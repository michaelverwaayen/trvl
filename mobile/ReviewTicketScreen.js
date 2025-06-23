// === ChatFlowRouter.js ===
// Handles chat logic, detects confidence, and routes to ReviewTicketScreen

import React, { useState } from 'react';
import ChatScreen from './ChatScreen';
import ReviewTicketScreen from './ReviewTicketScreen';

export default function ChatFlowRouter() {
  const [messages, setMessages] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [chatHistory, setChatHistory] = useState('');

  const handleChatUpdate = (newMessages, fullTranscript) => {
    setMessages(newMessages);
    setChatHistory(fullTranscript);

    // Auto-trigger review if confidence message appears
    const highConfidence = newMessages.some(m => m.role === 'assistant' && m.content.toLowerCase().includes('confidence: 85') || m.content.toLowerCase().includes('high confidence'));
    if (highConfidence) {
      setShowReview(true);
    }
  };

  const handleManualSubmit = () => {
    setShowReview(true);
  };

  const handleRFQSubmit = (editedTicket) => {
    // You would post the final RFQ to your backend here (e.g. /submit-rfq)
    console.log('Submitted Ticket:', editedTicket);
    setShowReview(false);
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
    />
  );
}
