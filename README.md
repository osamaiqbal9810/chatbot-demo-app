# WhatsApp Demo App (Node.js + Express) - Minimal for App Review

This is a minimal demo app to demonstrate two-way WhatsApp messaging for Meta App Review.

## What it shows
- Simple login (test credentials)
- "Send WhatsApp Test Message" button that calls the WhatsApp Cloud API via the backend
- Webhook endpoint to receive inbound WhatsApp messages and display them in the chat UI
- In-memory message store for demo/testing purposes

## Setup
1. Install dependencies

```bash
npm install
```

2. Set environment variables (in your hosting platform):

- `WHATSAPP_TOKEN` - your WhatsApp Cloud API token (or leave blank for simulated demo)
- `WHATSAPP_PHONE_NUMBER_ID` - your phone_number_id from Meta
- `VERIFY_TOKEN` - choose a verify token string for webhook verification

3. Start the server

```bash
npm start
```

4. Deploy options
- Heroku: recommended for quick deploy
- Render / Vercel / Netlify (serverless adaptation may be needed)

## Meta Dashboard
- Configure webhook URL to `https://<your-domain>/webhook` and set the verify token
- Subscribe to `messages` updates
- Keep the app in Development Mode for review

## Test credentials (defaults)
- Email: reviewer@test.com
- Password: Password123

## App Review notes (copy/paste)
Test environment URL: https://your-demo.example.com
Test credentials:
  Email: reviewer@test.com
  Password: Password123
Steps to test:
  1) Open the URL and log in with the test credentials.
  2) Enter target number (E.164) in the input and click "Send WhatsApp Test Message".
  3) The app will call the WhatsApp Cloud API and show the outbound message in the chat view.
  4) Reply from the target WhatsApp number — the reply will be received by our webhook and shown in the chat within a few seconds.
Screencast: (attach a short Loom/recording showing all steps)
