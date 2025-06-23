// === BACKEND FILES ===

// File: server.js
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/chat', async (req, res) => {
  const { text, image } = req.body;
  const messages = [];

  if (text) messages.push({ type: 'text', text });
  if (image) messages.push({ type: 'image_url', image_url: { url: image } });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: messages }
      ]
    });

    const replyText = completion.choices[0].message.content;

    // Simulate a quote coming back
    const replies = [
      { type: 'text', content: replyText },
      { type: 'text', content: "I've sent your request to nearby vendors. You'll receive quotes shortly." },
      { type: 'text', content: "Vendor A: $120 - Can come today." },
      { type: 'text', content: "Vendor B: $100 - Available tomorrow morning." },
    ];

    res.json({ replies });
  } catch (err) {
    console.error('OpenAI Error:', err);
    res.status(500).send('Error generating response');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
