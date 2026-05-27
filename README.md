# Monitoring Service MVP

A minimal Node + Vue.js starter that lets a user define:

* one or more URL sources to watch,
* optional login credentials,
* a cron‑like schedule,
* a summary template,
* a destination phone number (WhatsApp),

and that:

1. **Saves** the configuration (`POST /config`),
2. **Lists** existing configs (`GET /configs`),
3. **Runs** a scheduled check on demand (`GET /run/<id>`),
4. **Processes** the sources, builds a short summary, and (placeholder) sends it via WhatsApp.

## Quick start (on a Linux host)

```bash
# 1️⃣ Clone (already done) and enter the folder
cd summary

# 2️⃣ Install dependencies
npm install

# 3️⃣ Create a .env file (optional – defaults are fine)
cp .env.example .env   # edit if you need a different PORT

# 4️⃣ Start the server
npm start
```

The API will be reachable at `http://localhost:10000`.

## Using the UI

Open a browser and navigate to `http://localhost:10000`.  
You will see a tiny Vue‑based UI where you can:

* Enter a **User ID**, **Phone number**, **Schedule**, and **Summary template**.
* Add any number of **Sources** (URL + CSS selector + keywords + optional login).
* Save the configuration.
* List saved monitors and click **Run Now** to trigger an immediate check (the worker logs what it would send).

## Extending for production

* **Persistent state** – the worker currently stores the last‑sent items in `~/.openclaw/monitoring/state/<userId>.json`. In a real deployment you may want a more robust DB.
* **Authentication** – add JWT or API‑key protection to the endpoints.
* **WhatsApp sending** – replace the placeholder `console.log` with a call to the OpenCLaw WhatsApp channel (e.g. `openclaw exec --channel whatsapp --to $PHONE --text "$MSG"`).
* **Task scheduler** – instead of relying on a manual “Run Now”, set up a proper cron (e.g. `node-cron` inside the worker) or integrate with OpenCLaw’s own scheduler (`openclaw cron add`).
* **More advanced parsing** – use headless Chrome / `playwright` for JS‑heavy pages, or store snapshots for diffing.

## Deploy to Render.com

1. Push this repo to a public GitHub repo (or a private one with `openclaw‑tui` as a collaborator).  
2. In Render, create a **Web Service**, connect it to the GitHub repo, and set the **Build Command** to `npm install && npm run start`.  
3. Add a **Environment Variable** `PORT` (or rely on the default from `.env.example`).  
4. Render will serve the built static files automatically (the `express.static` middleware already serves `./public`).

---

Feel free to open an issue or PR if you need more features! 🚀