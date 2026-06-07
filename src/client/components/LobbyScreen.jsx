import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { joinGame, initSocketListeners } from '../actions/gameActions';

const LobbyScreen = () => {
  const { room, playerName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { player, error } = useSelector((s) => s.game);

  const [inputRoom, setInputRoom] = useState('');
  const [inputName, setInputName] = useState('');

  // Init socket listeners once
  useEffect(() => {
    dispatch(initSocketListeners());
  }, []);

  // Auto-join if URL has room + name
  useEffect(() => {
    if (room && playerName) {
      dispatch(joinGame(room, playerName));
    }
  }, [room, playerName]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inputRoom.trim() || !inputName.trim()) return;
    navigate(`/${inputRoom.trim()}/${inputName.trim()}`);
  };

  if (player) return null; // GameScreen takes over

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#06061a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
        color: '#fff',
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: 50, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 64,
            margin: 0,
            letterSpacing: 10,
            color: '#ff1744',
            textShadow: '0 0 40px #ff1744, 0 0 80px rgba(255,23,68,0.3)',
            fontWeight: 'bold',
          }}
        >
          RED TETRIS
        </h1>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: 4, marginTop: 8 }}>
          MULTIPLAYER · FULL STACK JS
        </div>
      </div>

      {/* Join form */}
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '40px 48px',
          width: 340,
        }}
      >
        <div style={{ marginBottom: 24, fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>
          Join a Game
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(255,23,68,0.15)',
              border: '1px solid rgba(255,23,68,0.4)',
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#ff6b6b',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Room Name
            </label>
            <input
              value={inputRoom}
              onChange={(e) => setInputRoom(e.target.value)}
              placeholder="e.g. galaxy42"
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Your Name
            </label>
            <input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="e.g. MedK"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin(e)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            onClick={handleJoin}
            style={{
              marginTop: 8,
              padding: '14px',
              backgroundColor: '#ff1744',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontWeight: 'bold',
              fontFamily: 'inherit',
              transition: 'background-color 0.2s',
            }}
          >
            Join / Create Room
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.8 }}>
        Or navigate directly to<br />
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>/:room/:playerName</span>
      </div>
    </div>
  );
};

export default LobbyScreen;
