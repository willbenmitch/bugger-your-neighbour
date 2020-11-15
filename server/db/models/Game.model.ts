import { Table, Column, Model, HasMany, DataType } from 'sequelize-typescript'
import { Round, Player } from '.'
import { GameState, RoundStructure } from '../../common/types'

@Table
export class Game extends Model<Game> {
    @Column({ allowNull: false, type: DataType.STRING, defaultValue: 'idle' })
    state: keyof typeof GameState

    @Column({ allowNull: true })
    activeUser?: number

    @Column({ allowNull: false })
    roomId: string

    @Column({ allowNull: false, defaultValue: [], type: DataType.JSON })
    roundsToPlay: RoundStructure[]

    @HasMany(() => Player)
    players: Player[]

    @HasMany(() => Round)
    rounds: Round[]
}

export default Game
