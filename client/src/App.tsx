import React from 'react'
import './App.css'
import '../node_modules/deck-of-cards/example/example.css'
// @ts-ignore
import io from 'socket.io-client'
// @ts-ignore
import Deck from 'deck-of-cards'
import User from './components/User'
import UserHand from './components/UserHand'
import { Card, Player, Round, RoundState, Game, Hand, Result, GameState } from './components/types'
import { getHandResult, calculatePoints, didFollowSuit } from './utils/gameLogic'
import { getRoundOrder, getNextDealerIndex, getRoundsToPlay } from './utils/getRoundOrder'
import Results from './components/Results'

const positions: Player[] = [
    { id: 0, isOccupied: false, name: 'Open', x: 58, y: 5, cards: [] },
    { id: 1, isOccupied: false, name: 'Open', x: 42, y: 5, cards: [] },
    { id: 2, isOccupied: false, name: 'Open', x: 25, y: 20, cards: [] },
    { id: 3, isOccupied: false, name: 'Open', x: 25, y: 45, cards: [] },
    { id: 4, isOccupied: false, name: 'Open', x: 25, y: 70, cards: [] },
    { id: 5, isOccupied: false, name: 'Open', x: 42, y: 80, cards: [] },
    { id: 6, isOccupied: false, name: 'Open', x: 58, y: 80, cards: [] },
    { id: 7, isOccupied: false, name: 'Open', x: 75, y: 70, cards: [] },
    { id: 8, isOccupied: false, name: 'Open', x: 75, y: 45, cards: [] },
    { id: 9, isOccupied: false, name: 'Open', x: 75, y: 20, cards: [] },
]

type Props = {}
type State = {
    game: Game
    round: Round
    hand: Hand
    myId?: number
    showResults: boolean
}

export type GameStateMessage = { game: Game; round: Round; hand: Hand }
export type PlayCardsMessage = GameStateMessage & {
    cards: Card[]
    x: number
    y: number
    rot?: number
    side: 'front' | 'back'
    zIndex?: number
}

const initialGame: Game = {
    state: GameState.idle,
    users: positions,
    activeUser: undefined,
    roundsToPlay: [],
    rounds: [],
}

const initialRound: Round = {
    id: 1,
    cardsToDeal: 1,
    dealerId: undefined,
    roundOrder: [],
    state: RoundState.idle,
    trumpCard: undefined,
    bids: [],
    hands: [],
    results: [],
}

const initialHand = {
    cardLed: undefined,
    cards: [],
    winnerId: undefined,
}

class App extends React.Component<Props, State> {
    // @ts-ignore
    state: State = {
        game: initialGame,
        round: initialRound,
        hand: initialHand,
        myId: undefined,
        showResults: false,
    }

    deck: any
    socket: any
    clientHeight = () => document.documentElement.clientHeight
    clientWidth = () => document.documentElement.clientWidth
    cardWidth = 120
    cardHeight = 100

    componentDidMount() {
        this.socket = io(process.env.REACT_APP_SERVER_URL)
        this.socket.on('welcome', (msg: GameStateMessage) => {
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
        this.socket.on('pingClient', (msg: any) => {
            this.socket.emit('pongServer', { id: this.state.myId })
        })
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
                //
                card.$el.style['z-index'] = zIndex ? zIndex : 1
            })
        })
    }

    socketHandleGameState = (msg: GameStateMessage, callback?: () => void) => {
        const { game, round, hand } = msg
        this.setState({ game, round, hand }, callback)
    }

    asyncDeal = () => {
        this.clearDeck()
        this.initiateDeck()
        this.shuffle()
        setTimeout(this.deal, 3500)
    }

    deal = () => {
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

            this.socket.emit('deal', { game, round, hand })
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
        // this.deck.mount(document.getElementById('table'))
        this.deck.intro()
        this.deck.shuffle()
        this.deck.shuffle()
    }

    handleLeave = (e: any, id: number) => {
        e.preventDefault()
        const { users } = this.state.game
        users[id].isOccupied = false
        users[id].name = 'Open'
        this.setState({ game: { ...this.state.game, users }, myId: undefined }, () => {
            const { game, round, hand } = this.state
            this.socket.emit('gameState', { game, round, hand })
        })
    }

    handleSit = (e: any, id: number) => {
        e.preventDefault()
        const { users } = this.state.game
        const user = users.find((u) => u.id === id)
        if (user === undefined) return alert('Could not find seat.')
        user.isOccupied = true
        let name = prompt("What's your name?", 'name')
        const foundName = users.find((u) => u.name === name)
        if (foundName !== undefined) return alert('That name is taken, please choose another')
        user.name = name ? name : `Default_${id}`
        const newUsers = users.map((u) => (u.id === id ? user : u))
        this.setState({ game: { ...this.state.game, users: newUsers }, myId: id }, () => {
            const { game, round, hand } = this.state
            this.socket.emit('gameState', { game, round, hand })
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
            this.socket.emit('gameState', { game, round, hand })
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
                this.socket.emit('playCards', message)
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
        const x = playingArea.left - 200 + Math.random() * (this.clientWidth() * 0.3)
        const y = playingArea.top - 200 + Math.random() * (this.clientHeight() * 0.3)
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
                    this.socket.emit('gameState', { game, round, hand })

                    const message: PlayCardsMessage = { game, round, hand, side, x, y, cards }
                    // wait five seconds to send message to start next round
                    this.socket.emit('playCards', message)
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
                this.socket.emit('showResults', { game: { ...game, state: GameState.complete }, round, hand })
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
            this.socket.emit('gameState', { game, round, hand })
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
        const users = positions.map((position) => {
            const foundOccupied = this.state.game.users.find((user) => user.id === position.id)
            return foundOccupied ? foundOccupied : position
        })

        const state: State = { game: { ...initialGame, users }, round: initialRound, hand: initialHand, showResults: false }
        this.setState(state, () => {
            const { game, round, hand } = this.state
            this.socket.emit('gameState', { game, round, hand })
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
        const amAdmin = this.state.game.users[0].id === this.state.myId

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

export default App
