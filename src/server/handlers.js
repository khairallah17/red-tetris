'use strict';

const { Player } = require('./models/Player');
const { Game } = require('./models/Game');

// In-memory store
const games = new Map();

function getOrCreateGame(name) {
  if (!games.has(name)) {
    games.set(name, new Game(name));
  }
  return games.get(name);
}

function registerHandlers(io, socket) {
  // JOIN ROOM
  socket.on('join_game', ({ room, playerName }) => {
    const game = getOrCreateGame(room);

    // Don't allow joining a running game
    if (!game.isOpen()) {
      socket.emit('error', { message: 'Game already started. Wait for next round.' });
      return;
    }

    // Check duplicate names
    if (game.players.find((p) => p.name === playerName)) {
      socket.emit('error', { message: 'Name already taken in this room.' });
      return;
    }

    const player = new Player(socket.id, playerName, room);
    game.addPlayer(player);
    socket.join(room);

    socket.emit('joined_game', {
      player: player.toJSON(),
      game: game.toJSON(),
    });

    io.to(room).emit('game_updated', game.toJSON());
  });

  // START GAME (host only)
  socket.on('start_game', ({ room }) => {
    const game = games.get(room);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only the host can start the game.' });
      return;
    }

    const started = game.start();
    if (!started) {
      socket.emit('error', { message: 'Game cannot be started.' });
      return;
    }

    io.to(room).emit('game_started', game.toJSON());
    // Send first piece to each player
    game.players.forEach((p) => {
      const piece = game.getPiece(p.pieceIndex);
      io.to(p.id).emit('new_piece', { piece, index: p.pieceIndex });
    });
  });

  // REQUEST NEXT PIECE
  socket.on('request_piece', ({ room }) => {
    const game = games.get(room);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    player.nextPiece();
    const piece = game.getPiece(player.pieceIndex);
    socket.emit('new_piece', { piece, index: player.pieceIndex });
  });

  // SPECTRUM UPDATE (player sends their column heights)
  socket.on('spectrum_update', ({ room, spectrum }) => {
    const game = games.get(room);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    // Broadcast to everyone else in the room
    socket.to(room).emit('opponent_spectrum', {
      playerId: socket.id,
      playerName: player.name,
      spectrum,
    });
  });

  // PLAYER LOST
  socket.on('player_lost', ({ room }) => {
    const game = games.get(room);
    if (!game) return;

    const result = game.eliminatePlayer(socket.id);
    if (!result) return;

    if (result.gameOver) {
      io.to(room).emit('game_over', { winner: result.winner });
      game.reset();
      io.to(room).emit('game_updated', game.toJSON());
    } else {
      io.to(room).emit('player_eliminated', {
        playerId: socket.id,
        playerName: game.getPlayer(socket.id)?.name,
        game: game.toJSON(),
      });
    }
  });

  // ADD PENALTY LINES (when a player clears lines)
  socket.on('lines_cleared', ({ room, count }) => {
    if (count < 2) return; // 1 line = no penalty
    const penaltyLines = count - 1;

    const game = games.get(room);
    if (!game) return;

    // Send penalty to all OTHER alive players
    socket.to(room).emit('add_penalty', { lines: penaltyLines });
  });

  // RESTART GAME (host only)
  socket.on('restart_game', ({ room }) => {
    const game = games.get(room);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player || !player.isHost) return;

    game.reset();
    io.to(room).emit('game_updated', game.toJSON());
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    games.forEach((game, roomName) => {
      const player = game.getPlayer(socket.id);
      if (!player) return;

      game.removePlayer(socket.id);

      if (game.isEmpty()) {
        games.delete(roomName);
        return;
      }

      io.to(roomName).emit('game_updated', game.toJSON());

      // If game was running, check if game should end
      if (game.state === 'playing') {
        const alive = game.getAlivePlayers();
        if (alive.length <= 1) {
          const winner = alive.length === 1 ? alive[0].name : null;
          game.state = 'ended';
          game.winner = winner;
          io.to(roomName).emit('game_over', { winner });
          game.reset();
          io.to(roomName).emit('game_updated', game.toJSON());
        }
      }
    });
  });
}

module.exports = { registerHandlers, games };
