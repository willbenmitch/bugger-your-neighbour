import { Player, RoundStructure } from '../types'

export const getRoundOrder = (players: Player[], firstPlayerIndex?: number): number[] => {
    const ids = players.map((player) => player.position.id).sort((a, b) => a - b)

    // if dealerIndex is last, we need to set to zero

    // construct the playing order
    const secondHalf = ids.slice(0, firstPlayerIndex)
    const firstHalf = ids.slice(firstPlayerIndex)
    const roundOrder = firstHalf.concat(secondHalf)

    return roundOrder
}

export const getNextDealerIndex = (players: Player[], previousDealerId: number): number => {
    const index = players.sort((a, b) => a.position.id - b.position.id).findIndex((player) => player.position.id === previousDealerId)

    return index === players.length - 1 ? 0 : index + 1
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
            roundNumber: id,
            cardsToDeal,
            withTrump,
        }
    })
}

export const getNextPlayerIndex = (roundOrder: number[], currentPlayerId: number): number | undefined => {
    let playerIndex = roundOrder.findIndex((id) => id === currentPlayerId)
    playerIndex++
    return playerIndex >= roundOrder.length ? undefined : playerIndex
}
