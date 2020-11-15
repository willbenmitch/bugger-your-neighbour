import { Player, Game as GameType, Round, Hand, Card, GameState, RoundState } from './types'

export const positions: Player[] = [
    { isOccupied: false, name: 'Open', position: { id: 0, x: 58, y: 5 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 1, x: 42, y: 5 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 2, x: 25, y: 20 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 3, x: 25, y: 45 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 4, x: 25, y: 70 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 5, x: 42, y: 80 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 6, x: 58, y: 80 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 7, x: 75, y: 70 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 8, x: 75, y: 45 }, cards: [] },
    { isOccupied: false, name: 'Open', position: { id: 9, x: 75, y: 20 }, cards: [] },
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

export const initialGame: Omit<GameType, 'id'> = {
    state: GameState.idle,
    players: positions,
    activeUser: undefined,
    roundsToPlay: [],
    rounds: [],
}

export const initialRound: Omit<Round, 'id'> = {
    roundNumber: 1,
    cardsToDeal: 1,
    dealerId: undefined,
    roundOrder: [],
    state: RoundState.idle,
    trumpCard: undefined,
    bids: [],
    hands: [],
    results: [],
}

export const initialHand: Omit<Hand, 'id'> = {
    cardLed: undefined,
    cards: [],
    winnerId: undefined,
}

export const getNextPlayerIndex = (roundOrder: number[], currentPlayerId: number): number | undefined => {
    let playerIndex = roundOrder.findIndex((id) => id === currentPlayerId)
    playerIndex++
    return playerIndex >= roundOrder.length ? undefined : playerIndex
}
