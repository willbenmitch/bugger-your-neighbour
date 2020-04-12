import { Player, RoundStructure } from '../components/types'

export const getRoundOrder = (users: Player[], firstPlayerIndex?: number): number[] => {
    const ids = users.map((user) => user.id).sort((a, b) => a - b)

    // if dealerIndex is last, we need to set to zero

    // construct the playing order
    const secondHalf = ids.slice(0, firstPlayerIndex)
    const firstHalf = ids.slice(firstPlayerIndex)
    const roundOrder = firstHalf.concat(secondHalf)

    return roundOrder
}

export const getNextDealerIndex = (users: Player[], previousDealerId: number): number => {
    const index = users.findIndex((user) => user.id === previousDealerId)

    return index === users.length - 1 ? 0 : index + 1
}

export const getRoundsToPlay = (availableRounds: number): RoundStructure[] => {
    const length = availableRounds * 2 + 1
    const middleIndex = Math.ceil(length / 2)

    return Array.from({ length }, (_, i) => {
        const id = i + 1
        let cardsToDeal
        const withTrump = id !== middleIndex
        if (id < middleIndex) {
            cardsToDeal = id
        } else if (id === middleIndex) {
            cardsToDeal = id - 1
        } else {
            // on the way down
            cardsToDeal = length - i
        }

        return {
            id,
            cardsToDeal,
            withTrump,
        }
    })
}
