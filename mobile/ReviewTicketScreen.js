// === ReviewTicketScreen.js ===
// Lets user review/edit the ticket before submitting

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function ReviewTicketScreen({ chatHistory, onSubmit, onBack }) {
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = () => {
    const ticket = {
      summary: summary || 'No summary provided',
      category: category || 'General',
      chat_history: chatHistory,
    };
    onSubmit(ticket);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📝 Review Your Request</Text>

      <Text style={styles.label}>Summary</Text>
      <TextInput
        style={styles.input}
        placeholder="Brief summary of the issue"
        value={summary}
        onChangeText={setSummary}
        multiline
      />

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Plumbing, Electrical"
        value={category}
        onChangeText={setCategory}
      />

      <Text style={styles.label}>Chat History</Text>
      <View style={styles.chatBox}>
        <Text style={styles.chatText}>{chatHistory}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Button title="⬅️ Back" onPress={onBack} />
        <Button title="✅ Submit Request" onPress={handleSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  chatBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
    marginVertical: 10,
  },
  chatText: { fontFamily: 'monospace' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
