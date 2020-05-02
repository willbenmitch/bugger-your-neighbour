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

const HandleJoinGame = () => {
    const id = window.prompt('Enter the id for this game.')
    if (!id) {
        return <div></div>
    }
    return <div></div>
}

const Games = () => {
    const { id } = useParams()
    const match = useRouteMatch()
    const history = useHistory()

    console.log('params', id)
    console.log('match', match)

    if (!id) {
        alert('No id provided, going home.')
        history.push(Routes.home)
    }
    return (
        <div>
            <Switch></Switch>
        </div>
    )
}

const Home = () => {
    const match = useRouteMatch()
    const history = useHistory()

    const handleStartGame = () => {
        const gameId = uuidv4()
        console.log('gameId', gameId)
        // TODO - create game room on server
        history.push(`${Routes.games}/${gameId}`)
    }
    console.log('home', match)
    return (
        <div id="app">
            <h1>Bugger Your Neighbour</h1>
            <button onClick={handleStartGame}>Start a New Game</button>
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
            <Switch>
                <Route exact path={Routes.home} component={Home} />
                <Route exact path={`${Routes.games}`} component={Games} />
                <Route path={`${Routes.games}/:id`} component={Game} />
            </Switch>
        </Router>
    )
}

export default App
