require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// Serve static assets (Vue front‑end) from ./public
app.use(express.static(path.resolve(__dirname, 'public'));

// Directory where per-user configs will be stored
const CFG_DIR = path.resolve(process.env.HOME || '.', '.openclaw/monitoring/configs');
fs.mkdirSync(CFG_DIR, { recursive: true });

/* ---------- 1️⃣ Save a new config ---------- */
app.post('/config', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).send({ error: 'userId required' });
  const cfgPath = path.join(CFG_DIR, `${userId}.json`);
  fs.writeFileSync(cfgPath, JSON.stringify(req.body, null, 2));
  res.send({ status: 'saved' });
});

/* ---------- 2️⃣ List all configs ---------- */
app.get('/configs', (req, res) => {
  const files = fs.readdirSync(CFG_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.slice(0, -5)); // strip .json

  const configs = files.map(fn => {
    const content = fs.readFileSync(path.join(CFG_DIR, fn + '.json'), 'utf8');
    return JSON.parse(content);
  });
  res.send(configs);
});

/* ---------- 3️⃣ Run a config now (for testing) ---------- */
app.get('/run/:userId', async (req, res) => {
  const { userId } = req.params;
  const cfgPath = path.join(CFG_DIR, `${userId}.json`);
  if (!fs.existsSync(cfgPath)) return res.status(404).send({ error: 'not found' });

  const { exec } = require('child_process');
  exec(`node ${path.resolve(__dirname, 'cron-worker.js')} ${userId}`, (err) => {
    if (err) console.error(err);
    res.send({ status: 'triggered' });
  });
});

/* ---------- 4️⃣ Health check ---------- */
app.get('/', (_, res) => res.send('OK'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 monitoring-service listening on ${PORT}`));