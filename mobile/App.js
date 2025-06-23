// File: App.js
import React, { useState } from 'react';
import HomePage from './HomePage';
import ChatFlowRouter from './ChatFlowRouter';

export default function App() {
  const [screen, setScreen] = useState('home');

  return screen === 'home' ? (
    <HomePage onStartNewRequest={() => setScreen('chat')} />
  ) : (
    <ChatFlowRouter onBackToHome={() => setScreen('home')} />
  );
}
