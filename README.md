# 🎬 Telegram Movie Uploader Bot - Cloudflare Workers

Production-ready, modular Telegram Bot for Movies/Series Upload & Download running on Cloudflare Workers with D1 Database and KV Cache.

## 🎯 Features

- **🔐 Admin-Only Access**: Only admins of a designated DATABASE_CHANNEL can upload movies
- **⚡ Smart Caching**: Admin status cached in Cloudflare KV with 1-hour TTL to optimize API calls
- **🎥 Auto Quality Detection**: Automatically detects video quality (1080p/720p/480p) based on resolution
- **📊 Multi-Quality Support**: Store and serve multiple quality versions of the same movie
- **🔗 Deep Linking**: Generate user-friendly download links with inline quality selection
- **💾 Persistent Storage**: D1 Database for movies and video metadata
- **📸 Banner Management**: Store and display movie banner images
- **🚀 Production-Ready**: Modern ES6 code, async/await, comprehensive error handling

## 📋 Prerequisites

1. **Cloudflare Account** with:
   - Cloudflare Workers enabled
   - D1 Database access
   - KV Namespace access
2. **Telegram Bot** created via [@BotFather](https://t.me/botfather)

3. **Node.js & npm** (for local development)

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Cloudflare D1 Database

```bash
# Create a new D1 database
wrangler d1 create telegram-uploader-bot

# Initialize the schema
wrangler d1 execute telegram-uploader-bot --file=./schema.sql
```

### 3. Create KV Namespace

```bash
# Create a new KV namespace
wrangler kv:namespace create DB_KV
wrangler kv:namespace create DB_KV --preview

# Note the namespace IDs for wrangler.toml
```

### 4. Configure wrangler.toml

Update `wrangler.toml` with:

```toml
[[kv_namespaces]]
binding = "DB_KV"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_ID"

[[d1_databases]]
binding = "DB_D1"
database_name = "telegram-uploader-bot"
database_id = "YOUR_D1_DATABASE_ID"

[env.production.vars]
BOT_TOKEN = "YOUR_BOT_TOKEN"
BOT_USERNAME = "your_bot_username"
MAIN_CHANNEL_ID = "YOUR_MAIN_CHANNEL_ID"
DATABASE_CHANNEL_ID = "YOUR_DATABASE_CHANNEL_ID"
ADMIN_CACHE_TTL = "3600"
```

### 5. Get Required IDs

- **BOT_TOKEN**: From [@BotFather](https://t.me/botfather) - `/start` → `/mybots` → select bot → copy token
- **BOT_USERNAME**: From [@BotFather](https://t.me/botfather) - Your bot username (e.g., `my_movie_bot`)
- **DATABASE_CHANNEL_ID**: Create a private channel, add the bot as admin, get the channel ID (usually negative)
- **MAIN_CHANNEL_ID**: Create a public/private channel for publishing movies, get the channel ID

### 6. Deploy to Cloudflare Workers

```bash
# Development testing
npm run dev

# Production deployment
npm run deploy
```

### 7. Configure Telegram Webhook

```bash
# Set webhook URL (replace YOUR_WORKER_URL)
curl -X POST https://api.telegram.org/bot$BOT_TOKEN/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://telegram-uploader-bot.YOUR_SUBDOMAIN.workers.dev"}'

# Verify webhook
curl https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo
```

## 📚 Architecture & Modules

### Core Modules

- **`telegram.js`** - Telegram API wrapper with robust error handling
- **`security.js`** - Admin verification with KV caching
- **`db.js`** - D1 database operations (movies, videos, queries)
- **`kv.js`** - KV session management (states, draft data)
- **`admin.js`** - Admin workflow (/newmovie, state transitions, /finish)
- **`user.js`** - User workflow (deep links, quality selection, downloads)
- **`utils.js`** - Helper functions (quality detection, formatting, validation)
- **`index.js`** - Main request handler and router

### Database Schema

**movies table**

```
id (AI)              - Primary key
title                - Movie title
banner_file_id       - Telegram file ID of banner image
max_quality          - Highest available quality (1080/720/480)
created_at           - Creation timestamp
```

**video_files table**

```
id (AI)              - Primary key
movie_id (FK)        - Reference to movies.id
quality              - Video quality (1080/720/480)
telegram_file_id     - Telegram file ID of video
unique_msg_id        - Unique message ID for tracking
created_at           - Creation timestamp
```

## 🎬 Admin Workflow

### Upload a Movie

1. **Start**: Send `/newmovie` command
2. **Title**: Enter movie title (2-100 characters)
3. **Banner**: Send the movie banner image
4. **Videos**: Send video files sequentially (auto-detects quality)
5. **Finish**: Send `/finish` to complete upload

### State Transitions

```
/newmovie
    ↓
AWAITING_TITLE (waiting for title text)
    ↓
AWAITING_BANNER (waiting for photo)
    ↓
AWAITING_VIDEOS (waiting for video files)
    ↓
/finish
    ↓
[Movie saved to D1, posted to MAIN_CHANNEL]
```

### Quality Auto-Detection

| Video Resolution | Detected Quality |
| :--------------- | :--------------- |
| 1920x1080+       | 1080p            |
| 1280x720+        | 720p             |
| Other            | 480p (default)   |

## 👥 User Workflow

### Download a Movie

1. **Receive Link**: User gets deep link to bot with `/start movie_${movieId}`
2. **View**: Bot sends banner with available quality options
3. **Select**: User clicks desired quality button
4. **Download**: Video sent instantly using cached Telegram file ID (no re-upload)

### Example Deep Link

```
https://t.me/my_movie_bot?start=movie_42
```

## 🔒 Security Features

### Admin Verification

- Only admins of `DATABASE_CHANNEL_ID` can execute commands
- Non-admin messages are silently ignored
- Admin status is cached in KV for 1 hour to minimize API calls
- Cache can be invalidated on demand

### Access Control

- `/start movie_*` links are public (user download)
- `/newmovie`, `/finish` commands require admin status
- State management is per-user and isolated

## 📊 Performance & Optimization

### KV Caching Strategy

```
Admin Status Cache (1 hour TTL):
  Key: admin:${userId}
  Value: 'true' | 'false'
  Purpose: Minimize getChatMember API calls

Draft Session Storage:
  state:${userId}                  - Current state
  draft:${userId}:title            - Movie title
  draft:${userId}:banner           - Banner file ID
  draft:${userId}:video_count      - Total videos
  draft:${userId}:v_${n}_quality   - Video quality
  draft:${userId}:v_${n}_fileId    - Video file ID
  draft:${userId}:v_${n}_msgId     - Message ID
  Purpose: Temporary storage during upload workflow
```

### Database Indexes

Optimized queries with indexes on:

- `video_files.movie_id` - Fast movie video lookup
- `video_files.quality` - Quick quality filtering
- `movies.created_at` - Timeline queries

## 🚀 Deployment Checklist

- [ ] D1 database created and schema initialized
- [ ] KV namespace created with correct IDs
- [ ] `wrangler.toml` configured with all environment variables
- [ ] Telegram bot token obtained and configured
- [ ] Database and Main channels created with bot as admin
- [ ] Worker deployed to Cloudflare
- [ ] Webhook URL configured in Telegram
- [ ] Test admin upload workflow
- [ ] Test user download workflow

## 🐛 Troubleshooting

### Bot Not Responding

1. Check webhook: `curl https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo`
2. Verify token is correct in `wrangler.toml`
3. Check Cloudflare Workers logs: `wrangler tail`

### Admin Commands Not Working

1. Verify bot is admin of `DATABASE_CHANNEL_ID`
2. Ensure user sending command is admin of that channel
3. Check KV namespace is properly bound
4. Clear cache: Manually delete admin cache key in KV dashboard

### Database Errors

1. Verify D1 database ID in `wrangler.toml`
2. Check schema initialized: `wrangler d1 list tables telegram-uploader-bot`
3. Review Cloudflare D1 dashboard for query errors

### Video Quality Not Detected

1. Verify video metadata includes width/height
2. Check `detectQuality()` function in `utils.js`
3. Manually override quality in `/finish` workflow

## 📝 API Reference

### Telegram Commands

```
/newmovie    - Start movie upload workflow (admin only)
/finish      - Complete and publish movie (admin only)
/start       - Display welcome or movie download page
```

### Callback Queries

```
download_${movieId}_${quality}   - Handle quality selection
```

### Environment Variables

```
BOT_TOKEN              - Telegram bot API token
BOT_USERNAME           - Bot username for deep links
MAIN_CHANNEL_ID        - Channel for publishing movies
DATABASE_CHANNEL_ID    - Channel for admin verification
ADMIN_CACHE_TTL        - Cache expiration in seconds (default: 3600)
```

## 🔄 Error Handling

All modules implement try-catch blocks with:

- Structured error logging
- User-friendly error messages
- Graceful degradation
- No sensitive data exposure

## 📦 Code Quality

- **ES6 Modules**: Modern module system
- **Async/Await**: Clean asynchronous code
- **Type Safety**: Consistent parameter validation
- **Documentation**: Comprehensive JSDoc comments
- **Modularity**: Separated concerns in distinct files
- **Scalability**: Ready for multi-tenant expansion

## 🎓 Example Workflow

### Upload Scenario

```bash
# Admin starts upload
Admin: /newmovie
Bot: "Please enter the movie title:"

Admin: Inception
Bot: "Title saved. Now send the banner image"

Admin: [sends image]
Bot: "Banner saved! Send video files one by one. Send /finish when done."

Admin: [sends 1080p video]
Bot: "Video 1 saved. Quality: 1080p. Send next video or /finish"

Admin: [sends 720p video]
Bot: "Video 2 saved. Quality: 720p. Send next video or /finish"

Admin: /finish
Bot: "Movie uploaded successfully! Max Quality: 1080p"
[Movie posted to MAIN_CHANNEL with download button]
```

### Download Scenario

```
User: [clicks movie link]
Bot: [displays banner with quality buttons]

User: [clicks "📥 Download 1080p"]
Bot: [sends 1080p video instantly]
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is a production-ready template. To extend:

1. Create feature branches
2. Test thoroughly in dev environment
3. Follow existing code patterns
4. Update documentation
5. Deploy to production with confidence

## 📞 Support

For issues or questions:

1. Check troubleshooting section
2. Review Cloudflare Workers logs
3. Verify all configuration steps
4. Check Telegram bot permissions

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-26  
**Status**: Production Ready ✅
