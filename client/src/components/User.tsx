import React from 'react'
import { Card } from './types'

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
}

type State = {}

class User extends React.Component<Props, State> {
    render() {
        const { name, y, x, isOccupied, onLeave, onSit, isMe, canOccupy, isDealer } = this.props
        const occupied = isOccupied ? isMe ? <button onClick={onLeave}>Leave</button> : null : canOccupy ? <button onClick={onSit}>Sit</button> : null
        const dealer = isDealer ? <p>Dealer</p> : null

        // let occupied = null
        // if (isMe) {
        //     occupied = isOccupied ? <button onClick={onLeave}>Leave</button> : <button onClick={onSit}>Sit</button>
        // } else {
        //     occupied = isOccupied ?
        // }
        return (
            <div style={{ position: 'absolute', top: `${y}vh`, right: `${x}vw`, width: '10vh', height: '10vh' }}>
                <p>{name}</p>
                {occupied}
                {dealer}
            </div>
        )
    }
}

export default User
