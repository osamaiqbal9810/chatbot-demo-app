// Minimal Express server for WhatsApp demo
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// In-memory store (for demo only)
const messages = []; // { id, from, text, direction: 'out'|'in', time }

// Simple test credentials (change before deploy if needed)
const TEST_USER = { email: 'reviewer@test.com', password: 'Password123' };

// Environment variables (configure in deployment)
// WHATSAPP_TOKEN - permanent token or test token
// WHATSAPP_PHONE_NUMBER_ID - phone_number_id used in Cloud API
// VERIFY_TOKEN - token used for webhook verification

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'EAASeUmOZCcKwBPVz0KvJg5ZCQDb6Vz9zjtPglUof2hNEbX6rFxTXOyc0OvJvAIiWj3psgtYzORA4K2BCzZCgq5UX2nBOLhKMfZArsOy19yZAt1ykFZCZCCAxgGrlTIBlsT2vAsRXwQGZBFvXSIyWxvjZBdFLS7mfF55SO9eUvagIh8HkdPE762etBNzKCPpg7Qe5VSXIN7L57Q12ubZCynUMtZAH6z6FTxOcWA3j9nOpioatWcDTshO5HeJfwQW0aU6e1oZD';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '766109259924666';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'YOUR_VERIFY_TOKEN';

// Auth endpoint (very minimal): returns success if credentials match
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === TEST_USER.email && password === TEST_USER.password) {
    return res.json({ ok: true, user: { email } });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

// Send message endpoint - calls WhatsApp Cloud API
// Send message endpoint - demo mode generates AI-like response
// Send message endpoint - calls WhatsApp Cloud API or simulates
app.post('/api/send', async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).json({ ok: false, error: 'Missing to or text' });

  // Store outbound message locally (user -> bot)
  messages.push({ 
    id: messages.length + 1, 
    from: 'me', 
    to, 
    text, 
    direction: 'out', 
    time: new Date().toISOString() 
  });

  if (!WHATSAPP_TOKEN || WHATSAPP_TOKEN === 'REPLACE_ME') {
    // Demo mode: simulate AI bot response
    const botReply = `🤖 Bot reply: I understood "${text}"`;
    messages.push({ 
      id: messages.length + 1, 
      from: 'bot', 
      to, 
      text: botReply, 
      direction: 'in', 
      time: new Date().toISOString() 
    });

    return res.json({ ok: true, demo: true, message: 'Simulated send', botReply });
  }

  try {
    // Real WhatsApp API call
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to,
      text: { body: text }
    };
    const headers = { Authorization: `Bearer ${WHATSAPP_TOKEN}` };
    const apiRes = await axios.post(url, payload, { headers });
    return res.json({ ok: true, apiRes: apiRes.data });
  } catch (err) {
    console.error('WhatsApp send error', err.response ? err.response.data : err.message);
    return res.status(500).json({ ok: false, error: 'WhatsApp API error', details: err.response ? err.response.data : err.message });
  }
});


// Simple endpoint to fetch messages for the chat UI
app.get('/api/messages', (req, res) => {
  res.json({ ok: true, messages });
});

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Webhook receiver (POST)
app.post('/webhook', (req, res) => {
  // Meta sends message updates here. For demo, we parse text messages and store them locally.
  const body = req.body;
  // Basic safety: ensure it looks like a WhatsApp payload
  if (body.object && body.entry) {
    body.entry.forEach((entry) => {
      (entry.changes || []).forEach((change) => {
        const value = change.value;
        if (value && value.messages) {
          value.messages.forEach((m) => {
            const from = m.from;
            const text = (m.text && m.text.body) || (m.message && m.message.text && m.message.text.body) || '';
            messages.push({ id: messages.length + 1, from, text, direction: 'in', time: new Date().toISOString() });
          });
        }
      });
    });
    return res.status(200).json({ received: true });
  }
  // not a whatsapp webhook event
  return res.status(400).json({ ok: false });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
