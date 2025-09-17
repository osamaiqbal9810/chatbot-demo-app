// server.js - Demo-only WhatsApp app with Templates (pure demo mode)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// In-memory stores (demo only)
const messages = []; // { id, from, text, direction: 'out'|'in', time }
const templates = []; // { id, name, language, body, createdAt }

// Simple test credentials (demo reviewer)
const TEST_USER = { email: 'reviewer@test.com', password: 'Password123' };

// ----------------- Auth -----------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === TEST_USER.email && password === TEST_USER.password) {
    return res.json({ ok: true, user: { email } });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

// ----------------- Messaging -----------------
// Send text message (demo)
app.post('/api/send', (req, res) => {
  let { text } = req.body;
  if (!text) return res.status(400).json({ ok: false, error: 'Missing text' });

  // store outbound
  messages.push({
    id: uuidv4(),
    from: 'You',
    text,
    direction: 'out',
    time: new Date().toISOString()
  });

  // simulated AI reply
  const botReply = `🤖 Bot reply: I understood "${text}"`;
  messages.push({
    id: uuidv4(),
    from: 'Bot',
    text: botReply,
    direction: 'in',
    time: new Date().toISOString()
  });

  return res.json({ ok: true, demo: true });
});

// get messages
app.get('/api/messages', (req, res) => {
  res.json({ ok: true, messages });
});

// ----------------- Templates (demo) -----------------
// create template
app.post('/api/templates', (req, res) => {
  const { name, language, body } = req.body;
  if (!name || !body) return res.status(400).json({ ok: false, error: 'Missing name or body' });

  const t = { id: uuidv4(), name, language: language || 'en', body, createdAt: new Date().toISOString() };
  templates.push(t);
  return res.json({ ok: true, template: t });
});

// list templates
app.get('/api/templates', (req, res) => {
  res.json({ ok: true, templates });
});

// delete template
app.delete('/api/templates/:id', (req, res) => {
  const id = req.params.id;
  const idx = templates.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
  templates.splice(idx, 1);
  return res.json({ ok: true });
});

// send template (simulate send via template)
app.post('/api/templates/:id/send', (req, res) => {
  const id = req.params.id;
  const t = templates.find(tt => tt.id === id);
  if (!t) return res.status(404).json({ ok: false, error: 'Template not found' });

  // Simulate sending template as outbound message
  messages.push({
    id: uuidv4(),
    from: 'You (Template: ' + t.name + ')',
    text: t.body,
    direction: 'out',
    time: new Date().toISOString()
  });

  // Simulated bot/Ai reply
  const botReply = `🤖 Bot reply to template "${t.name}": Thanks — we processed your request.`;
  messages.push({
    id: uuidv4(),
    from: 'Bot',
    text: botReply,
    direction: 'in',
    time: new Date().toISOString()
  });

  return res.json({ ok: true, sent: true });
});

// ----------------- Webhook (demo) -----------------
app.get('/webhook', (req, res) => {
  return res.status(200).send(req.query['hub.challenge'] || 'demo_webhook_verified');
});
app.post('/webhook', (req, res) => {
  console.log('Received webhook (demo):', req.body);
  return res.status(200).json({ received: true, demo: true });
});

// ----------------- Start -----------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Demo server running on http://localhost:${PORT}`));
