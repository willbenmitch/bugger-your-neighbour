import React from 'react'
import { Card } from './types'

type Props = {
    cards: Card[]
    isPlayerTurn: boolean
    canReneg: boolean
}
type State = {}

class UserHand extends React.Component<Props, State> {
    render() {
        return <div></div>
    }
}

export default UserHand
