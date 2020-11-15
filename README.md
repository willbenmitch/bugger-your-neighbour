# Bugger Your Neighbour

_The Mitchell Family's favourite card game_

## Installation

```zsh
git clone git@github.com:willbenmitch/bugger-your-neighbour.git bugger && cd bugger && npm install
```

Then, in bugger/client/ directory, copy the file `.env.example` and create two new files:

`.env.development`

`.env.production`

## Running locally

### MacOS

From the top directory `bugger/`, simply run `npm run dev`. You may need to provide system access to `ttab`.

This command is currently supported for Terminal and iTerm2 only (through ttab). To specify one over the other, you can change your preference in `package.json` inside the `openTerminal` script.

### Other platforms

```
cd server/ && npm run dev

cd ../client && npm run dev
```

## Rules

The game is centered around the taking of tricks, where a trick is taken when a player plays either (in order of importance): the highest trump suited card, or the highest card of the suit that was led. Every player must follow suit, meaning if the first player for a hand plays a spade, every player must also play a spade (if they have one). If a player does not have a spade, then they may play any card in their hand.

### Setting up the game

-   Everyone chooses their seat and enters their name
-   A dealer is randomly assigned to start the game
-   The highest number of cards to be dealt is selected (absolute maximum is `51 / number_of_players`)
-   The rounds will start at 1 and progress up to the maximum (without trump), and then back down to 1
    -   Ex. for 8 players with the total select as 6, the rounds would look like the following:
        -   1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 6_no_trump -> 6 -> 5 -> 4 -> 3 -> 2 -> 1
-   The first round will always consist of 1 card dealt to each player (starting one position clock-wise from the dealer).

### Rounds

Each round consists of the following:

-   The round will have a number of possible tricks that can be taken
-   The round will specify trump or no-trump. The only round that will be no-trump will be in the middle of the game
-   Each round consists of three states: bidding, playing, and scoring
    -   bidding: each player, starting one position clockwise from the dealer, says how many tricks they plan to take in this round (based on their cards, and, if applicable, the trump card for that round). The caveat to bidding is that at the end of bidding, the total bids can not equal the cards dealt to each person during that round (ie. on a round with 6 tricks, the total bids can not equal 6); The total number of bids can either be higher or lower. This means that the dealer (last to bid) is often forced to bid a number that is less than ideal for them.
    -   playing: Playing consists of a series of hands. One hand for each card in a players hand. Starting to the right of the dealer, each player plays a card (remembering to follow suit). When everyone has played a card, the person who wins that hand will take that trick. Winning is defined as: a) the highest played trump card, or b) the highest played card of the led suit for that hand.
    -   scoring: After the final round, the scores for each player are tallied.
        -   If you made your bid, then you are assigned 10 points + 1 point for every trick taken (ie. you bid 2, and took 2 tricks you are assigned 12 points). If you did not make your bid, then no points are assigned (ie. bid 0 and took 1 trick you will receive 0 points).

### Finishing the Game

When the last round has concluded, the results are tallied, and the winner is defined as the person with the highest number of points. At any point in the game you can click the `Show Results` button to see the current scores.

## TODOs

-   Add ability to create independant game rooms (spawning a new socket room)
-   Add room authentication
-   Deploy for general use
