// === BACKEND FILES ===
// File: server.js
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post('/chat', async (req, res) => {
  const { text, image } = req.body;
  const messages = [];

  if (text) messages.push({ type: 'text', text });
  if (image) messages.push({ type: 'image_url', image_url: { url: image } });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: false,
      messages: [
        { role: 'user', content: messages }
      ]
    });

    const replyText = response.choices[0].message.content;

    // Store message in Supabase
    await supabase.from('chat_logs').insert([
      { user_input: text || '[image]', assistant_reply: replyText }
    ]);

    res.json({ replies: [ { type: 'text', content: replyText } ] });
  } catch (err) {
    console.error('OpenAI Error:', err);
    res.status(500).json({ replies: [{ type: 'text', content: 'Sorry, I could not process that right now.' }] });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
