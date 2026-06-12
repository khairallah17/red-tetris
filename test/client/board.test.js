import {
  createBoard,
  isValidPosition,
  lockPiece,
  clearLines,
  addPenaltyLines,
  computeSpectrum,
  hardDropY,
  mergeBoard,
  ghostY,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  lineScore,
  dropScore,
  computeLevel,
  gravityInterval,
} from '../../src/client/utils/board';

const I_SHAPE = [[1, 1, 1, 1]];
const O_SHAPE = [[1, 1], [1, 1]];
const T_SHAPE = [[0, 1, 0], [1, 1, 1], [0, 0, 0]];

describe('createBoard', () => {
  it('creates a board with correct dimensions', () => {
    const board = createBoard();
    expect(board.length).toBe(BOARD_HEIGHT);
    expect(board[0].length).toBe(BOARD_WIDTH);
  });

  it('creates empty cells', () => {
    const board = createBoard();
    board.forEach((row) =>
      row.forEach((cell) => {
        expect(cell.filled).toBe(false);
        expect(cell.color).toBeNull();
      })
    );
  });
});

describe('isValidPosition', () => {
  let board;
  beforeEach(() => { board = createBoard(); });

  it('returns true for valid position', () => {
    expect(isValidPosition(board, I_SHAPE, 3, 5)).toBe(true);
  });

  it('returns false when piece goes off left wall', () => {
    expect(isValidPosition(board, I_SHAPE, -1, 5)).toBe(false);
  });

  it('returns false when piece goes off right wall', () => {
    expect(isValidPosition(board, I_SHAPE, 8, 5)).toBe(false);
  });

  it('returns false when piece goes below floor', () => {
    expect(isValidPosition(board, I_SHAPE, 3, BOARD_HEIGHT)).toBe(false);
  });

  it('returns true when piece is above the board (spawning)', () => {
    expect(isValidPosition(board, I_SHAPE, 3, -1)).toBe(true);
  });

  it('returns false when colliding with existing block', () => {
    board[5][3] = { filled: true, color: 'red', penalty: false };
    expect(isValidPosition(board, I_SHAPE, 3, 5)).toBe(false);
  });
});

describe('lockPiece', () => {
  it('places piece cells on the board', () => {
    const board = createBoard();
    const result = lockPiece(board, O_SHAPE, 0, 0, 'yellow');
    expect(result[0][0].filled).toBe(true);
    expect(result[0][0].color).toBe('yellow');
    expect(result[0][1].filled).toBe(true);
    expect(result[1][0].filled).toBe(true);
    expect(result[1][1].filled).toBe(true);
  });

  it('does not mutate the original board', () => {
    const board = createBoard();
    lockPiece(board, O_SHAPE, 0, 0, 'yellow');
    expect(board[0][0].filled).toBe(false);
  });
});

describe('clearLines', () => {
  it('clears a full line and returns linesCleared count', () => {
    const board = createBoard();
    // Fill entire row 19
    board[19] = Array.from({ length: BOARD_WIDTH }, () => ({ filled: true, color: 'red', penalty: false }));
    const { board: result, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(1);
    expect(result[19].every((c) => !c.filled)).toBe(true);
  });

  it('does not clear a partial line', () => {
    const board = createBoard();
    board[19][0] = { filled: true, color: 'red', penalty: false };
    const { linesCleared } = clearLines(board);
    expect(linesCleared).toBe(0);
  });

  it('handles multiple line clears', () => {
    const board = createBoard();
    for (let r = 17; r <= 19; r++) {
      board[r] = Array.from({ length: BOARD_WIDTH }, () => ({ filled: true, color: 'blue', penalty: false }));
    }
    const { linesCleared } = clearLines(board);
    expect(linesCleared).toBe(3);
  });

  it('keeps penalty lines (not cleared)', () => {
    const board = createBoard();
    board[19] = Array.from({ length: BOARD_WIDTH }, () => ({ filled: true, color: '#555', penalty: true }));
    const { linesCleared } = clearLines(board);
    expect(linesCleared).toBe(0);
  });
});

describe('addPenaltyLines', () => {
  it('adds penalty lines at the bottom', () => {
    const board = createBoard();
    const result = addPenaltyLines(board, 2);
    expect(result[BOARD_HEIGHT - 1].every((c) => c.filled && c.penalty)).toBe(true);
    expect(result[BOARD_HEIGHT - 2].every((c) => c.filled && c.penalty)).toBe(true);
  });

  it('shifts existing board content up', () => {
    const board = createBoard();
    board[0][0] = { filled: true, color: 'red', penalty: false };
    const result = addPenaltyLines(board, 1);
    // Original row 0 is now gone (shifted off); new row 0 comes from row 1
    expect(result[BOARD_HEIGHT - 1].every((c) => c.penalty)).toBe(true);
  });
});

describe('computeSpectrum', () => {
  it('returns zeros for empty board', () => {
    const board = createBoard();
    const spectrum = computeSpectrum(board);
    expect(spectrum).toHaveLength(BOARD_WIDTH);
    expect(spectrum.every((h) => h === 0)).toBe(true);
  });

  it('returns correct height for filled column', () => {
    const board = createBoard();
    board[19][0] = { filled: true, color: 'red', penalty: false };
    const spectrum = computeSpectrum(board);
    expect(spectrum[0]).toBe(1);
  });

  it('returns full height when column is full', () => {
    const board = createBoard();
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      board[r][5] = { filled: true, color: 'blue', penalty: false };
    }
    const spectrum = computeSpectrum(board);
    expect(spectrum[5]).toBe(BOARD_HEIGHT);
  });
});

describe('hardDropY', () => {
  it('drops to floor on empty board', () => {
    const board = createBoard();
    const y = hardDropY(board, I_SHAPE, 3, 0);
    expect(y).toBe(BOARD_HEIGHT - 1);
  });

  it('stops above existing block', () => {
    const board = createBoard();
    board[10][3] = { filled: true, color: 'red', penalty: false };
    const y = hardDropY(board, [[1]], 3, 0);
    expect(y).toBe(9);
  });
});

describe('mergeBoard', () => {
  it('overlays active piece onto board snapshot', () => {
    const board = createBoard();
    const result = mergeBoard(board, [[1]], 0, 0, 'cyan');
    expect(result[0][0].filled).toBe(true);
    expect(result[0][0].color).toBe('cyan');
  });

  it('does not mutate original board', () => {
    const board = createBoard();
    mergeBoard(board, [[1]], 0, 0, 'cyan');
    expect(board[0][0].filled).toBe(false);
  });
});

describe('ghostY', () => {
  it('returns same as hardDropY', () => {
    const board = createBoard();
    expect(ghostY(board, I_SHAPE, 3, 0)).toBe(hardDropY(board, I_SHAPE, 3, 0));
  });
});

describe('scoring (bonus)', () => {
  describe('lineScore', () => {
    it('returns 0 for no lines', () => {
      expect(lineScore(0, 1)).toBe(0);
    });
    it('uses classic single/double/triple/tetris values at level 1', () => {
      expect(lineScore(1, 1)).toBe(40);
      expect(lineScore(2, 1)).toBe(100);
      expect(lineScore(3, 1)).toBe(300);
      expect(lineScore(4, 1)).toBe(1200);
    });
    it('scales with the level', () => {
      expect(lineScore(4, 3)).toBe(3600);
      expect(lineScore(1, 5)).toBe(200);
    });
    it('defaults to level 1 and handles out-of-range counts', () => {
      expect(lineScore(1)).toBe(40);
      expect(lineScore(7, 1)).toBe(0);
    });
  });

  describe('dropScore', () => {
    it('awards 1 point per soft-drop cell', () => {
      expect(dropScore(5)).toBe(5);
      expect(dropScore(1, false)).toBe(1);
    });
    it('awards 2 points per hard-drop cell', () => {
      expect(dropScore(5, true)).toBe(10);
    });
    it('never goes negative', () => {
      expect(dropScore(-3, true)).toBe(0);
    });
  });

  describe('computeLevel', () => {
    it('starts at level 1', () => {
      expect(computeLevel(0)).toBe(1);
      expect(computeLevel(9)).toBe(1);
    });
    it('increments every 10 lines', () => {
      expect(computeLevel(10)).toBe(2);
      expect(computeLevel(25)).toBe(3);
      expect(computeLevel(100)).toBe(11);
    });
  });

  describe('gravityInterval', () => {
    it('returns the base interval at level 1', () => {
      expect(gravityInterval(1, 800)).toBe(800);
    });
    it('gets faster as the level rises', () => {
      expect(gravityInterval(5, 800)).toBeLessThan(gravityInterval(2, 800));
    });
    it('is clamped to a minimum', () => {
      expect(gravityInterval(50, 800)).toBeGreaterThanOrEqual(80);
    });
    it('respects a custom base', () => {
      expect(gravityInterval(1, 350)).toBe(350);
    });
  });
});
