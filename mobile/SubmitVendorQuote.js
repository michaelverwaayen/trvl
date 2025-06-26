import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from './supabase';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';

export default function SubmitVendorQuote({ route, navigation }) {
  const { user } = useAuth();
  const vendorId = user?.id;
  const { jobId } = route.params || {};
  const [quote, setQuote] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleSubmit = async () => {
    if (!quote || !availability) return;
    setLoading(true);
    const { error } = await supabase.from('quotes').insert([
      {
        log_id: jobId,
        vendor_id: vendorId,
        quote,
        availability,
        status: 'submitted'
      }
    ]);
    setLoading(false);
    if (error) {
      console.error('Quote submit error', error);
      alert('Failed to submit quote');
    } else {
      alert('Quote submitted!');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Submit Quote</Text>
      <TextInput
        style={styles.input}
        placeholder="Quote amount"
        keyboardType="numeric"
        value={quote}
        onChangeText={setQuote}
      />
      <TextInput
        style={styles.input}
        placeholder="Availability (YYYY-MM-DD)"
        value={availability}
        onChangeText={setAvailability}
      />
      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}
      <View style={styles.row}>
        <Button title="Cancel" onPress={() => navigation.goBack()} />
        <Button title="Submit" onPress={handleSubmit} />
      </View>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: theme.text },
    input: { borderWidth: 1, borderColor: theme.border, padding: 10, borderRadius: 6, marginBottom: 10, color: theme.text },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  });
