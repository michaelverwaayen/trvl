// === ChatRoom.js ===
import React, { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { supabase } from './supabase'; // or '../supabase'
import { OPENAI_API_KEY } from './config';




export default function ChatRoom({ chatRoomId, sender }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    fetchMessages();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId]);

  useEffect(() => {
    const fetchQuoteStatus = async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('log_id', chatRoomId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (data) {
        setMessages(prev => [
          ...prev,
          { id: 'system-accepted', sender: 'system', message: '✅ Your job has been accepted!' }
        ]);
      }
    };

    fetchQuoteStatus();
  }, [chatRoomId]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      await supabase.from('chat_messages').insert({
        chat_room_id: chatRoomId,
        sender,
        message: trimmed
      });
      setInput('');
    } catch (err) {
      console.error('Message send failed:', err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Live Chat</h2>
      <div style={{ maxHeight: 300, overflowY: 'scroll', border: '1px solid #ccc', padding: 10 }}>
        {messages.map(msg => (
          <div key={msg.id || Math.random()} style={{ margin: '10px 0' }}>
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
        style={{ width: '80%', marginRight: 10 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
