// Minimal Express server for WhatsApp demo (pure demo mode)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// In-memory store (for demo only)
const messages = []; // { id, from, text, direction: 'out'|'in', time }

// Simple test credentials (for reviewer login)
const TEST_USER = { email: 'reviewer@test.com', password: 'Password123' };

// ✅ Auth endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === TEST_USER.email && password === TEST_USER.password) {
    return res.json({ ok: true, user: { email } });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

// ✅ Send message (pure demo, no WhatsApp API call)
app.post('/api/send', (req, res) => {
  let { text } = req.body;
  if (!text) return res.status(400).json({ ok: false, error: 'Missing text' });

  // Store outbound message (user → bot)
  messages.push({
    id: messages.length + 1,
    from: 'me',
    text,
    direction: 'out',
    time: new Date().toISOString()
  });

  // Simulated bot reply
  const botReply = `🤖 Bot reply: I understood "${text}"`;
  messages.push({
    id: messages.length + 1,
    from: 'bot',
    text: botReply,
    direction: 'in',
    time: new Date().toISOString()
  });

  return res.json({ ok: true, demo: true, message: 'Simulated send', botReply });
});

// ✅ Get chat history
app.get('/api/messages', (req, res) => {
  res.json({ ok: true, messages });
});

// ✅ Fake webhook verification (always passes for demo)
app.get('/webhook', (req, res) => {
  return res.status(200).send(req.query['hub.challenge'] || 'demo_webhook_verified');
});

// ✅ Fake webhook receiver (logs but does nothing real)
app.post('/webhook', (req, res) => {
  console.log('Received webhook (demo only):', req.body);
  return res.status(200).json({ received: true, demo: true });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Demo WhatsApp bot running on http://localhost:${PORT}`));
