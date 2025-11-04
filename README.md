# Slipyme API (`api.slipyme.com`)

HTTPS Express API — contact, job applications, email subscriptions, and social stats/feeds.  
Sends structured **Discord embeds** and persists data in simple **JSON files**.

> **Stack:** Node.js • TypeScript • Express • HTTPS • Bearer Auth • discord.js • axios • dotenv • cors  
> **Social Integrations:** YouTube Data API v3, Instagram/Facebook Graph API

---

## ✨ Features

- 🔒 **Bearer Token** required for all `/api` endpoints
- 🌐 **HTTPS** server + **HTTP→HTTPS** redirect (ports 9128 / 8080)
- 🗂️ **JSON file** storage in `jsons/` (no RDBMS)
- ♻️ **Caching & Cron**: daily refresh for social stats/feeds
- 🔔 **Discord** notifications via rich embeds
- 🧰 Clean layering: Routes → Controllers → Repositories → Libs/Models

---

## 🧭 Table of Contents

- [Architecture & Structure](#-architecture--structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running](#-running)
- [API Reference](#-api-reference)
- [Security Notes](#-security-notes)
- [Logging & Rate Limiting](#-logging--rate-limiting)
- [Docker / PM2](#-docker--pm2)
- [Contributing & Roadmap](#-contributing--roadmap)
- [License](#-license)

---

## 🏗️ Architecture & Structure

```
src/
  app.ts                 # App entry: HTTPS server, auth, HSTS, cron, router mount
  routes/
    SocialRoutes.ts      # GET /api/social/stats, GET /api/social/feeds
    MailAddRoutes.ts     # POST /api/mail
    JobApplicationRoutes.ts # POST /api/job
    ContactRoutes.ts     # POST /api/contact
  controllers/
    SocialController.ts
    MailAddController.ts
    JobApplicationController.ts
    ContactController.ts
  repositories/
    SocialRepository.ts  # IG/YT fetch + JSON cache (social.json, feeds.json)
    MailAddRepository.ts # jsons/mails.json + Discord embed
    JobApplicationRepository.ts # jsons/applications.json + Discord embed
    ContactRepository.ts # jsons/contact.json + Discord embed
  models/
    Socials.ts           # SocialSnapshot, MediaItem, IgStats
    Mail.ts              # Mail
    JobApplication.ts    # JobApplication, Job, Education
    Contact.ts           # Contact
  middlewares/
    loggerMiddleware.ts  # Append request logs to jsons/logs.json
    rateLimitMiddleware.ts # In-memory helper (wire per-route)
  libs/
    config.ts            # ENV loader
    validateModel.ts     # required field checks
    fileHandler.ts       # append/read JSON utilities
    date.ts              # date helpers
    sendEmbed.ts         # Discord embed utility
    social/
      instagram.ts, youtube.ts, fbToken.ts, tokens.ts
  cr/
    certificate.crt      # TLS certificate
    private.key          # TLS private key
jsons/                    # runtime data: social.json, feeds.json, mails.json, 
                          # applications.json, contact.json, logs.json, ig_tokens.json
start.bat                 # Windows bootstrap
```

**Flow:** `Routes → Controllers → Repositories → (Files / External services)`  
Controllers validate payloads and call repos; repos persist JSON and notify Discord. Social repo fetches IG/YT and caches results.

---

## ⚙️ Installation

Prerequisites:
- Node.js LTS
- Valid TLS keypair at `src/cr/certificate.crt` and `src/cr/private.key`
- `.env` file (see below)

Install:
```bash
npm install
```

Windows helper:
```bat
start.bat
```

> `start.bat` loads `.env`, verifies TLS files, ensures ts-node, then starts the app.

---

## 🔐 Environment Variables

Create a `.env` from `.env.example`:

```ini
# Core
API_KEY=changeme                       # Bearer Token for all /api routes
LOG_LEVEL=info                         # debug|info|warn|error
LOG_PRETTY=1                           # 1 to pretty-print logs

# Discord
BOT_TOKEN=your-discord-bot-token

# YouTube
YT_API_KEY=your-youtube-api-key
YT_CHANNEL_ID=UCxxxxxxxxxxxxxxxx

# Instagram / Facebook
IG_USER_ID=1784xxxxxxxxxxxxxx
IG_ACCESS_TOKEN=your-instagram-access-token
FB_APP_ID=xxxxxxxx
FB_APP_SECRET=xxxxxxxx
SYSTEM_USER_TOKEN=prefer-stable-long-lived-token
PAGE_ACCESS_TOKEN=optional-page-access-token
```

> **Ports (hardcoded):** HTTPS **9128**, HTTP redirect **8080**.  
> **TLS files:** `src/cr/certificate.crt`, `src/cr/private.key`.

---

## ▶️ Running

Development:
```bash
npm run start
# ts-node src/app.ts
```

Production (example):
```bash
NODE_ENV=production npm run start
```

Base URL:
```
HTTPS: https://<host>:9128
All routes live under /api
```

---

## 📚 API Reference

**Auth:** Include `Authorization: Bearer <API_KEY>` on every request. Otherwise: `401`.

### GET `/api/social/stats`

Returns IG followers/media count and YT subscribers/views (cached; auto-refreshed daily).

```bash
curl -k -H "Authorization: Bearer $API_KEY"   "https://localhost:9128/api/social/stats"
```

**200 Example**
```json
{
  "instagram": { "followers": 12345, "mediaCount": 678 },
  "youtube":   { "subs": 54321, "views": 987654 },
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

**401**
```json
{ "status": "error", "message": "Unauthorized: Invalid token" }
```

### GET `/api/social/feeds?igLimit=6&ytMax=6&ytChannelId=...`

Recent IG posts and YT videos.

```bash
curl -k -H "Authorization: Bearer $API_KEY"   "https://localhost:9128/api/social/feeds?igLimit=6&ytMax=6"
```

**200 (success)**
```json
{
  "data": {
    "instagram": [
      {
        "id": "123",
        "media_type": "IMAGE",
        "media_url": "https://...",
        "permalink": "https://instagram.com/p/...",
        "caption": "Post caption",
        "timestamp": "2024-01-01T09:00:00.000Z"
      }
    ],
    "youtube": [
      {
        "id": "abc123",
        "title": "Video title",
        "publishedAt": "2024-01-01T08:00:00.000Z",
        "thumbnail": "https://i.ytimg.com/...",
        "views": 1000,
        "likes": 50,
        "comments": 10
      }
    ]
  }
}
```

**200 (fallback on upstream error)**
```json
{ "data": { "instagram": [], "youtube": [] } }
```

### POST `/api/contact`

```bash
curl -k -X POST "https://localhost:9128/api/contact"   -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json"   -d '{
    "name":"Jane Doe",
    "email":"jane@example.com",
    "subject":"Partnership",
    "message":"We would love to collaborate.",
    "channel":"website",
    "phone":"+1-555-555-5555"
  }'
```

**200**
```json
{ "message": "İletişim bilgileri başarıyla gönderildi." }
```

**400 (missing field)**
```json
{ "error": "Lütfen zorunlu alanları doldurun." }
```

### POST `/api/mail`

Subscribe an email; persists and notifies Discord.

```bash
curl -k -X POST "https://localhost:9128/api/mail"   -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json"   -d '{ "email":"test@example.com" }'
```

### POST `/api/job`

Creates a job application; appends to `jsons/applications.json` and sends a Discord embed.

```bash
curl -k -X POST "https://localhost:9128/api/job"   -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json"   -d '{
    "name":"John",
    "email":"john@example.com",
    "jobs":[{ "company":"X", "title":"Dev", "start":"2022-01-01" }],
    "educations":[{ "school":"Y", "degree":"BS", "gradYear":2020 }]
  }'
```

> **Note:** Actual response messages are in **Turkish** in the codebase.

---

## 🛡️ Security Notes

- **Bearer Token** is mandatory; do not expose it on the client.
- **HSTS** header and **HTTP→HTTPS** redirect are enabled.
- Ensure proper **Discord channel permissions**.
- **Do not commit TLS keys**; mount or inject via secrets in deployment.

---

## 📝 Logging & Rate Limiting

- Each request is appended to `jsons/logs.json` via `loggerMiddleware`.
- `rateLimitMiddleware` exists but must be **wired per-route**:
  ```ts
  router.post("/", rateLimit(3, 300000), handler);
  ```

---

## 🐳 Docker / PM2

**Dockerfile** and **docker-compose.yml** are provided. Mount TLS files and `jsons/` as volumes.

```bash
docker compose up -d --build
```

**PM2** (example):
```bash
npm i -g pm2
pm2 start "npm -- run start" --name slipyme-api
pm2 save && pm2 startup
```

---

## 🤝 Contributing & Roadmap

**Contributing**
- When adding a route, export `export default { name: "/path", router }` from the module; `src/app.ts` will auto-mount it.
- For persistence, use `jsons/` via `fileHandler.ts`.
- Wire `rateLimit()` on write-heavy routes (`/mail`, `/contact`, `/job`).

---

## 📜 License

**GPL-3.0** © 2025 — Slipyme / SlipBey.  
You may use, modify, and distribute under the terms of the GPLv3 license.
See [`LICENSE`](./LICENSE) for details.

---

## 👨‍💻 Author

**SlipBey**  
[Discord](https://slip.slipyme.com/discord) • [LinkedIn](https://slip.slipyme.com/linkedin) • [Website](https://slip.slipyme.com)