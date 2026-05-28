# Nischen‑Monitoring‑Service

A reusable OpenClaw‑based monitoring service that can be offered to other users.

## 1. Task Definition (JSON)

```json
{
  "id": "price‑watch‑001",
  "url": "https://example‑shop.at/product/123",
  "login": {
    "user": "my_user",
    "pwd": "my_secret_pwd"
  },
  "selector": "#price",
  "checkInterval": "0 6 * * *",
  "summaryTemplate": "Preis‑Check: {{price}} €",
  "notifyTo": "+4369917165983"
}
```

## 2. Cron Job

```bash
openclaw cron add \
  -j price‑watch‑001 \
  -s '{"id":"price‑watch‑001","schedule":"0 6 * * *","payload":"monitor-run"}' \
  -d '{"kind":"systemEvent","text":"Run price‑watch‑001"}' \
  -t session:monitor‑jobs
```

## 3. Worker Script (monitor‑run)

1. Load the JSON task.  
2. Open the URL with `browser` (login if `login` provided).  
3. Snapshot the page, extract the element defined by `selector`.  
4. Render `summaryTemplate` with the extracted value.  
5. Send the summary to `notifyTo` via WhatsApp (`openclaw gateway send`).

## 4. UI (Render.com)

- **Frontend:** Vue 3 + Vuetify (forms for task creation, schedule picker, template preview).  
- **Backend:** Node/Express exposing `/tasks` CRUD endpoints.  
- **Storage:** JSON files in `tasks/` (git‑tracked).  
- **Auth:** GitHub‑OAuth + personal access token stored as secret.

## 5. Security

- Login credentials stored in `secrets/`, mode `600`.  
- Worker runs in isolated session (`session:monitor‑jobs`).  
- All logs written to `logs/` with rotation.

## 6. Deployment

1. Push this repo to GitHub.  
2. Connect Render services (frontend & backend).  
3. Set `OPENCLAW_TOKEN` env var on Render.  
4. Deploy – the UI is now available at the Render URL.

---

This scaffold gives you a fully functional, configurable monitoring service that can be replicated for any URL / selector / schedule you need, with automatic cron execution and WhatsApp notifications.