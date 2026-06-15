"use strict";

const { Player } = require("./models/Player");
const { Game } = require("./models/Game");
const { ScoreStore } = require("./models/ScoreStore");

// In-memory store
const games = new Map();

// Persistent leaderboard (bonus)
const scoreStore = new ScoreStore(process.env.SCORES_FILE);

function getOrCreateGame(name) {
  if (!games.has(name)) {
    games.set(name, new Game(name));
  }
  return games.get(name);
}

function registerHandlers(io, socket) {
  // Send current leaderboard on connect (bonus)
  socket.emit("high_scores", scoreStore.top());

  // GET HIGH SCORES (leaderboard)
  socket.on("get_high_scores", () => {
    socket.emit("high_scores", scoreStore.top());
  });

  // SUBMIT SCORE (bonus persistence) — recorded once per finished game
  socket.on("submit_score", ({ room, score }) => {
    const game = games.get(room);
    const player = game ? game.getPlayer(socket.id) : null;
    const name = player ? player.name : null;
    if (!name) return;
    const recorded = scoreStore.record({ name, score, room });
    if (recorded) {
      io.emit("high_scores", scoreStore.top());
    }
  });

  // JOIN ROOM
  socket.on("join_game", ({ room, playerName }) => {
    const game = getOrCreateGame(room);

    // Don't allow joining a running game
    if (!game.isOpen()) {
      socket.emit("error", {
        message: "Game already started. Wait for next round.",
      });
      return;
    }

    // Check duplicate names
    if (game.players.find((p) => p.name === playerName)) {
      socket.emit("error", { message: "Name already taken in this room." });
      return;
    }

    const player = new Player(socket.id, playerName, room);
    game.addPlayer(player);
    socket.join(room);

    socket.emit("joined_game", {
      player: player.toJSON(),
      game: game.toJSON(),
    });

    io.to(room).emit("game_updated", game.toJSON());
  });

  // START GAME (host only)
  socket.on("start_game", ({ room, modes }) => {
    const game = games.get(room);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player || !player.isHost) {
      socket.emit("error", { message: "Only the host can start the game." });
      return;
    }

    const started = game.start(modes);
    if (!started) {
      socket.emit("error", { message: "Game cannot be started." });
      return;
    }

    io.to(room).emit("game_started", game.toJSON());
    // Send first piece to each player
    game.players.forEach((p) => {
      const piece = game.getPiece(p.pieceIndex);
      io.to(p.id).emit("new_piece", { piece, index: p.pieceIndex });
    });
  });

  // REQUEST NEXT PIECE
  socket.on("request_piece", ({ room }) => {
    const game = games.get(room);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    player.nextPiece();
    const piece = game.getPiece(player.pieceIndex);
    socket.emit("new_piece", { piece, index: player.pieceIndex });
  });

  // SPECTRUM UPDATE (player sends their column heights)
  socket.on("spectrum_update", ({ room, spectrum }) => {
    const game = games.get(room);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    // Broadcast to everyone else in the room
    socket.to(room).emit("opponent_spectrum", {
      playerId: socket.id,
      playerName: player.name,
      spectrum,
    });
  });

  // PLAYER LOST
  socket.on("player_lost", ({ room }) => {
    const game = games.get(room);
    if (!game) return;

    const result = game.eliminatePlayer(socket.id);
    if (!result) return;

    if (result.gameOver) {
      // Leave game in 'ended' state; host must explicitly restart via restart_game
      io.to(room).emit("game_over", { winner: result.winner });
    } else {
      io.to(room).emit("player_eliminated", {
        playerId: socket.id,
        playerName: game.getPlayer(socket.id)?.name,
        game: game.toJSON(),
      });
    }
  });

  // ADD PENALTY LINES (when a player clears lines)
  socket.on("lines_cleared", ({ room, count }) => {
    if (count < 2) return; // 1 line = no penalty
    const penaltyLines = count - 1;

    const game = games.get(room);
    if (!game) return;

    // Send penalty to all OTHER alive players
    socket.to(room).emit("add_penalty", { lines: penaltyLines });
  });

  // RESTART GAME (host only)
  // Accepts playerName to handle reconnection: if the socket disconnected after
  // game over, the game may have been cleaned up; we recreate it and re-add the player.
  socket.on("restart_game", ({ room, playerName }) => {
    let game = games.get(room);

    if (!game) {
      if (!playerName) {
        socket.emit("error", { message: "Room not found. Please rejoin." });
        return;
      }
      game = getOrCreateGame(room);
    }

    if (game.state !== "ended") return;

    let player = game.getPlayer(socket.id);

    if (!player) {
      // New socket.id after reconnect — re-add the player under their name
      if (!playerName) {
        socket.emit("error", { message: "Session expired. Please rejoin." });
        return;
      }
      // Remove any stale entry with the same name from the old socket
      const stale = game.players.find((p) => p.name === playerName);
      if (stale) game.removePlayer(stale.id);

      player = new Player(socket.id, playerName, room);
      game.addPlayer(player);
      socket.join(room);
    }

    if (!player.isHost) {
      socket.emit("error", { message: "Only the host can restart the game." });
      return;
    }

    game.reset();
    io.to(room).emit("game_restarted", game.toJSON());
  });

  // REJOIN after socket reconnect — restores room membership without changing host
  socket.on("rejoin_game", ({ room, playerName, wasHost }) => {
    let game = games.get(room);
    if (!game) {
      game = getOrCreateGame(room);
    }

    if (game.getPlayer(socket.id)) return; // already tracked under this socket

    // Remove stale entry with same name left by the disconnect handler
    const stale = game.players.find((p) => p.name === playerName);
    if (stale) game.removePlayer(stale.id);

    const player = new Player(socket.id, playerName, room);

    // Original host always reclaims their role; demote whoever was auto-promoted
    if (wasHost) {
      const currentHost = game.getHost();
      if (currentHost) currentHost.setHost(false);
      player.setHost(true);
    }

    // Push directly to avoid addPlayer auto-promoting non-hosts to host
    game.players.push(player);
    socket.join(room);

    socket.emit("joined_game", { player: player.toJSON(), game: game.toJSON() });
    io.to(room).emit("game_updated", game.toJSON());
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    games.forEach((game, roomName) => {
      const player = game.getPlayer(socket.id);
      if (!player) return;

      game.removePlayer(socket.id);

      if (game.isEmpty()) {
        games.delete(roomName);
        return;
      }

      io.to(roomName).emit("game_updated", game.toJSON());

      // If game was running, end it — but leave in 'ended' state for explicit restart
      if (game.state === "playing") {
        const alive = game.getAlivePlayers();
        if (alive.length <= 1) {
          const winner = alive.length === 1 ? alive[0].name : null;
          game.state = "ended";
          game.winner = winner;
          io.to(roomName).emit("game_over", { winner });
        }
      }
    });
  });
}

module.exports = { registerHandlers, games, scoreStore };
