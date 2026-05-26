# 📖 API Documentation

Complete technical reference for the Telegram Movie Uploader Bot APIs and internal interfaces.

## Table of Contents

1. [Telegram Bot Commands](#telegram-bot-commands)
2. [Telegram Webhook Payload](#telegram-webhook-payload)
3. [Internal Module APIs](#internal-module-apis)
4. [Database Schema](#database-schema)
5. [KV Storage Keys](#kv-storage-keys)
6. [Error Codes](#error-codes)

---

## Telegram Bot Commands

### `/newmovie` (Admin Only)

Initiates the movie upload workflow.

**Prerequisites**:

- User must be admin of DATABASE_CHANNEL_ID
- User must not be in an active upload state

**Request**:

```
POST https://api.telegram.org/botTOKEN/sendMessage
{
  "chat_id": "USER_ID",
  "text": "/newmovie",
  "parse_mode": "HTML"
}
```

**Response** (from Bot):

```
Status: AWAITING_TITLE
Message: "🎬 New Movie Upload\n\nPlease enter the movie title:"
```

**State Transition**: `null` → `AWAITING_TITLE`

---

### `/finish` (Admin Only, During Upload)

Completes the movie upload workflow and publishes to MAIN_CHANNEL.

**Prerequisites**:

- User must be in AWAITING_VIDEOS state
- Must have: title, banner, at least 1 video

**Request**:

```
POST https://api.telegram.org/botTOKEN/sendMessage
{
  "chat_id": "USER_ID",
  "text": "/finish",
  "parse_mode": "HTML"
}
```

**Response** (from Bot):

```
Status: Upload Complete
Message: "✅ Movie uploaded successfully!\n\n🎬 Title\n🎞️ Max Quality: 1080p\n📊 Videos: 3\n\n🔗 Deep Link: https://t.me/bot?start=movie_42"
```

**Side Effects**:

- Creates movie in D1 `movies` table
- Creates entries in D1 `video_files` table
- Posts to MAIN_CHANNEL with banner and download button
- Clears all draft KV data

**State Transition**: `AWAITING_VIDEOS` → `null` (cleanup)

---

### `/start` or `/start movie_${movieId}`

Generic start command or deep link to movie.

**Variant 1**: Generic Start

```
/start
```

**Response**:

```
Welcome message with instructions for admins and users
```

**Variant 2**: Movie Deep Link

```
/start movie_42
```

**Response**:

```
Banner image with inline keyboard showing available qualities
```

---

## Telegram Webhook Payload

### Message Update (Text)

```json
{
  "message": {
    "message_id": 12345,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 987654321,
      "first_name": "John",
      "username": "johndoe",
      "type": "private"
    },
    "date": 1696857600,
    "text": "/newmovie"
  }
}
```

### Message Update (Photo)

```json
{
  "message": {
    "message_id": 12346,
    "from": { "id": 987654321, "is_bot": false, "first_name": "John" },
    "chat": { "id": 987654321, "type": "private" },
    "date": 1696857600,
    "photo": [
      {
        "file_id": "AgAC...",
        "file_unique_id": "AQADa...",
        "file_size": 5000,
        "width": 320,
        "height": 240
      },
      {
        "file_id": "AgAD...",
        "file_unique_id": "AQADa...",
        "file_size": 50000,
        "width": 800,
        "height": 600
      }
    ]
  }
}
```

### Message Update (Video)

```json
{
  "message": {
    "message_id": 12347,
    "from": { "id": 987654321, "is_bot": false, "first_name": "John" },
    "chat": { "id": 987654321, "type": "private" },
    "date": 1696857600,
    "video": {
      "file_id": "BAACAgQ...",
      "file_unique_id": "AgAD...",
      "file_size": 500000,
      "width": 1920,
      "height": 1080,
      "duration": 3600,
      "mime_type": "video/mp4",
      "thumb": {
        "file_id": "AAAF...",
        "file_unique_id": "AQADa...",
        "file_size": 5000,
        "width": 320,
        "height": 180
      }
    }
  }
}
```

### Callback Query Update

```json
{
  "callback_query": {
    "id": "callback_query_id_123",
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat_instance": "7654321",
    "data": "download_42_1080",
    "message": {
      "message_id": 12348,
      "from": { "id": 654321, "is_bot": true, "first_name": "MovieBot" },
      "chat": { "id": 987654321, "type": "private" },
      "date": 1696857600,
      "photo": [...]
    }
  }
}
```

---

## Internal Module APIs

### TelegramAPI Class

**Constructor**:

```javascript
const api = new TelegramAPI(botToken);
```

**Methods**:

#### `async request(method, params)`

Generic Telegram API request.

```javascript
const result = await api.request("sendMessage", {
  chat_id: 123456,
  text: "Hello!",
});
```

#### `async sendMessage(chatId, text, options)`

Send text message.

```javascript
await api.sendMessage(123456, "Hello <b>World</b>", {
  parse_mode: "HTML",
  disable_web_page_preview: true,
});
```

#### `async sendPhoto(chatId, fileId, options)`

Send photo message.

```javascript
await api.sendPhoto(123456, 'AgAC...', {
  caption: 'Movie Banner',
  reply_markup: { inline_keyboard: [...] }
});
```

#### `async sendVideo(chatId, fileId, options)`

Send video message.

```javascript
await api.sendVideo(123456, "BAAC...", {
  caption: "Movie Video",
});
```

#### `async getChatMember(chatId, userId)`

Get user's status in a chat.

```javascript
const member = await api.getChatMember(-1001234567890, 123456);
// { user: {...}, status: 'administrator', ... }
```

---

### SecurityManager Class

**Constructor**:

```javascript
const security = new SecurityManager(
  telegramAPI,
  kv,
  databaseChannelId,
  cacheTTL,
);
```

**Methods**:

#### `async isUserAdmin(userId)`

Check if user is admin (with KV cache).

```javascript
const isAdmin = await security.isUserAdmin(987654321);
// Returns: true | false
```

#### `async verifyAdmin(userId)`

Verify admin status and throw/warn on failure.

```javascript
const verified = await security.verifyAdmin(987654321);
```

#### `async invalidateAdminCache(userId)`

Clear cached admin status.

```javascript
await security.invalidateAdminCache(987654321);
```

---

### DatabaseManager Class

**Constructor**:

```javascript
const db = new DatabaseManager(env.DB_D1);
```

**Methods**:

#### `async createMovie(title, bannerFileId, maxQuality)`

Create new movie record.

```javascript
const movieId = await db.createMovie("Inception", "AgAC...", 1080);
// Returns: 42
```

#### `async getMovie(movieId)`

Fetch movie by ID.

```javascript
const movie = await db.getMovie(42);
// Returns: { id: 42, title: 'Inception', banner_file_id: '...', max_quality: 1080, created_at: '2026-05-26...' }
```

#### `async addVideoFile(movieId, quality, fileId, uniqueMsgId)`

Add video to movie.

```javascript
const videoId = await db.addVideoFile(42, 1080, "BAAC...", 12345);
// Returns: 101
```

#### `async getMovieVideos(movieId)`

Get all videos for a movie (sorted by quality DESC).

```javascript
const videos = await db.getMovieVideos(42);
// Returns: [ { id: 101, movie_id: 42, quality: 1080, telegram_file_id: 'BAAC...', ... }, ... ]
```

#### `async getVideoByQuality(movieId, quality)`

Get specific quality video.

```javascript
const video = await db.getVideoByQuality(42, 1080);
// Returns: { id: 101, movie_id: 42, quality: 1080, ... }
```

---

### KVSessionManager Class

**Constructor**:

```javascript
const kv = new KVSessionManager(env.DB_KV);
```

**Methods**:

#### `async setState(userId, state)`

Set user's current state.

```javascript
await kv.setState(987654321, "AWAITING_TITLE");
```

#### `async getState(userId)`

Get user's current state.

```javascript
const state = await kv.getState(987654321);
// Returns: 'AWAITING_TITLE' | null
```

#### `async saveDraftTitle(userId, title)`

Save draft title.

```javascript
await kv.saveDraftTitle(987654321, "Inception");
```

#### `async getDraftTitle(userId)`

Get draft title.

```javascript
const title = await kv.getDraftTitle(987654321);
// Returns: 'Inception'
```

#### `async addDraftVideo(userId, quality, fileId, uniqueMsgId)`

Add video to draft.

```javascript
const count = await kv.addDraftVideo(987654321, 1080, "BAAC...", 12346);
// Returns: 1 (video index)
```

#### `async getDraftVideos(userId)`

Get all draft videos.

```javascript
const videos = await kv.getDraftVideos(987654321);
// Returns: [ { quality: 1080, fileId: 'BAAC...', uniqueMsgId: 12346 }, ... ]
```

#### `async clearDraft(userId)`

Clear all draft data.

```javascript
await kv.clearDraft(987654321);
```

---

### Utility Functions

#### `detectQuality(width, height)`

Auto-detect video quality.

```javascript
const quality = detectQuality(1920, 1080); // 1080
const quality = detectQuality(1280, 720); // 720
const quality = detectQuality(640, 480); // 480
```

#### `createQualityKeyboard(movieId, qualities)`

Create inline keyboard for quality selection.

```javascript
const keyboard = createQualityKeyboard(42, [1080, 720, 480]);
// Returns: { inline_keyboard: [ [ { text: '📥 Download 1080p', callback_data: 'download_42_1080' } ], ... ] }
```

#### `parseStartParam(param)`

Extract movie ID from start parameter.

```javascript
const movieId = parseStartParam("movie_42"); // 42
const movieId = parseStartParam("invalid"); // null
```

#### `parseCallbackData(data)`

Parse callback query data.

```javascript
const parsed = parseCallbackData("download_42_1080");
// Returns: { action: 'download', movieId: 42, quality: 1080 }
```

---

## Database Schema

### movies Table

```sql
CREATE TABLE movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  banner_file_id TEXT NOT NULL,
  max_quality INTEGER NOT NULL DEFAULT 480,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
| Field | Type | Description |
|:---|:---|:---|
| `id` | INTEGER | Primary key, auto-increment |
| `title` | TEXT | Movie title (required) |
| `banner_file_id` | TEXT | Telegram file ID for banner image |
| `max_quality` | INTEGER | Highest available quality (1080/720/480) |
| `created_at` | TEXT | ISO timestamp of creation |

**Example**:

```json
{
  "id": 42,
  "title": "Inception",
  "banner_file_id": "AgACAgQ...",
  "max_quality": 1080,
  "created_at": "2026-05-26T10:30:00.000Z"
}
```

---

### video_files Table

```sql
CREATE TABLE video_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  quality INTEGER NOT NULL,
  telegram_file_id TEXT NOT NULL,
  unique_msg_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);
```

**Fields**:
| Field | Type | Description |
|:---|:---|:---|
| `id` | INTEGER | Primary key, auto-increment |
| `movie_id` | INTEGER | Foreign key to movies.id |
| `quality` | INTEGER | Video quality (1080/720/480) |
| `telegram_file_id` | TEXT | Telegram file ID for video |
| `unique_msg_id` | INTEGER | Unique message ID for tracking |
| `created_at` | TEXT | ISO timestamp of creation |

**Example**:

```json
{
  "id": 101,
  "movie_id": 42,
  "quality": 1080,
  "telegram_file_id": "BAACAgQ...",
  "unique_msg_id": 12345,
  "created_at": "2026-05-26T10:30:15.000Z"
}
```

---

## KV Storage Keys

### Admin Cache

**Key Format**: `admin:${userId}`
**Value**: `'true'` | `'false'`
**TTL**: 3600 seconds (1 hour)
**Purpose**: Cache admin status to optimize API calls

**Example**:

```
Key: admin:987654321
Value: 'true'
Expiration: 3600
```

### User State

**Key Format**: `state:${userId}`
**Value**: `'AWAITING_TITLE'` | `'AWAITING_BANNER'` | `'AWAITING_VIDEOS'` | null
**TTL**: No expiration
**Purpose**: Track current upload workflow state

**Example**:

```
Key: state:987654321
Value: 'AWAITING_TITLE'
```

### Draft Title

**Key Format**: `draft:${userId}:title`
**Value**: Movie title string
**TTL**: No expiration
**Purpose**: Store draft movie title

**Example**:

```
Key: draft:987654321:title
Value: 'Inception'
```

### Draft Banner

**Key Format**: `draft:${userId}:banner`
**Value**: Telegram file ID
**TTL**: No expiration
**Purpose**: Store draft banner file ID

**Example**:

```
Key: draft:987654321:banner
Value: 'AgACAgQ...'
```

### Draft Video Count

**Key Format**: `draft:${userId}:video_count`
**Value**: Integer string (e.g., `'3'`)
**TTL**: No expiration
**Purpose**: Track number of uploaded videos

**Example**:

```
Key: draft:987654321:video_count
Value: '3'
```

### Draft Video Quality

**Key Format**: `draft:${userId}:v_${index}_quality`
**Value**: Quality integer string (e.g., `'1080'`)
**TTL**: No expiration
**Purpose**: Store detected quality for each video

**Example**:

```
Key: draft:987654321:v_1_quality
Value: '1080'
```

### Draft Video File ID

**Key Format**: `draft:${userId}:v_${index}_fileId`
**Value**: Telegram file ID
**TTL**: No expiration
**Purpose**: Store file ID for each uploaded video

**Example**:

```
Key: draft:987654321:v_1_fileId
Value: 'BAACAgQ...'
```

### Draft Video Message ID

**Key Format**: `draft:${userId}:v_${index}_msgId`
**Value**: Message ID integer string
**TTL**: No expiration
**Purpose**: Store message ID for tracking

**Example**:

```
Key: draft:987654321:v_1_msgId
Value: '12346'
```

---

## Error Codes & Messages

### Admin Errors

| Error          | Message                                          | Status |
| :------------- | :----------------------------------------------- | :----- |
| NOT_ADMIN      | "You do not have permission to use this command" | 403    |
| NOT_IN_CHANNEL | "Bot is not admin of DATABASE_CHANNEL"           | 403    |
| CACHE_FAILED   | "Failed to verify admin status"                  | 500    |

### Upload Workflow Errors

| Error            | Message                                            | Status |
| :--------------- | :------------------------------------------------- | :----- |
| INVALID_STATE    | "You are not in a valid upload state"              | 400    |
| INVALID_TITLE    | "Title must be between 2-100 characters"           | 400    |
| NO_BANNER        | "No photo found. Please send a valid image"        | 400    |
| INVALID_VIDEO    | "No video found. Please send a valid file"         | 400    |
| INCOMPLETE_DRAFT | "Draft is incomplete (need title, banner, videos)" | 400    |
| DB_ERROR         | "Failed to save movie. Please try again."          | 500    |

### User Download Errors

| Error             | Message                                      | Status |
| :---------------- | :------------------------------------------- | :----- |
| INVALID_LINK      | "Invalid movie link. Please try again."      | 400    |
| MOVIE_NOT_FOUND   | "Movie not found. It may have been deleted." | 404    |
| NO_VIDEOS         | "No video files available for this movie."   | 404    |
| QUALITY_NOT_FOUND | "Video with Xp quality not found."           | 404    |
| SEND_FAILED       | "Failed to send video. Please try again."    | 500    |

---

## Examples

### Example 1: Complete Admin Upload Flow

```
1. Admin: /newmovie
   Bot: [setState('987654321', 'AWAITING_TITLE')]
        "Please enter the movie title:"

2. Admin: Inception
   Bot: [saveDraftTitle('987654321', 'Inception')]
        [setState('987654321', 'AWAITING_BANNER')]
        "Title saved. Send banner image"

3. Admin: [sends photo]
   Bot: [saveDraftBanner('987654321', 'AgAC...')]
        [setState('987654321', 'AWAITING_VIDEOS')]
        "Banner saved! Send videos"

4. Admin: [sends 1080p video]
   Bot: [addDraftVideo('987654321', 1080, 'BAAC...', 12346)]
        "Video 1 saved. Quality: 1080p"

5. Admin: [sends 720p video]
   Bot: [addDraftVideo('987654321', 720, 'BAAC...', 12347)]
        "Video 2 saved. Quality: 720p"

6. Admin: /finish
   Bot: [createMovie('Inception', 'AgAC...', 1080)]
        [batchInsertVideoFiles(42, [...])]
        [sendPhoto(MAIN_CHANNEL_ID, 'AgAC...', { ... })]
        [clearDraft('987654321')]
        "Movie uploaded successfully!"
```

### Example 2: User Download Flow

```
1. User: [clicks movie deep link]
   Bot: [parseStartParam('movie_42')]
        [getMovie(42)]
        [getMovieVideos(42)]
        [sendPhoto(userId, 'AgAC...', { keyboard: [...] })]

2. User: [clicks "📥 Download 1080p"]
   Bot: [parseCallbackData('download_42_1080')]
        [getVideoByQuality(42, 1080)]
        [sendVideo(userId, 'BAAC...', {...})]
```

---

## Rate Limits

- **Telegram Bot API**: 30 messages/second per chat
- **KV Operations**: No hard limit (auto-scale)
- **D1 Queries**: Auto-scale with Cloudflare edge
- **Admin Cache TTL**: 3600 seconds (1 hour)

---

## Compatibility

- **Cloudflare Workers**: ✅ ES6 Modules
- **Node.js**: ✅ 18+ (for local testing)
- **Telegram Bot API**: ✅ v7.0+
- **TypeScript**: ✅ Compatible (compile to JS)
