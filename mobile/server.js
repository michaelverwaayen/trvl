// === server.js ===

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { Expo } = require('expo-server-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// === Logging Middleware ===
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const expo = new Expo();

// === Helper: category inference ===
async function guessCategoryFromHistory(text) {
  if (text.toLowerCase().includes('leak')) return 'plumbing';
  if (text.toLowerCase().includes('electrical') || text.includes('breaker')) return 'electrical';
  return 'general';
}


// === /chat – GET-compatible SSE + save to chat_logs ===
app.get('/chat', async (req, res) => {
  const text = req.query.text || '';
  const image = req.query.image || '';
  const user_location = req.query.user_location || '';
  const category = req.query.category || '';

  // Correct multimodal structure
  const messages = [];
  if (text) {
    messages.push({ type: 'text', text: text }); // ✅ FIXED
  }
  if (image) {
    messages.push({ type: 'image_url', image_url: { url: image } });
  }

  // No input = early return
  if (messages.length === 0) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.write("data: No message provided.\n\n");
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        {
          role: 'user',
          content: messages
        }
      ]
    });

    let fullReply = '';
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      fullReply += content;
      res.write(`data: ${content}\n\n`);
    }

    await supabase.from('chat_logs').insert([{
      user_input: text || '[image]',
      assistant_reply: fullReply,
      image_url: image || null,
      user_location,
      category,
      status: 'open'
    }]);

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error('🔥 Streaming error:', err);
    res.write("data: Sorry, something went wrong.\n\n");
    res.write("data: [DONE]\n\n");
    res.end();
  }
});


// === /estimate/:summary ===
app.get('/estimate/:summary', async (req, res) => {
  const summary = decodeURIComponent(req.params.summary);
  try {
    const { data: logs } = await supabase
      .from('chat_logs')
      .select('id')
      .ilike('assistant_reply', `%${summary}%`);
    const ids = logs.map(l => l.id);

    const { data: quotes } = await supabase
      .from('quotes')
      .select('quote')
      .in('log_id', ids);

    const values = quotes.map(q => parseFloat(q.quote));
    if (values.length === 0) return res.json({ avg: null, min: null, max: null });
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const min = Math.min(...values).toFixed(2);
    const max = Math.max(...values).toFixed(2);
    res.json({ avg, min, max });
  } catch (err) {
    console.error('Estimate error:', err);
    res.status(500).send('Failed to compute estimate');
  }
});

// === /jobs-for-vendor/:vendorId ===
function isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) <= radiusKm;
}

app.get('/jobs-for-vendor/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;
  try {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('*').eq('id', vendorId).single();

    const { lat: vLat, lon: vLon, radius_km, category } = vendor;
    const { data: jobs } = await supabase
      .from('chat_logs')
      .select('*')
      .eq('status', 'open');
    const filtered = jobs.filter(job => {
      const loc = job.user_location?.coordinates;
      return loc && job.category === category &&
             isWithinRadius(vLat, vLon, loc[1], loc[0], radius_km);
    });

    res.json(filtered);
  } catch (err) {
    console.error('Job fetch error:', err);
    res.status(500).send('Failed to get jobs');
  }
});

// === /rfq-dashboard ===
app.get('/rfq-dashboard', async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from('chat_logs')
      .select('*, quotes(quote)')
      .order('created_at', { ascending: false });

    const html = logs.map(log => {
      const lines = log.quotes.map(q => `<li>$${parseFloat(q.quote).toFixed(2)}</li>`).join('');
      return `
        <div style='border:1px solid #ccc;padding:10px;margin:10px;'>
          <p><strong>Summary:</strong> ${log.assistant_reply}</p>
          <ul>${lines || '<li>No quotes yet</li>'}</ul>
        </div>`;
    }).join('\n');

    res.send(`<html><body><h1>Your Requests</h1>${html}</body></html>`);
  } catch (err) {
    console.error('RFQ dashboard error:', err);
    res.status(500).send('Failed to load dashboard');
  }
});

// === /dispatch_urgent_vendor ===
app.post('/dispatch_urgent_vendor', async (req, res) => {
  const { chat_history } = req.body;
  const chatRoomId = uuidv4();
  const severity = 'high';
  const expires_at = new Date(Date.now() + 20 * 60 * 1000);

  const category = await guessCategoryFromHistory(chat_history);
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*').eq('category', category).maybeSingle();

  if (!vendor || !vendor.email) {
    return res.json({ success: false, reason: 'No vendor available' });
  }

  const { error: ticketErr } = await supabase.from('tickets').insert([{
    assistant_reply: chat_history,
    severity,
    expires_at,
    category,
    dispatched_vendor_email: vendor.email,
    chat_room_id: chatRoomId
  }]);
  if (ticketErr) {
    console.error('Ticket insert error:', ticketErr);
    return res.status(500).json({ success: false });
  }

  const alertText = `🚨 Urgent job assigned in ${category}.\nJoin: https://yourapp.com/chat/${chatRoomId}`;
  await supabase.from('email_alerts').insert([{
    vendor_email: vendor.email,
    subject: '🚨 Urgent Job Assigned',
    body: alertText
  }]);

  return res.json({ success: true, chat_room_id: chatRoomId });
});

// === /submit-rfq ===
app.post('/submit-rfq', async (req, res) => {
  const { assistant_reply, severity='medium', category, user_location, image_url, user_email } = req.body;
  const expires_at = new Date();
  if (severity === 'high') expires_at.setMinutes(expires_at.getMinutes() + 20);
  else if (severity === 'medium') expires_at.setHours(expires_at.getHours() + 24);
  else expires_at.setHours(expires_at.getHours() + 48);

  try {
    const { error } = await supabase.from('tickets').insert([{
      assistant_reply, severity, category, user_location, image_url, user_email, expires_at
    }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('RFQ submission error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === /register-token ===
app.post('/register-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    await supabase.from('expo_tokens').upsert({ token });
    res.json({ success: true });
  } catch (err) {
    console.error('Token registration failed:', err);
    res.status(500).json({ success: false });
  }
});

// === /health check ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// === Home Route ===
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>RFQ Backend</title></head>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1>🛠️ RFQ Backend is Running</h1>
        <p>This is your backend API. Use the mobile app or test endpoints with Postman or curl.</p>
        <ul>
          <li><a href="/rfq-dashboard">📋 View RFQ Dashboard</a></li>
          <li><a href="/health">🩺 Health Check</a></li>
        </ul>
      </body>
    </html>
  `);
});

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// === Supabase realtime: push on new quote ===
supabase
  .channel('quotes-listener')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quotes' }, async payload => {
    try {
      const { data: tokens } = await supabase.from('expo_tokens').select('token');
      const messages = (tokens || []).map(t => ({
        to: t.token,
        sound: 'default',
        title: 'New Quote Received',
        body: `A vendor responded with a quote.`,
        data: { logId: payload.new.log_id }
      }));

      for (const chunk of expo.chunkPushNotifications(messages)) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    } catch (err) {
      console.error('Push notification error:', err);
    }
  })
  .subscribe();
