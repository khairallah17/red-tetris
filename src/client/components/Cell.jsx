import React from 'react';

const PIECE_COLORS = {
  cyan:   { bg: '#00f5ff', border: '#00bcd4', shadow: '#00f5ff' },
  yellow: { bg: '#ffee00', border: '#ffd600', shadow: '#ffee00' },
  purple: { bg: '#d500f9', border: '#aa00ff', shadow: '#d500f9' },
  green:  { bg: '#00e676', border: '#00c853', shadow: '#00e676' },
  red:    { bg: '#ff1744', border: '#d50000', shadow: '#ff1744' },
  blue:   { bg: '#2979ff', border: '#2962ff', shadow: '#2979ff' },
  orange: { bg: '#ff6d00', border: '#e65100', shadow: '#ff6d00' },
  '#555': { bg: '#3d3d3d', border: '#555',    shadow: 'none' },
};

const Cell = ({ cell, isGhost }) => {
  const style = {};

  if (cell.filled || isGhost) {
    const colorKey = cell.color || '#555';
    const colors = PIECE_COLORS[colorKey] || { bg: colorKey, border: '#333', shadow: colorKey };

    if (isGhost) {
      style.backgroundColor = 'transparent';
      style.border = `2px solid ${colors.bg}`;
      style.opacity = 0.4;
    } else if (cell.penalty) {
      style.backgroundColor = colors.bg;
      style.border = `1px solid ${colors.border}`;
    } else {
      style.backgroundColor = colors.bg;
      style.border = `1px solid ${colors.border}`;
      style.boxShadow = `inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.4)`;
    }
  }

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1',
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.05)',
        boxSizing: 'border-box',
        transition: 'background-color 0.05s',
        ...style,
      }}
    />
  );
};

export default Cell;
