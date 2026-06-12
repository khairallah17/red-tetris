import gameReducer from '../../src/client/reducers/gameReducer';
import {
  SET_PLAYER, GAME_UPDATED, GAME_STARTED, GAME_OVER,
  SET_ERROR, CLEAR_ERROR, OPPONENT_SPECTRUM, HIGH_SCORES,
} from '../../src/client/actions/types';

const initialState = {
  player: null,
  game: null,
  isPlaying: false,
  isOver: false,
  winner: null,
  error: null,
  opponents: {},
  highScores: [],
};

const mockPlayer = { id: 'abc', name: 'MedK', isHost: true };
const mockGame = { name: 'room1', state: 'waiting', players: [mockPlayer] };

describe('gameReducer', () => {
  it('returns initial state', () => {
    const state = gameReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  it('SET_PLAYER sets the player', () => {
    const state = gameReducer(undefined, { type: SET_PLAYER, payload: mockPlayer });
    expect(state.player).toEqual(mockPlayer);
  });

  it('GAME_UPDATED updates game state', () => {
    const state = gameReducer(undefined, { type: GAME_UPDATED, payload: mockGame });
    expect(state.game).toEqual(mockGame);
  });

  it('GAME_STARTED sets isPlaying and resets isOver', () => {
    const prev = { ...initialState, isOver: true };
    const state = gameReducer(prev, { type: GAME_STARTED, payload: { ...mockGame, state: 'playing' } });
    expect(state.isPlaying).toBe(true);
    expect(state.isOver).toBe(false);
    expect(state.winner).toBeNull();
    expect(state.opponents).toEqual({});
  });

  it('GAME_OVER sets isOver and winner', () => {
    const state = gameReducer(undefined, { type: GAME_OVER, payload: { winner: 'MedK' } });
    expect(state.isOver).toBe(true);
    expect(state.isPlaying).toBe(false);
    expect(state.winner).toBe('MedK');
  });

  it('SET_ERROR stores error message', () => {
    const state = gameReducer(undefined, { type: SET_ERROR, payload: 'Room full' });
    expect(state.error).toBe('Room full');
  });

  it('CLEAR_ERROR clears the error', () => {
    const prev = { ...initialState, error: 'some error' };
    const state = gameReducer(prev, { type: CLEAR_ERROR });
    expect(state.error).toBeNull();
  });

  it('OPPONENT_SPECTRUM adds opponent data', () => {
    const payload = { playerId: 'p1', playerName: 'Opp1', spectrum: [1, 2, 3] };
    const state = gameReducer(undefined, { type: OPPONENT_SPECTRUM, payload });
    expect(state.opponents['p1']).toEqual({ playerName: 'Opp1', spectrum: [1, 2, 3] });
  });

  it('OPPONENT_SPECTRUM with null spectrum removes opponent', () => {
    const prev = {
      ...initialState,
      opponents: { p1: { playerName: 'Opp1', spectrum: [1, 2, 3] } },
    };
    const state = gameReducer(prev, {
      type: OPPONENT_SPECTRUM,
      payload: { playerId: 'p1', playerName: 'Opp1', spectrum: null },
    });
    expect(state.opponents['p1']).toBeUndefined();
  });

  it('HIGH_SCORES stores the leaderboard', () => {
    const scores = [{ name: 'Alice', score: 1200 }, { name: 'Bob', score: 800 }];
    const state = gameReducer(undefined, { type: HIGH_SCORES, payload: scores });
    expect(state.highScores).toEqual(scores);
  });

  it('unknown action returns state unchanged', () => {
    const state = gameReducer(initialState, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual(initialState);
  });
});
