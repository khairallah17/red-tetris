import {
  SET_PLAYER, GAME_UPDATED, GAME_STARTED, GAME_OVER,
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

const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_PLAYER:
      return { ...state, player: action.payload };

    case GAME_UPDATED:
      return { ...state, game: action.payload };

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
