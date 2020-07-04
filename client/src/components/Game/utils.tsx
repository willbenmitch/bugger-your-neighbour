import { Player, Game as GameType, Round, Hand, Card, GameState, RoundState } from '../types'

export const positions: Player[] = [
    { id: 0, isOccupied: false, name: 'Open', x: 58, y: 5, cards: [] },
    { id: 1, isOccupied: false, name: 'Open', x: 42, y: 5, cards: [] },
    { id: 2, isOccupied: false, name: 'Open', x: 25, y: 20, cards: [] },
    { id: 3, isOccupied: false, name: 'Open', x: 25, y: 45, cards: [] },
    { id: 4, isOccupied: false, name: 'Open', x: 25, y: 70, cards: [] },
    { id: 5, isOccupied: false, name: 'Open', x: 42, y: 80, cards: [] },
    { id: 6, isOccupied: false, name: 'Open', x: 58, y: 80, cards: [] },
    { id: 7, isOccupied: false, name: 'Open', x: 75, y: 70, cards: [] },
    { id: 8, isOccupied: false, name: 'Open', x: 75, y: 45, cards: [] },
    { id: 9, isOccupied: false, name: 'Open', x: 75, y: 20, cards: [] },
]

export type GameStateMessage = { game: GameType; round: Round; hand: Hand }
export type PlayCardsMessage = GameStateMessage & {
    cards: Card[]
    x: number
    y: number
    rot?: number
    side: 'front' | 'back'
    zIndex?: number
}

export const initialGame: GameType = {
    state: GameState.idle,
    users: positions,
    activeUser: undefined,
    roundsToPlay: [],
    rounds: [],
}

export const initialRound: Round = {
    id: 1,
    cardsToDeal: 1,
    dealerId: undefined,
    roundOrder: [],
    state: RoundState.idle,
    trumpCard: undefined,
    bids: [],
    hands: [],
    results: [],
}

export const initialHand = {
    cardLed: undefined,
    cards: [],
    winnerId: undefined,
}
