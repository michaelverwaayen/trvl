// === server.js ===

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { Expo } = require('expo-server-sdk');
const SYSTEM_PROMPT = `
You are a skilled home appliance technician. Your job is to help users diagnose what might be wrong with any appliance based on their description of the issue. Your goal is to ask smart, relevant, and targeted questions like a real technician would — not generic or robotic ones.

Follow a logical troubleshooting path:
1. **Clarify the issue** – Ask what’s happening (e.g., not working at all, unusual noise, not heating/cooling, leaking, etc.).
2. **Check power/safety** – Ask if the appliance is plugged in, if there’s power, and if any breakers or resets were triggered.
3. **Evaluate symptoms** – Ask about noises, smells, lights, display errors, temperature issues, leaks, movement, or recent changes.
4. **Assess environment & usage** – Ask about appliance age, location, recent moves, overuse, or part replacements.
5. **Guide basic steps if safe** – Suggest safe checks like cleaning filters, clearing vents, resetting breakers, etc.
6. **Propose likely causes** – Once enough info is gathered, offer one or two possible issues with confidence level (e.g., "Control board failure – 70% confidence").
7. **Recommend action** – Suggest whether a technician is needed, or if the user can try a next step themselves.

Tone should be natural, clear, and confident — never robotic. Do not repeat the same question. Never ask the user to re-identify the appliance or restate the problem unless they explicitly say something like “start over” or “reset.” 

Assume chat continuity at all times unless clearly instructed otherwise. You are here to troubleshoot, not to interview.

`;
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
// === Helper: build multimodal message ===
function buildMultimodalContent(text, image) {
  const content = [];
  if (text) content.push({ type: 'text', text });
  if (image) content.push({ type: 'image_url', image_url: { url: image } });
  return content;
}


// === /chat – GET-compatible SSE + save to chat_logs ===
app.get('/chat', async (req, res) => {
  const text = req.query.text || '';
  const image = req.query.image || '';
  const user_location = req.query.user_location || '';
  const category = req.query.category || '';
  const multimodalContent = buildMultimodalContent(text, image);



  if (multimodalContent.length === 0) {
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

  const messages = [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: multimodalContent }
];

const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  stream: true,
  messages
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
    console.error('🔥 Streaming error:', err.response?.data || err.message || err);
    res.write("data: Sorry, something went wrong.\n\n");
    res.write("data: [DONE]\n\n");
    console.log('🧠 Messages sent to OpenAI:', JSON.stringify(multimodalContent, null, 2));
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
    console.log('🚨 Dispatching vendor for category:', category);
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
             isWithinRadius(vLat, vLon, loc[1], loc[0], 20000);
    });

    res.json(filtered);
  } catch (err) {
    console.error('Job fetch error:', err);
    res.status(500).send('Failed to get jobs');
  }
});

// === /available_vendors ===
app.get('/available_vendors', async (req, res) => {
  const { category, lat, lon } = req.query;
  try {
    let query = supabase.from('vendors').select('*');
    if (category) query = query.eq('category', category);
    const { data: vendors, error } = await query;
    if (error) throw error;

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (!isNaN(latNum) && !isNaN(lonNum)) {
      const filtered = vendors.filter(v =>
        v.lat && v.lon && v.radius_km
          ? isWithinRadius(latNum, lonNum, v.lat, v.lon, v.radius_km)
          : true
      );
      return res.json(filtered);
    }
    res.json(vendors);
  } catch (err) {
    console.error('Vendor list error:', err);
    res.status(500).send('Failed to get vendors');
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
  const { chat_history, category: passedCategory, vendor_id } = req.body; // ✅ Destructure once
  const chatRoomId = uuidv4();
  const severity = 'high';
  const expires_at = new Date(Date.now() + 20 * 60 * 1000);

  const category = passedCategory || await guessCategoryFromHistory(chat_history); // ✅ Use fallback logic
  console.log('🚨 Dispatching vendor for category:', category);
  let vendor;
  if (vendor_id) {
    ({ data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendor_id)
      .maybeSingle());
  } else {
    ({ data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('category', category)
      .maybeSingle());
  }
console.log('🧪 Searching for vendor with category:', category);
const { data: debugVendors, error: debugError } = await supabase
  .from('vendors')
  .select('*')
  .eq('category', category);

  const { data: debugJobs } = await supabase
  .from('chat_logs')
  .select('*')
  .eq('category', category)
  .eq('status', 'open');

console.log('📦 Open jobs in this category:', debugJobs);


console.log('🧱 All vendors matching category:', debugVendors);
if (debugError) console.error('⚠️ Vendor query error:', debugError);

  if (!vendor || !vendor.id) {
    return res.json({ success: false, reason: 'No vendor available' });
  }

  const { error: ticketErr } = await supabase.from('tickets').insert([{
    assistant_reply: chat_history,
    severity,
    expires_at,
    category,
    dispatched_vendor_id: vendor.id,
    chat_room_id: chatRoomId
  }]);
  if (ticketErr) {
    console.error('Ticket insert error:', ticketErr);
    return res.status(500).json({ success: false });
  }

  const alertText = `🚨 Urgent job assigned in ${category}.\nJoin: https://yourapp.com/chat/${chatRoomId}`;
  await supabase.from('email_alerts').insert([{
    vendor_id: vendor.id,
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
