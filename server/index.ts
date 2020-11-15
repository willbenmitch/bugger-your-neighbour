const express = require('express')
const http = require('http')
const cors = require('cors')
const path = require('path')
import IOSocket from 'socket.io'
import { db } from './db/connect'
import { findOrCreateGame } from './game/commands'
import { connectToRoom } from './sockets'
import { BuggerGame } from './game/game.controller'

const NODE_ENV = process.env.NODE_ENV

const app = express()
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    credentials: true,
}

app.use(cors(corsOptions))

if (NODE_ENV !== 'development') {
    app.use(express.static('../client/build'))
}

const server = http.createServer(app)
const io = IOSocket(server)
io.origins((origin: any, callback: any) => {
    callback(null, true)
})

const startServer = async () => {
    if (NODE_ENV === 'development') {
        const indexFile = path.resolve(__dirname, '../client/build/index.html')

        app.get('*', function (req: any, res: any) {
            res.sendFile(indexFile)
        })
    }

    io.on('connection', async (socket) => {
        const { socketId, roomId } = connectToRoom(socket)

        // find or create game
        const { game, round, hand } = await findOrCreateGame(roomId)

        socket.emit('welcome', { game: game.toJSON(), round: round.toJSON(), hand: hand.toJSON() })
        new BuggerGame({ io, socket, roomId, socketId })
    })

    const PORT = process.env.PORT || 4000
    console.log('PORT', PORT)
    server.listen(PORT, function () {
        const host = server.address().address
        const port = server.address().port
        let protocol = 'http'
        if (NODE_ENV === 'production') {
            protocol = 'https'
        }
        const REACT_APP_SERVER_URL = `${protocol}://${host}:${port}`

        console.log(`listening on ${REACT_APP_SERVER_URL}`)
    })
}

db.sequelize.sync({ alter: true }).then(() => {
    startServer()
})
