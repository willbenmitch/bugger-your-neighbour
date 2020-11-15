import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript'
import { Card } from '../../common/types'
import { Game } from '.'

@Table
export class Player extends Model<Player> {
    @Column({ allowNull: true, type: DataType.STRING })
    socketId?: string

    @Column({ allowNull: false, type: DataType.BOOLEAN, defaultValue: false })
    isOccupied: boolean

    @Column({ allowNull: false, type: DataType.STRING })
    name: string

    @Column({ allowNull: false, type: DataType.JSONB })
    position: { id: number; x: number; y: number }

    @Column({ type: DataType.JSONB })
    cards: Card[]

    @ForeignKey(() => Game)
    @Column
    gameId: number

    @BelongsTo(() => Game, 'gameId')
    game: Game
}

export default Player
