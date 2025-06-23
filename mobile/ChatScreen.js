import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, Image, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import ChatRoom from './ChatRoom';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [urgentChatId, setUrgentChatId] = useState(null);
  const [inUrgentChat, setInUrgentChat] = useState(false);

  const sendMessage = async (text = null, image = null) => {
    if (!text && !image) return;
    const userMessage = { role: 'user', type: image ? 'image' : 'text', content: text || image };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    try {
      const res = await axios.post('https://rfq-a1og.onrender.com/chat', {
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

  const handleGetHelpNow = async () => {
    const fullTranscript = messages.map(m => m.content).join('\n');
    try {
      const res = await axios.post('https://rfq-a1og.onrender.com/chat'/dispatch_urgent_vendor', {
        chat_history: fullTranscript
      });

      if (res.data.success && res.data.chat_room_id) {
        setUrgentChatId(res.data.chat_room_id);
        setInUrgentChat(true);
      } else {
        alert('No vendor available right now. Continuing with RFQ.');
      }
    } catch (err) {
      console.error('Urgent dispatch failed:', err);
      alert('Something went wrong while dispatching.');
    }
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

  if (inUrgentChat && urgentChatId) {
    return <ChatRoom chatRoomId={urgentChatId} sender="user@example.com" />;
  }

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
      <View style={styles.manualRow}>
        <Button title="🚨 Get Help Now" onPress={handleGetHelpNow} disabled={sending} />
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
  manualRow: { marginTop: 10 }
});
