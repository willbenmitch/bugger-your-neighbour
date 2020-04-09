export type Card = {
    suit: number
    rank: number
}

export type Player = {
    id: number
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

export type UserCard = Card & {
    userId: number
}

export type Bid = {
    userId: number
    bid: number
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
    dealerId?: number
    roundOrder: number[]
    state: RoundState
    trumpCard?: Card
    bids: Bid[]
    hands: Hand[]
    results: Result[]
}
