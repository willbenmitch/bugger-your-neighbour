import IoSocket from 'socket.io'
import { Socket } from 'socket.io'
import { db } from '../db/connect'
import { getNextPlayerIndex, PlayCardsMessage } from '../common/utils'
import { Player, Card, RoundStructure, Result } from '../common/types'
import { getGameState, newRound, deal, prepareRound, tallyHandWinner, playCard, getFullGame } from '../game/commands'
import { handlePersonMoving } from '../players/commands'
import { getNextDealerIndex, getRoundOrder } from '../common/getRoundOrder'
import { calculatePoints } from '../common/gameLogic'
import { Hand } from '../db/models'

type BuggerParams = {
    io: IoSocket.Server
    socket: Socket
    roomId: string
    socketId: string
}

export class BuggerGame {
    io: IoSocket.Server
    socket: Socket
    roomId: string
    socketId: string

    constructor({ io, socket, roomId, socketId }: BuggerParams) {
        this.io = io
        this.socket = socket
        this.roomId = roomId
        this.socketId = socketId

        this.setup()
    }

    private setup() {
        this.socket.on('disconnect', () => this.disconnect())

        this.socket.on('sit', (msg) => this.sit(msg))

        this.socket.on('leave', (msg) => this.leave(msg))

        this.socket.on('startGame', (id, players, roundsToPlay) => this.startGame(id, players, roundsToPlay))

        this.socket.on('newRound', (id, dealerIndex, roundNumber) => this.newRound(id, dealerIndex, roundNumber))

        this.socket.on('deal', (id, cards) => this.deal(id, cards))

        this.socket.on('bid', (id, msg) => this.bid(id, msg))

        this.socket.on('playCards', (id, msg) => this.playCards(id, msg))
    }

    async disconnect() {
        const { socket, socketId, roomId } = this
        console.log('user disconnected with socketId: ', socketId)

        await db.Player.update({ socketId: undefined, name: 'Open', isOccupied: false }, { where: { socketId } })
        const gameStateMessage = await getGameState(roomId)

        socket.broadcast.to(roomId).emit('gameState', gameStateMessage)
    }

    async sit(msg: { socketId: string | undefined; name: string; id: number; isOccupied: boolean }) {
        // console.log('this', this)
        console.log('roomId', this.roomId)
        const gameStateMessage = await handlePersonMoving(this.roomId, msg)
        console.log(
            'sit gameStateMessage',
            gameStateMessage.game.players.find((p) => p.id === msg.id),
        )
        console.log('roomId', this.roomId)
        this.io.in(this.roomId).emit('gameState', gameStateMessage)
    }

    async leave(msg: { socketId: string | undefined; name: string; id: number; isOccupied: boolean }) {
        const gameStateMessage = await handlePersonMoving(this.roomId, msg)
        this.io.in(this.roomId).emit('gameState', gameStateMessage)
    }

    async startGame(id: string, players: Player[], roundsToPlay: RoundStructure[]) {
        await db.sequelize.transaction(async (transaction) => {
            const game = await db.Game.findOne({ where: { roomId: id }, transaction })
            if (!game) {
                throw Error(`startGame error, no game with id: ${id}`)
            }

            const allPlayers = await db.Player.findAll({ where: { gameId: game.id }, transaction })

            // destroy player records who are not in the game
            await Promise.all(
                allPlayers.map(async (p) => {
                    if (!players.find((a) => p.position.id === a.position.id)) {
                        await p.destroy({ transaction })
                    }
                }),
            )

            // update roundsToPlay
            await game.update({ roundsToPlay, state: 'playing' }, { transaction })

            const dealerIndex = Math.floor(Math.random() * players.length)
            const { roundStructure, initialHandOrder, dealerId } = await prepareRound(this.roomId, dealerIndex, 1, transaction)
            // await newRound(id, dealerIndex, 1, transaction)
            await db.Round.update(
                {
                    cardsToDeal: roundStructure.cardsToDeal,
                    dealerId,
                    bidOrder: initialHandOrder,
                    state: 'bidding',
                    trumpCard: undefined,
                    bids: [],
                    hands: [],
                    results: [],
                },
                { where: { gameId: game.id }, transaction },
            )

            await db.Hand.update({order: initialHandOrder})
        })

        const gameStateMessage = await getGameState(this.roomId)
        this.io.in(this.roomId).emit('newRound', gameStateMessage)
    }

    async newRound(id: string, dealerIndex: number, roundNumber: number) {
        await db.sequelize.transaction(async (transaction) => {
            await newRound(id, dealerIndex, roundNumber, transaction)
        })
        const gameStateMessage = await getGameState(this.roomId)
        this.socket.broadcast.to(this.roomId).emit('newRound', gameStateMessage)
    }

    async deal(id: string, cards: Card[]) {
        await deal(id, cards)
        const gameStateMessage = await getGameState(this.roomId)
        this.io.in(this.roomId).emit('deal', gameStateMessage)
    }

    async bid(id: string, msg: { playerId: number; bid: number; roundId: number }) {
        const { playerId, bid, roundId } = msg
        await db.sequelize.transaction(async (transaction) => {
            const game = await db.Game.findOne({ where: { roomId: id }, transaction })
            if (!game) {
                throw Error('no game found while bidding')
            }

            const round = await db.Round.findByPk(roundId, { transaction })

            if (!round) {
                throw Error('no round found after bidding')
            }
            const nextPlayer = getNextPlayerIndex(round.roundOrder, playerId)
            let { state } = round
            let activeUser
            if (nextPlayer == undefined) {
                // bidding is over. Let's start playing
                activeUser = round.roundOrder[0]
                state = 'playing'
            } else {
                // setting next player
                activeUser = round.roundOrder[nextPlayer]
            }

            const bids = round.bids.concat({ bid, playerId })
            await round.update({ bids, state }, { transaction })
            await game.update({ activeUser }, { transaction })
        })

        const gameStateMessage = await getGameState(this.roomId)
        this.io.in(this.roomId).emit('gameState', gameStateMessage)
    }

    async playCards(id: string, msg: { card: Card; playerId: number; roundId: number; handId: number }) {
        const { io, roomId } = this
        const { cardsMessage, nextPlayer } = await playCard(id, msg)

        const gameStateMessage = await getGameState(roomId)

        // update game
        io.in(roomId).emit('playCards', { ...gameStateMessage, ...cardsMessage } as PlayCardsMessage)

        if (nextPlayer === undefined) {
            // Hand is over
            const { cards, winner } = await tallyHandWinner(roomId)
            const handFinishedMessage = await getGameState(roomId)

            // send cards to pile
            io.in(roomId).emit('playCards', { ...handFinishedMessage, cards, x: 1000, y: 1000, side: 'back' } as PlayCardsMessage)

            // nextHand, or nextRound?
            const game = await getFullGame(id)
            const { players, rounds } = game

            const round = rounds.find((r) => r.id === msg.roundId)
            if (!round) throw Error('no round found')

            // check to see if players have more cards
            const usersWithCardsLeft = game.players.filter((player) => player.cards.length !== 0)
            console.log("usersWithCardsLeft", usersWithCardsLeft.length)
            if (usersWithCardsLeft.length === 0) {
                // round is over

                // add results

                const { hands, bids } = round
                const userTotals = hands.reduce(
                    (acc, cur: Hand) => {
                        return acc.map(({ total, id }) => (id === cur.winnerId ? { total: total + 1, id } : { total, id }))
                    },
                    players.map((player) => ({ id: player.position.id, total: 0 })),
                )
                const results: Result[] = userTotals.map(({ total, id }) => {
                    const bid = bids.find((bid) => bid.playerId === id)!.bid
                    return { playerId: id, bid, actual: total, points: calculatePoints(bid, total) }
                })

                // create new round
                const dealerIndex = getNextDealerIndex(game.players, handFinishedMessage.round.dealerId as number)
                const { roundNumber } = game.roundsToPlay[0]
                await db.sequelize.transaction(async (transaction) => {
                    await round.update({ results }, { transaction })
                    await newRound(id, dealerIndex, roundNumber, transaction)
                })
                const newRoundMessage = await getGameState(roomId)
                io.in(roomId).emit('newRound', newRoundMessage)
            } else {
                // hand is over, but more hands to play
                await db.sequelize.transaction(async (transaction) => {
                    await Hand.create({ roundId: round.id }, { transaction })
                    await round.update({
                        roundOrder: getRoundOrder(
                            players,
                            players.findIndex((p) => p.position.id === winner.playerId),
                        ),
                    })
                    await game.update({ activeUser: winner.playerId }, { transaction })
                })
                const nextHandMessage = await getGameState(roomId)

                // send cards to pile
                io.in(roomId).emit('gameState', nextHandMessage)
            }
        }
    }
}
