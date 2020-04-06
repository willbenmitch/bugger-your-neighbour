import React from 'react'
import { Card } from './types'

type Props = {
    cards: any[]
    isPlayerTurn: boolean
    canReneg: boolean
}
type State = {}
const suitMap = (suit: number) => (suit === 0 ? 'spades' : suit === 1 ? 'hearts' : suit === 2 ? 'clubs' : suit === 3 ? 'diamonds' : 'joker')

class UserHand extends React.Component<Props, State> {
    render() {
        const { cards } = this.props
        let y = 0
        const hand = cards.map((card, i) => {
            const mod = i % 3
            console.log(mod)
            let x
            switch (mod) {
                case 0:
                    y += 150
                    x = -120
                    break
                case 1:
                    x = -20
                    break
                case 2:
                default:
                    x = 80
                    break
            }
            return (
                <div className={`card ${suitMap(card.suit)} rank${card.rank}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
                    <div className="face"></div>
                </div>
            )
        })
        return (
            <div style={{ position: 'absolute', top: `${0}vh`, right: `${0}vw`, width: '25vw', height: '100vh', border: '2px solid black' }}>
                <h1>This is your hand</h1>
                <div id="hand">{hand}</div>
            </div>
        )
    }
}

export default UserHand
