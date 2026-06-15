import {
  NEW_PIECE, MOVE_LEFT, MOVE_RIGHT, MOVE_DOWN,
  ROTATE_PIECE, HARD_DROP, ADD_PENALTY, PLAYER_LOST, RESET_BOARD, GAME_UPDATED, GAME_RESTARTED,
} from '../actions/types';

import {
  createBoard, isValidPosition, lockPiece, clearLines,
  addPenaltyLines, computeSpectrum, hardDropY,
  lineScore, dropScore, computeLevel,
} from '../utils/board';

const initialState = {
  board: createBoard(),
  currentPiece: null,
  nextPiece: null,
  isLost: false,
  linesCleared: 0,
  score: 0,
  level: 1,
  pendingLines: 0,
  spectrumDirty: false,
};

const tryMove = (board, piece, dx, dy) => {
  if (!piece) return piece;
  const shape = piece.shape;
  const nx = piece.x + dx;
  const ny = piece.y + dy;
  if (isValidPosition(board, shape, nx, ny)) {
    return { ...piece, x: nx, y: ny };
  }
  return null; // invalid
};

const boardReducer = (state = initialState, action) => {
  switch (action.type) {
    case RESET_BOARD:
      return { ...initialState, board: createBoard() };

    case NEW_PIECE: {
      const piece = action.payload;
      // Spawn check
      if (!isValidPosition(state.board, piece.shape, piece.x, piece.y)) {
        return { ...state, isLost: true };
      }

      // If we already have a current piece (shouldn't normally happen), ignore
      if (state.currentPiece && !state.nextPiece) {
        return { ...state, nextPiece: piece };
      }

      if (!state.currentPiece) {
        return { ...state, currentPiece: piece, spectrumDirty: false };
      }

      // Promote next → current, store incoming as next
      return {
        ...state,
        currentPiece: state.nextPiece || piece,
        nextPiece: state.nextPiece ? piece : null,
        spectrumDirty: false,
      };
    }

    case MOVE_LEFT: {
      const moved = tryMove(state.board, state.currentPiece, -1, 0);
      if (!moved) return state;
      return { ...state, currentPiece: moved };
    }

    case MOVE_RIGHT: {
      const moved = tryMove(state.board, state.currentPiece, 1, 0);
      if (!moved) return state;
      return { ...state, currentPiece: moved };
    }

    case ROTATE_PIECE: {
      if (!state.currentPiece) return state;
      const piece = state.currentPiece;
      const shape = piece.shape;
      // Transpose + reverse for clockwise rotation
      const rotated = shape[0].map((_, i) => shape.map((row) => row[i]).reverse());

      if (isValidPosition(state.board, rotated, piece.x, piece.y)) {
        return { ...state, currentPiece: { ...piece, shape: rotated } };
      }
      // Wall kick attempts
      for (const kick of [-1, 1, -2, 2]) {
        if (isValidPosition(state.board, rotated, piece.x + kick, piece.y)) {
          return { ...state, currentPiece: { ...piece, shape: rotated, x: piece.x + kick } };
        }
      }
      return state;
    }

    case MOVE_DOWN: {
      if (!state.currentPiece) return state;
      const { currentPiece, board } = state;
      const moved = tryMove(board, currentPiece, 0, 1);

      if (moved) {
        const softBonus = action.payload?.soft ? dropScore(1, false) : 0;
        return { ...state, currentPiece: moved, score: state.score + softBonus };
      }

      // Lock piece
      const locked = lockPiece(board, currentPiece.shape, currentPiece.x, currentPiece.y, currentPiece.color);
      const { board: cleared, linesCleared } = clearLines(locked);

      // Apply any pending penalty lines
      const finalBoard = state.pendingLines > 0
        ? addPenaltyLines(cleared, state.pendingLines)
        : cleared;

      const spectrum = computeSpectrum(finalBoard);
      const totalLines = state.linesCleared + linesCleared;
      const level = computeLevel(totalLines);

      return {
        ...state,
        board: finalBoard,
        currentPiece: null,
        linesCleared: totalLines,
        level,
        score: state.score + lineScore(linesCleared, state.level),
        pendingLines: 0,
        spectrumDirty: true,
        _lastLinesCleared: linesCleared,
        _spectrum: spectrum,
      };
    }

    case HARD_DROP: {
      if (!state.currentPiece) return state;
      const { currentPiece, board } = state;
      const dropY = hardDropY(board, currentPiece.shape, currentPiece.x, currentPiece.y);
      const dropped = { ...currentPiece, y: dropY };
      const dropCells = dropY - currentPiece.y;

      const locked = lockPiece(board, dropped.shape, dropped.x, dropped.y, dropped.color);
      const { board: cleared, linesCleared } = clearLines(locked);

      const finalBoard = state.pendingLines > 0
        ? addPenaltyLines(cleared, state.pendingLines)
        : cleared;

      const spectrum = computeSpectrum(finalBoard);
      const totalLines = state.linesCleared + linesCleared;
      const level = computeLevel(totalLines);

      return {
        ...state,
        board: finalBoard,
        currentPiece: null,
        linesCleared: totalLines,
        level,
        score: state.score + lineScore(linesCleared, state.level) + dropScore(dropCells, true),
        pendingLines: 0,
        spectrumDirty: true,
        _lastLinesCleared: linesCleared,
        _spectrum: spectrum,
      };
    }

    case ADD_PENALTY:
      // Queue penalty lines to apply on next piece lock
      return { ...state, pendingLines: state.pendingLines + action.payload };

    case PLAYER_LOST:
      return { ...state, isLost: true };

    case GAME_UPDATED:
      if (action.payload?.state === 'waiting' && state.isLost) {
        return { ...state, isLost: false };
      }
      return state;

    case GAME_RESTARTED:
      return { ...state, isLost: false };

    default:
      return state;
  }
};

export default boardReducer;
