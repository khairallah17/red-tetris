'use strict';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

function Player(id, name, roomName) {
  this.id = id;
  this.name = name;
  this.roomName = roomName;
  this.isHost = false;
  this.isAlive = true;
  this.pieceIndex = 0;
}

Player.prototype.setHost = function (val) {
  this.isHost = val;
};

Player.prototype.eliminiate = function () {
  this.isAlive = false;
};

Player.prototype.nextPiece = function () {
  this.pieceIndex += 1;
};

Player.prototype.reset = function () {
  this.isAlive = true;
  this.pieceIndex = 0;
};

Player.prototype.toJSON = function () {
  return {
    id: this.id,
    name: this.name,
    roomName: this.roomName,
    isHost: this.isHost,
    isAlive: this.isAlive,
  };
};

module.exports = { Player, BOARD_WIDTH, BOARD_HEIGHT };
