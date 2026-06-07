'use strict';

// All 7 Tetrimino shapes with their rotation states
const SHAPES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
};

const COLORS = {
  I: 'cyan',
  O: 'yellow',
  T: 'purple',
  S: 'green',
  Z: 'red',
  J: 'blue',
  L: 'orange',
};

const PIECE_TYPES = Object.keys(SHAPES);

function Piece(type, rotation) {
  this.type = type || PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  this.rotation = rotation || 0;
  this.color = COLORS[this.type];
  this.x = 3;
  this.y = 0;
}

Piece.prototype.getShape = function () {
  const rotations = SHAPES[this.type];
  return rotations[this.rotation % rotations.length];
};

Piece.prototype.rotate = function () {
  const rotations = SHAPES[this.type];
  return Object.assign(new Piece(this.type, (this.rotation + 1) % rotations.length), {
    x: this.x,
    y: this.y,
  });
};

Piece.prototype.moveLeft = function () {
  return Object.assign(new Piece(this.type, this.rotation), { x: this.x - 1, y: this.y });
};

Piece.prototype.moveRight = function () {
  return Object.assign(new Piece(this.type, this.rotation), { x: this.x + 1, y: this.y });
};

Piece.prototype.moveDown = function () {
  return Object.assign(new Piece(this.type, this.rotation), { x: this.x, y: this.y + 1 });
};

Piece.prototype.toJSON = function () {
  return {
    type: this.type,
    rotation: this.rotation,
    color: this.color,
    x: this.x,
    y: this.y,
    shape: this.getShape(),
  };
};

Piece.random = function () {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return new Piece(type, 0);
};

module.exports = { Piece, SHAPES, COLORS, PIECE_TYPES };
