import _ from 'lodash'
import { initialGame, initialHand, initialRound } from './utils'

export const getInitialState = () => ({
    game: _.cloneDeep(initialGame),
    round: _.cloneDeep(initialRound),
    hand: _.cloneDeep(initialHand),
    myId: undefined,
    showResults: false,
})
