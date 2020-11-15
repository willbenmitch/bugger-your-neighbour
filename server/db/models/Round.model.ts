import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
// import { Hand } from './'
import { Card, RoundState, Bid, Result } from '../../common/types'
import { Game } from '.'
import { Hand } from './Hand.model'

@Table
export class Round extends Model<Round> {
    @Column
    roundNumber: number

    @Column
    cardsToDeal: number

    @Column
    dealerId?: number

    @Column({ allowNull: false, type: DataType.JSONB })
    roundOrder: number[]

    @Column(DataType.STRING)
    state: keyof typeof RoundState

    @Column({ type: DataType.JSONB })
    trumpCard?: Card

    @Column({ type: DataType.JSONB })
    bids: Bid[]

    @Column({ allowNull: false, type: DataType.JSONB })
    results: Result[]

    @ForeignKey(() => Game)
    @Column
    gameId: number

    @BelongsTo(() => Game, 'gameId')
    game: Game

    @HasMany(() => Hand)
    hands: Hand[]
}

export default Round
