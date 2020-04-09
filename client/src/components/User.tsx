import React from 'react'
import { Card, RoundState } from './types'
import { rankMap, suitMap } from './UserHand'

type Props = {
    name: string
    x: number
    y: number
    isOccupied: boolean
    cards?: Card[]
    onLeave: (e: any) => void
    onSit: (e: any) => void
    isMe: boolean
    canOccupy: boolean
    isDealer: boolean
    roundState: RoundState
    isPlayerTurn: boolean
    playedCard?: Card
    myBid?: number
    handsWon: number
}

type State = {}

class User extends React.Component<Props, State> {
    render() {
        const { name, y, x, isOccupied, onLeave, onSit, isMe, canOccupy, isDealer, roundState, playedCard, isPlayerTurn, handsWon } = this.props
        const occupied = isOccupied ? isMe ? <button onClick={onLeave}>Leave</button> : null : canOccupy ? <button onClick={onSit}>Sit</button> : null
        const dealer = isDealer ? <p>Dealer</p> : null
        const bidding = !isPlayerTurn ? null : roundState === RoundState.bidding ? <p>Bidding</p> : null
        const playing = !isPlayerTurn ? null : roundState === RoundState.playing ? <p>Playing</p> : null
        const cardPlayed = playedCard ? <p>{`${rankMap(playedCard.rank)} of ${suitMap(playedCard.suit)}`}</p> : null
        const wonHands = roundState === RoundState.playing ? <p>Hands won: {handsWon}</p> : null
        return (
            <div style={{ position: 'absolute', top: `${y}vh`, right: `${x}vw`, width: '10vh', height: '10vh' }}>
                <p>{name}</p>
                {occupied}
                {dealer}
                {bidding}
                {playing}
                {cardPlayed}
                {wonHands}
            </div>
        )
    }
}

export default User
