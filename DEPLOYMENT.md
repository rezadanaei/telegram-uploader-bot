# 🚀 Deployment Guide

Complete step-by-step guide to deploy the Telegram Movie Uploader Bot on Cloudflare Workers.

## Prerequisites

- Cloudflare account (free tier supported)
- Node.js 18+ and npm
- Telegram bot created via @BotFather
- Two Telegram channels (DATABASE_CHANNEL and MAIN_CHANNEL)

## Step 1: Create Telegram Bot

1. Open Telegram and find [@BotFather](https://t.me/botfather)
2. Send `/start`
3. Send `/newbot` and follow instructions
4. Save your `BOT_TOKEN` (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
5. Send `/mybots` → select your bot → "Edit Bot" → "Edit Commands"
6. Paste the following commands:
   ```
   newmovie - Upload a new movie
   finish - Complete movie upload
   ```

## Step 2: Create Telegram Channels

### Database Channel (for admin verification)

1. Create a **private channel** (e.g., `@my_database_channel`)
2. Add the bot as an **Admin** member
3. Get the channel ID:
   - Send any message in the channel
   - Forward it to @getmyid_bot
   - Note the channel ID (negative number starting with -100)

### Main Channel (for publishing movies)

1. Create a **channel** (public or private, e.g., `@my_movies_channel`)
2. Add the bot as an **Admin** member
3. Get the channel ID (same process as above)

## Step 3: Setup Cloudflare

### Create D1 Database

```bash
# Login to Cloudflare
npm install -g @cloudflare/wrangler

# Create D1 database
wrangler d1 create telegram-uploader-bot

# Copy the database_id from the output
# Update wrangler.toml with this ID
```

### Create KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create DB_KV
wrangler kv:namespace create DB_KV --preview

# Copy the namespace IDs from the output
# Update wrangler.toml with these IDs
```

## Step 4: Configure wrangler.toml

Open `wrangler.toml` and update:

```toml
name = "telegram-uploader-bot"
main = "src/index.js"
compatibility_date = "2024-06-11"

[[kv_namespaces]]
binding = "DB_KV"
id = "YOUR_KV_NAMESPACE_ID"           # From: wrangler kv:namespace create
preview_id = "YOUR_KV_PREVIEW_ID"     # From: wrangler kv:namespace create --preview

[[d1_databases]]
binding = "DB_D1"
database_name = "telegram-uploader-bot"
database_id = "YOUR_D1_DATABASE_ID"   # From: wrangler d1 create

[env.production.vars]
BOT_TOKEN = "YOUR_BOT_TOKEN"                  # From: @BotFather
BOT_USERNAME = "your_bot_username"            # Your bot username
MAIN_CHANNEL_ID = "YOUR_MAIN_CHANNEL_ID"      # Negative number, e.g., -1001234567890
DATABASE_CHANNEL_ID = "YOUR_DATABASE_CHANNEL" # Negative number
ADMIN_CACHE_TTL = "3600"
```

## Step 5: Initialize Database Schema

```bash
# Run migrations
npm run db:migrate

# Verify tables created
wrangler d1 execute telegram-uploader-bot --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## Step 6: Deploy to Cloudflare

```bash
# Test locally (optional)
npm run dev

# Deploy to production
npm run deploy
```

Note: Copy your Worker URL from the deployment output (e.g., `https://telegram-uploader-bot.YOUR_SUBDOMAIN.workers.dev`)

## Step 7: Configure Telegram Webhook

```bash
# Replace with your actual values
export BOT_TOKEN="YOUR_BOT_TOKEN"
export WORKER_URL="https://telegram-uploader-bot.YOUR_SUBDOMAIN.workers.dev"

# Set webhook
curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WORKER_URL}\"}"

# Verify webhook is set
curl https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo
```

Expected response:

```json
{
  "ok": true,
  "result": {
    "url": "https://telegram-uploader-bot.YOUR_SUBDOMAIN.workers.dev",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": null,
    "allowed_updates": []
  }
}
```

## Step 8: Test the Bot

### Test Admin Functions

1. Go to your DATABASE_CHANNEL and verify the bot is an admin
2. Open a private chat with your bot
3. Send `/newmovie`
4. Follow the workflow to upload a test movie
5. Verify the movie appears in MAIN_CHANNEL

### Test User Functions

1. Click the movie link posted in MAIN_CHANNEL
2. Select a quality option
3. Verify the video is sent

## Troubleshooting

### "Bot token invalid"

- Double-check BOT_TOKEN from @BotFather
- Ensure no extra spaces or characters
- Token format: `123456:ABC-DEF...`

### "Channel not found"

- Verify channel IDs are correct (should be negative)
- Ensure bot is admin of both channels
- Check channels aren't deleted

### "Webhook not working"

```bash
# Get webhook info
curl https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo

# If last_error_date shows errors, clear and reset
curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook

# Reset webhook
curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WORKER_URL}\"}"
```

### Database connection errors

```bash
# Check D1 binding
wrangler d1 list databases

# Check KV binding
wrangler kv:key list --namespace-id YOUR_KV_ID

# Reinitialize schema if needed
wrangler d1 execute telegram-uploader-bot --file=./schema.sql
```

### Bot not responding to commands

1. Check Cloudflare Worker logs: `wrangler tail`
2. Verify bot is in DATABASE_CHANNEL as admin
3. Clear KV cache manually (admin status cache)
4. Retry command

## Environment Variables Cheat Sheet

| Variable              | Example             | Source                                     |
| :-------------------- | :------------------ | :----------------------------------------- |
| `BOT_TOKEN`           | `123456:ABC-DEF...` | @BotFather `/start`                        |
| `BOT_USERNAME`        | `my_movie_bot`      | @BotFather bot settings                    |
| `DATABASE_CHANNEL_ID` | `-1001234567890`    | @getmyid_bot                               |
| `MAIN_CHANNEL_ID`     | `-1001234567891`    | @getmyid_bot                               |
| `DB_KV`               | binding             | `wrangler kv:namespace create DB_KV`       |
| `DB_D1`               | binding             | `wrangler d1 create telegram-uploader-bot` |

## Monitoring & Logs

### View Worker Logs

```bash
wrangler tail
```

### Check KV Data

```bash
# List all keys (for debugging)
wrangler kv:key list --namespace-id YOUR_KV_ID

# Get specific key
wrangler kv:key get --namespace-id YOUR_KV_ID "admin:USER_ID"
```

### Check D1 Data

```bash
# Query movies
wrangler d1 execute telegram-uploader-bot --command "SELECT * FROM movies;"

# Query videos
wrangler d1 execute telegram-uploader-bot --command "SELECT * FROM video_files;"
```

## Scaling & Optimization

- **Bot can handle unlimited channels and admins**
- **Admin cache (KV) prevents API spam**
- **D1 auto-scales with Cloudflare**
- **Video file IDs cached (no re-upload)**

## Security Checklist

- [ ] Bot token stored securely in Cloudflare (not in git)
- [ ] Channel IDs verified as correct
- [ ] Database channel admin access verified
- [ ] Webhook URL points to correct Worker
- [ ] .gitignore excludes .env and sensitive files
- [ ] Non-admin users cannot upload
- [ ] Proper error handling (no token leaks)

## Next Steps

- Monitor logs for errors
- Test with multiple admins and users
- Add additional quality levels if needed
- Implement additional features (batch upload, analytics, etc.)
- Set up alerting for errors

---

**Need Help?**

- Check README.md for architecture details
- Review individual module documentation
- Check Cloudflare Workers troubleshooting
- Check Telegram Bot API documentation
