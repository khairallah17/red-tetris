import boardReducer from '../../src/client/reducers/boardReducer';
import {
  NEW_PIECE, MOVE_LEFT, MOVE_RIGHT, MOVE_DOWN,
  ROTATE_PIECE, HARD_DROP, ADD_PENALTY, PLAYER_LOST, RESET_BOARD,
} from '../../src/client/actions/types';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../../src/client/utils/board';

const I_PIECE = {
  type: 'I',
  color: 'cyan',
  x: 3,
  y: 5,
  shape: [[1, 1, 1, 1]],
};

const makePiece = (overrides = {}) => ({
  type: 'O',
  color: 'yellow',
  x: 4,
  y: 0,
  shape: [[1, 1], [1, 1]],
  ...overrides,
});

const getInitialState = () => boardReducer(undefined, { type: '@@INIT' });

describe('boardReducer', () => {
  it('returns initial state', () => {
    const state = getInitialState();
    expect(state.board).toHaveLength(BOARD_HEIGHT);
    expect(state.currentPiece).toBeNull();
    expect(state.isLost).toBe(false);
  });

  it('RESET_BOARD resets to initial state', () => {
    let state = getInitialState();
    state = { ...state, isLost: true, linesCleared: 5 };
    const result = boardReducer(state, { type: RESET_BOARD });
    expect(result.isLost).toBe(false);
    expect(result.linesCleared).toBe(0);
    expect(result.currentPiece).toBeNull();
  });

  it('NEW_PIECE sets current piece', () => {
    const state = getInitialState();
    const piece = makePiece();
    const result = boardReducer(state, { type: NEW_PIECE, payload: piece });
    expect(result.currentPiece).toEqual(piece);
  });

  it('NEW_PIECE detects game over when spawning into block', () => {
    let state = getInitialState();
    // Fill top rows
    for (let c = 0; c < BOARD_WIDTH; c++) {
      state.board[0][c] = { filled: true, color: 'red', penalty: false };
    }
    const piece = makePiece({ x: 0, y: 0, shape: [[1, 1], [1, 1]] });
    const result = boardReducer(state, { type: NEW_PIECE, payload: piece });
    expect(result.isLost).toBe(true);
  });

  it('MOVE_LEFT moves piece left', () => {
    const state = { ...getInitialState(), currentPiece: makePiece({ x: 4, y: 5 }) };
    const result = boardReducer(state, { type: MOVE_LEFT });
    expect(result.currentPiece.x).toBe(3);
  });

  it('MOVE_LEFT does not move past left wall', () => {
    const state = { ...getInitialState(), currentPiece: makePiece({ x: 0, y: 5 }) };
    const result = boardReducer(state, { type: MOVE_LEFT });
    expect(result.currentPiece.x).toBe(0);
  });

  it('MOVE_RIGHT moves piece right', () => {
    const state = { ...getInitialState(), currentPiece: makePiece({ x: 4, y: 5 }) };
    const result = boardReducer(state, { type: MOVE_RIGHT });
    expect(result.currentPiece.x).toBe(5);
  });

  it('MOVE_RIGHT does not move past right wall', () => {
    const state = { ...getInitialState(), currentPiece: makePiece({ x: 8, y: 5 }) };
    const result = boardReducer(state, { type: MOVE_RIGHT });
    expect(result.currentPiece.x).toBe(8);
  });

  it('MOVE_DOWN moves piece down', () => {
    const state = { ...getInitialState(), currentPiece: makePiece({ x: 4, y: 5 }) };
    const result = boardReducer(state, { type: MOVE_DOWN });
    expect(result.currentPiece.y).toBe(6);
  });

  it('MOVE_DOWN locks piece when hitting floor', () => {
    const state = { ...getInitialState(), currentPiece: makePiece({ x: 4, y: BOARD_HEIGHT - 2 }) };
    const result = boardReducer(state, { type: MOVE_DOWN });
    expect(result.currentPiece).toBeNull();
    expect(result.board[BOARD_HEIGHT - 2][4].filled).toBe(true);
  });

  it('ROTATE_PIECE rotates the shape', () => {
    const piece = {
      ...makePiece(),
      shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      x: 3,
      y: 3,
    };
    const state = { ...getInitialState(), currentPiece: piece };
    const result = boardReducer(state, { type: ROTATE_PIECE });
    // Shape should have changed
    expect(result.currentPiece.shape).not.toEqual(piece.shape);
  });

  it('HARD_DROP drops piece to floor immediately', () => {
    const state = { ...getInitialState(), currentPiece: makePiece({ x: 4, y: 0 }) };
    const result = boardReducer(state, { type: HARD_DROP });
    expect(result.currentPiece).toBeNull();
    // Bottom rows should be filled
    expect(result.board[BOARD_HEIGHT - 1][4].filled).toBe(true);
  });

  it('ADD_PENALTY accumulates penalty lines', () => {
    const state = getInitialState();
    let result = boardReducer(state, { type: ADD_PENALTY, payload: 2 });
    expect(result.pendingLines).toBe(2);
    result = boardReducer(result, { type: ADD_PENALTY, payload: 1 });
    expect(result.pendingLines).toBe(3);
  });

  it('PLAYER_LOST sets isLost to true', () => {
    const state = getInitialState();
    const result = boardReducer(state, { type: PLAYER_LOST });
    expect(result.isLost).toBe(true);
  });

  it('MOVE_DOWN clears lines and updates linesCleared', () => {
    let state = getInitialState();
    // Fill all of row 19 except where piece will land
    const row = Array.from({ length: BOARD_WIDTH }, (_, i) =>
      i < 4 || i > 5 ? { filled: true, color: 'red', penalty: false } : { filled: false, color: null, penalty: false }
    );
    state.board[BOARD_HEIGHT - 1] = row;
    state = { ...state, currentPiece: { type: 'I', color: 'cyan', x: 3, y: BOARD_HEIGHT - 2, shape: [[1, 1, 1, 1]] } };
    const result = boardReducer(state, { type: MOVE_DOWN });
    // After locking, the line should have cleared
    expect(result.linesCleared).toBeGreaterThan(0);
  });
});
