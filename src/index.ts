import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import { WebClient } from '@slack/web-api';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || '';
const PORT = Number(process.env.PORT) || 5000;

const TOKEN_PATH = path.join(__dirname, 'tokens.json');
const SCHEDULE_PATH = path.join(__dirname, 'scheduled.json');

// ---------- Helpers ----------
function readJSON(file: string) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function readTokens() {
  if (!fs.existsSync(TOKEN_PATH)) return {};
  return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
}
function saveTokens(tokens: any) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

// ---------- OAuth Start ----------
app.get('/api/oauth/start', (req, res) => {
  const scopes = [
    'chat:write',
    'channels:read',
    'users:read',
    'channels:history'
  ].join(',');
  const url = `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(url);
});

// ---------- OAuth Callback ----------
app.get('/api/oauth/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send('Missing code');

  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();
    if (!data.ok) return res.status(400).send('OAuth failed: ' + data.error);

    const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
    });
    res.send('Slack OAuth Successful! You can close this tab.');
  } catch (err: any) {
    res.status(500).send('OAuth error: ' + err.message);
  }
});

// ---------- Token Refresh ----------
async function getValidAccessToken() {
  const tokens = readTokens();
  if (!tokens.access_token) throw new Error('Please authenticate first');
  const now = Date.now();
  if (tokens.expires_at && tokens.expires_at > now + 60000) {
    return tokens.access_token;
  }
  if (!tokens.refresh_token) throw new Error('No refresh token found');

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  });

  const data = await response.json();
  if (!data.ok) throw new Error('Token refresh failed: ' + data.error);

  const newExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: newExpiresAt,
  });

  return data.access_token;
}

// ---------- API Endpoints ----------
app.get('/api/channels', async (req, res) => {
  try {
    const token = await getValidAccessToken();
    const slack = new WebClient(token);
    const result = await slack.conversations.list({ types: 'public_channel' });
    res.json({ success: true, channels: result.channels });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { channel, text } = req.body;
    const token = await getValidAccessToken();
    const slack = new WebClient(token);
    const result = await slack.chat.postMessage({ channel, text });
    res.json({ success: true, message: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedule-message', async (req, res) => {
  try {
    const { channel, text, post_at } = req.body;
    const token = await getValidAccessToken();
    const slack = new WebClient(token);
    const result = await slack.chat.scheduleMessage({ channel, text, post_at });
    const scheduled = readJSON(SCHEDULE_PATH);
    scheduled.push({ channel, text, post_at, id: result.scheduled_message_id });
    writeJSON(SCHEDULE_PATH, scheduled);
    res.json({ success: true, message: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/list-scheduled', (req, res) => {
  try {
    const scheduled = readJSON(SCHEDULE_PATH);
    res.json({ success: true, scheduled });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/delete-scheduled/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { channel } = req.query;
    const token = await getValidAccessToken();
    const slack = new WebClient(token);
    await slack.chat.deleteScheduledMessage({
      channel: channel as string,
      scheduled_message_id: id,
    });
    let scheduled = readJSON(SCHEDULE_PATH).filter((msg: any) => msg.id !== id);
    writeJSON(SCHEDULE_PATH, scheduled);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
