const express = require('express')
const http = require('http')
const socket = require('socket.io')
const ngrok = require('ngrok')
const cors = require('cors')
import { GameStateMessage, PlayCardsMessage } from '../client/src/App'
import { GameState, Game, Round, Hand } from '../client/src/components/types'
console.log(GameState.idle)

const app = express()
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))
const server = http.createServer(app)
const io = socket(server)
io.origins((origin: any, callback: any) => {
    callback(null, true)
})

let gameState: { game: Game; round: Round; hand: Hand } | undefined = undefined
let users = 0
let pingedIds: number[] = []

const startServer = () => {
    app.get('/', function (req: any, res: any) {
        res.send('<h1>Hello world</h1>')
    })

    io.on('connection', (socket: any) => {
        console.log('a user connected')
        users += 1
        if (gameState) {
            socket.emit('welcome', gameState)
        }
        socket.on('disconnect', function () {
            console.log('user disconnected')
            // reduce total number of users
            socket.broadcast.emit('pingClient', { request: 'id' })
            users -= 1
            if (users === 0) {
                // reset game state when everyone's left
                gameState = undefined
            }
            setTimeout(() => {
                if (!gameState) return
                console.log('pinged', pingedIds)
                const { game, round, hand } = gameState
                gameState = {
                    game: {
                        ...game,
                        users: game.users.map((user) => {
                            return pingedIds.find((id) => id === user.id) !== undefined ? user : { ...user, isOccupied: false, name: 'Open' }
                        }),
                    },
                    round,
                    hand,
                }
                socket.broadcast.emit('gameState', gameState)
                pingedIds = []
            }, 5000)
        })

        socket.on('gameState', (msg: GameStateMessage) => {
            console.log('game state', msg)
            gameState = msg
            socket.broadcast.emit('gameState', msg)
        })

        socket.on('deal', (msg: GameStateMessage) => {
            console.log('deal state', msg)
            gameState = msg
            socket.broadcast.emit('deal', msg)
        })

        socket.on('playCards', (msg: PlayCardsMessage) => {
            const { game, hand, round } = msg
            console.log('playCards state', msg)
            gameState = { game, hand, round }
            socket.broadcast.emit('playCards', msg)
        })

        socket.on('showResults', (msg: GameStateMessage) => {
            console.log('showResults state', msg)
            gameState = msg
            socket.broadcast.emit('showResults', msg)
        })

        socket.on('pongServer', (msg: { id: number }) => {
            console.log('pong state', msg)
            pingedIds.push(msg.id)
        })
    })

    const PORT = 4000
    server.listen(PORT, function () {
        console.log(`listening on *:${PORT}`)
    })
}

startServer()
