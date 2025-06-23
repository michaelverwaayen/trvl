// File: ChatScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, Image, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (text = null, image = null) => {
    if (!text && !image) return;
    const userMessage = { role: 'user', type: image ? 'image' : 'text', content: text || image };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await axios.post('http://<YOUR_BACKEND_IP>:3000/chat', {
        text: text || '',
        image: image || null,
      });
      const replies = res.data.replies;
      setMessages(prev => [
        ...prev,
        userMessage,
        ...replies.map(r => ({ role: 'assistant', type: r.type, content: r.content }))
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Something went wrong. Please try again.' }]);
    }
    setSending(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({ base64: true });
    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      sendMessage(null, base64Image);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.message, item.role === 'user' ? styles.user : styles.assistant]}>
      {item.type === 'image' ? (
        <Image source={{ uri: item.content }} style={styles.image} />
      ) : (
        <Text>{item.content}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, idx) => idx.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Describe your issue..."
          value={input}
          onChangeText={setInput}
          editable={!sending}
        />
        <Button title="Send" onPress={() => sendMessage(input)} disabled={sending} />
        <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
          <Text style={{ fontSize: 20 }}>📷</Text>
        </TouchableOpacity>
      </View>
      {sending && <ActivityIndicator style={{ marginTop: 10 }} size="small" color="#007AFF" />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, paddingTop: 50 },
  message: { padding: 10, marginVertical: 5, borderRadius: 8, maxWidth: '80%' },
  user: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  assistant: { alignSelf: 'flex-start', backgroundColor: '#EEE' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginRight: 5 },
  image: { width: 150, height: 150, borderRadius: 8 },
  imageBtn: { marginLeft: 5, padding: 8 },
});
