'use strict';

const { Game, GAME_STATES } = require('../../src/server/models/Game');
const { Player } = require('../../src/server/models/Player');

const makePlayer = (id, name) => new Player(id, name, 'testroom');

describe('Game', () => {
  let game;
  beforeEach(() => { game = new Game('testroom'); });

  it('creates a game with correct initial state', () => {
    expect(game.name).toBe('testroom');
    expect(game.state).toBe(GAME_STATES.WAITING);
    expect(game.players).toHaveLength(0);
    expect(game.winner).toBeNull();
  });

  it('addPlayer: first player becomes host', () => {
    const p = makePlayer('s1', 'Alice');
    game.addPlayer(p);
    expect(p.isHost).toBe(true);
    expect(game.players).toHaveLength(1);
  });

  it('addPlayer: second player is not host', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    const p2 = makePlayer('s2', 'Bob');
    game.addPlayer(p2);
    expect(p2.isHost).toBe(false);
  });

  it('removePlayer: removes the correct player', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.addPlayer(makePlayer('s2', 'Bob'));
    game.removePlayer('s2');
    expect(game.players).toHaveLength(1);
    expect(game.players[0].name).toBe('Alice');
  });

  it('removePlayer: reassigns host when host leaves', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.addPlayer(makePlayer('s2', 'Bob'));
    game.removePlayer('s1');
    expect(game.players[0].isHost).toBe(true);
  });

  it('removePlayer: no-op for unknown player', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.removePlayer('unknown');
    expect(game.players).toHaveLength(1);
  });

  it('getPlayer returns player or null', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    expect(game.getPlayer('s1')).not.toBeNull();
    expect(game.getPlayer('nope')).toBeNull();
  });

  it('getHost returns the host player', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.addPlayer(makePlayer('s2', 'Bob'));
    expect(game.getHost().id).toBe('s1');
  });

  it('start transitions to PLAYING and generates pieces', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    const result = game.start();
    expect(result).toBe(true);
    expect(game.state).toBe(GAME_STATES.PLAYING);
    expect(game.pieces.length).toBeGreaterThan(0);
  });

  it('start returns false if already playing', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.start();
    const result = game.start();
    expect(result).toBe(false);
  });

  it('getPiece returns a piece and extends if needed', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.start();
    const piece = game.getPiece(0);
    expect(piece).toBeDefined();
    expect(piece).toHaveProperty('type');
  });

  it('getPiece extends piece array when index exceeds length', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.start();
    const piece = game.getPiece(1000);
    expect(piece).toBeDefined();
  });

  it('eliminatePlayer triggers game over when one player left', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.addPlayer(makePlayer('s2', 'Bob'));
    game.start();
    const result = game.eliminatePlayer('s2');
    expect(result.gameOver).toBe(true);
    expect(result.winner).toBe('Alice');
    expect(game.state).toBe(GAME_STATES.ENDED);
  });

  it('eliminatePlayer does not end game with multiple alive players', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.addPlayer(makePlayer('s2', 'Bob'));
    game.addPlayer(makePlayer('s3', 'Carol'));
    game.start();
    const result = game.eliminatePlayer('s3');
    expect(result.gameOver).toBe(false);
    expect(game.state).toBe(GAME_STATES.PLAYING);
  });

  it('eliminatePlayer returns undefined for unknown player', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.start();
    const result = game.eliminatePlayer('nobody');
    expect(result).toBeUndefined();
  });

  it('reset restores game to waiting state', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    game.start();
    game.reset();
    expect(game.state).toBe(GAME_STATES.WAITING);
    expect(game.pieces).toHaveLength(0);
    expect(game.winner).toBeNull();
  });

  it('isOpen returns true only in WAITING state', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    expect(game.isOpen()).toBe(true);
    game.start();
    expect(game.isOpen()).toBe(false);
  });

  it('isEmpty returns true with no players', () => {
    expect(game.isEmpty()).toBe(true);
    game.addPlayer(makePlayer('s1', 'Alice'));
    expect(game.isEmpty()).toBe(false);
  });

  it('getAlivePlayers returns only alive players', () => {
    const p1 = makePlayer('s1', 'Alice');
    const p2 = makePlayer('s2', 'Bob');
    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start();
    game.eliminatePlayer('s2');
    expect(game.getAlivePlayers()).toHaveLength(1);
    expect(game.getAlivePlayers()[0].name).toBe('Alice');
  });

  it('toJSON returns serializable object', () => {
    game.addPlayer(makePlayer('s1', 'Alice'));
    const json = game.toJSON();
    expect(json.name).toBe('testroom');
    expect(json.state).toBe(GAME_STATES.WAITING);
    expect(Array.isArray(json.players)).toBe(true);
  });
});
