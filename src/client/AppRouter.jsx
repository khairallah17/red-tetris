import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';

const AppRouter = () => {
  const player = useSelector((s) => s.game.player);

  if (player) {
    return <GameScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<LobbyScreen />} />
      <Route path="/:room/:playerName" element={<LobbyScreen />} />
      <Route path="*" element={<LobbyScreen />} />
    </Routes>
  );
};

export default AppRouter;
