import React from 'react';
import './App.css';
// @ts-ignore
import Deck from 'deck-of-cards'
import User from './components/User';

const users = [
  {name: 'Reid', x: 50, y: 5, cards: []},
  {name: 'Lindsay', x: 25, y: 5, cards: []},
  {name: 'Ben', x: 0, y: 5, cards: []},
  {name: 'Dottie', x: 0, y: 30, cards: []},
  {name: 'Lesley', x: 0, y: 55, cards: []},
  {name: 'Ellen', x: 0, y: 80, cards: []},
  {name: 'Andrew', x: 25, y: 90, cards: []},
  {name: 'Stewart', x: 50, y: 90, cards: []},
  {name: 'Open', x: 75, y: 90, cards: []},
]

enum GamePlay {
  inactive = 'inactive',
  dealing = 'dealing',
  roundInProgress = 'roundInProgress',
  roundFinished = 'roundFinished',
}

type Props = {}
type State = {
  gamePlay: GamePlay,
  users: any[],
  activeUserId: number
  round: number
  dealerId: number
}

class App extends React.Component<Props, State> {
  // @ts-ignore
  state: State = {
    gamePlay: GamePlay.inactive,
    users,
    activeUserId: 0,
    round: 1,
    dealerId: 0
  }

  deck: any = Deck()
  userRefs: any = []

  componentDidMount() {
    this.initiateDeck()
    this.state.users.forEach(user => {
      this.userRefs.push(React.createRef())
    })
  }

  deal = () => {
    const userLength = this.state.users.length
    const clientHeight = document.documentElement.clientHeight
    const clientWidth = document.documentElement.clientWidth
    const cardWidth = 120
    const cardHeight = 100
    this.setState({gamePlay: GamePlay.dealing}, () => {
      const { users } = this.state
      for (let i = 0; i < this.state.round; i++) {
        const mod = i === 0 ? 0 : userLength * i
        users.map((user, j) => {
          const cardIndex = mod + j
          const card = this.deck.cards[cardIndex]

          const x = clientWidth - (clientWidth * (user.x / 100)) - (cardWidth * 2)
          const y = (clientHeight * (user.y / 100)) - cardHeight
          console.log(x, y)
          card.animateTo({
            duration: 300,
            east: 'quartOut',
            x: x,
            y : y,
            rot: 10
          })
          card.enableDragging()
          users[j].cards.push(card)
        })
      }
      
      const trumpCardIndex: number = users.length * this.state.round
      const trumpCard = this.deck.cards[trumpCardIndex]
      trumpCard.animateTo({delay: 500, x: 120})
      this.deck.cards.map((card: any) => {
        card.disableDragging()
        card.disableFlipping()
      })

      this.setState({users})
    })
  }

  initiateDeck = () => {
    this.deck = Deck()
    this.deck.cards.forEach((card: any) => {
      card.enableDragging()
      card.enableFlipping()
    });
    this.deck.mount(document.getElementById('table'))
    this.deck.intro()
    this.deck.shuffle()
    this.deck.shuffle()
  }

  resetDeck = () => {
    const table = document.getElementById('table')
    this.deck.unmount(table)
    this.initiateDeck()
  }

  shuffle = () => {
    this.deck.intro()
    this.deck.shuffle()
    this.deck.shuffle()
  }
  
  render() {
      const users = this.state.users.map(({name, x, y}, i) => <User ref={this.userRefs[i]} name={name} x={x} y={y} />)
      return (
        <div id="game">
          <button onClick={this.deal}>Deal</button>
          <button onClick={this.resetDeck}>Shuffle</button>
          <div id="users">
            {users}
          </div>
          <div id="table">
          </div>
        </div>
      )
  }
}

export default App;
