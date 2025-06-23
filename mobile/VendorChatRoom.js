// === VendorChatRoom.js ===

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function VendorChatRoom({ chatRoomId, vendorEmail }) {
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

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat with Customer</h2>
      <div style={{ maxHeight: 300, overflowY: 'scroll', border: '1px solid #ccc', padding: 10 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ margin: '10px 0' }}>
            <strong>{msg.sender === vendorEmail ? 'You' : 'Customer'}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type your reply..."
        style={{ width: '80%', marginRight: 10 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
