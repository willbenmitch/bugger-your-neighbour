import { db } from '../db/connect'
import { Player, Round } from '../db/models'
import { getGameState } from '../game/commands'

export const handlePersonMoving = async (roomId: string, msg: { socketId: string | undefined; name: string; id: number; isOccupied: boolean }) => {
    await db.sequelize.transaction(async (transaction) => {
        console.log('handlePersonMoving', msg)
        const { socketId, name, id, isOccupied } = msg
        const game = await db.Game.findOne({ where: { roomId }, include: [Player, Round], transaction })
        if (!game) {
            throw Error('handlePersonMoving, no game found')
        }
        const position = await db.Player.findOne({ where: { id }, transaction })
        if (!position) {
            throw Error('handlePersonMoving, no position found')
        }

        await position.update({ socketId, name, isOccupied }, { transaction })
    })

    const gameStateMessage = await getGameState(roomId)
    return gameStateMessage
}
