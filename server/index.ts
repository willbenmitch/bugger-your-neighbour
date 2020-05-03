const express = require('express')
const http = require('http')
const IOsocket = require('socket.io')
const cors = require('cors')
const path = require('path')
import { GameStateMessage, PlayCardsMessage } from '../client/src//components/Game/Game'
import { Game, Round, Hand } from '../client/src/components/types'

const indexFile = path.resolve(__dirname, '../client/build/index.html')
const NODE_ENV = process.env.NODE_ENV
const envFilPath = path.resolve(__dirname, `../client/.env.${NODE_ENV}`)

const app = express()
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    credentials: true,
}

app.use(cors(corsOptions))
app.use(express.static('../client/build'))
const server = http.createServer(app)
const io = IOsocket(server)
io.origins((origin: any, callback: any) => {
    callback(null, true)
})

let gameState: { [id: string]: { game: Game; round: Round; hand: Hand } } = {}
let pingedIds: { [id: string]: number[] } = {}

const startServer = () => {
    app.get('*', function (req: any, res: any) {
        res.sendFile(indexFile)
    })

    io.on('connection', (socket: any) => {
        const { id } = socket.handshake.query
        console.log('a user connected', id)
        if (!id) {
            console.error('no ID provided')
            return
        }
        socket.join(id)
        if (gameState[id] !== undefined) {
            socket.emit('welcome', gameState[id])
        }
        socket.on('disconnect', function () {
            console.log('user disconnected')
            socket.broadcast.to(id).emit('pingClient', { request: 'id' })
            setTimeout(() => {
                if (!gameState[id]) return
                const { game, round, hand } = gameState[id]

                if (!pingedIds[id]) {
                    delete gameState[id]
                    return
                }

                try {
                    gameState[id] = {
                        game: {
                            ...game,
                            users: game.users.map((user) => {
                                return pingedIds[id].find((userId) => userId === user.id) !== undefined ? user : { ...user, isOccupied: false, name: 'Open' }
                            }),
                        },
                        round,
                        hand,
                    }
                } catch (err) {
                    console.error(err)
                }
                socket.broadcast.to(id).emit('gameState', gameState[id])
                delete pingedIds[id]
            }, 3000)
        })

        socket.on('gameState', (id: string, msg: GameStateMessage) => {
            gameState[id] = msg
            socket.broadcast.to(id).emit('gameState', msg)
        })

        socket.on('deal', (id: string, msg: GameStateMessage) => {
            gameState[id] = msg
            socket.broadcast.to(id).emit('deal', msg)
        })

        socket.on('playCards', (id: string, msg: PlayCardsMessage) => {
            const { game, hand, round } = msg
            gameState[id] = { game, hand, round }
            socket.broadcast.to(id).emit('playCards', msg)
        })

        socket.on('showResults', (id: string, msg: GameStateMessage) => {
            gameState[id] = msg
            socket.broadcast.to(id).emit('showResults', msg)
        })

        socket.on('pongServer', (id: string, msg: { id: number }) => {
            if (!pingedIds[id]) {
                pingedIds[id] = [msg.id]
            } else {
                pingedIds[id].push(msg.id)
            }
        })
    })

    const PORT = process.env.PORT || 4000
    server.listen(PORT, function () {
        const host = server.address().address
        const port = server.address().port
        let protocol = 'http'
        protocol = 'https'
        const REACT_APP_SERVER_URL = `${protocol}://${host}:${port}`

        console.log(`listening on ${REACT_APP_SERVER_URL}`)
    })
}

startServer()
