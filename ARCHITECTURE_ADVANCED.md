# Advanced Bot Architecture - Upgrade Documentation

## Overview

This document outlines the three major advanced features added to the Telegram Uploader Bot:

1. **Advanced Admin Panel** with Inline Keyboards and Template Management
2. **Dynamic Channel Post Buttons** with Multi-language Support
3. **Secure Database Channel Integration** (Anti-Ban Architecture)

---

## 1. Advanced Admin Panel

### Purpose

Provides admins with a professional, keyboard-driven interface to manage post templates, configure button languages, and approve posts before publication.

### Key Components

#### `admin-panel.js` (New Module)

Handles all admin panel operations through inline keyboard menus.

**Main Methods:**

- `showAdminPanel()` - Opens the main admin menu
- `showTemplateEditor()` - Shows template editing options
- `showTemplatePreview()` - Displays current template with sample render
- `resetTemplate()` - Restores default template
- `showSettings()` - Opens settings menu
- `showButtonLanguageMenu()` - Language selection for channel buttons
- `setButtonLanguage()` - Saves admin's language preference
- `showPendingPosts()` - Shows posts awaiting approval
- `showPostApprovalDialog()` - Displays individual post for approval
- `approveAndPublishPost()` - Publishes approved post to Main Channel
- `rejectPost()` - Rejects pending post
- `publishMovieToChannel()` - Handles actual publishing with quality buttons

**Usage:**

```javascript
// Admins can access with /panel command
// Or through callback queries: admin_panel_menu, admin_edit_template, etc.
```

### Post Template System

**Default Template:**

```
<b>{title}</b>

📽️ <b>Max Quality:</b> {max_quality}p

{qualities_list}

👇 <i>Click below to watch in your preferred quality</i>
```

**Supported Variables:**

- `{title}` - Movie title
- `{max_quality}` - Maximum available quality in pixels
- `{qualities_list}` - Formatted list of all available qualities

**Template Customization:**

- Admins can edit templates via `/panel` → Edit Template
- Templates are stored per-admin in `admin_settings` table
- Invalid templates are validated before saving

---

## 2. Dynamic Channel Post Buttons & Multi-language Support

### Purpose

When movies are published to the Main Channel, they display quality selection buttons below the banner that:

- List available qualities (1080p, 720p, 480p) from highest to lowest
- Are rendered in the admin's selected language (Persian/English/Arabic)
- Redirect users to watch the film in their preferred quality

### Key Components

#### `post-processor.js` (New Module)

Handles caption generation, template rendering, and quality button creation.

**Main Methods:**

- `generateCaption()` - Renders template with movie data
- `createPendingPost()` - Creates post awaiting admin approval
- `showPostPreview()` - Shows preview with quality buttons before approval
- `updatePendingPostCaption()` - Allows editing caption before publish
- `generateQualityButtonsList()` - Creates formatted quality list
- `validateTemplate()` - Validates template syntax

**Example Rendered Post:**

```
<b>Movie Title Here</b>

📽️ <b>Max Quality:</b> 1080p

🎬 1080p
🎬 720p
🎬 480p

👇 <i>Click below to watch in your preferred quality</i>

[📥 Quality 1080p] [📥 Quality 720p] [📥 Quality 480p]
```

### Button Language Configuration

**Supported Languages:**

- Persian (فارسی) - Default
- English
- Arabic (العربية)

**Button Rendering:**
Each quality button is translated based on admin's setting:

- Persian: `📥 کیفیت {quality}p`
- English: `📥 Quality {quality}p`
- Arabic: `📥 جودة {quality}p`

**Admin Configuration:**

```
/panel → Settings → Button Language
```

---

## 3. Secure Database Channel Integration

### Purpose

Implements an anti-ban architecture where ALL video files are stored in a dedicated Database Channel, providing:

- Backup protection if the main bot gets banned
- Secure delivery that hides the Database Channel's existence
- Complete file history and tracking
- Seamless user experience without revealing the backup location

### Key Components

#### `db-channel.js` (New Module)

Manages secure storage and retrieval from the Database Channel.

**Main Methods:**

- `storeVideoInDatabaseChannel()` - Backs up video to DB Channel
- `retrieveVideoSecurely()` - Delivers video to user without revealing source (Recommended)
- `retrieveVideoVioCopy()` - Alternative secure delivery using copyMessage
- `checkVideoExistence()` - Batch verify video availability
- `getMovieBackupVideos()` - Get all backups for a movie
- `verifyDatabaseChannelAccess()` - Test DB Channel connectivity

### Storage Process

**When Admin Uploads Video:**

```
1. Video received by bot
2. Quality auto-detected from dimensions
3. Video stored in DATABASE_CHANNEL (with metadata caption)
4. Telegram returns file_id for DB Channel copy
5. Mapping stored in db_channel_files table:
   - video_file_id (original upload ref)
   - db_channel_msg_id (message ID in DB Channel)
   - db_channel_file_id (file_id for secure delivery)
```

### Secure Delivery Methods

#### Method 1: Direct File ID Send (RECOMMENDED)

```javascript
await telegramAPI.sendVideo(chatId, dbChannelFileId, {
  disable_notification: false,
});
```

✅ **Advantages:**

- No forward header visible
- Completely hides Database Channel identity
- Fastest delivery
- Ideal for normal users

#### Method 2: Copy Message

```javascript
await telegramAPI.copyMessage(chatId, databaseChannelId, msgId, {
  disable_notification: false,
});
```

✅ **Advantages:**

- Forward operation without visible "forwarded from" indicator
- Works with all message types
- Maintains message quality

### Database Schema

**New Tables:**

#### `admin_settings`

```sql
CREATE TABLE admin_settings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER UNIQUE,
  template TEXT,              -- Post template with variables
  button_language TEXT,       -- fa/en/ar for channel buttons
  created_at TEXT,
  updated_at TEXT
);
```

#### `pending_posts`

```sql
CREATE TABLE pending_posts (
  id INTEGER PRIMARY KEY,
  movie_id INTEGER,           -- Foreign key to movies
  admin_id INTEGER,           -- Admin who created post
  caption TEXT,               -- Rendered caption text
  status TEXT,                -- pending/approved/rejected/published
  preview_message_id INTEGER, -- Message ID of preview in chat
  created_at TEXT,
  updated_at TEXT
);
```

#### `db_channel_files`

```sql
CREATE TABLE db_channel_files (
  id INTEGER PRIMARY KEY,
  video_file_id INTEGER UNIQUE, -- Foreign key to video_files
  db_channel_msg_id INTEGER,    -- Message ID in Database Channel
  db_channel_file_id TEXT,      -- File ID for secure delivery
  created_at TEXT
);
```

---

## Updated File Workflows

### Upload Workflow (Admin)

```
/newmovie
   ↓
Title Input (AWAITING_TITLE)
   ↓
Banner Photo (AWAITING_BANNER)
   ↓
Video Files (AWAITING_VIDEOS)
   ↓ (Each video)
→ Auto-detect quality
→ Save to D1 (video_files table)
→ Store in Database Channel
→ Create mapping in db_channel_files
   ↓
/finish
   ↓
Create Movie in D1
   ↓
Generate caption from admin's template
   ↓
Create pending post in pending_posts table
   ↓
Show preview to admin with quality buttons
   ↓
Admin clicks "Approve & Publish"
   ↓
Publish to Main Channel with language-specific buttons
   ↓
Update pending_posts status to "published"
```

### Download Workflow (User)

```
User clicks "Watch in 1080p" button
   ↓
Quality selection callback
   ↓
Retrieve mapping from db_channel_files
   ↓
Use secure delivery method (sendVideo with file_id)
   ↓
Video sent to user (Database Channel identity hidden)
```

### Admin Panel Workflow

```
/panel
   ↓
Main Menu (Admin Panel)
   ├─ 📝 Edit Template
   │  ├─ View Current
   │  ├─ Reset to Default
   │  └─ Custom Template
   ├─ ⚙️ Settings
   │  └─ 🌐 Button Language (fa/en/ar)
   └─ 📋 Pending Posts
      └─ Show posts awaiting approval
         ├─ Approve & Publish
         ├─ Reject
         └─ Preview
```

---

## Callback Data Routing

### Admin Callbacks

All admin panel callbacks use the `admin_` prefix:

- `admin_panel_menu` - Main menu
- `admin_edit_template` - Template editor
- `admin_view_current_template` - Template preview
- `admin_reset_template` - Reset to default
- `admin_settings` - Settings menu
- `admin_button_language_menu` - Language selection
- `admin_set_button_lang_{fa|en|ar}` - Save language
- `admin_pending_posts` - Show pending posts
- `admin_approve_post_{id}` - Approve and publish
- `admin_reject_post_{id}` - Reject post
- `admin_preview_post_{id}` - Show post for editing

### Finish Workflow Callbacks

Used during the /finish preview:

- `finish_approve_{postId}` - Approve from preview
- `finish_edit_caption_{postId}` - Edit caption (future feature)

---

## Security Considerations

### Admin Verification

- All admin panel operations require `verifyAdmin()` check
- Admins identified from predefined ADMIN_IDS
- Admin status verified before any sensitive operation

### Database Channel Security

- Database Channel ID stored securely in wrangler.toml
- Direct file_id delivery leaves no trace of source
- Message captions include minimal metadata
- No mention of backup/Database Channel in user-facing messages

### Post Approval System

- Posts require explicit admin approval before publishing
- No automatic publication (removed from old system)
- Multiple review points: template, preview, approval

---

## Multi-language System

### Supported Languages

1. **Persian (فارسی)** - Default for admins
2. **English** - Default for users
3. **Arabic (العربية)** - Optional

### Translation Keys Added

- `admin_panel_menu`
- `admin_template_editor`
- `admin_settings_menu`
- `admin_post_approval`
- `admin_post_published`
- `admin_post_rejected`
- `admin_db_channel_error`
- `admin_secure_delivery`

---

## Configuration & Deployment

### No Changes to `wrangler.toml`

✅ **DO NOT modify existing configuration**

- BOT_TOKEN
- DATABASE_CHANNEL_ID
- MAIN_CHANNEL_ID
- D1 Database binding
- KV namespace binding

All features work with existing bindings.

### Database Migration

Run this SQL to create new tables:

```sql
-- See schema.sql for complete CREATE TABLE statements
-- New tables: admin_settings, pending_posts, db_channel_files
-- New indexes for optimized queries
```

---

## Testing & Validation

### Admin Panel Testing

1. Send `/panel` to open admin menu
2. Test template editor and preview
3. Verify button language selection
4. Test pending posts workflow

### Video Storage Testing

1. Upload movie with `/newmovie`
2. Verify videos stored in Database Channel
3. Check db_channel_files mappings in D1
4. Approve and publish post

### Secure Delivery Testing

1. Click quality button as user
2. Verify video arrives without forward header
3. Check console logs for no Database Channel mention

---

## Error Handling

All new modules include comprehensive error handling:

- ✅ Database query failures
- ✅ API timeout/failures
- ✅ Missing admin settings (fallbacks to defaults)
- ✅ Invalid template variables
- ✅ Missing video mappings
- ✅ Database Channel access failures

Error messages are localized in user's/admin's preferred language.

---

## Performance Optimization

### Caching

- Admin settings cached in KV during workflow
- Language preferences retrieved once per session
- Template stored in D1, retrieved on-demand

### Batch Operations

- Batch insert for video files
- Bulk quality button rendering
- Single database query for movie with videos

### Asynchronous Processing

- All DB operations are async/await
- Callback responses sent immediately
- Background storage operations complete separately

---

## Future Enhancements

Planned features for next releases:

- [ ] Custom caption editing before approval
- [ ] Template preview in admin panel
- [ ] Video file compression/optimization
- [ ] Advanced analytics (views, downloads)
- [ ] Multi-admin collaboration
- [ ] Scheduled post publishing
- [ ] Content moderation workflows

---

## Summary of New Files

| File                | Purpose                       | Key Classes              |
| ------------------- | ----------------------------- | ------------------------ |
| `admin-panel.js`    | Admin UI & management         | `AdminPanel`             |
| `post-processor.js` | Caption generation & approval | `PostProcessor`          |
| `db-channel.js`     | Secure storage & delivery     | `DatabaseChannelManager` |

## Summary of Modified Files

| File          | Changes                                                         |
| ------------- | --------------------------------------------------------------- |
| `index.js`    | Added `/panel` command, updated callback routing                |
| `admin.js`    | Integrated AdminPanel & PostProcessor, new approval workflow    |
| `telegram.js` | Added `editMessageText()`, `copyMessage()`, `forwardMessage()`  |
| `db.js`       | Added admin settings, pending posts, DB channel mapping methods |
| `utils.js`    | Added `renderTemplate()`, updated `parseCallbackData()`         |
| `i18n.js`     | Added admin panel translations                                  |
| `schema.sql`  | Added 3 new tables, new indexes                                 |

---

## Architecture Diagram

```
User Request
    ↓
Index Handler
    ├─ Message Type?
    │  ├─ /newmovie → AdminWorkflow.handleNewMovie()
    │  ├─ /finish → AdminWorkflow.handleFinish()
    │  ├─ /panel → AdminPanel.showAdminPanel()
    │  └─ Video Input → AdminWorkflow.handleVideoUpload()
    │                     ↓
    │                  Store in DB
    │                     ↓
    │                  Store in DatabaseChannel
    │                     ↓
    │                  Create Mapping
    │
    └─ Callback Query?
       ├─ admin_* → AdminPanel methods
       ├─ finish_* → AdminPanel.approveAndPublish()
       │              ↓
       │           Generate Caption
       │              ↓
       │           Render Quality Buttons
       │              ↓
       │           Publish to MainChannel
       │
       └─ download_* → UserWorkflow.handleQuality()
                          ↓
                       Retrieve from DatabaseChannel
                          ↓
                       Send Securely to User
```

---

**Last Updated:** May 27, 2026
**Version:** 2.0.0 (Advanced Features Release)
