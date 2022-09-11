import React from 'react'
import './Game.css'
import io from 'socket.io-client'
// @ts-ignore
import Deck from 'deck-of-cards'
import User from '../User'
import UserHand from '../UserHand'
import { Card, Round, RoundState, Game as GameType, Hand, Result, GameState, Player } from '../types'
import { getHandResult, calculatePoints, didFollowSuit } from '../../utils/gameLogic'
import { getRoundOrder, getNextDealerIndex, getRoundsToPlay } from '../../utils/getRoundOrder'
import Results from '../Results'
import { GameStateMessage, keepAlive, PlayCardsMessage, positions } from './utils'
import { getInitialState } from './initialState'

type Props = {}
type State = {
    game: GameType
    round: Round
    hand: Hand
    myId?: number
    showResults: boolean
}

class Game extends React.Component<Props, State> {
    state = getInitialState() as State

    isUpdating: boolean = false
    deck: any
    socket: any
    clientHeight = () => document.documentElement.clientHeight
    clientWidth = () => document.documentElement.clientWidth
    cardWidth = 120
    cardHeight = 100
    keepAlive?: number

    componentDidMount() {
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        // this.socket = io(`${process.env.REACT_APP_SERVER_URL}?id=${roomId}`)
        if (process.env.NODE_ENV === 'development') {
            // to handle sockets on different hosts
            this.socket = io(process.env.REACT_APP_SERVER_URL, { query: { id: roomId } })
        } else {
            this.socket = io({ query: { id: roomId } })
        }

        //
        
        this.socket.on('welcome', (msg: GameStateMessage) => {
            // this.keepAlive = keepAlive(this.socket)
            console.log('welcome!')
            this.initiateDeck()
            const callback = () => {
                const { cards } = this.state.hand
                const { trumpCard } = this.state.round
                if (trumpCard !== undefined) {
                    this.animateTrumpCard(trumpCard)
                }
                if (cards.length !== 0) {
                    cards.forEach((card) => {
                        const playCardsMessage = this.getPlayCardsMessage(card)
                        this.socketHandlePlayCard(playCardsMessage)
                    })
                }
            }

            this.socketHandleGameState(msg, callback)
        })
        this.socket.on('deal', this.socketHandleDeal)
        this.socket.on('playCards', this.socketHandlePlayCard)
        this.socket.on('gameState', this.socketHandleGameState)
        this.socket.on('showResults', (msg: GameStateMessage) => {
            this.setState({ ...msg }, this.handleOpenResults)
        })
    }

    componentWillUnmount() {
        // clearInterval(this.keepAlive)
        this.socket.close()
        this.deck = undefined
    }

    waitForIt = (callback: () => void) => {
        while (this.isUpdating) {
            // do nothing
        }
        callback()
    }

    socketHandleDeal = (msg: GameStateMessage) => {
        const { game, round, hand } = msg
        this.setState({ game, round, hand }, () => {
            this.clearDeck()
            this.initiateDeck()
            this.animateDeal()
        })
    }

    socketHandlePlayCard = (msg: PlayCardsMessage) => {
        const { cards, game, round, x, y, hand, side, zIndex, rot } = msg
        this.setState({ game, round, hand }, () => {
            const deckCards = cards.map((card) => this.deck.cards.find((c: Card) => c.rank === card.rank && c.suit === card.suit))
            deckCards.map((card) => {
                card.animateTo({
                    duration: 300,
                    east: 'quartOut',
                    x,
                    y,
                    rot,
                })
                card.setSide(side)
                card.$el.style['z-index'] = zIndex ? zIndex : 1
            })
        })
    }

    socketHandleGameState = (msg: GameStateMessage, callback?: () => void) => {
        this.waitForIt(() => {
            this.isUpdating = true
            const { game, round, hand } = msg
            this.setState({ game, round, hand }, () => {
                this.isUpdating = false
                callback && callback()
            })
        })
    }

    asyncDeal = () => {
        this.clearDeck()
        this.initiateDeck()
        this.shuffle()
        setTimeout(this.deal, 3500)
    }

    deal = () => {
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const thisRound = this.state.game.roundsToPlay[0]
        const userLength = this.state.game.users.length
        const { users } = this.state.game
        for (let i = 0; i < this.state.round.cardsToDeal; i++) {
            const mod = i === 0 ? 0 : userLength * i
            this.state.game.users.map((user, j) => {
                const cardIndex = mod + j
                const card = this.deck.cards[cardIndex]

                users[j].cards.push({ ...card, isPlayed: false })
            })
        }

        const trumpCardIndex: number = users.length * this.state.round.cardsToDeal
        const trumpCard = thisRound.withTrump ? this.deck.cards[trumpCardIndex] : undefined

        this.setState({ game: { ...this.state.game, users }, round: { ...this.state.round, trumpCard } }, () => {
            const { game, round, hand } = this.state

            this.socket.emit('deal', roomId, { game, round, hand })
            this.socketHandleDeal({ game, round, hand })
        })
    }

    animateDeal = () => {
        this.state.game.users.map((user) => {
            user.cards.map((card: any, i: number) => {
                const deckCard = this.deck.cards.find((c: any) => c.rank === card.rank && c.suit === card.suit)
                const x = this.clientWidth() - this.clientWidth() * (user.x / 100) - this.cardWidth * 2 - 5 * i
                const y = this.clientHeight() * (user.y / 100) - this.cardHeight
                deckCard.animateTo({
                    duration: 300,
                    east: 'quartOut',
                    x: x,
                    y: y,
                    rot: 10,
                })
            })
        })
        const { trumpCard } = this.state.round
        if (trumpCard !== undefined) {
            this.animateTrumpCard(trumpCard)
        }
    }

    animateTrumpCard = (card: Card) => {
        const trumpCard = this.deck.cards.find((c: any) => c.rank === this.state.round.trumpCard?.rank && c.suit === this.state.round.trumpCard?.suit)
        trumpCard.animateTo({ delay: 500, x: 120 })
        trumpCard.setSide('front')
    }

    initiateDeck = () => {
        this.deck = Deck()
        this.deck.mount(document.getElementById('table'))
        this.deck.cards.forEach((card: any) => {
            card.disableDragging()
            card.disableFlipping()
        })
    }

    clearDeck = () => {
        const table = document.getElementById('table')
        try {
            this.deck.unmount(table)
        } catch (err) {
            console.error(err)
        }
        this.deck = undefined
    }

    shuffle = () => {
        this.deck.intro()
        this.deck.shuffle()
        this.deck.shuffle()
    }

    handleLeave = (e: any, id: number) => {
        e.preventDefault()
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const { users } = this.state.game
        const user = users.find((u) => u.id === id)
        if (!user) {
            return
        }
        user.isOccupied = false
        user.name = 'Open'
        user.socketId = undefined
        const newUsers = users.map((u) => (u.id === id ? user : u))
        this.setState({ game: { ...this.state.game, users: newUsers }, myId: undefined }, () => {
            this.socket.emit('leave', roomId, { user })
        })
    }

    handleSit = (e: any, id: number) => {
        e.preventDefault()
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const { id: socketId } = this.socket
        const { users } = this.state.game
        const user = users.find((u) => u.id === id)
        if (user === undefined) return alert('Could not find seat.')
        user.isOccupied = true
        user.socketId = socketId
        let name = prompt("What's your name?", 'name')
        if (!name) {
            return
        }
        const foundName = users.find((u) => u.name === name)
        if (foundName !== undefined) return alert('That name is taken, please choose another')
        user.name = name
        const newUsers = users.map((u) => (u.id === id ? user : u))
        this.setState({ game: { ...this.state.game, users: newUsers }, myId: id }, () => {
            this.socket.emit('sit', roomId, { user })
        })
    }

    handleStartGame = () => {
        // remove unused seats
        const users = this.state.game.users.filter((user) => user.isOccupied)
        if (users.length < 2) return alert('Bugger your neighbour is better with friends. Share the link to invite some players!')
        const availableRounds = Math.floor(51 / users.length)
        const userRounds = prompt("What's the highest round you'd like to play?", availableRounds.toString())
        const rounds = Number(userRounds)
        const gameState = GameState.playing

        if (!rounds || rounds < 1 || rounds > availableRounds) return alert(`please enter a number between 1 and ${availableRounds}`)

        const roundsToPlay = getRoundsToPlay(rounds)
        this.setState({ game: { ...this.state.game, users, roundsToPlay, state: gameState } }, () => {
            // determine inital dealer randomly
            const dealerIndex = Math.floor(Math.random() * users.length)
            this.startRound(dealerIndex, 1)
        })
    }

    handleBid = (bid: number, userId: number) => {
        let { bids, state } = this.state.round
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        bids.push({ userId, bid })
        const nextPlayer = this.getNextPlayerIndex(userId)
        let activeUser
        if (nextPlayer === undefined) {
            // bidding is over. Let's start playing
            activeUser = this.state.round.roundOrder[0]
            state = RoundState.playing
        } else {
            // setting next player
            activeUser = this.state.round.roundOrder[nextPlayer]
        }
        this.setState({ game: { ...this.state.game, activeUser }, round: { ...this.state.round, bids, state } }, () => {
            const { game, round, hand } = this.state
            this.socket.emit('gameState', roomId, { game, round, hand })
        })
    }

    getNextPlayerIndex = (currentPlayerId: number): number | undefined => {
        let playerIndex = this.state.round.roundOrder.findIndex((id) => id === currentPlayerId)
        playerIndex++
        return playerIndex >= this.state.round.roundOrder.length ? undefined : playerIndex
    }

    handlePlayCard = (e: any, card: Card, userId?: number) => {
        e.preventDefault()
        if (userId === undefined) {
            console.warn('no userId provided')
            return
        }
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const { users } = this.state.game
        const { cards, cardLed } = this.state.hand
        const userHand = users.find((u) => u.id === userId)!.cards
        const isCardValid = didFollowSuit(card, userHand, cardLed)

        if (!isCardValid) {
            return alert('You must follow suit')
        }
        const nextPlayerIndex = this.getNextPlayerIndex(userId)
        let nextPlayer: number | undefined
        if (nextPlayerIndex === undefined) {
            nextPlayer = undefined
        } else {
            nextPlayer = this.state.round.roundOrder[nextPlayerIndex]
        }
        cards.push({ ...card, userId })
        // remove card from user state
        const newUsers = users.map((user) => {
            if (user.id === userId) {
                user.cards.splice(
                    user.cards.findIndex((c: Card) => c.suit === card.suit && c.rank === card.rank),
                    1,
                )
                return user
            }
            return user
        })
        this.setState(
            {
                game: { ...this.state.game, users: newUsers, activeUser: nextPlayer },
                round: { ...this.state.round },
                hand: { cards, cardLed: cards[0] },
            },
            () => {
                const { activeUser } = this.state.game
                const message = this.getPlayCardsMessage(card)
                this.socket.emit('playCards', roomId, message)
                // handling the animation of playing the card, which is done on socket emit (which won't be triggered for the user)
                this.socketHandlePlayCard(message)
                if (activeUser === undefined) {
                    this.playNextHand()
                }
            },
        )
    }

    getPlayCardsMessage = (card: Card): PlayCardsMessage => {
        const { game, round, hand } = this.state
        const playingArea = document.getElementById('playingArea')?.getBoundingClientRect() as DOMRect
        const x = playingArea.left - 100 + Math.random() * (this.clientWidth() * 0.3)
        const y = playingArea.top - 100 + Math.random() * (this.clientHeight() * 0.3)
        const zIndex = this.state.hand.cards.length
        const side = 'front'
        const rot = Math.random() * 720
        const message: PlayCardsMessage = { cards: [card], game, round, hand, x, y, zIndex, side, rot }
        return message
    }

    playNextHand = () => {
        const { users } = this.state.game
        const { cards, cardLed } = this.state.hand
        const { trumpCard, hands } = this.state.round
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        // hand is over, time to get winner and start next hand
        if (cardLed === undefined) return alert('Could not find led card')

        const winner = getHandResult(cardLed, cards, trumpCard?.suit, true, false)

        if (winner === undefined) {
            console.error('winner is undefined')
            console.error('cardLed', cardLed)
            console.error('cards', cards)
            console.error('trumpCard', trumpCard)
        }
        hands.push({
            cardLed,
            winnerId: winner.userId,
            cards,
        })
        const activeUser = winner.userId
        const roundOrder = getRoundOrder(
            users,
            users.findIndex((u) => u.id === winner.userId),
        )

        setTimeout(() => {
            this.setState(
                {
                    game: { ...this.state.game, activeUser },
                    round: { ...this.state.round, hands, roundOrder },
                    hand: { cardLed: undefined, cards: [], winnerId: undefined },
                },
                () => {
                    const { game, round, hand } = this.state
                    const side = 'back'
                    const x = 1000
                    const y = 1000
                    // send results to users
                    this.socket.emit('gameState', roomId, { game, round, hand })

                    const message: PlayCardsMessage = { game, round, hand, side, x, y, cards }
                    // wait five seconds to send message to start next round
                    this.socket.emit('playCards', roomId, message)
                    this.socketHandlePlayCard(message)
                    // check to see if users have more cards
                    const usersWithCardsLeft = game.users.filter((user) => user.cards.length !== 0)
                    if (usersWithCardsLeft.length === 0) {
                        this.playNextRound()
                    }
                },
            )
        }, 5000)
    }

    playNextRound = () => {
        const { game, round } = this.state
        const { roundsToPlay, users, rounds } = game
        const { hands, bids } = round
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const userTotals = hands.reduce(
            (prev, cur: Hand) => {
                return prev.map(({ total, id }) => (id === cur.winnerId ? { total: total + 1, id } : { total, id }))
            },
            users.map((user) => ({ id: user.id, total: 0 })),
        )
        const results: Result[] = userTotals.map(({ total, id }) => {
            const bid = bids.find((bid) => bid.userId === id)!.bid
            return { userId: id, bid, actual: total, points: calculatePoints(bid, total) }
        })
        const removedRounds = roundsToPlay.slice(1)

        const roundWithResults = { ...round, results }

        this.setState({ game: { ...game, rounds: [...rounds, roundWithResults], roundsToPlay: removedRounds }, round: roundWithResults }, () => {
            const { game, round, hand } = this.state
            const { roundsToPlay, rounds } = game
            if (roundsToPlay.length === 0) {
                this.socket.emit('showResults', roomId, { game: { ...game, state: GameState.complete }, round, hand })
                this.setState({ showResults: true, game: { ...game, state: GameState.complete } })
            } else {
                const { round: lastRound } = this.state
                const { dealerId } = lastRound
                const dealerIndex = getNextDealerIndex(users, dealerId as number)
                this.startRound(dealerIndex, roundsToPlay[0].id)
            }
        })
    }

    startRound = (dealerIndex: number, id: number) => {
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const roundStructure = this.state.game.roundsToPlay.find((r) => r.id === id)
        if (roundStructure === undefined) return alert('Could not start round')
        const { users } = this.state.game
        const dealerId = users[dealerIndex].id
        const firstPlayerIndex = dealerIndex === users.length - 1 ? 0 : dealerIndex + 1
        const roundOrder = getRoundOrder(users, firstPlayerIndex)
        const activeUser = roundOrder[0]

        const newRound: Round = {
            id,
            cardsToDeal: roundStructure.cardsToDeal,
            dealerId,
            roundOrder,
            state: RoundState.bidding,
            trumpCard: undefined,
            bids: [],
            hands: [],
            results: [],
        }

        this.setState({ game: { ...this.state.game, activeUser }, round: newRound }, () => {
            const { game, round, hand } = this.state
            // emit dealer to others
            this.socket.emit('gameState', roomId, { game, round, hand })
            this.asyncDeal()
        })
    }

    handleCloseResults = (event: React.MouseEvent) => {
        event.preventDefault()
        this.setState({ showResults: false })
    }

    handleOpenResults = (event?: React.MouseEvent) => {
        event && event.preventDefault()
        this.setState({ showResults: true })
    }

    resetGame = () => {
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const users = positions.map((position) => {
            const foundOccupied = this.state.game.users.find((user) => user.id === position.id)
            return foundOccupied ? foundOccupied : position
        })

        const initialState = getInitialState()
        const state: State = { game: { ...initialState.game, users }, round: initialState.round, hand: initialState.hand, showResults: false }
        this.setState(state, () => {
            const { game, round, hand } = this.state
            this.socket.emit('gameState', roomId, { game, round, hand })
        })
    }

    render() {
        const { roundsToPlay } = this.state.game
        const users = this.state.game.users.map(({ name, x, y, isOccupied, id }) => {
            const { cards } = this.state.hand
            const { activeUser } = this.state.game
            const isPlayerTurn = activeUser !== undefined && activeUser === id
            const playedCard = cards.find((card) => card.userId === id)
            const myBid = this.state.round.bids.find((bid) => bid.userId === id)?.bid
            return (
                <User
                    key={`${id}-${new Date().getTime()}`}
                    name={name}
                    x={x}
                    y={y}
                    isPlayerTurn={isPlayerTurn}
                    isOccupied={isOccupied}
                    onLeave={(e) => this.handleLeave(e, id)}
                    onSit={(e) => this.handleSit(e, id)}
                    isMe={id === this.state.myId}
                    canOccupy={!isOccupied && this.state.myId === undefined}
                    isDealer={this.state.round.dealerId !== undefined && this.state.round.dealerId === id}
                    playedCard={playedCard}
                    roundState={this.state.round.state}
                    myBid={myBid}
                    handsWon={this.state.round.hands.filter((hand) => hand.winnerId === id).length}
                />
            )
        })
        const withTrump = roundsToPlay.length === 0 ? '' : roundsToPlay[0].withTrump ? 'with trump' : 'no trump'
        const dealerAssigned = this.state.round.dealerId !== undefined
        const amDealer = dealerAssigned && this.state.round.dealerId === this.state.myId
        const activeUsers = this.state.game.users.filter((user) => user.isOccupied).sort((a, b) => a.id - b.id)
        const amAdmin = activeUsers.length > 0 && activeUsers[0].id === this.state.myId

        const me = this.state.game.users.find((user) => user.id === this.state.myId)
        const myCards = me !== undefined ? me.cards : []
        const magicBids = this.state.round.cardsToDeal
        const possiblebids = Array.from({ length: magicBids + 1 }, (_, i) => i)
        const currentBidTotal = this.state.round.bids.reduce((acc, cur) => acc + cur.bid, 0)
        const availableBids = amDealer ? possiblebids.filter((bid) => magicBids - currentBidTotal - bid !== 0) : possiblebids

        return (
            <div id="game">
                {!dealerAssigned && amAdmin && <button onClick={this.handleStartGame}>Start Game</button>}
                {amAdmin && this.state.game.state === GameState.complete && <button onClick={this.resetGame}>Reset Game</button>}
                {this.state.game.state === GameState.playing && <button onClick={this.handleOpenResults}>Show Results</button>}
                <Results isOpen={this.state.showResults} onRequestClose={this.handleCloseResults} game={this.state.game} />
                <span>{`  Round ${this.state.round.cardsToDeal} ${withTrump}`}</span>
                <div id="users">{users}</div>
                <div id="table"></div>
                <div id="playingArea"></div>
                <UserHand
                    cards={myCards}
                    isPlayerTurn={this.state.game.activeUser !== undefined && this.state.game.activeUser === this.state.myId}
                    canReneg
                    onPlayCard={this.handlePlayCard}
                    id={this.state.myId}
                    availableBids={availableBids}
                    onBid={this.handleBid}
                    roundState={this.state.round.state}
                />
            </div>
        )
    }
}

export default Game
