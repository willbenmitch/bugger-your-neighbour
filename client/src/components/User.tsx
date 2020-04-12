import React from 'react'
import { Card, RoundState } from './types'
import { rankMap, suitMap, suitMapUnicode } from './UserHand'

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
        const { name, y, x, isOccupied, onLeave, onSit, isMe, canOccupy, isDealer, roundState, playedCard, isPlayerTurn, handsWon, myBid } = this.props
        const occupied = isMe ? isOccupied ? <button onClick={onLeave}>Leave</button> : null : canOccupy ? <button onClick={onSit}>Sit</button> : null
        const dealer = isDealer ? <p>Dealer</p> : null
        const bidding = !isPlayerTurn ? null : roundState === RoundState.bidding ? <p>Bidding</p> : null
        const playing = !isPlayerTurn ? null : roundState === RoundState.playing ? <p>Playing</p> : null
        const cardPlayed = playedCard ? <p>{`${rankMap(playedCard.rank)} ${suitMapUnicode(playedCard.suit)}`}</p> : null
        const bidHands = myBid !== undefined ? <p>Bid: {myBid}</p> : null
        const wonHands = roundState === RoundState.playing ? <p>Won: {handsWon}</p> : null
        return (
            <div style={{ position: 'absolute', top: `${y}vh`, right: `${x}vw`, width: '10vh', height: '10vh' }}>
                <h3>{name}</h3>
                {occupied}
                {dealer}
                {bidding}
                {playing}
                {cardPlayed}
                {bidHands}
                {wonHands}
            </div>
        )
    }
}

export default User
