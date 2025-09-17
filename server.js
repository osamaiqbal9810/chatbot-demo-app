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
app.post('/api/send', async (req, res) => {
  const { to, text } = req.body;
  if (!text) return res.status(400).json({ ok: false, error: 'Missing text' });

  // Store outbound message locally
  const userMsg = {
    id: messages.length + 1,
    from: 'me',
    to,
    text,
    direction: 'out',
    time: new Date().toISOString(),
  };
  messages.push(userMsg);

  // ✅ Simulate AI processing
  const aiReply = {
    id: messages.length + 1,
    from: 'AI Bot',
    to: 'me',
    text: `AI Response: Thanks for your message - "${text}"`,
    direction: 'in',
    time: new Date().toISOString(),
  };
  messages.push(aiReply);

  // Return both for the UI
  return res.json({ ok: true, userMsg, aiReply });
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
