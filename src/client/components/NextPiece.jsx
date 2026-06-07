import React from 'react';

const PIECE_COLORS = {
  cyan: '#00f5ff', yellow: '#ffee00', purple: '#d500f9',
  green: '#00e676', red: '#ff1744', blue: '#2979ff', orange: '#ff6d00',
};

const NextPiece = ({ piece }) => {
  if (!piece) return null;

  const shape = piece.shape;
  const color = PIECE_COLORS[piece.color] || piece.color;
  const rows = shape.length;
  const cols = shape[0]?.length || 0;

  return (
    <div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
        Next
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 20px)`,
          gridTemplateRows: `repeat(${rows}, 20px)`,
          gap: 1,
          padding: 8,
          backgroundColor: '#0a0a1a',
          border: '1px solid rgba(255,255,255,0.08)',
          width: 'fit-content',
        }}
      >
        {shape.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r},${c}`}
              style={{
                width: 20,
                height: 20,
                backgroundColor: val ? color : 'transparent',
                border: val ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                boxShadow: val ? `inset 2px 2px 4px rgba(255,255,255,0.3)` : 'none',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NextPiece;
