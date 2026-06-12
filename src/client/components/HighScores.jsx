import React from 'react';
import { useSelector } from 'react-redux';

const HighScores = () => {
  const highScores = useSelector((s) => s.game.highScores) || [];

  if (highScores.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 28,
        width: 340,
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '20px 24px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
        🏆 High Scores
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {highScores.slice(0, 10).map((entry, i) => (
          <div
            key={`${entry.name}-${entry.date}-${i}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: i === 0 ? '#ffee00' : 'rgba(255,255,255,0.7)',
            }}
          >
            <span style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: 18 }}>{i + 1}.</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
            </span>
            <span style={{ fontWeight: 'bold' }}>{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighScores;
