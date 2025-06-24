// File: App.js
import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import HomePage from './HomePage';
import ChatFlowRouter from './ChatFlowRouter';
import QuoteComparison from './QuoteComparison';
import SettingsScreen from './SettingsScreen';
import { SUPABASE_URL } from './config';
import { ThemeProvider, useTheme } from './ThemeContext';
console.log('🧪 SUPABASE_URL:', SUPABASE_URL);

function Main() {
  const [screen, setScreen] = useState('home');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const { theme } = useTheme();

  // Simple fallback if a screen fails to render
  const renderScreen = () => {
    try {
      if (screen === 'home') {
        return (
          <HomePage
            onStartNewRequest={() => setScreen('chat')}
            onSelectJob={(id) => {
              setSelectedJobId(id);
              setScreen('quotes');
            }}
            onOpenSettings={() => setScreen('settings')}
          />
        );
      } else if (screen === 'chat') {
        return <ChatFlowRouter onBackToHome={() => setScreen('home')} />;
      } else if (screen === 'settings') {
        return <SettingsScreen onBack={() => setScreen('home')} />;
      } else {
        return (
          <QuoteComparison
            logId={selectedJobId}
            onBack={() => setScreen('home')}
          />
        );
      }
    } catch (err) {
      console.error('Error rendering screen:', err);
      return (
        <View style={styles.centered}>
          <Text>Something went wrong. Please reload.</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default function App() {
  return (
    <ThemeProvider>
      <Main />
    </ThemeProvider>
  );
}

