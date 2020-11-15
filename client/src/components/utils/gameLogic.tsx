import { Card, UserCard } from '../types'

const getHighestCard = (hand: Card[], isAceHigh: boolean): Card => {
    // sort out isAceHigh
    const mapped = hand.map((card) => {
        return isAceHigh && card.rank === 1 ? { ...card, rank: 14 } : card
    })
    const sorted = mapped.sort((a, b) => b.rank - a.rank)
    return sorted[0]
}

// 0 == spade, 1 == heart, 2 == club, 3 == diamonds
// Math.abs(1-3) == 2, Math.abs(0-2) == 2, etc.
const isOppositeSuit = (trump: number, suit: number): boolean => Math.abs(trump - suit) === 2

const isTrump = (trump: number, card: Card, includeBowers: boolean = true): boolean => {
    const { suit, rank } = card

    return suit === trump || (includeBowers && rank === 11 && isOppositeSuit(trump, suit))
}

const getHighestTrumpCard = (trump: number, hand: Card[], isAceHigh: boolean, includeBowers: boolean): Card => {
    let leftBower,
        rightBower = undefined
    if (includeBowers) {
        rightBower = hand.find((card) => card.rank === 11 && card.suit === trump)
        leftBower = hand.find((card) => card.rank === 11 && isOppositeSuit(trump, card.suit))
    }
    const highestCard = getHighestCard(hand, isAceHigh)

    return rightBower ? rightBower : leftBower ? leftBower : highestCard
}

export const getHandResult = (ledCard: Card, hand: UserCard[], trump?: number, isAceHigh: boolean = true, includeBowers: boolean = false): UserCard => {
    // hand into 2 arrays: trump & ledSuit
    // need to include bowers (bauers)
    const trumps = trump == undefined ? [] : hand.filter((card) => isTrump(trump, card, includeBowers))
    const ledSuit = hand.filter((card) => card.suit === ledCard.suit)

    let highest
    if (trump !== undefined && trumps.length !== 0) {
        // if trump array is not empty, return highest UserCard in trumps array
        highest = getHighestTrumpCard(trump, trumps, isAceHigh, includeBowers) as UserCard
    } else {
        // else return highest of ledSuit array
        highest = getHighestCard(ledSuit, isAceHigh) as UserCard
    }

    return highest
}

export const calculatePoints = (bid: number, actual: number) => {
    return bid === actual ? 10 + bid : 0
}

export const didFollowSuit = (card: Card, hand: Card[], cardLed?: Card): boolean => {
    // if no card is led, then true, else if you followed suit then true, else if you don't have the suit then true else false
    return cardLed == undefined || card.suit === cardLed.suit || hand.find((c) => c.suit === cardLed.suit) == undefined
}
