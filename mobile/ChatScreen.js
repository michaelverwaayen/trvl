import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { useState, useEffect } from 'react';
import { Picker } from 'react-native';
import { SERVER_URL } from './config';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import ChatRoom from './ChatRoom';
import { useTheme } from './ThemeContext';
import { supabase } from './supabase';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [urgentChatId, setUrgentChatId] = useState(null);
  const [inUrgentChat, setInUrgentChat] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('vendors').select('category').neq('category', '');
      if (data) {
        const uniqueCategories = [...new Set(data.map(v => v.category))];
        setCategories(uniqueCategories);
      }
    };
    fetchCategories();
  }, []);

  const sendMessage = async (text = null, image = null) => {
    if (!text && !image) return;

    let query = '';
    try {
      query = new URLSearchParams({
        text: text || '',
        image: image || '',
      }).toString();
    } catch (e) {
      console.error('❌ Failed to build query string:', e);
      return;
    }

    if (image && !image.startsWith('data:image/')) {
      console.warn('⚠️ Invalid image format submitted.');
      return;
    }

    const userMessage = {
      role: 'user',
      type: image ? 'image' : 'text',
      content: text || image,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const eventSource = new EventSourcePolyfill(
        `http://localhost:3000/chat?${query}`
      );

      let fullResponse = '';
      let done = false;

      const timeoutId = setTimeout(() => {
        if (!done) {
          console.warn('⏰ SSE timed out. Closing connection.');
          eventSource.close();
          setSending(false);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              type: 'text',
              content: 'Sorry, the server timed out.',
            },
          ]);
        }
      }, 30000);

      eventSource.onmessage = (event) => {
        if (done) return;
        if (event.data === '[DONE]') {
          done = true;
          clearTimeout(timeoutId);
          setSending(false);
          eventSource.close();
          return;
        }

        fullResponse += event.data;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: fullResponse }];
          } else {
            return [...prev, { role: 'assistant', type: 'text', content: event.data }];
          }
        });
      };

      eventSource.onerror = (e) => {
        if (!done) {
          console.error('🔥 SSE stream error:', e);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              type: 'text',
              content: 'There was a connection issue. Please try again.',
            },
          ]);
          clearTimeout(timeoutId);
          setSending(false);
          eventSource.close();
        }
      };
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          type: 'text',
          content: 'Something went wrong. Please try again.',
        },
      ]);
      setSending(false);
    }
  };

  const handleGetHelpNow = async () => {
    if (!showCategoryDropdown) {
      setShowCategoryDropdown(true);
      return;
    }

    if (!selectedCategory) {
      alert('Please select a category.');
      return;
    }

    const fullTranscript = messages.map(m => m.content).join('\n');
    try {
      const res = await axios.post('http://localhost:3000/dispatch_urgent_vendor', {
  chat_history: fullTranscript,
  category: selectedCategory  // ✅ ADD THIS LINE
});

      if (res.data.success && res.data.chat_room_id) {
        console.log('🚀 Urgent chat initiated:', res.data.chat_room_id);
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

  const renderItem = ({ item, index }) => (
    <View
      key={item.id || index}
      style={[styles.message, item.role === 'user' ? styles.user : styles.assistant]}
    >
      {item.type === 'image' && item.content ? (
        <Image source={{ uri: item.content }} style={styles.image} />
      ) : (
        <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
          {item.content || '⚠️ Empty message'}
        </Text>
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
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
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

      {showCategoryDropdown && (
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          style={{ marginTop: 10, color: theme.text, backgroundColor: theme.card }}
        >
          <Picker.Item label="Select a category" value="" />
          {categories.map((cat, idx) => (
            <Picker.Item key={idx} label={cat} value={cat} />
          ))}
        </Picker>
      )}

    

      {sending && <ActivityIndicator style={{ marginTop: 10 }} size="small" color={theme.primary} />}
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 10, paddingTop: 50, backgroundColor: theme.background },
    message: { padding: 10, marginVertical: 5, borderRadius: 8, maxWidth: '80%' },
    user: { alignSelf: 'flex-end', backgroundColor: theme.card },
    assistant: { alignSelf: 'flex-start', backgroundColor: theme.card },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 5, padding: 10, marginRight: 5, color: theme.text },
    image: { width: 150, height: 150, borderRadius: 8 },
    imageBtn: { marginLeft: 5, padding: 8 },
    manualRow: { marginTop: 10 },
    userText: { color: '#FFFFFF' },
    assistantText: { color: '#FFA500' }
  });
