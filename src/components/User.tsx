import React from 'react'
import { Card } from './types'

type Props = {
    name: string
    x: number
    y: number
    cards?: Card[]
}

type State = {}

class User extends React.Component<Props, State> {
    render() {
        const { name, y, x } = this.props
        return (
            <div style={{ position: 'absolute', top: `${y}vh`, right: `${x}vw`, width: '10vh', height: '10vh' }}>
                <p>{name}</p>
            </div>
        )
    }
}

export default User
