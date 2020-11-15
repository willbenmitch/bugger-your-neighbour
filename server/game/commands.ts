import _ from 'lodash'
import { db } from '../db/connect'
import { Round, Player, Hand } from '../db/models'
import { getInitialState } from '../common/initialState'
import { GameStateMessage, getNextPlayerIndex } from '../common/utils'
import { getRoundOrder } from '../common/getRoundOrder'
import { Card, RoundStructure } from '../common/types'
import { Transaction } from 'sequelize/types'
import { getHandResult } from '../common/gameLogic'


export const findOrCreateGame = async (roomId: string) => {
    return await db.sequelize.transaction(async (transaction) => {
        const [game, created] = await db.Game.findOrCreate({ where: { roomId }, transaction })

        await game.reload({ include: [Round, Player], transaction })

        let round
        let hand
        if (created) {
            round = await db.Round.create(
                {
                    roundNumber: 1,
                    cardsToDeal: 1,
                    dealerId: undefined,
                    roundOrder: [],
                    state: 'idle',
                    trumpCard: undefined,
                    bids: [],
                    results: [],
                    gameId: game.id,
                },
                { transaction },
            )

            hand = await db.Hand.create(
                {
                    cardLed: undefined,
                    cards: [],
                    winnerId: undefined,
                    roundId: round.id,
                },
                { transaction },
            )
            await db.Player.bulkCreate(
                getInitialState().game.players.map((p) => ({ ...p, gameId: game.id })),
                { transaction },
            )
        } else {
            const rounds = await db.Round.findAll({
                limit: 1,
                where: { gameId: game.id },
                include: [Hand],
                order: [['roundNumber', 'DESC']],
                transaction,
            })
            round = rounds[0]

            hand = round.hands.sort((a, b) => b.id - a.id)[0]
        }
        await game.reload({ include: [Round, Player], transaction })
        return { game, round, hand }
    })
}

export const getFullGame = async (roomId: string) => {
    const game = await db.Game.findOne({
        where: { roomId },
        include: [
            { as: 'players', model: Player },
            { as: 'rounds', model: Round, include: [{ as: 'hands', model: Hand }] },
        ],
    })

    if (!game) {
        throw Error('no full game found')
    }

    return game
}

export const getGameState = async (roomId: string): Promise<GameStateMessage> => {
    const game = await db.Game.findOne({
        where: { roomId },
        include: [
            { as: 'players', model: Player },
            { as: 'rounds', model: Round, include: [{ as: 'hands', model: Hand }] },
        ],
    })

    if (!game) {
        throw Error
    }

    const round = game.rounds.sort((a, b) => b.roundNumber - a.roundNumber)[0]
    const hand = round.hands.sort((a, b) => b.id - a.id)[0]

    // console.log('game', game)
    // console.log('round', round)
    // console.log('hand', hand)

    return { game: game.toJSON(), round: round.toJSON(), hand: hand.toJSON() } as GameStateMessage
}

export const prepareRound = async (roomId: string, dealerIndex: number, roundNumber: number, transaction: Transaction) => {
    const game = await db.Game.findOne({ where: { roomId }, include: [Round, Player], transaction })
    if (!game) {
        throw Error(`no game found with roomId: ${roomId}`)
    }
    const roundStructure = game.roundsToPlay.find((r) => r.roundNumber === roundNumber)
    if (roundStructure == undefined) throw Error('Could not start round')
    const { players } = game

    // TODO: dealerIndex probably won't work here
    const sortedPlayers = players.sort((a, b) => a.position.id - b.position.id)
    const dealerId = sortedPlayers[dealerIndex].position.id

    const firstPlayerIndex = dealerIndex === sortedPlayers.length - 1 ? 0 : dealerIndex + 1

    const roundOrder = getRoundOrder(sortedPlayers, firstPlayerIndex)
    const activeUser = roundOrder[0]
    await game.update({ activeUser }, { transaction })

    return { game, roundStructure, dealerId, roundOrder }
}

export const newRound = async (roomId: string, dealerIndex: number, roundNumber: number, transaction: Transaction) => {
    const { game, roundStructure, dealerId, roundOrder } = await prepareRound(roomId, dealerIndex, roundNumber, transaction)

    const round = await db.Round.create(
        {
            gameId: game.id,
            roundNumber,
            cardsToDeal: roundStructure.cardsToDeal,
            dealerId,
            roundOrder,
            state: 'bidding',
            trumpCard: undefined,
            bids: [],
            hands: [],
            results: [],
        },
        { transaction },
    )

    const hand = await db.Hand.create(
        {
            cardLed: undefined,
            cards: [],
            winnerId: undefined,
            roundId: round.id,
        },
        { transaction },
    )

    return { round, hand }
}

export const deal = async (roomId: string, cards: Card[]) => {
    await db.sequelize.transaction(async (transaction) => {
        const game = await db.Game.findOne({ where: { roomId }, include: [Player, Round] })
        if (!game) {
            throw Error(`deal error, no game found with roomId: ${roomId}`)
        }

        const rounds = await db.Round.findAll({ limit: 1, where: { gameId: game.id }, order: [['roundNumber', 'DESC']], include: [Hand], transaction })
        const round = rounds[0]
        if (!round) {
            throw Error(`deal error, no round found with game id: ${game.id}`)
        }

        const roundsToPlay = _.cloneDeep(game.roundsToPlay)

        if (!roundsToPlay.length) {
            throw Error('nothing to deal')
        }
        const thisRound = roundsToPlay.shift() as RoundStructure
        const userLength = game.players.length
        const { players } = game
        for (let i = 0; i < round.cardsToDeal; i++) {
            const mod = i === 0 ? 0 : userLength * i
            await Promise.all(
                players.map(async (player, j) => {
                    const cardIndex = mod + j
                    const card = cards[cardIndex]
                    const playerCards = player.cards.concat([card])
                    await player.update({ cards: playerCards }, { transaction })
                }),
            )
        }

        const trumpCardIndex: number = players.length * round.cardsToDeal
        const trumpCard = thisRound.withTrump ? cards[trumpCardIndex] : undefined

        await round.update({ trumpCard }, { transaction })
        await game.update({ roundsToPlay }, { transaction })
    })
}

export const playCard = async (roomId: string, msg: { card: Card; playerId: number; roundId: number; handId: number }) => {
    return db.sequelize.transaction(async (transaction) => {
        const { card, playerId, roundId, handId } = msg
        const { suit, rank } = card

        const game = await db.Game.findOne({ where: { roomId }, transaction })
        if (!game) {
            throw Error('no game found while playing card')
        }

        const round = await db.Round.findByPk(roundId, { transaction })

        if (!round) {
            throw Error('no round found after playing card')
        }

        const hand = await db.Hand.findByPk(handId, { transaction })

        if (!hand) {
            throw Error('no hand found after playing card')
        }

        const player = await db.Player.findOne({ where: { gameId: game.id, position: { id: playerId } }, transaction })

        if (!player) {
            throw Error('no player found after playing card')
        }

        const { cardLed } = hand

        if (!cardLed) {
            await hand.update({ cardLed: card }, { transaction })
        }

        const nextPlayerIndex = getNextPlayerIndex(round.roundOrder, playerId)
        let nextPlayer: number | undefined
        if (nextPlayerIndex === undefined) {
            nextPlayer = undefined
        } else {
            nextPlayer = round.roundOrder[nextPlayerIndex]
        }

        // remove card from player
        const playerCards = player.cards.filter((c: Card) => !(c.suit === suit && c.rank === rank))

        await player.update({ cards: playerCards }, { transaction })

        // add card to hand
        const cards = hand.cards.concat({ suit, rank, playerId })
        await hand.update({ cards }, { transaction })

        // set activeUser
        await game.update({ activeUser: nextPlayer }, { transaction })

        const x = Math.random()
        const y = Math.random()
        const zIndex = cards.length
        const side = 'front'
        const rot = Math.random() * 720

        return { cardsMessage: { cards: [{ suit, rank }], x, y, zIndex, side, rot }, nextPlayer }
    })
}

export const tallyHandWinner = async (roomId: string) => {
    return db.sequelize.transaction(async (transaction) => {
        const game = await db.Game.findOne({
            where: { roomId },
            include: [{ as: 'rounds', model: Round, include: [{ as: 'hands', model: Hand }] }],
            transaction,
        })
        if (!game) {
            throw Error('no game found')
        }

        const { rounds } = game

        const round = rounds.sort((a, b) => b.id - a.id)[0]
        const { hands } = round
        const hand = hands.sort((a, b) => b.id - a.id)[0]
        const { trumpCard } = round
        const { cards, cardLed } = hand

        if (!cardLed) {
            throw Error('could not find led card')
        }

        const winner = getHandResult(cardLed, cards, trumpCard?.suit, true, false)

        if (winner === undefined) {
            const err = 'winner is undefined'
            console.error('cardLed', cardLed)
            console.error('cards', cards)
            console.error('trumpCard', trumpCard)
            throw Error(err)
        }

        await hand.update({ winnerId: winner.playerId }, { transaction })

        return { cards, winner }
    })
}

// playNextRound = () => {
//     const { game, round } = this.state!
//     const { roundsToPlay, players, rounds } = game
//     const { hands, bids } = round
//     // @ts-ignore
//     const { id: roomId } = this.props.match.params
//     const userTotals = hands.reduce(
//         (prev, cur: Hand) => {
//             return prev.map(({ total, id }) => (id === cur.winnerId ? { total: total + 1, id } : { total, id }))
//         },
//         players.map((player) => ({ id: player.position.id, total: 0 })),
//     )
//     const results: Result[] = userTotals.map(({ total, id }) => {
//         const bid = bids.find((bid) => bid.playerId === id)!.bid
//         return { playerId: id, bid, actual: total, points: calculatePoints(bid, total) }
//     })
//     const removedRounds = roundsToPlay.slice(1)
//     const roundWithResults = { ...round, results }
//     this.setState({ game: { ...game, rounds: [...rounds, roundWithResults], roundsToPlay: removedRounds }, round: roundWithResults }, () => {
//         const { game, round, hand } = this.state!
//         const { roundsToPlay } = game
//         if (roundsToPlay.length === 0) {
//             this.socket.emit('showResults', roomId, { game: { ...game, state: GameState.complete }, round, hand })
//             this.setState({ showResults: true, game: { ...game, state: GameState.complete } })
//         } else {
//             const { round: lastRound } = this.state!
//             const { dealerId } = lastRound
//             const dealerIndex = getNextDealerIndex(players, dealerId as number)
//             this.startRound(dealerIndex, roundsToPlay[0].roundNumber)
//         }
//     })
// }
// startRound = (dealerIndex: number, roundNumber: number) => {
//     // @ts-ignore
//     const { id: roomId } = this.props.match.params
//     this.socket.emit('newRound', roomId, dealerIndex, roundNumber)
// }
