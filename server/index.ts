const fs = require('fs')
const express = require('express')
const http = require('http')
const https = require('https')
const IOsocket = require('socket.io')
const cors = require('cors')
const path = require('path')
const _ = require('lodash')
import { GameStateMessage, PlayCardsMessage, initialGame, initialHand, initialRound } from '../client/src/components/Game/utils'
import { Game, Round, Hand, Player } from '../client/src/components/types'

const indexFile = path.resolve(__dirname, '../client/build/index.html')
const NODE_ENV = process.env.NODE_ENV
const envFilPath = path.resolve(__dirname, `../client/.env.${NODE_ENV}`)

const getInitialState = () => ({
    game: _.cloneDeep(initialGame),
    round: _.cloneDeep(initialRound),
    hand: _.cloneDeep(initialHand),
    myId: undefined,
    showResults: false,
})

const app = express()
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    credentials: true,
}

app.use(cors(corsOptions))
app.use(express.static('../client/build'))

const options = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem')
};

const server = http.createServer(app)
// const server = https.createServer(options, app)
const io = IOsocket(server)
io.origins((origin: any, callback: any) => {
    callback(null, true)
})

let userMap: { [id: string]: { id: string; socketId: string }[] }
let gameState: { [id: string]: { isUpdating: boolean; game: Game; round: Round; hand: Hand } } = {}
let pingedIds: { [id: string]: number[] } = {}

const waitForIt = (id: string, callback: () => void) => {
    while (gameState[id].isUpdating) {
        // do nothing
    }
    gameState[id].isUpdating = true
    callback()
    gameState[id].isUpdating = false
}

const startServer = () => {
    app.get('*', function (req: any, res: any) {
        res.sendFile(indexFile)
    })

    io.on('connection', (socket: any) => {
        const { id: socketId } = socket
        console.log('a socket connection was established with id: ', socket.id)
        const { id } = socket.handshake.query
        console.log('a user connected to room : ', id)
        if (!id) {
            console.error('no room ID provided')
            return
        }

        socket.join(id)

        // emit a welcome message, if the game has a state
        if (gameState[id] === undefined) {
            const initialState = getInitialState()
            const { game, hand, round } = initialState
            gameState[id] = { game, hand, round, isUpdating: false }
        }

        socket.emit('welcome', gameState[id])

        socket.on('ping', function () {
            socket.in(id).emit('pong')
        })

        socket.on('disconnect', function () {
            console.log('user disconnected with socketId: ', socketId)
            if (!!gameState[id] && !!gameState[id].game && gameState[id].game.users.length) {
                const playerIndex = gameState[id].game.users.findIndex((u) => u.socketId === socketId)
                if (playerIndex === -1) {
                    console.warn('player not found')
                    return
                }

                const player = gameState[id].game.users[playerIndex]
                gameState[id].game.users[playerIndex] = { ...player, socketId: undefined, name: 'Open', isOccupied: false }

                socket.broadcast.to(id).emit('gameState', gameState[id])
            }
        })

        const handlePersonMoving = (id: string, msg: { user: Player }) => {
            const { user } = msg
            console.log('in callback', null)
            const users = gameState[id].game.users.map((u) => (u.id === user.id ? user : u))
            console.log('users', users)
            gameState[id].game.users = users
            console.log('gameState', gameState)
            const { game, hand, round } = gameState[id]
            socket.in(id).emit('gameState', { game, hand, round })
        }

        socket.on('sit', (id: string, msg: { user: Player }) => {
            waitForIt(id, () => {
                handlePersonMoving(id, msg)
            })
        })

        socket.on('leave', (id: string, msg: { user: Player }) => {
            waitForIt(id, () => {
                handlePersonMoving(id, msg)
            })
        })

        socket.on('gameState', (id: string, msg: GameStateMessage) =>
            waitForIt(id, () => {
                const { game, hand, round } = msg
                gameState[id] = { ...gameState[id], game, hand, round }
                socket.broadcast.to(id).emit('gameState', msg)
            }),
        )

        socket.on('deal', (id: string, msg: GameStateMessage) =>
            waitForIt(id, () => {
                const { game, hand, round } = msg
                gameState[id] = { ...gameState[id], game, hand, round }
                socket.broadcast.to(id).emit('deal', msg)
            }),
        )

        socket.on('playCards', (id: string, msg: PlayCardsMessage) =>
            waitForIt(id, () => {
                const { game, hand, round } = msg
                gameState[id] = { ...gameState[id], game, hand, round }
                socket.broadcast.to(id).emit('playCards', msg)
            }),
        )

        socket.on('showResults', (id: string, msg: GameStateMessage) =>
            waitForIt(id, () => {
                const { game, hand, round } = msg
                gameState[id] = { ...gameState[id], game, hand, round }
                socket.broadcast.to(id).emit('showResults', msg)
            }),
        )
    })

    const PORT = process.env.PORT || 4000
    server.listen(PORT, function () {
        const host = server.address().address
        const port = server.address().port
        console.log(server.address())
        let protocol = 'http'
        if (NODE_ENV === 'production') {
            protocol = 'https'
        }
        const REACT_APP_SERVER_URL = `${protocol}://${host}:${port}`

        console.log(`listening on ${REACT_APP_SERVER_URL}`)
    })
}

startServer()
