import {
  SET_PLAYER, GAME_UPDATED, GAME_STARTED, GAME_OVER, GAME_RESTARTED,
  SET_ERROR, CLEAR_ERROR, OPPONENT_SPECTRUM, HIGH_SCORES,
} from '../actions/types';

const initialState = {
  player: null,
  game: null,
  isPlaying: false,
  isOver: false,
  winner: null,
  error: null,
  opponents: {}, // { playerId: { playerName, spectrum } }
  highScores: [],
};

// Keep state.player in sync with the server's player list (e.g. host changes)
function syncPlayer(state, gamePlayers) {
  if (!state.player || !Array.isArray(gamePlayers)) return null;
  return gamePlayers.find((p) => p.name === state.player.name) || null;
}

const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_PLAYER:
      return { ...state, player: action.payload };

    case GAME_UPDATED: {
      const synced = syncPlayer(state, action.payload?.players);
      return {
        ...state,
        game: action.payload,
        // Game recreated in lobby (e.g. after all players disconnected) — clear stale game-over state
        ...(action.payload?.state === 'waiting' ? { isOver: false, winner: null } : {}),
        ...(synced ? { player: synced } : {}),
      };
    }

    case GAME_STARTED:
      return {
        ...state,
        game: action.payload,
        isPlaying: true,
        isOver: false,
        winner: null,
        opponents: {},
      };

    case GAME_OVER:
      return {
        ...state,
        isPlaying: false,
        isOver: true,
        winner: action.payload.winner,
      };

    case GAME_RESTARTED: {
      const synced = syncPlayer(state, action.payload?.players);
      return {
        ...state,
        game: action.payload,
        isPlaying: false,
        isOver: false,
        winner: null,
        opponents: {},
        ...(synced ? { player: synced } : {}),
      };
    }

    case OPPONENT_SPECTRUM: {
      const { playerId, playerName, spectrum } = action.payload;
      if (spectrum === null) {
        // Player left - remove them
        const { [playerId]: _, ...rest } = state.opponents;
        return { ...state, opponents: rest };
      }
      return {
        ...state,
        opponents: {
          ...state.opponents,
          [playerId]: { playerName, spectrum },
        },
      };
    }

    case HIGH_SCORES:
      return { ...state, highScores: action.payload };

    case SET_ERROR:
      return { ...state, error: action.payload };

    case CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

export default gameReducer;
