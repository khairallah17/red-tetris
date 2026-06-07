import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Board from './Board';
import NextPiece from './NextPiece';
import Spectrum from './Spectrum';
import {
  requestNextPiece, sendSpectrum, sendLinesCleared,
  sendPlayerLost, restartGame, startGame,
} from '../actions/gameActions';
import {
  MOVE_LEFT, MOVE_RIGHT, MOVE_DOWN, ROTATE_PIECE, HARD_DROP,
} from '../actions/types';

const TICK_INTERVAL = 600; // ms per gravity tick

const GameScreen = () => {
  const dispatch = useDispatch();

  // All selectors at top level — no hooks in JSX
  const { player, game, isOver, winner, opponents } = useSelector((s) => s.game);
  const { currentPiece, nextPiece, isLost, spectrumDirty, linesCleared, _lastLinesCleared, _spectrum } =
    useSelector((s) => s.board);

  const room = game?.name;
  const tickRef = useRef(null);

  // ─── Request next piece when currentPiece is null ───────────────────────
  useEffect(() => {
    if (!isLost && !isOver && game?.state === 'playing' && !currentPiece) {
      dispatch(requestNextPiece(room));
    }
  }, [currentPiece, isLost, isOver, game?.state]);

  // ─── Notify server when we lose ─────────────────────────────────────────
  useEffect(() => {
    if (isLost && game?.state === 'playing') {
      dispatch(sendPlayerLost(room));
    }
  }, [isLost]);

  // ─── Spectrum sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (spectrumDirty && _spectrum) {
      dispatch(sendSpectrum(room, _spectrum));
    }
  }, [spectrumDirty, _spectrum]);

  // ─── Lines cleared notification ─────────────────────────────────────────
  useEffect(() => {
    if (_lastLinesCleared && _lastLinesCleared > 0) {
      dispatch(sendLinesCleared(room, _lastLinesCleared));
    }
  }, [_lastLinesCleared]);

  // ─── Gravity tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (game?.state !== 'playing' || isLost || isOver) {
      clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      dispatch({ type: MOVE_DOWN });
    }, TICK_INTERVAL);
    return () => clearInterval(tickRef.current);
  }, [game?.state, isLost, isOver]);

  // ─── Keyboard controls ───────────────────────────────────────────────────
  const handleKey = useCallback(
    (e) => {
      if (game?.state !== 'playing' || isLost) return;
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          dispatch({ type: MOVE_LEFT });
          break;
        case 'ArrowRight':
          e.preventDefault();
          dispatch({ type: MOVE_RIGHT });
          break;
        case 'ArrowUp':
          e.preventDefault();
          dispatch({ type: ROTATE_PIECE });
          break;
        case 'ArrowDown':
          e.preventDefault();
          dispatch({ type: MOVE_DOWN });
          break;
        case 'Space':
          e.preventDefault();
          dispatch({ type: HARD_DROP });
          break;
        default:
          break;
      }
    },
    [game?.state, isLost, dispatch]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const opponentEntries = Object.entries(opponents);
  const isGameEnded = isOver || isLost;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#06061a',
        color: '#fff',
        fontFamily: "'Courier New', monospace",
        padding: '20px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 6, color: '#ff1744', textShadow: '0 0 20px #ff1744' }}>
          RED TETRIS
        </h1>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>
          ROOM: {room?.toUpperCase()} · {player?.name?.toUpperCase()}
          {player?.isHost ? ' · HOST' : ''}
        </div>
      </div>

      {/* Game over / lost overlay */}
      {isGameEnded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          {isOver && (
            <>
              <div style={{ fontSize: 48, fontWeight: 'bold', color: '#ff1744', marginBottom: 10, textShadow: '0 0 30px #ff1744' }}>
                GAME OVER
              </div>
              {winner && (
                <div style={{ fontSize: 24, color: '#ffee00', marginBottom: 30 }}>
                  🏆 {winner} WINS
                </div>
              )}
            </>
          )}
          {isLost && !isOver && (
            <div style={{ fontSize: 36, color: '#ff6d00', marginBottom: 30 }}>
              YOU LOST — Waiting for others...
            </div>
          )}
          {player?.isHost && isOver && (
            <button
              onClick={() => dispatch(restartGame(room))}
              style={{
                padding: '12px 32px',
                fontSize: 16,
                backgroundColor: '#ff1744',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontFamily: 'inherit',
              }}
            >
              Restart
            </button>
          )}
          {!player?.isHost && isOver && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Waiting for host to restart...
            </div>
          )}
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 10, minWidth: 90 }}>
          <NextPiece piece={nextPiece} />
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              Lines
            </div>
            <div style={{ fontSize: 24, color: '#00e676', fontWeight: 'bold' }}>
              {linesCleared}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.8 }}>
            ← → Move<br />
            ↑ Rotate<br />
            ↓ Soft drop<br />
            SPC Hard drop
          </div>
        </div>

        {/* Board */}
        <Board />

        {/* Right sidebar: opponents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 10, minWidth: 80 }}>
          {opponentEntries.length > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Opponents
            </div>
          )}
          {opponentEntries.map(([id, { playerName, spectrum }]) => (
            <Spectrum key={id} playerName={playerName} spectrum={spectrum} />
          ))}
        </div>
      </div>

      {/* Waiting lobby */}
      {game?.state === 'waiting' && (
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          {player?.isHost ? (
            <button
              onClick={() => dispatch(startGame(room))}
              style={{
                padding: '14px 40px',
                fontSize: 18,
                backgroundColor: '#00e676',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontFamily: 'inherit',
              }}
            >
              Start Game
            </button>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>
              Waiting for host to start...
            </div>
          )}
          <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Players in room: {game?.players?.map((p) => p.name).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
