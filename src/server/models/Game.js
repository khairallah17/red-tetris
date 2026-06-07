'use strict';

const { Piece } = require('./Piece');

const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended',
};

function Game(name) {
  this.name = name;
  this.players = [];
  this.state = GAME_STATES.WAITING;
  this.pieces = []; // shared piece sequence
  this.winner = null;
}

Game.prototype.addPlayer = function (player) {
  if (this.players.length === 0) {
    player.setHost(true);
  }
  this.players.push(player);
};

Game.prototype.removePlayer = function (playerId) {
  const idx = this.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;

  const wasHost = this.players[idx].isHost;
  this.players.splice(idx, 1);

  // Reassign host if needed
  if (wasHost && this.players.length > 0) {
    this.players[0].setHost(true);
  }
};

Game.prototype.getPlayer = function (playerId) {
  return this.players.find((p) => p.id === playerId) || null;
};

Game.prototype.getHost = function () {
  return this.players.find((p) => p.isHost) || null;
};

Game.prototype.start = function () {
  if (this.state !== GAME_STATES.WAITING) return false;
  this.state = GAME_STATES.PLAYING;
  this.winner = null;
  // Pre-generate shared piece sequence (enough for a long game)
  this.pieces = Array.from({ length: 500 }, () => Piece.random().toJSON());
  this.players.forEach((p) => p.reset());
  return true;
};

Game.prototype.getPiece = function (index) {
  // Extend if needed
  while (this.pieces.length <= index) {
    this.pieces.push(Piece.random().toJSON());
  }
  return this.pieces[index];
};

Game.prototype.eliminatePlayer = function (playerId) {
  const player = this.getPlayer(playerId);
  if (!player) return;
  player.eliminiate();

  const alivePlayers = this.players.filter((p) => p.isAlive);
  if (alivePlayers.length <= 1) {
    this.state = GAME_STATES.ENDED;
    this.winner = alivePlayers.length === 1 ? alivePlayers[0].name : null;
    return { gameOver: true, winner: this.winner };
  }
  return { gameOver: false };
};

Game.prototype.reset = function () {
  this.state = GAME_STATES.WAITING;
  this.pieces = [];
  this.winner = null;
  this.players.forEach((p) => {
    p.reset();
    p.setHost(false);
  });
  if (this.players.length > 0) {
    this.players[0].setHost(true);
  }
};

Game.prototype.isOpen = function () {
  return this.state === GAME_STATES.WAITING;
};

Game.prototype.isEmpty = function () {
  return this.players.length === 0;
};

Game.prototype.getAlivePlayers = function () {
  return this.players.filter((p) => p.isAlive);
};

Game.prototype.toJSON = function () {
  return {
    name: this.name,
    state: this.state,
    winner: this.winner,
    players: this.players.map((p) => p.toJSON()),
  };
};

module.exports = { Game, GAME_STATES };
