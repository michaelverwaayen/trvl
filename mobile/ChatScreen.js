import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { useState, useEffect, useRef } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

export default function ChatScreen({ onManualSubmit }) {
  const manualSubmit = onManualSubmit || (() => {});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [urgentChatId, setUrgentChatId] = useState(null);
  const [inUrgentChat, setInUrgentChat] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [photoRequested, setPhotoRequested] = useState(false);
  const [showQuoteButton, setShowQuoteButton] = useState(false);
  const userAvatar = 'https://i.pravatar.cc/100?img=11';
  const assistantAvatar = 'https://i.pravatar.cc/100?img=12';
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const sessionIdRef = useRef(uuidv4());
  const flatListRef = useRef(null);

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

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_room_id', sessionIdRef.current)
        .order('created_at');
      if (data) setMessages(data);
    };
    loadMessages();
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

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
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    supabase.from('chat_messages').insert({
      chat_room_id: sessionIdRef.current,
      sender: 'user',
      message: text || image || ''
    });
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
              timestamp: new Date().toISOString(),
            },
          ]);
          supabase.from('chat_messages').insert({
            chat_room_id: sessionIdRef.current,
            sender: 'assistant',
            message: 'Sorry, the server timed out.'
          });
        }
      }, 30000);

      let firstAssistantChunk = true;
      eventSource.onmessage = (event) => {
        if (done) return;
        if (event.data === '[DONE]') {
          done = true;
          clearTimeout(timeoutId);
          setSending(false);
          eventSource.close();
          supabase.from('chat_messages').insert({
            chat_room_id: sessionIdRef.current,
            sender: 'assistant',
            message: fullResponse
          });
          return;
        }

        fullResponse += event.data;
        const lower = event.data.toLowerCase();
        if (lower.includes('?')) {
          setQuestionCount(c => {
            const newCount = c + 1;
            if (newCount >= 4 && (photoRequested || lower.includes('photo') || lower.includes('picture') || lower.includes('image'))) {
              setShowQuoteButton(true);
            }
            return newCount;
          });
        }
        if (lower.includes('photo') || lower.includes('picture') || lower.includes('image')) {
          setPhotoRequested(true);
          setShowQuoteButton(q => q || questionCount >= 4);
        }
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (!firstAssistantChunk && last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: fullResponse }];
          }
          firstAssistantChunk = false;
          return [
            ...prev,
            {
              role: 'assistant',
              type: 'text',
              content: event.data,
              timestamp: new Date().toISOString(),
            },
          ];
        });
        // show button if conditions met after message append
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
              timestamp: new Date().toISOString(),
            },
          ]);
          supabase.from('chat_messages').insert({
            chat_room_id: sessionIdRef.current,
            sender: 'assistant',
            message: 'There was a connection issue. Please try again.'
          });
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
          timestamp: new Date().toISOString(),
        },
      ]);
      supabase.from('chat_messages').insert({
        chat_room_id: sessionIdRef.current,
        sender: 'assistant',
        message: 'Something went wrong. Please try again.'
      });
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
      setPhotoRequested(true);
      if (questionCount >= 4) {
        setShowQuoteButton(true);
      }
    }
  };

  const renderItem = ({ item, index }) => {
    const isUser = item.role === 'user';
    const avatarSource = { uri: isUser ? userAvatar : assistantAvatar };
    return (
      <View
        key={item.id || index}
        style={[
          styles.bubbleRow,
          isUser ? styles.alignRight : styles.alignLeft,
        ]}
      >
        {!isUser && <Image source={avatarSource} style={styles.avatar} />}
        <View
          style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
        >
          {item.type === 'image' && item.content ? (
            <Image source={{ uri: item.content }} style={styles.image} />
          ) : (
            <Text style={isUser ? styles.userText : styles.assistantText}>
              {item.content || '⚠️ Empty message'}
            </Text>
          )}
          {item.timestamp && (
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          )}
        </View>
        {isUser && <Image source={avatarSource} style={styles.avatar} />}
      </View>
    );
  };

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
        ref={flatListRef}
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

      {showQuoteButton && (
        <View style={{ marginTop: 10 }}>
          <Button title="Request Quotes" onPress={manualSubmit} />
        </View>
      )}

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
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 5 },
    alignRight: { justifyContent: 'flex-end' },
    alignLeft: { justifyContent: 'flex-start' },
    bubble: { padding: 10, borderRadius: 16, maxWidth: '70%' },
    userBubble: { backgroundColor: theme.primary, marginLeft: 8 },
    assistantBubble: { backgroundColor: theme.card, marginRight: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 5, padding: 10, marginRight: 5, color: theme.text },
    image: { width: 150, height: 150, borderRadius: 8 },
    imageBtn: { marginLeft: 5, padding: 8 },
    userText: { color: '#FFFFFF' },
    assistantText: { color: theme.text },
    avatar: { width: 32, height: 32, borderRadius: 16 },
    timestamp: { fontSize: 10, color: theme.text, marginTop: 4, textAlign: 'right' },
  });
