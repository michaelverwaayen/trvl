import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { SERVER_URL } from './config';
import { useTheme } from './ThemeContext';

export default function EstimateScreen({ navigation }) {
  const [summary, setSummary] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const fetchEstimate = async () => {
    if (!summary) return;
    setLoading(true);
    try {
      const encoded = encodeURIComponent(summary);
      const res = await fetch(`${SERVER_URL}/estimate/${encoded}`);
      const data = await res.json();
      setEstimate(data);
    } catch (err) {
      console.error('Estimate fetch error', err);
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Get Rough Estimate</Text>
      <TextInput
        style={styles.input}
        placeholder="Brief summary of your issue"
        value={summary}
        onChangeText={setSummary}
      />
      <Button title="Fetch Estimate" onPress={fetchEstimate} />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {estimate && (
        <View style={styles.result}>
          <Text>Average: {estimate.avg ? `$${estimate.avg}` : 'N/A'}</Text>
          <Text>Min: {estimate.min ? `$${estimate.min}` : 'N/A'}</Text>
          <Text>Max: {estimate.max ? `$${estimate.max}` : 'N/A'}</Text>
        </View>
      )}
      <Button title="Done" onPress={() => navigation.goBack()} />
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: theme.text },
    input: { borderWidth: 1, borderColor: theme.border, padding: 10, borderRadius: 6, marginBottom: 10, color: theme.text },
    result: { marginTop: 20 },
  });
