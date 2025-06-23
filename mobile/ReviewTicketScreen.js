// === React Native Component ===
// File: ReviewTicketScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';

export default function ReviewTicketScreen({ chatHistory, onSubmit, onBack }) {
  const [ticket, setTicket] = useState('');
  const [loading, setLoading] = useState(true);
  const [editedTicket, setEditedTicket] = useState('');

  useEffect(() => {
    const generateTicket = async () => {
      try {
        const res = await axios.post('http://<YOUR_BACKEND_IP>:3000/review', { chat_history: chatHistory });
        setTicket(res.data.ticket);
        setEditedTicket(res.data.ticket);
      } catch (err) {
        setTicket('Failed to generate ticket summary.');
      } finally {
        setLoading(false);
      }
    };
    generateTicket();
  }, [chatHistory]);

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Review Request Ticket</Text>
      <Text style={styles.label}>Edit or confirm this summary before sending to vendors:</Text>
      <TextInput
        style={styles.input}
        multiline
        value={editedTicket}
        onChangeText={setEditedTicket}
      />
      <View style={styles.buttonRow}>
        <Button title="Back" onPress={onBack} />
        <Button title="Submit RFQ" onPress={() => onSubmit(editedTicket)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  label: { fontSize: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 150, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
