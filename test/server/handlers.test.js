'use strict';

// Mock socket.io so we can test handlers without a real server
const { registerHandlers, games } = require('../../src/server/handlers');

// Minimal socket/io mock factory
const makeIo = () => {
  const roomEmits = {};
  const io = {
    to: (room) => ({
      emit: (event, data) => {
        if (!roomEmits[room]) roomEmits[room] = [];
        roomEmits[room].push({ event, data });
      },
    }),
    _roomEmits: roomEmits,
  };
  return io;
};

const makeSocket = (id = 'socket1') => {
  const listeners = {};
  const emitted = [];
  const socket = {
    id,
    join: jest.fn(),
    emit: (event, data) => emitted.push({ event, data }),
    to: (room) => ({ emit: () => {} }),
    on: (event, fn) => { listeners[event] = fn; },
    _trigger: (event, data) => listeners[event] && listeners[event](data),
    _emitted: emitted,
    _listeners: listeners,
  };
  return socket;
};

// Clear game map before each test
beforeEach(() => {
  games.clear();
});

describe('handlers: join_game', () => {
  it('allows a player to join a new room', () => {
    const io = makeIo();
    const socket = makeSocket('s1');
    registerHandlers(io, socket);

    socket._trigger('join_game', { room: 'room1', playerName: 'Alice' });

    const joined = socket._emitted.find((e) => e.event === 'joined_game');
    expect(joined).toBeDefined();
    expect(joined.data.player.name).toBe('Alice');
    expect(joined.data.game.name).toBe('room1');
  });

  it('first player becomes host', () => {
    const io = makeIo();
    const socket = makeSocket('s1');
    registerHandlers(io, socket);

    socket._trigger('join_game', { room: 'room1', playerName: 'Alice' });

    const joined = socket._emitted.find((e) => e.event === 'joined_game');
    expect(joined.data.player.isHost).toBe(true);
  });

  it('second player is not host', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });

    const joined = s2._emitted.find((e) => e.event === 'joined_game');
    expect(joined.data.player.isHost).toBe(false);
  });

  it('rejects duplicate player name', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Alice' });

    const err = s2._emitted.find((e) => e.event === 'error');
    expect(err).toBeDefined();
    expect(err.data.message).toMatch(/taken/i);
  });

  it('rejects joining a game in progress', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });

    const err = s2._emitted.find((e) => e.event === 'error');
    expect(err).toBeDefined();
    expect(err.data.message).toMatch(/started/i);
  });
});

describe('handlers: start_game', () => {
  it('host can start the game', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });

    const roomEvents = io._roomEmits['room1'] || [];
    const started = roomEvents.find((e) => e.event === 'game_started');
    expect(started).toBeDefined();
  });

  it('non-host cannot start the game', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });
    s2._trigger('start_game', { room: 'room1' });

    const err = s2._emitted.find((e) => e.event === 'error');
    expect(err).toBeDefined();
  });

  it('start_game on unknown room is a no-op', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);
    // Should not throw
    expect(() => s1._trigger('start_game', { room: 'nonexistent' })).not.toThrow();
  });

  it('cannot start an already-started game', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });
    s1._trigger('start_game', { room: 'room1' }); // second start

    const errors = s1._emitted.filter((e) => e.event === 'error');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('handlers: request_piece', () => {
  it('sends a piece to the requesting player', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });

    // Clear emitted, then request
    s1._emitted.length = 0;
    s1._trigger('request_piece', { room: 'room1' });

    const piece = s1._emitted.find((e) => e.event === 'new_piece');
    expect(piece).toBeDefined();
    expect(piece.data.piece).toHaveProperty('type');
  });

  it('is a no-op for unknown room', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);
    expect(() => s1._trigger('request_piece', { room: 'ghost' })).not.toThrow();
  });
});

describe('handlers: lines_cleared', () => {
  it('sends penalty to other players when 2+ lines cleared', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    // Track what s1 broadcasts to room
    const roomPenalties = [];
    s1.to = () => ({ emit: (event, data) => roomPenalties.push({ event, data }) });

    registerHandlers(io, s1);
    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });
    s1._trigger('lines_cleared', { room: 'room1', count: 3 });

    const penalty = roomPenalties.find((e) => e.event === 'add_penalty');
    expect(penalty).toBeDefined();
    expect(penalty.data.lines).toBe(2); // n - 1
  });

  it('does not send penalty for 1 line cleared', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const roomPenalties = [];
    s1.to = () => ({ emit: (event, data) => roomPenalties.push({ event, data }) });

    registerHandlers(io, s1);
    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });
    s1._trigger('lines_cleared', { room: 'room1', count: 1 });

    const penalty = roomPenalties.find((e) => e.event === 'add_penalty');
    expect(penalty).toBeUndefined();
  });
});

describe('handlers: player_lost', () => {
  it('triggers game_over when last player loses', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });
    s1._trigger('player_lost', { room: 'room1' });

    const roomEvents = io._roomEmits['room1'] || [];
    const gameOver = roomEvents.find((e) => e.event === 'game_over');
    expect(gameOver).toBeDefined();
  });

  it('game continues when multiple players remain', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });
    s1._trigger('start_game', { room: 'room1' });

    const preEvents = (io._roomEmits['room1'] || []).length;
    s2._trigger('player_lost', { room: 'room1' });

    const roomEvents = io._roomEmits['room1'] || [];
    const gameOver = roomEvents.find((e) => e.event === 'game_over');
    expect(gameOver).toBeDefined(); // Alice is the winner
    expect(gameOver.data.winner).toBe('Alice');
  });

  it('is a no-op for unknown room', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);
    expect(() => s1._trigger('player_lost', { room: 'ghost' })).not.toThrow();
  });
});

describe('handlers: restart_game', () => {
  it('host can restart the game', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('start_game', { room: 'room1' });
    s1._trigger('player_lost', { room: 'room1' }); // ends game
    s1._trigger('restart_game', { room: 'room1' });

    const roomEvents = io._roomEmits['room1'] || [];
    const updated = roomEvents.filter((e) => e.event === 'game_updated');
    expect(updated.length).toBeGreaterThan(0);
    const last = updated[updated.length - 1];
    expect(last.data.state).toBe('waiting');
  });

  it('non-host cannot restart', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });
    s1._trigger('start_game', { room: 'room1' });

    const preCount = (io._roomEmits['room1'] || []).length;
    s2._trigger('restart_game', { room: 'room1' });
    // No new game_updated should have been emitted from restart
    const post = (io._roomEmits['room1'] || []).slice(preCount);
    const updated = post.find((e) => e.event === 'game_updated' && e.data.state === 'waiting');
    expect(updated).toBeUndefined();
  });
});

describe('handlers: disconnect', () => {
  it('removes player from game on disconnect', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });
    s2._trigger('disconnect');

    expect(games.get('room1').players).toHaveLength(1);
    expect(games.get('room1').players[0].name).toBe('Alice');
  });

  it('cleans up empty room after last player disconnects', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('disconnect');

    expect(games.has('room1')).toBe(false);
  });

  it('reassigns host when host disconnects', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });
    s1._trigger('disconnect');

    const game = games.get('room1');
    expect(game.players[0].isHost).toBe(true);
    expect(game.players[0].name).toBe('Bob');
  });

  it('ends running game if only one player remains after disconnect', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const s2 = makeSocket('s2');
    registerHandlers(io, s1);
    registerHandlers(io, s2);

    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s2._trigger('join_game', { room: 'room1', playerName: 'Bob' });
    s1._trigger('start_game', { room: 'room1' });
    s2._trigger('disconnect');

    const roomEvents = io._roomEmits['room1'] || [];
    const gameOver = roomEvents.find((e) => e.event === 'game_over');
    expect(gameOver).toBeDefined();
    expect(gameOver.data.winner).toBe('Alice');
  });
});

describe('handlers: spectrum_update', () => {
  it('broadcasts spectrum to other room members', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    const roomEmits = [];
    s1.to = () => ({ emit: (event, data) => roomEmits.push({ event, data }) });

    registerHandlers(io, s1);
    s1._trigger('join_game', { room: 'room1', playerName: 'Alice' });
    s1._trigger('spectrum_update', { room: 'room1', spectrum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });

    const specEv = roomEmits.find((e) => e.event === 'opponent_spectrum');
    expect(specEv).toBeDefined();
    expect(specEv.data.playerName).toBe('Alice');
    expect(specEv.data.spectrum).toHaveLength(10);
  });

  it('is a no-op for unknown room', () => {
    const io = makeIo();
    const s1 = makeSocket('s1');
    registerHandlers(io, s1);
    expect(() => s1._trigger('spectrum_update', { room: 'ghost', spectrum: [] })).not.toThrow();
  });
});
