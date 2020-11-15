import { Socket } from 'socket.io'

export const connectToRoom = (socket: Socket): { socketId: string; roomId: string } => {
    const { id: socketId } = socket
    console.log('a socket connection was established with id: ', socket.id)
    const { id: roomId } = socket.handshake.query
    console.log('a user connected to room : ', roomId)
    if (!roomId) {
        const err = 'no room ID provided'
        console.error(err)
        throw Error(err)
    }

    socket.join(roomId)
    return { socketId, roomId }
}
