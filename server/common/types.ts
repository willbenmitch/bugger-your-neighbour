export type Card = {
    suit: number
    rank: number
}

export type Player = {
    id?: number
    socketId?: string
    isOccupied: boolean
    name: string
    position: {
        id: number
        x: number
        y: number
    }
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
    playerId: number
}

export type Bid = {
    playerId: number
    bid: number
}

export type Game = {
    id?: number
    state: GameState
    players: Player[]
    activeUser?: number
    roundsToPlay: RoundStructure[]
    rounds: Round[]
}

export type Hand = {
    id?: number
    cardLed?: Card
    cards: UserCard[]
    winnerId?: number
    order: number[],
}

export type Result = {
    playerId: number
    bid: number
    actual: number
    points: number
}

export type Round = {
    id?: number
    roundNumber: number
    cardsToDeal: number
    dealerId?: number
    state: RoundState
    trumpCard?: Card
    bids: Bid[]
    hands: Hand[]
    results: Result[]
}

export type RoundStructure = {
    roundNumber: number
    cardsToDeal: number
    withTrump: boolean
}
