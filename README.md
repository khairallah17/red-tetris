# Red Tetris 🎮

> Multiplayer Tetris — Full Stack JavaScript (42 Paris project)

## Stack

| Layer | Tech |
|---|---|
| Server | Node.js + Express + Socket.io |
| Client | React 18 + Redux + Socket.io-client |
| Build | Webpack 5 + Babel |
| Tests | Jest + Testing Library |

## Project Structure

```
red_tetris/
├── src/
│   ├── server/
│   │   ├── index.js          # Express + Socket.io server entry
│   │   ├── handlers.js       # Socket event handlers
│   │   └── models/
│   │       ├── Piece.js      # OOP piece model (prototype-based)
│   │       ├── Player.js     # OOP player model
│   │       └── Game.js       # OOP game room model
│   └── client/
│       ├── index.js          # React entry point
│       ├── App.jsx           # Root component + Provider
│       ├── AppRouter.jsx     # Route/state-based routing
│       ├── store.js          # Redux store
│       ├── actions/
│       │   ├── types.js      # Action type constants
│       │   └── gameActions.js # Thunk action creators (socket emitters)
│       ├── reducers/
│       │   ├── gameReducer.js # Room/lobby state
│       │   └── boardReducer.js # Board/piece state (pure functions)
│       ├── utils/
│       │   ├── board.js      # Pure board logic (no `this`)
│       │   └── socket.js     # Socket singleton
│       └── components/
│           ├── Board.jsx     # 10×20 grid with ghost piece
│           ├── Cell.jsx      # Individual cell renderer
│           ├── Spectrum.jsx  # Opponent field view
│           ├── NextPiece.jsx # Next piece preview
│           ├── GameScreen.jsx # Main game UI
│           └── LobbyScreen.jsx # Join/create room UI
├── test/
│   ├── client/
│   │   ├── board.test.js       # Pure function tests
│   │   ├── boardReducer.test.js
│   │   └── gameReducer.test.js
│   └── server/
│       ├── Piece.test.js
│       ├── Player.test.js
│       └── Game.test.js
├── public/
│   └── index.html
├── webpack.config.js
├── .babelrc
├── .env.example
└── package.json
```

## Setup

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env

# 3. Build client bundle
npm run build

# 4. Start server
npm start
# → http://localhost:3000
```

## Development

```bash
# Run server with hot reload
npm run dev:server

# Run webpack dev server (port 3001, proxies socket to 3000)
npm run dev:client
```

## Tests

```bash
npm test
```

Coverage targets (per subject):
- Statements / Functions / Lines: ≥ 70%
- Branches: ≥ 50%

## How to Play

Navigate to:
```
http://localhost:3000/<room>/<playerName>
```

Or use the lobby UI to fill in room and name.

- **First player** to join a room becomes the **host**
- Host clicks **Start** to begin
- Players get the **same piece sequence** (synchronized via server)
- Clearing lines sends **penalty rows** to opponents (n−1 lines)
- Last alive player wins

### Controls

| Key | Action |
|---|---|
| `←` / `→` | Move piece |
| `↑` | Rotate |
| `↓` | Soft drop |
| `Space` | Hard drop |

## Architecture Notes

- **Client game logic**: pure functions only, no `this` (board.js, reducers)
- **Server models**: prototype-based OOP (Piece, Player, Game)
- **Piece sequence**: generated server-side and indexed, ensuring all players in a room get the same pieces
- **Spectrum**: column heights broadcast to opponents in real-time via socket
- **SPA**: single `index.html` + `bundle.js`, all routing client-side via MemoryRouter

## Bonuses (optional)

- Scoring system (clear bonus for Tetris = 4 lines)
- Persistent high scores
- Game modes: invisible pieces, gravity ramp
- FRP with `flyd` instead of Redux
