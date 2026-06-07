import React from 'react';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../utils/board';

const Spectrum = ({ playerName, spectrum }) => {
  if (!spectrum) return null;

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 4,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 70,
        }}
      >
        {playerName}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          width: 70,
          height: 100,
          backgroundColor: '#0a0a1a',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '2px',
          boxSizing: 'border-box',
        }}
      >
        {spectrum.map((height, col) => {
          const pct = (height / BOARD_HEIGHT) * 100;
          const danger = pct > 70;
          return (
            <div
              key={col}
              style={{
                flex: 1,
                height: `${pct}%`,
                backgroundColor: danger ? '#ff1744' : '#2979ff',
                transition: 'height 0.15s ease',
                minHeight: height > 0 ? 2 : 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Spectrum;
