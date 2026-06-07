import { getSocket } from '../utils/socket';
import {
  JOIN_GAME, GAME_UPDATED, GAME_STARTED, GAME_OVER,
  SET_ERROR, CLEAR_ERROR, SET_PLAYER, NEW_PIECE,
  ADD_PENALTY, OPPONENT_SPECTRUM, RESET_BOARD, PLAYER_LOST,
} from './types';

// ─── Socket listener registration ───────────────────────────────────────────

export const initSocketListeners = () => (dispatch) => {
  const socket = getSocket();

  socket.on('joined_game', ({ player, game }) => {
    dispatch({ type: SET_PLAYER, payload: player });
    dispatch({ type: GAME_UPDATED, payload: game });
  });

  socket.on('game_updated', (game) => {
    dispatch({ type: GAME_UPDATED, payload: game });
  });

  socket.on('game_started', (game) => {
    dispatch({ type: GAME_STARTED, payload: game });
    dispatch({ type: RESET_BOARD });
  });

  socket.on('new_piece', ({ piece }) => {
    dispatch({ type: NEW_PIECE, payload: piece });
  });

  socket.on('add_penalty', ({ lines }) => {
    dispatch({ type: ADD_PENALTY, payload: lines });
  });

  socket.on('opponent_spectrum', ({ playerId, playerName, spectrum }) => {
    dispatch({ type: OPPONENT_SPECTRUM, payload: { playerId, playerName, spectrum } });
  });

  socket.on('game_over', ({ winner }) => {
    dispatch({ type: GAME_OVER, payload: { winner } });
  });

  socket.on('player_eliminated', ({ playerId }) => {
    // Remove that player's spectrum
    dispatch({ type: OPPONENT_SPECTRUM, payload: { playerId, playerName: '', spectrum: null } });
  });

  socket.on('error', ({ message }) => {
    dispatch({ type: SET_ERROR, payload: message });
  });
};

// ─── Emitters ────────────────────────────────────────────────────────────────

export const joinGame = (room, playerName) => (dispatch) => {
  const socket = getSocket();
  dispatch({ type: CLEAR_ERROR });
  socket.emit('join_game', { room, playerName });
};

export const startGame = (room) => () => {
  getSocket().emit('start_game', { room });
};

export const restartGame = (room) => () => {
  getSocket().emit('restart_game', { room });
};

export const requestNextPiece = (room) => () => {
  getSocket().emit('request_piece', { room });
};

export const sendSpectrum = (room, spectrum) => () => {
  getSocket().emit('spectrum_update', { room, spectrum });
};

export const sendLinesCleared = (room, count) => () => {
  getSocket().emit('lines_cleared', { room, count });
};

export const sendPlayerLost = (room) => (dispatch) => {
  getSocket().emit('player_lost', { room });
  dispatch({ type: PLAYER_LOST });
};

export const clearError = () => ({ type: CLEAR_ERROR });
