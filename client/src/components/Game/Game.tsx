import React from 'react'
import './Game.css'
// @ts-ignore
import io from 'socket.io-client'
// @ts-ignore
import Deck from 'deck-of-cards'
import User from '../User'
import UserHand from '../UserHand'
import { Card, Round, Game as GameType, Hand } from '../types'
import { didFollowSuit } from '../utils/gameLogic'
import { getRoundsToPlay } from '../utils/getRoundOrder'
import Results from '../Results'
import { GameStateMessage, PlayCardsMessage } from './utils'
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
    state: State = getInitialState()
    isUpdating: boolean = false
    deck: any
    socket: any
    clientHeight = () => document.documentElement.clientHeight
    clientWidth = () => document.documentElement.clientWidth
    cardWidth = 120
    cardHeight = 100

    componentDidMount() {
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        this.socket = io(`${process.env.REACT_APP_SERVER_URL}?id=${roomId}`)
        this.socket.on('welcome', (msg: GameStateMessage) => {
            console.log('welcome!', msg)
            this.initiateDeck()
            const callback = () => {
                const { cards } = this.state!.hand
                const { trumpCard } = this.state!.round
                if (trumpCard) {
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
        this.socket.on('newRound', this.socketHandleNewRound)
    }

    componentWillUnmount() {
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

    socketHandleNewRound = (msg: GameStateMessage) => {
        // @ts-ignore
        const { game, round, hand } = msg
        this.setState({ game, round, hand }, () => {
            if (this.state.round.dealerId === this.state.myId) {
                this.asyncDeal()
            }
        })
    }

    socketHandlePlayCard = (msg: PlayCardsMessage) => {
        const { cards, game, round, x, y, hand, side, zIndex, rot } = msg
        const playingArea = document.getElementById('playingArea')?.getBoundingClientRect() as DOMRect
        const clientX = playingArea.left - 100 + x * (this.clientWidth() * 0.3)
        const clientY = playingArea.top - 100 + y * (this.clientHeight() * 0.3)
        console.log('handlePlay', msg)
        this.setState({ game, round, hand }, () => {
            const deckCards = cards.map((card) => this.deck.cards.find((c: Card) => c.rank === card.rank && c.suit === card.suit))
            deckCards.map((card) => {
                card.animateTo({
                    duration: 300,
                    east: 'quartOut',
                    x: clientX,
                    y: clientY,
                    rot,
                })
                card.setSide(side)
                card.$el.style['z-index'] = zIndex ? zIndex : 1
            })
        })
    }

    socketHandleGameState = (msg: GameStateMessage, callback?: () => void) => {
        console.log('socketHandleGameState', msg)
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
        this.deck.queue(this.deal)
    }

    deal = () => {
        // @ts-ignore
        const { id: roomId } = this.props.match.params

        this.socket.emit('deal', roomId, this.deck.cards)
    }

    animateDeal = () => {
        this.state!.game.players.map((player) => {
            player.cards.map((card: any, i: number) => {
                const { position } = player
                const deckCard = this.deck.cards.find((c: any) => c.rank === card.rank && c.suit === card.suit)
                const x = this.clientWidth() - this.clientWidth() * (position.x / 100) - this.cardWidth * 2 - 5 * i
                const y = this.clientHeight() * (position.y / 100) - this.cardHeight
                deckCard.animateTo({
                    duration: 300,
                    east: 'quartOut',
                    x: x,
                    y: y,
                    rot: 10,
                })
            })
        })
        const { trumpCard } = this.state!.round
        if (trumpCard) {
            this.animateTrumpCard(trumpCard)
        }
    }

    animateTrumpCard = (card: Card) => {
        const trumpCard = this.deck.cards.find((c: any) => c.rank === this.state!.round.trumpCard?.rank && c.suit === this.state!.round.trumpCard?.suit)
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
        const { players } = this.state!.game
        const player = players.find((p) => p.position.id === id)
        if (!player) {
            return
        }
        const newPlayers = players.map((p) => (p.position.id === id ? player : p))
        this.setState({ game: { ...this.state!.game, players: newPlayers }, myId: undefined }, () => {
            this.socket.emit('leave', { isOccupied: false, socketId: undefined, name: 'Open', id: player.id })
        })
    }

    handleSit = (e: any, id: number) => {
        e.preventDefault()
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const { id: socketId } = this.socket
        const { players } = this.state!.game
        const player = players.find((p) => p.position.id === id)
        if (player == undefined) return alert('Could not find seat.')
        let name = prompt("What's your name?", 'name')
        if (!name) {
            return
        }
        const foundName = players.find((p) => p.name === name)
        if (foundName !== undefined) return alert('That name is taken, please choose another')
        const message = { isOccupied: true, socketId, name, id: player.id }
        console.log('handleSit message', message)
        this.setState({ myId: id }, () => {
            this.socket.emit('sit', message)
        })
    }

    handleStartGame = () => {
        // remove unused seats
        const players = this.state!.game.players.filter((player) => player.isOccupied)
        if (players.length < 2) return alert('Bugger your neighbour is better with friends. Share the link to invite some players!')
        const availableRounds = Math.floor(51 / players.length)
        const userRounds = prompt("What's the highest round you'd like to play?", availableRounds.toString())
        const rounds = Number(userRounds)

        if (!rounds || rounds < 1 || rounds > availableRounds) return alert(`please enter a number between 1 and ${availableRounds}`)

        const roundsToPlay = getRoundsToPlay(rounds)
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        this.socket.emit('startGame', roomId, players, roundsToPlay)
    }

    handleBid = (bid: number, playerId: number) => {
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const { id: roundId } = this.state.round
        this.socket.emit('bid', roomId, { bid, playerId, roundId })
    }

    handlePlayCard = (e: any, card: Card, playerId?: number) => {
        e.preventDefault()
        if (playerId == undefined) {
            console.warn('no playerId provided')
            return
        }
        // @ts-ignore
        const { id: roomId } = this.props.match.params
        const { players } = this.state!.game
        const { id: handId, cardLed } = this.state!.hand
        const { id: roundId } = this.state.round
        const userHand = players.find((p) => p.position.id === playerId)!.cards
        const isCardValid = didFollowSuit(card, userHand, cardLed)

        if (!isCardValid) {
            return alert('You must follow suit')
        }

        this.socket.emit('playCards', roomId, { card, playerId, roundId, handId })
    }

    getPlayCardsMessage = (card: Card): PlayCardsMessage => {
        const { game, round, hand } = this.state!
        const playingArea = document.getElementById('playingArea')?.getBoundingClientRect() as DOMRect
        const x = playingArea.left - 100 + Math.random() * (this.clientWidth() * 0.3)
        const y = playingArea.top - 100 + Math.random() * (this.clientHeight() * 0.3)
        const zIndex = this.state!.hand.cards.length
        const side = 'front'
        const rot = Math.random() * 720
        const message: PlayCardsMessage = { cards: [card], game, round, hand, x, y, zIndex, side, rot }
        return message
    }

    handleCloseResults = (event: React.MouseEvent) => {
        event.preventDefault()
        this.setState({ showResults: false })
    }

    handleOpenResults = (event?: React.MouseEvent) => {
        event && event.preventDefault()
        this.setState({ showResults: true })
    }

    render() {
        const { round } = this.state
        const players = this.state!.game.players.map(({ name, position, isOccupied }) => {
            const { x, y, id } = position
            const { cards } = this.state!.hand
            const { activeUser } = this.state!.game
            const isPlayerTurn = activeUser !== undefined && activeUser === id
            const playedCard = cards.find((card) => card.playerId === id)
            const myBid = this.state!.round.bids.find((bid) => bid.playerId === id)?.bid
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
                    isMe={id === this.state!.myId}
                    canOccupy={!isOccupied && this.state!.myId == undefined}
                    isDealer={this.state!.round.dealerId !== undefined && this.state!.round.dealerId === id}
                    playedCard={playedCard}
                    roundState={this.state!.round.state}
                    myBid={myBid}
                    handsWon={this.state!.round.hands ? this.state.round.hands.filter((hand) => hand.winnerId === id).length : 0}
                />
            )
        })
        const withTrump = round.trumpCard ? 'with trump' : 'no trump'
        const dealerAssigned = this.state!.round.dealerId != undefined
        const amDealer = dealerAssigned && this.state!.round.dealerId === this.state!.myId
        const activeUsers = this.state!.game.players.filter((player) => player.isOccupied).sort((a, b) => a.position.id - b.position.id)
        const amAdmin = activeUsers.length > 0 && activeUsers[0].position.id === this.state!.myId

        const me = this.state!.game.players.find((player) => player.position.id === this.state!.myId)
        const myCards = me !== undefined ? me.cards : []
        const magicBids = this.state!.round.cardsToDeal
        const possiblebids = Array.from({ length: magicBids + 1 }, (_, i) => i)
        const currentBidTotal = this.state!.round.bids.reduce((acc, cur) => acc + cur.bid, 0)
        const availableBids = amDealer ? possiblebids.filter((bid) => magicBids - currentBidTotal - bid !== 0) : possiblebids

        return (
            <div id="game">
                {!dealerAssigned && amAdmin && <button onClick={this.handleStartGame}>Start Game</button>}
                {/* {this.state!.game.state !== GameState.idle &&  */}
                <button onClick={this.handleOpenResults}>Show Results</button>
                {/* } */}
                <Results isOpen={this.state!.showResults} onRequestClose={this.handleCloseResults} game={this.state!.game} />
                <span>{`  Round ${this.state!.round.cardsToDeal} ${withTrump}`}</span>
                <div id="players">{players}</div>
                <div id="table"></div>
                <div id="playingArea"></div>
                <UserHand
                    cards={myCards}
                    isPlayerTurn={this.state!.game.activeUser != undefined && this.state!.game.activeUser === this.state!.myId}
                    canReneg
                    onPlayCard={this.handlePlayCard}
                    id={this.state!.myId}
                    availableBids={availableBids}
                    onBid={this.handleBid}
                    roundState={this.state!.round.state}
                />
            </div>
        )
    }
}

export default Game
