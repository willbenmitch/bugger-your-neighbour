import { Card, UserCard } from '../components/types'

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
    const rightBower = hand.find((card) => card.rank === 11 && card.suit === trump)
    const leftBower = hand.find((card) => card.rank === 11 && isOppositeSuit(trump, card.suit))
    const highestCard = getHighestCard(hand, isAceHigh)

    return rightBower ? rightBower : leftBower ? leftBower : highestCard
}

export const getHandResult = (ledCard: Card, trump: number, hand: UserCard[], isAceHigh: boolean = true, includeBowers: boolean = false): UserCard => {
    // hand into 2 arrays: trump & ledSuit
    // need to include bowers (bauers)
    const trumps = hand.filter((card) => isTrump(trump, card))
    const ledSuit = hand.filter((card) => card.suit === ledCard.suit)

    // if trump array is not empty, return highest UserCard
    if (trumps.length !== 0) {
        return getHighestTrumpCard(trump, trumps, isAceHigh, includeBowers) as UserCard
    }

    // else return highest of ledSuit array
    return getHighestCard(ledSuit, isAceHigh) as UserCard
}
