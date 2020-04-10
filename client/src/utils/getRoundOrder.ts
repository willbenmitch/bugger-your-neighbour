import { Player, RoundStructure } from '../components/types'

export const getRoundOrder = (users: Player[], dealerIndex: number): number[] => {
    const ids = users.map((user) => user.id).sort((a, b) => a - b)

    // if dealerIndex is last, we need to set to zero
    const firstPlayerIndex = dealerIndex === users.length - 1 ? 0 : dealerIndex + 1

    // construct the playing order
    const secondHalf = ids.slice(0, firstPlayerIndex)
    const firstHalf = ids.slice(firstPlayerIndex)
    const roundOrder = firstHalf.concat(secondHalf)

    return roundOrder
}

export const getDealerIndex = (users: Player[], previousDealerId: number): number => {
    const index = users.findIndex((user) => user.id === previousDealerId)

    return index === users.length - 1 ? 0 : index + 1
}

export const getRoundsToPlay = (availableRounds: number): RoundStructure[] => {
    const length = availableRounds * 2 + 1
    return Array.from({ length }, (_, i) => {
        let id = i + 1
        const withTrump = id !== availableRounds + 1
        if (i >= availableRounds + 1) {
            // on the way down
            id = length - i
            console.log('hit', id)
        }

        return {
            id,
            withTrump,
        }
    })
}
