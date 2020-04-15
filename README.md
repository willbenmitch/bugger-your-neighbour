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

## Serving for distribution (via ngrok)

If you're on **MacOS**, from the top directory `bugger/`, run `npm run server`. This will open a new tab.

For other platforms, run `cd server/ && npm run start`

In both platforms, you'll next need to look on your console for an output url, such as `https://4ebfebe3.ngrok.io`, copy this url, and paste it in your client's production environment file: `.env.production`.

Then, you're on **MacOS**, from the top directory `bugger/`, run `npm run client`. This will open a new tab.

For other platforms, run `cd ../client/ && npm run start`

In both cases, you'll next need to look on your console for an output url, ending in `.ngrok.io` (note that this will be different than the url output for the server). Copy this url to share with your players.

## TODOs

-   Add ability to create independant game rooms (spawning a new socket room)
-   Add room authentication
-   Deploy for general use
