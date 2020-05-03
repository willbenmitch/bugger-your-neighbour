import React from 'react'
import { BrowserRouter as Router, Switch, Route, Link, useRouteMatch, useParams, useHistory } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

import '../node_modules/deck-of-cards/example/example.css'
// import Home from './components/Home'
import Game from './components/Game/Game'

type Props = {}
type State = {}

export enum Routes {
    home = '/',
    games = '/games',
}

const Home = (props: any) => {
    const history = useHistory()

    const handleStartGame = () => {
        const gameId = uuidv4()
        // TODO - create game room on server
        history.push(`${Routes.games}/${gameId}`)
        const url = window.location.href
        alert(`Copy this url to share with your players: ${url}`)
    }
    return (
        <div id="app">
            <h1>Bugger Your Neighbour</h1>
            <button onClick={handleStartGame}>Start a New Game</button>
        </div>
    )
}

export const Footer = () => {
    return (
        <div style={{ position: 'absolute', width: '100%', bottom: 10, fontSize: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <a style={{ paddingRight: 15 }} href="https://www.linkedin.com/in/willbenmitchell/" target="_blank" rel="noopener noreferrer">
                    LinkedIn
                </a>
                <a style={{ paddingRight: 15 }} href="https://github.com/willbenmitch" target="_blank" rel="noopener noreferrer">
                    GitHub
                </a>
                <a style={{ paddingRight: 15 }} href="https://twitter.com/WillBenMitchell" target="_blank" rel="noopener noreferrer">
                    Twitter
                </a>
                <a style={{ paddingRight: 15 }} href="https://willbenmitch.com" target="_blank" rel="noopener noreferrer">
                    Web
                </a>
                <p style={{ opacity: 0.6 }}>willbenmitch {new Date().getFullYear()}</p>
            </div>
        </div>
    )
}

const App = () => {
    return (
        <Router>
            <ul>
                <li>
                    <Link to={Routes.home}>Home</Link>
                </li>
            </ul>
            <Route exact path={Routes.home} render={(routeProps) => <Home key={new Date().getTime()} {...routeProps} />} />
            <Route exact path={`${Routes.games}/:id`} render={(routeProps) => <Game key={new Date().getTime()} {...routeProps} />} />
            <Footer />
        </Router>
    )
}

export default App
