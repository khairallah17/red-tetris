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

## Bonuses (implemented)

- **Scoring system** — classic Tetris scoring (single/double/triple/Tetris = 40/100/300/1200), scaled by level. Soft-drop (+1/cell) and hard-drop (+2/cell) bonuses. Level rises every 10 cleared lines and speeds up gravity. Score and level shown live in the HUD.
- **Persistent high scores** — server-side `ScoreStore` writes a sorted top-20 leaderboard to a JSON file (`data/scores.json`, configurable via `SCORES_FILE`) that survives restarts. Shown on the lobby screen, broadcast in real time.
- **New game modes** (host-selectable in the waiting room, synchronized to all players in the room):
  - 👻 **Invisible** — the settled pile is hidden; only the active falling piece and its ghost are visible.
  - ⚡ **Gravity+** — faster base fall speed.

All bonus logic keeps the project's constraints: client board/scoring logic is pure functions (no `this`); the server uses prototype-based models (`ScoreStore`, `Game`, `Player`, `Piece`). Bonus code is covered by unit tests.
