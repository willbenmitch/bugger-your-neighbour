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
import { getHandResult, calculatePoints } from './utils/gameLogic'
import { getRoundOrder, getDealerIndex, getRoundsToPlay } from './utils/getRoundOrder'
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
    showresults: boolean
}

type GameStateMessage = { game: Game; round: Round; hand: Hand }
type PlayCardsMessage = GameStateMessage & {
    cards: Card[]
    x: number
    y: number
    rot?: number
    side: 'front' | 'back'
    zIndex?: number
}

class App extends React.Component<Props, State> {
    // @ts-ignore
    state: State = {
        game: {
            state: GameState.idle,
            users: positions,
            activeUser: undefined,
            roundsToPlay: [],
            rounds: [],
        },
        round: {
            id: 1,
            dealerId: undefined,
            roundOrder: [],
            state: RoundState.idle,
            trumpCard: undefined,
            bids: [],
            hands: [],
            results: [],
        },
        hand: {
            cardLed: undefined,
            cards: [],
            winnerId: undefined,
        },
        myId: undefined,
        showresults: false,
    }

    deck: any
    socket: any
    clientHeight = () => document.documentElement.clientHeight
    clientWidth = () => document.documentElement.clientWidth
    cardWidth = 120
    cardHeight = 100

    componentDidMount() {
        this.socket = io('http://localhost:4000')
        // this.socket = io('https://willbenmitch-af518b0d.localhost.run')
        this.socket.on('deal', this.socketHandleDeal)
        this.socket.on('playCards', this.socketHandlePlayCard)
        this.socket.on('gameState', this.socketHandleGameState)
    }

    socketHandleDeal = (msg: GameStateMessage) => {
        console.log('deal state received', msg)
        const { game, round, hand } = msg
        this.setState({ game, round, hand }, () => {
            console.log('deal state set', this.state.game)
            this.deck = undefined
            this.deck = Deck()
            this.deck.mount(document.getElementById('table'))
            this.animateDeal()
        })
    }

    socketHandlePlayCard = (msg: PlayCardsMessage) => {
        const { cards, game, round, x, y, hand, side, zIndex, rot } = msg
        this.setState({ game, round, hand }, () => {
            const deckCards = cards.map((card) => this.deck.cards.find((c: Card) => c.rank === card.rank && c.suit === card.suit))
            console.log(x, y)
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

    socketHandleGameState = (msg: GameStateMessage) => {
        console.log('game state received', msg)
        const { game, round, hand } = msg
        this.setState({ game, round, hand })
    }

    asyncDeal = () => {
        this.clearDeck()
        this.initiateDeck()
        this.shuffle()
        setTimeout(this.deal, 3500)
    }

    deal = () => {
        console.log('__deck__', this.deck)
        const thisRound = this.state.game.roundsToPlay[0]
        const userLength = this.state.game.users.length
        const { users } = this.state.game
        for (let i = 0; i < this.state.round.id; i++) {
            const mod = i === 0 ? 0 : userLength * i
            this.state.game.users.map((user, j) => {
                const cardIndex = mod + j
                const card = this.deck.cards[cardIndex]

                users[j].cards.push({ ...card, isPlayed: false })
            })
        }

        const trumpCardIndex: number = users.length * this.state.round.id
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
                console.log(x, y)
                deckCard.animateTo({
                    duration: 300,
                    east: 'quartOut',
                    x: x,
                    y: y,
                    rot: 10,
                })
            })
        })
        const trumpCard = this.deck.cards.find((c: any) => c.rank === this.state.round.trumpCard?.rank && c.suit === this.state.round.trumpCard?.suit)
        if (trumpCard) {
            trumpCard.animateTo({ delay: 500, x: 120 })
            trumpCard.setSide('front')
        }
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
        console.log('id', id)
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
        console.log('id', id)
        const { users } = this.state.game
        users[id].isOccupied = true
        let name = prompt("What's your name?", 'name')
        const foundName = users.find((user) => user.name === name)
        if (foundName !== undefined) return alert('That name is taken, please choose another')
        users[id].name = name ? name : ''
        this.setState({ game: { ...this.state.game, users }, myId: id }, () => {
            const { game, round, hand } = this.state
            this.socket.emit('gameState', { game, round, hand })
        })
    }

    handleStartGame = () => {
        // remove unused seats
        const users = this.state.game.users.filter((user) => user.isOccupied)
        if (users.length < 2) return alert('Bugger your neighbour is better with friends. Share the link to invite some players!')
        const availableRounds = Math.floor(52 / users.length)
        const userRounds = prompt("What's the highest round you'd like to play?", availableRounds.toString())
        const rounds = Number(userRounds)
        const gameState = GameState.playing
        console.log('rounds', rounds)

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
        console.log('prev index', playerIndex)
        playerIndex++
        console.log('post index', playerIndex)
        return playerIndex >= this.state.round.roundOrder.length ? undefined : playerIndex
    }

    handlePlayCard = (e: any, card: Card, userId?: number) => {
        e.preventDefault()
        if (userId === undefined) {
            console.log('no userId provided')
            return
        }
        const { users } = this.state.game

        const nextPlayerIndex = this.getNextPlayerIndex(userId)
        let nextPlayer: number | undefined
        if (nextPlayerIndex === undefined) {
            nextPlayer = undefined
        } else {
            nextPlayer = this.state.round.roundOrder[nextPlayerIndex]
        }
        const { cards } = this.state.hand
        const { trumpCard, hands } = this.state.round
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
        const playingArea = document.getElementById('playingArea')?.getBoundingClientRect() as DOMRect
        const x = playingArea.left - 200 + Math.random() * 400
        const y = playingArea.top - 200 + Math.random() * 400
        this.setState(
            { game: { ...this.state.game, users: newUsers, activeUser: nextPlayer }, round: { ...this.state.round, hands, trumpCard }, hand: { cards } },
            () => {
                const { game, round, hand } = this.state
                const zIndex = this.state.hand.cards.length
                const side = 'front'
                const rot = Math.random() * 720
                const message: PlayCardsMessage = { cards: [card], game, round, hand, x, y, zIndex, side, rot }
                this.socket.emit('playCards', message)
                // handling the animation of playing the card, which is done on socket emit (which won't be triggered for the user)
                this.socketHandlePlayCard(message)
                if (nextPlayer === undefined) {
                    setTimeout(this.playNextHand, 5000)
                }
            },
        )
    }

    playNextHand = () => {
        const { cards } = this.state.hand
        const { trumpCard, hands } = this.state.round
        // hand is over, time to get winner and start next hand
        const cardLed = cards[0]
        const winner = getHandResult(cards[0], cards, trumpCard?.suit, true, false)
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

        this.setState(
            {
                game: { ...this.state.game, activeUser },
                round: { ...this.state.round, hands },
                hand: { cardLed: undefined, cards: [], winnerId: undefined },
            },
            () => {
                const { game, round, hand } = this.state
                const side = 'back'
                const x = 1000
                const y = 1000

                const message: PlayCardsMessage = { game, round, hand, side, x, y, cards }
                this.socket.emit('playCards', message)
                this.socketHandlePlayCard(message)
                // check to see if users have more cards
                const usersWithCardsLeft = game.users.filter((user) => user.cards.length !== 0)
                if (usersWithCardsLeft.length === 0) {
                    this.playNextRound()
                }
            },
        )
        // reset game state/animate playing cards
        //  set new game
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
            const { game } = this.state
            const { roundsToPlay, rounds } = game
            if (roundsToPlay.length === 0) {
                // game over, man. game over.
            } else {
                const { round: lastRound } = this.state
                const { dealerId } = lastRound
                const dealerIndex = getDealerIndex(users, dealerId as number)
                this.startRound(dealerIndex, roundsToPlay[0].id)
            }
        })
    }

    startRound = (dealerIndex: number, id: number) => {
        const { users } = this.state.game
        const dealerId = users[dealerIndex].id
        const roundOrder = getRoundOrder(users, dealerIndex)
        const activeUser = roundOrder[0]

        const newRound: Round = {
            id,
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
        this.setState({ showresults: false })
    }

    handleOpenResults = (event: React.MouseEvent) => {
        event.preventDefault()
        this.setState({ showresults: true })
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
                    canOccupy={this.state.myId === undefined}
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

        console.log('myId', this.state.myId)
        console.log('dealerId', this.state.round.dealerId)

        const me = this.state.game.users.find((user) => user.id === this.state.myId)
        const myCards = me !== undefined ? me.cards : []
        const magicBids = this.state.round.id
        const possiblebids = Array.from({ length: magicBids + 1 }, (_, i) => i)
        const currentBidTotal = this.state.round.bids.reduce((acc, cur) => acc + cur.bid, 0)
        console.log('currentBidTotal', currentBidTotal)
        const availableBids = amDealer ? possiblebids.filter((bid) => magicBids - currentBidTotal - bid !== 0) : possiblebids
        console.log('available', availableBids)
        // const minBid = amDealer ? 0 : 0
        // const maxBid = amDealer ? 0 : magicBids
        return (
            <div id="game">
                {!dealerAssigned && <button onClick={this.handleStartGame}>Start Game</button>}
                {this.state.game.state === GameState.playing && <button onClick={this.handleOpenResults}>Show Results</button>}
                <Results isOpen={this.state.showresults} onRequestClose={this.handleCloseResults} game={this.state.game} />
                {/* {amDealer && (
                    <div>
                        <button onClick={this.asyncDeal}>Deal</button>
                        <button
                            onClick={() => {
                                this.clearDeck()
                                this.initiateDeck()
                                this.shuffle()
                            }}
                        >
                            Shuffle
                        </button>
                    </div>
                )} */}
                <span>{`  Round ${this.state.round.id} ${withTrump}`}</span>
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
