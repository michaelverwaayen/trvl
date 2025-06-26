import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { SERVER_URL } from './config';
import { useTheme } from './ThemeContext';

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <WebView source={{ uri: `${SERVER_URL}/rfq-dashboard` }} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
