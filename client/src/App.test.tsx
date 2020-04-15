import React from 'react'
import { Player, Card, UserCard } from './components/types'
import { getRoundOrder } from './utils/getRoundOrder'
import { getHandResult } from './utils/gameLogic'

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
    expect(roundOrder[0]).toEqual(7)
    expect(roundOrder[1]).toEqual(1)
})

test('getHandResult', () => {
    const cardLed: Card = { suit: 0, rank: 3 }
    const cards: UserCard[] = [
        { ...cardLed, userId: 3 },
        { suit: 2, rank: 10, userId: 6 },
        { suit: 0, rank: 11, userId: 0 },
        { suit: 0, rank: 13, userId: 2 },
    ]
    const trumpCard: Card = { suit: 0, rank: 3 }
    const winner = getHandResult(cardLed, cards, trumpCard.suit, true, false)
    expect(winner.userId).toEqual(2)
})

test('getHandResult with bowers', () => {
    const cardLed: Card = { suit: 0, rank: 3 }
    const cards: UserCard[] = [
        { ...cardLed, userId: 3 },
        { suit: 2, rank: 10, userId: 6 },
        { suit: 0, rank: 11, userId: 0 },
        { suit: 0, rank: 13, userId: 2 },
    ]
    const trumpCard: Card = { suit: 0, rank: 3 }
    const winner = getHandResult(cardLed, cards, trumpCard.suit, true, true)
    expect(winner.userId).toEqual(0)
})
