import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Cell from './Cell';
import { mergeBoard, ghostY, BOARD_WIDTH, BOARD_HEIGHT } from '../utils/board';

const Board = () => {
  const { board, currentPiece } = useSelector((state) => state.board);

  const displayBoard = useMemo(() => {
    if (!currentPiece) return board;
    return mergeBoard(board, currentPiece.shape, currentPiece.x, currentPiece.y, currentPiece.color);
  }, [board, currentPiece]);

  const ghostPieceY = useMemo(() => {
    if (!currentPiece) return null;
    return ghostY(board, currentPiece.shape, currentPiece.x, currentPiece.y);
  }, [board, currentPiece]);

  // Build ghost positions
  const ghostCells = useMemo(() => {
    if (!currentPiece || ghostPieceY === null || ghostPieceY === currentPiece.y) return new Set();
    const cells = new Set();
    currentPiece.shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) {
          const bx = currentPiece.x + c;
          const by = ghostPieceY + r;
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            cells.add(`${by},${bx}`);
          }
        }
      });
    });
    return cells;
  }, [currentPiece, ghostPieceY]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
        width: 240,
        height: 480,
        backgroundColor: '#0a0a1a',
        border: '2px solid rgba(255,255,255,0.1)',
        boxShadow: '0 0 40px rgba(0,200,255,0.15), inset 0 0 30px rgba(0,0,0,0.5)',
      }}
    >
      {displayBoard.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const key = `${rowIdx},${colIdx}`;
          const isGhost = ghostCells.has(key) && !cell.filled;
          const ghostCell = isGhost ? { filled: true, color: currentPiece?.color } : null;
          return (
            <Cell
              key={key}
              cell={isGhost ? ghostCell : cell}
              isGhost={isGhost}
            />
          );
        })
      )}
    </div>
  );
};

export default Board;
