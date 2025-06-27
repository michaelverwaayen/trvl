import React, { useState } from 'react';
import ChatScreen from './ChatScreen';
import ReviewTicketScreen from './ReviewTicketScreen';
import axios from 'axios';

export default function ChatFlowRouter({ onBackToHome }) {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);

  const handleChatUpdate = (newMessages, fullTranscript) => {
    setMessages(newMessages);
    setChatHistory(fullTranscript);

    const highConfidence = newMessages.some(m =>
      m.role === 'assistant' &&
      (m.content.toLowerCase().includes('confidence: 85') ||
       m.content.toLowerCase().includes('high confidence'))
    );

    if (highConfidence) {
      setShowReview(true);
    }
  };

  const handleManualSubmit = () => {
    setShowReview(true);
  };

  const handleUrgentDispatch = async () => {
    try {
      const res = await axios.post('http://localhost:3000/dispatch_urgent_vendor', {
        chat_history: chatHistory
      });

      if (res.data.success && res.data.chat_room_id) {
        setChatRoomId(res.data.chat_room_id);
        alert('✅ Urgent vendor found. Opening chat...');
        // Optional: Navigate to VendorChatRoom
      } else {
        alert('⚠️ No vendor available for urgent dispatch. Submitting RFQ instead.');
        setShowReview(true);
      }
    } catch (err) {
      console.error('Urgent dispatch failed:', err);
      setShowReview(true);
    }
  };

  const handleRFQSubmit = async (editedTicket) => {
    try {
      const res = await axios.post('http://localhost:3000/submit-rfq', editedTicket);
      console.log('RFQ submitted:', res.data);
      setShowReview(false);
      if (onBackToHome) {
        onBackToHome();
      }
    } catch (err) {
      console.error('Error submitting RFQ:', err);
      alert('Failed to submit RFQ. Please try again.');
    }
  };

  return showReview ? (
    <ReviewTicketScreen
      chatHistory={chatHistory}
      onSubmit={handleRFQSubmit}
      onBack={() => setShowReview(false)}
    />
  ) : (
    <ChatScreen
      messages={messages}
      onUpdate={handleChatUpdate}
      onManualSubmit={handleManualSubmit}
      onUrgentHelp={handleUrgentDispatch}
    />
  );
}
