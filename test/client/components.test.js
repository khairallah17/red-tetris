import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cell from '../../src/client/components/Cell';
import Spectrum from '../../src/client/components/Spectrum';
import NextPiece from '../../src/client/components/NextPiece';

// ─── Cell ────────────────────────────────────────────────────────────────────

describe('Cell', () => {
  it('renders an empty cell with no fill', () => {
    const { container } = render(
      <Cell cell={{ filled: false, color: null, penalty: false }} isGhost={false} />
    );
    const div = container.firstChild;
    expect(div).toBeTruthy();
    expect(div.style.backgroundColor).toBe('transparent');
  });

  it('renders a filled cell with background color', () => {
    const { container } = render(
      <Cell cell={{ filled: true, color: 'cyan', penalty: false }} isGhost={false} />
    );
    const div = container.firstChild;
    expect(div.style.backgroundColor).toBe('rgb(0, 245, 255)');
  });

  it('renders a ghost cell with no background and border', () => {
    const { container } = render(
      <Cell cell={{ filled: true, color: 'cyan', penalty: false }} isGhost={true} />
    );
    const div = container.firstChild;
    expect(div.style.backgroundColor).toBe('transparent');
    expect(div.style.border).toContain('solid');
  });

  it('renders a penalty cell', () => {
    const { container } = render(
      <Cell cell={{ filled: true, color: '#555', penalty: true }} isGhost={false} />
    );
    const div = container.firstChild;
    expect(div.style.backgroundColor).not.toBe('transparent');
  });

  it('renders all piece color types without crashing', () => {
    const colors = ['cyan', 'yellow', 'purple', 'green', 'red', 'blue', 'orange'];
    colors.forEach((color) => {
      expect(() =>
        render(<Cell cell={{ filled: true, color, penalty: false }} isGhost={false} />)
      ).not.toThrow();
    });
  });

  it('renders unknown color gracefully', () => {
    expect(() =>
      render(<Cell cell={{ filled: true, color: 'hotpink', penalty: false }} isGhost={false} />)
    ).not.toThrow();
  });
});

// ─── Spectrum ────────────────────────────────────────────────────────────────

describe('Spectrum', () => {
  const spectrum = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  it('renders player name', () => {
    render(<Spectrum playerName="Opp1" spectrum={spectrum} />);
    expect(screen.getByText('Opp1')).toBeInTheDocument();
  });

  it('renders 10 column bars', () => {
    const { container } = render(<Spectrum playerName="Opp1" spectrum={spectrum} />);
    // The inner bar container has 10 flex children
    const bars = container.querySelectorAll('[style*="flex: 1"]');
    expect(bars.length).toBe(10);
  });

  it('returns null when spectrum is null', () => {
    const { container } = render(<Spectrum playerName="Ghost" spectrum={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('colors danger columns red when above 70% height', () => {
    // Column with height 15 out of 20 = 75% → danger
    const dangerSpectrum = Array(10).fill(15);
    const { container } = render(<Spectrum playerName="Opp" spectrum={dangerSpectrum} />);
    const bars = container.querySelectorAll('[style*="flex: 1"]');
    bars.forEach((bar) => {
      expect(bar.style.backgroundColor).toBe('rgb(255, 23, 68)');
    });
  });

  it('colors safe columns blue when below 70% height', () => {
    const safeSpectrum = Array(10).fill(5);
    const { container } = render(<Spectrum playerName="Opp" spectrum={safeSpectrum} />);
    const bars = container.querySelectorAll('[style*="flex: 1"]');
    bars.forEach((bar) => {
      expect(bar.style.backgroundColor).toBe('rgb(41, 121, 255)');
    });
  });
});

// ─── NextPiece ───────────────────────────────────────────────────────────────

describe('NextPiece', () => {
  const tPiece = {
    type: 'T',
    color: 'purple',
    shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  };

  it('renders the "Next" label', () => {
    render(<NextPiece piece={tPiece} />);
    expect(screen.getByText(/next/i)).toBeInTheDocument();
  });

  it('renders the correct number of cells for T piece (3x3 = 9)', () => {
    const { container } = render(<NextPiece piece={tPiece} />);
    // Grid container holds all shape cells
    const grid = container.querySelector('[style*="grid-template-columns"]');
    expect(grid.children.length).toBe(9);
  });

  it('returns null when piece is null', () => {
    const { container } = render(<NextPiece piece={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders I piece (1x4 = 4 cells)', () => {
    const iPiece = {
      type: 'I',
      color: 'cyan',
      shape: [[1, 1, 1, 1]],
    };
    const { container } = render(<NextPiece piece={iPiece} />);
    const grid = container.querySelector('[style*="grid-template-columns"]');
    expect(grid.children.length).toBe(4);
  });

  it('highlights filled cells with piece color', () => {
    const { container } = render(<NextPiece piece={tPiece} />);
    // T piece has 4 filled cells out of 9
    const grid = container.querySelector('[style*="grid-template-columns"]');
    const allCells = Array.from(grid.children);
    const filled = allCells.filter((c) => c.style.backgroundColor !== 'transparent');
    expect(filled.length).toBe(4);
  });
});
