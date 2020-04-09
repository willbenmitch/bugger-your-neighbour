import React from 'react'
import { Player } from './components/types'
import { getRoundOrder } from './utils/getRoundOrder'

test('gets correct round order', () => {
    const players = [{ id: 1 }, { id: 7 }] as Player[]
    const dealerIndex = 0
    const roundOrder = getRoundOrder(players, dealerIndex)
    expect(roundOrder).toEqual(expect.arrayContaining([7, 1]))
})

test('gets correct round order', () => {
    const players = [{ id: 7 }, { id: 1 }] as Player[]
    const dealerIndex = 1
    const roundOrder = getRoundOrder(players, dealerIndex)
    expect(roundOrder[0]).toEqual(1)
    expect(roundOrder[1]).toEqual(7)
})
