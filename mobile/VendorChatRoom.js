// === VendorChatRoom.js ===

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Button, StyleSheet } from 'react-native';
import { supabase } from './supabase';

export default function VendorChatRoom({ route }) {
  const { chatRoomId, vendorEmail } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [quote, setQuote] = useState('');
  const [availability, setAvailability] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at');
      setMessages(data || []);
    };

    const channel = supabase
      .channel(`chat-${chatRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    fetchMessages();
    return () => supabase.removeChannel(channel);
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await supabase.from('chat_messages').insert({
      chat_room_id: chatRoomId,
      sender: vendorEmail,
      message: input
    });
    setInput('');
  };

  const submitQuote = async () => {
    if (!quote || !availability) return;
    const { error } = await supabase.from('quotes').insert({
      log_id: chatRoomId,
      vendor_email: vendorEmail,
      quote,
      availability,
      status: 'submitted'
    });
    if (!error) {
      alert('Quote submitted!');
      setQuote('');
      setAvailability('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat with Customer</Text>
      <ScrollView style={styles.messages}>
        {messages.map(msg => (
          <View key={msg.id} style={styles.message}>
            <Text>
              <Text style={styles.bold}>{msg.sender === vendorEmail ? 'You' : 'Customer'}:</Text> {msg.message}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your reply..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>

      <View style={styles.quoteSection}>
        <Text style={styles.subHeader}>Submit Quote</Text>
        <TextInput
          style={styles.input}
          value={quote}
          onChangeText={setQuote}
          placeholder="Quote $"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={availability}
          onChangeText={setAvailability}
          placeholder="Availability (YYYY-MM-DD)"
        />
        <Button title="Submit" onPress={submitQuote} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  messages: { maxHeight: 300, borderWidth: 1, borderColor: '#ccc', padding: 10 },
  message: { marginVertical: 5 },
  bold: { fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, marginRight: 10 },
  quoteSection: { marginTop: 20 },
  subHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 }
});
