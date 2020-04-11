const express = require('express')
const http = require('http')
const socket = require('socket.io')
const ngrok = require('ngrok')
const cors = require('cors')

const app = express()
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))
const server = http.createServer(app)
const io = socket(server).origins(['*:*'])

const { NODE_ENV } = process.env

if (NODE_ENV === 'production') {
    ngrok.connect().then((url) => {
        process.env.BUGGER_SERVER_URL = url
        console.info(process.env.BUGGER_SERVER_URL)
    })
}

app.get('/', function (req, res) {
    res.send('<h1>Hello world</h1>')
})

let gameState = undefined
let users = 0

io.on('connection', (socket) => {
    console.log('a user connected')
    users++
    if (gameState) {
        socket.emit('gameState', gameState)
    }
    socket.on('disconnect', function () {
        console.log('user disconnected')
        users--
        if (users === 0) {
            // reset game state when everyone's left
            gameState = undefined
        }
    })
    socket.on('gameState', (msg) => {
        console.log('game state', msg)
        gameState = msg
        socket.broadcast.emit('gameState', msg)
    })

    socket.on('deal', (msg) => {
        console.log('deal state', msg)
        socket.broadcast.emit('deal', msg)
    })

    socket.on('playCards', (msg) => {
        console.log('playCards state', msg)
        socket.broadcast.emit('playCards', msg)
    })

    socket.on('showResults', (msg) => {
        console.log('showResults state', msg)
        socket.broadcast.emit('showResults', msg)
    })
})

const PORT = 4000
server.listen(PORT, function () {
    console.log(`listening on *:${PORT}`)
})
