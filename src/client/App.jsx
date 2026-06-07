import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import AppRouter from './AppRouter';

const App = () => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[window.location.pathname]} initialIndex={0}>
      <AppRouter />
    </MemoryRouter>
  </Provider>
);

export default App;
