// === BACKEND FILES ===

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post('/chat', async (req, res) => {
  const { text, image, user_location, category } = req.body;
  const messages = [];

  if (text) messages.push({ type: 'text', text });
  if (image) messages.push({ type: 'image_url', image_url: { url: image } });

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'user', content: messages }
      ]
    });

    let fullReply = '';
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      fullReply += content;
      res.write(`data: ${content}\n\n`);
    }

    await supabase.from('chat_logs').insert([
      {
        user_input: text || '[image]',
        assistant_reply: fullReply,
        image_url: image || null,
        user_location: user_location || null,
        category: category || null
      }
    ]);

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error('Streaming error:', err);
    res.write("data: Sorry, something went wrong.\n\n");
    res.end();
  }
});

// New route to get average pricing for a diagnosis
app.get('/estimate/:summary', async (req, res) => {
  const summary = decodeURIComponent(req.params.summary);
  try {
    const { data: logs, error } = await supabase
      .from('chat_logs')
      .select('id')
      .ilike('assistant_reply', `%${summary}%`);

    if (error) throw error;
    const ids = logs.map(l => l.id);

    const { data: quotes, error: quoteErr } = await supabase
      .from('quotes')
      .select('quote')
      .in('log_id', ids);

    if (quoteErr) throw quoteErr;
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

// Route to show relevant jobs for a vendor
app.get('/jobs-for-vendor/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;
  try {
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendorData) throw vendorError;

    const { lat: vLat, lon: vLon, radius_km, category } = vendorData;

    const { data: jobs, error: jobErr } = await supabase
      .from('chat_logs')
      .select('*');

    if (jobErr) throw jobErr;

    const filtered = jobs.filter(job => {
      const loc = job.user_location?.coordinates;
      if (!loc || !job.category || job.category !== category) return false;
      return isWithinRadius(vLat, vLon, loc[1], loc[0], radius_km);
    });

    res.json(filtered);
  } catch (err) {
    console.error('Job fetch error:', err);
    res.status(500).send('Failed to get jobs');
  }
});

// Customer landing page
app.get('/rfq-dashboard', async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('chat_logs')
      .select('*, quotes(quote)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const html = logs.map(log => {
      const quoteLines = log.quotes.map(q => `<li>$${parseFloat(q.quote).toFixed(2)}</li>`).join('') || '<li>No quotes yet</li>';
      return `
        <div style='border:1px solid #ccc;padding:10px;margin:10px;'>
          <p><strong>Summary:</strong> ${log.assistant_reply}</p>
          <ul>${quoteLines}</ul>
        </div>
      `;
    }).join('\n');

    res.send(`<html><head><title>RFQ Dashboard</title></head><body><h1>Your Requests</h1>${html}</body></html>`);
  } catch (err) {
    console.error('RFQ dashboard error:', err);
    res.status(500).send('Failed to load dashboard');
  }
});

function isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) <= radiusKm;
}

const { v4: uuidv4 } = require('uuid');

app.post('/dispatch_urgent_vendor', async (req, res) => {
  const { chat_history } = req.body;
  const chatRoomId = uuidv4();
  const severity = 'high'; // Could be inferred with GPT if you want

  const category = await guessCategoryFromHistory(chat_history); // Simplify as needed

  const { data: vendor } = await supabase
    .from('vendors')
    .select('email')
    .eq('category', category)
    .limit(1)
    .maybeSingle();

  if (!vendor || !vendor.email) {
    return res.json({ success: false });
  }

  const { error } = await supabase.from('tickets').insert([{
    assistant_reply: chat_history,
    severity,
    expires_at: new Date(Date.now() + 20 * 60 * 1000),
    category,
    dispatched_vendor_email: vendor.email,
    chat_room_id: chatRoomId
  }]);

  if (error) return res.status(500).json({ success: false });

  return res.json({ success: true, chat_room_id: chatRoomId });
});

async function guessCategoryFromHistory(text) {
  // TODO: Add GPT logic or fallback regex
  if (text.includes('leak')) return 'plumbing';
  if (text.includes('fuse') || text.includes('wiring')) return 'electrical';
  return 'general';
}
app.post('/submit-rfq', async (req, res) => {
  const {
    assistant_reply,
    severity = 'medium',
    category,
    user_location,
    image_url = null,
    user_email = null
  } = req.body;

  const expires_at = new Date();
  if (severity === 'high') expires_at.setMinutes(expires_at.getMinutes() + 20);
  else if (severity === 'medium') expires_at.setHours(expires_at.getHours() + 24);
  else expires_at.setHours(expires_at.getHours() + 48);

  try {
    const { error } = await supabase.from('tickets').insert([{
      assistant_reply,
      severity,
      category,
      user_location,
      image_url,
      user_email,
      expires_at
    }]);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('RFQ submission error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new table fields to Supabase:
// ALTER TABLE chat_logs ADD COLUMN user_location geography(Point, 4326);
// ALTER TABLE chat_logs ADD COLUMN category text;
// CREATE TABLE vendors (id uuid default gen_random_uuid() primary key, name text, lat double precision, lon double precision, radius_km integer, category text);

app.listen(3000, () => console.log('Server running on port 3000'));
