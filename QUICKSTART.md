# ⚡ Quick Start Guide (5 Minutes)

**Goal**: Deploy the bot and send your first movie upload.

---

## Prerequisites (Already Have?)

- ✅ Cloudflare account (free tier OK)
- ✅ Node.js 18+
- ✅ Telegram bot from @BotFather
- ✅ Two channels (make them now if not ready)

---

## 5-Step Quick Start

### Step 1: Get Your IDs (2 min)

**Telegram Bot Token**

1. Open @BotFather
2. `/start` → `/mybots` → select your bot → copy token
3. Save: `BOT_TOKEN=123456:ABC-DEF...`

**Channel IDs**

1. Create DATABASE_CHANNEL (private), add bot as admin
2. Create MAIN_CHANNEL (public/private), add bot as admin
3. Send any message in each channel
4. Forward to @getmyid_bot to get IDs
5. Save: `DATABASE_CHANNEL_ID=-1001234567890` and `MAIN_CHANNEL_ID=-1001234567891`

**Bot Username**

1. Go to @BotFather, select bot, "Edit Bot"
2. Check Bot name/username in the "About" section
3. Save: `BOT_USERNAME=my_movie_bot`

### Step 2: Setup Cloudflare (2 min)

```bash
# Install wrangler globally
npm install -g @cloudflare/wrangler

# Login (opens browser)
wrangler login

# Create D1 database
wrangler d1 create telegram-uploader-bot
# Copy the database_id: "XXX-XXXX-XXXX..."

# Create KV namespace
wrangler kv:namespace create DB_KV
# Copy the id: "xxxxxxxxxxxxxxxx"

wrangler kv:namespace create DB_KV --preview
# Copy the preview_id: "yyyyyyyyyyyyyyyy"
```

### Step 3: Configure Files (30 sec)

**Update `wrangler.toml`** (replace values from Step 1 & 2):

```toml
[[kv_namespaces]]
binding = "DB_KV"
id = "xxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyy"

[[d1_databases]]
binding = "DB_D1"
database_name = "telegram-uploader-bot"
database_id = "XXX-XXXX-XXXX..."

[env.production.vars]
BOT_TOKEN = "123456:ABC-DEF..."
BOT_USERNAME = "my_movie_bot"
MAIN_CHANNEL_ID = "-1001234567890"
DATABASE_CHANNEL_ID = "-1001234567891"
```

### Step 4: Deploy (30 sec)

```bash
# Install dependencies
npm install

# Initialize database
npm run db:migrate

# Deploy
npm run deploy
```

Copy the worker URL from the output (e.g., `https://telegram-uploader-bot.YOUR_SUBDOMAIN.workers.dev`)

### Step 5: Configure Webhook (30 sec)

```bash
export BOT_TOKEN="123456:ABC-DEF..."
export WORKER_URL="https://telegram-uploader-bot.YOUR_SUBDOMAIN.workers.dev"

curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WORKER_URL}\"}"

# Verify (should say "has_custom_certificate": false, "pending_update_count": 0)
curl https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo
```

---

## 🎬 Test It Now!

### 1. Upload Your First Movie

```
You:  /newmovie
Bot:  "Please enter the movie title:"

You:  Test Movie
Bot:  "Title saved. Send banner image"

You:  [send photo]
Bot:  "Banner saved! Send videos"

You:  [send a video]
Bot:  "Video 1 saved. Quality: 1080p"

You:  /finish
Bot:  "Movie uploaded successfully!
      Movie posted to MAIN_CHANNEL"
```

### 2. Download as User

1. Go to MAIN_CHANNEL
2. Click the movie post
3. Click "📥 Download" button
4. Bot sends you the video!

---

## ✅ Done!

Your bot is live! 🚀

**What's next?**

- Read [README.md](README.md) for complete features
- Check [TESTING.md](TESTING.md) for advanced testing
- Review [API.md](API.md) for technical details
- See [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting

---

## 🆘 Quick Troubleshooting

### Bot Not Responding

```bash
# Check webhook
curl https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo

# If not set, run Step 5 again

# Check logs
wrangler tail
```

### Command Rejected

```bash
# Verify you're admin of DATABASE_CHANNEL
# Clear cache (if changed permissions)
wrangler kv:key delete --namespace-id ${KV_ID} "admin:${YOUR_USER_ID}"
```

### Database Error

```bash
# Check D1 tables
wrangler d1 execute telegram-uploader-bot \
  --command "SELECT name FROM sqlite_master WHERE type='table';"

# Should show: movies, video_files
```

---

## 📊 What You Get

✅ **Complete production-ready bot**

- Admin upload workflow
- User download system
- Security & caching
- Error handling
- Auto quality detection

✅ **Full documentation**

- Setup guide
- Testing procedures
- API reference
- Deployment checklist

✅ **Ready to scale**

- Cloudflare edge deployment
- D1 database
- KV caching
- No server management

---

**Questions?** Check the docs or review [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)!
