import React from 'react'
import './App.css'
// @ts-ignore
import io from 'socket.io-client'
// @ts-ignore
import Deck from 'deck-of-cards'
import User from './components/User'

const positions = [
    { isOccupied: false, name: 'Open', x: 50, y: 5, cards: [] },
    { isOccupied: false, name: 'Open', x: 25, y: 5, cards: [] },
    { isOccupied: false, name: 'Open', x: 0, y: 5, cards: [] },
    { isOccupied: false, name: 'Open', x: 0, y: 30, cards: [] },
    { isOccupied: false, name: 'Open', x: 0, y: 55, cards: [] },
    { isOccupied: false, name: 'Open', x: 0, y: 80, cards: [] },
    { isOccupied: false, name: 'Open', x: 25, y: 90, cards: [] },
    { isOccupied: false, name: 'Open', x: 50, y: 90, cards: [] },
    { isOccupied: false, name: 'Open', x: 75, y: 90, cards: [] },
]

enum GamePlay {
    inactive = 'inactive',
    dealing = 'dealing',
    roundInProgress = 'roundInProgress',
    roundFinished = 'roundFinished',
}

type Props = {}
type State = {
    game: {
        trumpCard: any
        gamePlay: GamePlay
        users: any[]
        activeUserId: number
        round: number
        withTrump: boolean
        dealerId?: number
        currentHand: any[]
    }
    myId?: number
}

class App extends React.Component<Props, State> {
    // @ts-ignore
    state: State = {
        game: {
            trumpCard: undefined,
            gamePlay: GamePlay.inactive,
            users: positions,
            activeUserId: 0,
            round: 10,
            withTrump: true,
            dealerId: undefined,
            currentHand: [],
        },
        myId: undefined,
    }

    deck: any
    userRefs: any = []
    socket: any

    componentDidMount() {
        // this.initiateDeck()
        this.state.game.users.forEach((user) => {
            this.userRefs.push(React.createRef())
        })
        this.socket = io('http://localhost:4000')
        this.socket.on('deal', this.socketHandleDeal)
        this.socket.on('playCard', this.socketHandlePlayCard)
        this.socket.on('assignDealer', this.socketHandleAssignDealer)
        this.socket.on('gameState', this.socketHandleGameState)
    }

    socketHandleDeal = (msg: any) => {
        this.setState({ game: { ...msg } }, () => {
            console.log('deal state received', msg)
            this.deck = undefined
            this.deck = Deck()
            this.deck.mount(document.getElementById('table'))
            this.animateDeal()
        })
    }
    socketHandlePlayCard = (msg: any) => {}
    socketHandleAssignDealer = (msg: any) => {}
    socketHandleGameState = (msg: any) => {
        console.log('game state received', msg)
        this.setState({ game: msg })
    }

    deal = () => {
        const userLength = this.state.game.users.length
        const { users } = this.state.game
        for (let i = 0; i < this.state.game.round; i++) {
            const mod = i === 0 ? 0 : userLength * i
            this.state.game.users.map((user, j) => {
                const cardIndex = mod + j
                const card = this.deck.cards[cardIndex]

                users[j].cards.push(card)
            })
        }

        const trumpCardIndex: number = users.length * this.state.game.round
        const trumpCard = this.deck.cards[trumpCardIndex]

        this.setState({ game: { ...this.state.game, trumpCard } }, () => {
            this.socket.emit('deal', this.state.game)
            this.socketHandleDeal(this.state.game)
        })
    }

    animateDeal = () => {
        const clientHeight = document.documentElement.clientHeight
        const clientWidth = document.documentElement.clientWidth
        const cardWidth = 120
        const cardHeight = 100
        this.state.game.users.map((user) => {
            user.cards.map((card: any, i: number) => {
                const deckCard = this.deck.cards.find((c: any) => c.rank === card.rank && c.suit === card.suit)
                const x = clientWidth - clientWidth * (user.x / 100) - cardWidth * 2 - 5 * i
                const y = clientHeight * (user.y / 100) - cardHeight
                console.log(x, y)
                deckCard.animateTo({
                    duration: 300,
                    east: 'quartOut',
                    x: x,
                    y: y,
                    rot: 10,
                })
                deckCard.setSide('front')
            })
        })
        const trumpCard = this.deck.cards.find((c: any) => c.rank === this.state.game.trumpCard.rank && c.suit === this.state.game.trumpCard.suit)
        trumpCard.animateTo({ delay: 500, x: 120 })
        trumpCard.setSide('front')
    }

    initiateDeck = () => {
        this.deck = Deck()
        this.deck.cards.forEach((card: any) => {
            card.enableDragging()
            card.enableFlipping()
        })
        this.deck.mount(document.getElementById('table'))
        this.deck.intro()
        this.deck.shuffle()
        this.deck.shuffle()
    }

    resetDeck = () => {
        const table = document.getElementById('table')
        try {
            this.deck.unmount(table)
        } catch (err) {
            console.error(err)
        }
        this.deck = undefined
        this.initiateDeck()
    }

    shuffle = () => {
        this.deck.mount(document.getElementById('table'))
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
        this.setState({ game: { ...this.state.game, users }, myId: undefined })
        this.socket.emit('gameState', this.state.game)
    }

    handleSit = (e: any, id: number) => {
        e.preventDefault()
        console.log('id', id)
        const { users } = this.state.game
        users[id].isOccupied = true
        const name = prompt("What's your name?", 'name')
        users[id].name = name
        this.setState({ game: { ...this.state.game, users }, myId: id })
        this.socket.emit('gameState', this.state.game)
    }

    handleStartGame = () => {
        const users = this.state.game.users.filter((user) => user.isOccupied)
        this.setState({ game: { ...this.state.game, users } }, () => {
            this.socket.emit('gameState', this.state.game)

            const dealerId = Math.floor(Math.random() * this.state.game.users.length)
            console.log('dealerId', dealerId)
            this.setState({ game: { ...this.state.game, dealerId } }, () => {
                this.socket.emit('gameState', this.state.game)
            })
        })
    }

    render() {
        const users = this.state.game.users.map(({ name, x, y, isOccupied }, i) => (
            <User
                ref={this.userRefs[i]}
                name={name}
                x={x}
                y={y}
                isOccupied={isOccupied}
                onLeave={(e) => this.handleLeave(e, i)}
                onSit={(e) => this.handleSit(e, i)}
                isMe={i === this.state.myId}
                canOccupy={this.state.myId === undefined}
                isDealer={this.state.game.dealerId !== undefined && this.state.game.dealerId === i}
            />
        ))
        const withTrump = this.state.game.withTrump ? 'with trump' : 'no trump'
        const dealerAssigned = this.state.game.dealerId !== undefined
        const amDealer = dealerAssigned && this.state.game.dealerId === this.state.myId
        console.log('myId', this.state.myId)
        console.log('dealerId', this.state.game.dealerId)
        return (
            <div id="game">
                {!dealerAssigned && <button onClick={this.handleStartGame}>Start Game</button>}
                {amDealer && (
                    <div>
                        <button onClick={this.deal}>Deal</button>
                        <button onClick={this.resetDeck}>Shuffle</button>
                    </div>
                )}
                <span>{`  Round ${this.state.game.round} ${withTrump}`}</span>
                <div id="users">{users}</div>
                <div id="table"></div>
            </div>
        )
    }
}

export default App