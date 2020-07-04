export type Card = {
    suit: number
    rank: number
}

export type Player = {
    id: number
    socketId?: string
    isOccupied: boolean
    name: string
    x: number
    y: number
    cards: Card[]
}

export enum RoundState {
    idle = 'idle',
    bidding = 'bidding',
    playing = 'playing',
    complete = 'complete',
}

export enum GameState {
    idle = 'idle',
    playing = 'playing',
    complete = 'complete',
}

export type UserCard = Card & {
    userId: number
}

export type Bid = {
    userId: number
    bid: number
}

export type Game = {
    state: GameState
    users: Player[]
    activeUser?: number
    roundsToPlay: RoundStructure[]
    rounds: Round[]
}

export type Hand = {
    cardLed?: Card
    cards: UserCard[]
    winnerId?: number
}

export type Result = {
    userId: number
    bid: number
    actual: number
    points: number
}

export type Round = {
    id: number
    cardsToDeal: number
    dealerId?: number
    roundOrder: number[]
    state: RoundState
    trumpCard?: Card
    bids: Bid[]
    hands: Hand[]
    results: Result[]
}

export type RoundStructure = {
    id: number
    cardsToDeal: number
    withTrump: boolean
}
