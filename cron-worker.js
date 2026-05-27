#!/usr/bin/env node
/**
 * Cron worker that processes a single user's monitoring config and sends a WhatsApp summary.
 *
 * Usage: node cron-worker.js <userId>
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Helper to load user config
function loadConfig(userId) {
  const cfgPath = path.resolve(process.env.HOME || '.', `.openclaw/monitoring/configs/${userId}.json`);
  if (!fs.existsSync(cfgPath)) {
    console.error(`❌ Config file not found for user ${userId}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

// Helper to store state (new items already sent) in ./state/<userId>.json
function getStatePath(userId) {
  const stateDir = path.resolve(process.env.HOME || '.', `.openclaw/monitoring/state`);
  fs.mkdirSync(stateDir, { recursive: true });
  return path.join(stateDir, `${userId}.json`);
}
function loadState(userId) {
  try {
    return JSON.parse(fs.readFileSync(getStatePath(userId), 'utf8'));
  } catch {
    return {};
  }
}
function saveState(userId, state) {
  saveFile(getStatePath(userId), JSON.stringify(state, null, 2));
}
function saveFile(p, content) {
  fs.writeFileSync(p, content, 'utf8');
}

// Simple placeholder for login (basic auth)
async function fetchWithLogin(url, login) {
  const auth = 'Basic ' + Buffer.from(`${login.user}:${login.pass}`).toString('base64');
  return axios.get(url, { headers: { Authorization: auth } });
}
async function fetchUrl(url) {
  return axios.get(url);
}

// Summarize new items based on keywords
function filterItems(items, keywords) {
  const lower = items.map(i => i.toLowerCase());
  return items.filter(txt => keywords.some(kw => lower.includes(kw.toLowerCase())));
}

// Build final message from template
function buildMessage(cfg, items) {
  const template = cfg.summaryTemplate || '{{title}}\n\n{{body}}';
  // Very naive placeholder replacement
  let msg = template;
  // Replace generic placeholders
  msg = msg.replace('{{numNew}}', items.length);
  const highlightLines = items.slice(0, 3).map(i => `- ${i}`).join('\n');
  msg = msg.replace('{{highlights}}', highlightLines);
  return msg;
}

// Main
(async () => {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node cron-worker.js <userId>');
    process.exit(1);
  }

  const cfg = loadConfig(userId);
  const prevState = loadState(userId) || {};

  let allNewItems = [];

  for (const src of cfg.sources) {
    if (!src.enabled) continue;

    let response;
    try {
      if (src.login) {
        response = await fetchWithLogin(src.url, src.login);
      } else {
        response = await fetchUrl(src.url);
      }
    } catch (e) {
      console.error(`⚠️  Failed to fetch ${src.url}: ${e.message}`);
      continue;
    }

    const $ = cheerio.load(response.data);
    const extracted = $(src.selector).map((_, el) => $(el).text().trim()).get();

    const filtered = filterItems(extracted, src.keywords || []);
    // Determine which items are new (not seen before)
    const newItems = filtered.filter(txt => !prevState[src.url]?.includes(txt));
    if (newItems.length) {
      allNewItems.push(...newItems);
      // Update state to remember what we've sent for this source
      prevState[src.url] = prevState[src.url] || [];
      prevState[src.url].push(...newItems);
      // Keep only last 200 chars to avoid huge state files
      saveState(userId, prevState);
    }
  }

  if (allNewItems.length) {
    const msg = buildMessage(cfg, allNewItems);
    console.log(`📝 Summary for ${userId}:\n${msg}`);

    // ---- Placeholder: send via WhatsApp ----
    // In a real deployment you would use the OpenCLaw WhatsApp channel
    // or an external provider. Here we just log the intended recipient.
    const recipient = cfg.phone;
    console.log(`📲 Would send WhatsApp message to ${recipient}`);

    // Example of how you could invoke OpenCLaw to send a message:
    // const { exec } = require('child_process');
    // exec(`openclaw exec --channel whatsapp --to ${recipient} --text "${msg}"`);

  } else {
    console.log(`✅ No new items for ${userId}`);
  }
})();