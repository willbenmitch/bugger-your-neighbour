const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

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
})

const PORT = 4000
http.listen(PORT, function () {
    console.log(`listening on *:${PORT}`)
})
