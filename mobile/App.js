// File: App.js
import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import HomePage from './HomePage';
import ChatFlowRouter from './ChatFlowRouter';
import QuoteComparison from './QuoteComparison';
import { SUPABASE_URL } from './config';
console.log('🧪 SUPABASE_URL:', SUPABASE_URL);
export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedJobId, setSelectedJobId] = useState(null);

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
          />
        );
      } else if (screen === 'chat') {
        return <ChatFlowRouter onBackToHome={() => setScreen('home')} />;
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
    <SafeAreaView style={styles.container}>
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 40
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
