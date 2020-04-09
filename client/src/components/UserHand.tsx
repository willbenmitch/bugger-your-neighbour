import React from 'react'
import { Card } from './types'
import { RoundState } from './types'

type Props = {
    cards: Card[]
    isPlayerTurn: boolean
    canReneg: boolean
    onPlayCard: (e: any, card: Card, userId?: number) => void
    id?: number
    roundState: RoundState
    bid?: number
    maxBid?: number
    onBid: (bid: number, userId: number) => void
}
type State = { bid?: number }
export const suitMap = (suit: number) => (suit === 0 ? 'spades' : suit === 1 ? 'hearts' : suit === 2 ? 'clubs' : suit === 3 ? 'diamonds' : 'joker')
export const rankMap = (rank: number) => (rank === 0 ? 'ace' : rank === 11 ? 'jack' : rank === 12 ? 'queen' : rank === 13 ? 'king' : rank)

class UserHand extends React.Component<Props, State> {
    state: State = {
        bid: 0,
    }

    handleBid = (e: any) => {
        const { onBid, maxBid, id } = this.props
        e.preventDefault()
        if (this.state.bid === undefined || this.state.bid < 0 || (maxBid !== undefined && this.state.bid > maxBid)) {
            return alert(`You have to enter a bid between 0 and ${maxBid}`)
        }
        onBid(this.state.bid, id as number)
        this.setState({ bid: 0 })
    }

    handleChange = (e: any) => {
        e.preventDefault()
        this.setState({ bid: Number(e.target.value) })
    }

    handleKeyDown = (e: any) => {
        if (e.keyCode == 13) {
            this.handleBid(e)
        }
    }

    render() {
        const { cards, onPlayCard, id, roundState, bid, onBid, maxBid, isPlayerTurn } = this.props
        let y = 0

        if (id === undefined) {
            return <div></div>
        }
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
                    {roundState === RoundState.playing && isPlayerTurn && <button onClick={(e) => onPlayCard(e, card, id)}>Play Card</button>}
                </div>
            )
        })

        const bidJSX = roundState === RoundState.bidding && isPlayerTurn && (
            <div>
                <form>
                    <input type="number" defaultValue={0} onSubmit={this.handleKeyDown} onChange={this.handleChange} onKeyDown={this.handleKeyDown}></input>
                    <button type="submit" onClick={this.handleBid}></button>
                </form>
                <p>{`Bid: ${bid}`}</p>
            </div>
        )
        return (
            <div style={{ position: 'absolute', top: `${0}vh`, right: `${0}vw`, width: '25vw', height: '100vh', border: '2px solid black' }}>
                <h1>This is your hand</h1>
                <div id="bid">{bidJSX}</div>
                <div id="hand">{hand}</div>
            </div>
        )
    }
}

export default UserHand
