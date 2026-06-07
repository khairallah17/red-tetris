'use strict';

const { Player } = require('../../src/server/models/Player');

describe('Player', () => {
  it('creates a player with correct properties', () => {
    const player = new Player('socket1', 'MedK', 'room1');
    expect(player.id).toBe('socket1');
    expect(player.name).toBe('MedK');
    expect(player.roomName).toBe('room1');
    expect(player.isHost).toBe(false);
    expect(player.isAlive).toBe(true);
    expect(player.pieceIndex).toBe(0);
  });

  it('setHost changes isHost', () => {
    const player = new Player('s1', 'Alice', 'room');
    player.setHost(true);
    expect(player.isHost).toBe(true);
    player.setHost(false);
    expect(player.isHost).toBe(false);
  });

  it('eliminiate sets isAlive to false', () => {
    const player = new Player('s1', 'Alice', 'room');
    player.eliminiate();
    expect(player.isAlive).toBe(false);
  });

  it('nextPiece increments pieceIndex', () => {
    const player = new Player('s1', 'Alice', 'room');
    player.nextPiece();
    expect(player.pieceIndex).toBe(1);
    player.nextPiece();
    expect(player.pieceIndex).toBe(2);
  });

  it('reset restores default values', () => {
    const player = new Player('s1', 'Alice', 'room');
    player.eliminiate();
    player.nextPiece();
    player.nextPiece();
    player.reset();
    expect(player.isAlive).toBe(true);
    expect(player.pieceIndex).toBe(0);
  });

  it('toJSON returns correct shape', () => {
    const player = new Player('s1', 'Alice', 'room1');
    player.setHost(true);
    const json = player.toJSON();
    expect(json.id).toBe('s1');
    expect(json.name).toBe('Alice');
    expect(json.roomName).toBe('room1');
    expect(json.isHost).toBe(true);
    expect(json.isAlive).toBe(true);
  });
});
