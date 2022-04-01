import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript'
// import { Hand } from './'
import { Card, UserCard } from '../../common/types'
import Round from './Round.model'

@Table
export class Hand extends Model<Hand> {
    @Column({ type: DataType.JSONB, allowNull: true })
    cardLed?: Card

    @Column({ allowNull: false, type: DataType.JSONB, defaultValue: [] })
    cards: UserCard[]

    @Column
    winnerId?: number

    @Column({ allowNull: false, type: DataType.ARRAY(DataType.INTEGER) })
    order: number[]

    @ForeignKey(() => Round)
    @Column
    roundId: number

    @BelongsTo(() => Round, 'roundId')
    round: Round
}

export default Hand
