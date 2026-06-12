// Pure functions for Tetris board logic
// No `this` keyword used anywhere

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Create an empty board
export const createBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ filled: false, color: null, penalty: false }))
  );

// Check if a piece position is valid (no collision)
export const isValidPosition = (board, shape, x, y) => {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;

      const newX = x + col;
      const newY = y + row;

      if (newX < 0 || newX >= BOARD_WIDTH) return false;
      if (newY >= BOARD_HEIGHT) return false;
      if (newY < 0) continue; // above the board is fine
      if (board[newY][newX].filled) return false;
    }
  }
  return true;
};

// Lock a piece onto the board
export const lockPiece = (board, shape, x, y, color) => {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;
      const bx = x + col;
      const by = y + row;
      if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
        newBoard[by][bx] = { filled: true, color, penalty: false };
      }
    }
  }
  return newBoard;
};

// Clear completed lines, return { board, linesCleared }
export const clearLines = (board) => {
  const newBoard = board.filter((row) => row.some((cell) => !cell.filled || cell.penalty));
  const linesCleared = BOARD_HEIGHT - newBoard.length;

  const emptyRows = Array.from({ length: linesCleared }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ filled: false, color: null, penalty: false }))
  );

  return {
    board: [...emptyRows, ...newBoard],
    linesCleared,
  };
};

// Add penalty lines at the bottom
export const addPenaltyLines = (board, count) => {
  const penaltyRow = () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ filled: true, color: '#555', penalty: true }));

  const newBoard = board.slice(count);
  const penalty = Array.from({ length: count }, penaltyRow);
  return [...newBoard, ...penalty];
};

// Compute spectrum (height of each column)
export const computeSpectrum = (board) =>
  Array.from({ length: BOARD_WIDTH }, (_, col) => {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      if (board[row][col].filled) return BOARD_HEIGHT - row;
    }
    return 0;
  });

// Hard drop: find lowest valid Y
export const hardDropY = (board, shape, x, startY) => {
  let y = startY;
  while (isValidPosition(board, shape, x, y + 1)) {
    y += 1;
  }
  return y;
};

// Check if the game is over (piece spawns into collision)
export const isGameOver = (board, shape, x, y) =>
  !isValidPosition(board, shape, x, y);

// Merge active piece into a displayable board snapshot
export const mergeBoard = (board, shape, x, y, color) => {
  const display = board.map((row) => row.map((cell) => ({ ...cell })));
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;
      const bx = x + col;
      const by = y + row;
      if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
        display[by][bx] = { filled: true, color, penalty: false, active: true };
      }
    }
  }
  return display;
};

// Ghost piece Y (for visual aid)
export const ghostY = (board, shape, x, currentY) =>
  hardDropY(board, shape, x, currentY);

// ─── Scoring system (bonus) ──────────────────────────────────────────────────

// Classic Tetris line-clear scoring, scaled by level (level is 1-based).
// 1 line = 40, 2 = 100, 3 = 300, 4 (a "Tetris") = 1200.
const LINE_SCORES = [0, 40, 100, 300, 1200];

export const lineScore = (linesCleared, level = 1) => {
  const base = LINE_SCORES[linesCleared] || 0;
  return base * level;
};

// Bonus points for dropping a piece: 1 point per soft-drop cell,
// 2 points per hard-drop cell. `cells` is the number of rows fallen.
export const dropScore = (cells, hard = false) =>
  Math.max(0, cells) * (hard ? 2 : 1);

// Level increases every 10 cleared lines, starting at level 1.
export const computeLevel = (totalLines) => Math.floor(totalLines / 10) + 1;

// Gravity interval (ms) for a given level. Speeds up as the level rises,
// clamped so it never becomes unplayably fast.
export const gravityInterval = (level, base = 800) =>
  Math.max(80, Math.round(base * Math.pow(0.85, level - 1)));
