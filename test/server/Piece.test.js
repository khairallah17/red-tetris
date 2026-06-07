'use strict';

const { Piece, SHAPES, PIECE_TYPES } = require('../../src/server/models/Piece');

describe('Piece', () => {
  it('creates a piece with a valid type', () => {
    const piece = new Piece('I', 0);
    expect(piece.type).toBe('I');
    expect(piece.rotation).toBe(0);
    expect(piece.color).toBe('cyan');
    expect(piece.x).toBe(3);
    expect(piece.y).toBe(0);
  });

  it('creates a random piece when no type given', () => {
    const piece = new Piece();
    expect(PIECE_TYPES).toContain(piece.type);
  });

  it('getShape returns the correct shape matrix', () => {
    const piece = new Piece('O', 0);
    expect(piece.getShape()).toEqual(SHAPES.O[0]);
  });

  it('rotate increments rotation', () => {
    const piece = new Piece('T', 0);
    const rotated = piece.rotate();
    expect(rotated.rotation).toBe(1);
    expect(rotated.type).toBe('T');
    expect(rotated.x).toBe(piece.x);
    expect(rotated.y).toBe(piece.y);
  });

  it('rotate wraps around at max rotations', () => {
    const piece = new Piece('T', 3);
    const rotated = piece.rotate();
    expect(rotated.rotation).toBe(0);
  });

  it('moveLeft decrements x', () => {
    const piece = new Piece('I', 0);
    const moved = piece.moveLeft();
    expect(moved.x).toBe(piece.x - 1);
    expect(moved.y).toBe(piece.y);
  });

  it('moveRight increments x', () => {
    const piece = new Piece('I', 0);
    const moved = piece.moveRight();
    expect(moved.x).toBe(piece.x + 1);
  });

  it('moveDown increments y', () => {
    const piece = new Piece('I', 0);
    const moved = piece.moveDown();
    expect(moved.y).toBe(piece.y + 1);
  });

  it('toJSON returns serializable object', () => {
    const piece = new Piece('S', 1);
    const json = piece.toJSON();
    expect(json).toHaveProperty('type', 'S');
    expect(json).toHaveProperty('rotation', 1);
    expect(json).toHaveProperty('color');
    expect(json).toHaveProperty('shape');
    expect(json).toHaveProperty('x');
    expect(json).toHaveProperty('y');
  });

  it('Piece.random returns a Piece instance', () => {
    const piece = Piece.random();
    expect(piece).toBeInstanceOf(Piece);
    expect(PIECE_TYPES).toContain(piece.type);
  });

  it('does not mutate original piece on operations', () => {
    const piece = new Piece('L', 0);
    const origX = piece.x;
    piece.moveLeft();
    expect(piece.x).toBe(origX);
  });
});
