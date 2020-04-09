import { Player } from '../components/types'

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
