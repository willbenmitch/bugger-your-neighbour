const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

app.get('/', function (req, res) {
    res.send('<h1>Hello world</h1>')
})

let gameState = undefined

io.on('connection', (socket) => {
    console.log('a user connected')
    if (gameState) {
        socket.emit('gameState', gameState)
    }
    socket.on('disconnect', function () {
        console.log('user disconnected')
    })
    socket.on('gameState', (msg) => {
        console.log('game state server', msg)
        gameState = msg
        socket.broadcast.emit('gameState', msg)
    })

    socket.on('deal', (msg) => {
        console.log('deal state server', msg)
        socket.broadcast.emit('deal', msg)
    })
})

const PORT = 4000
http.listen(PORT, function () {
    console.log(`listening on *:${PORT}`)
})
