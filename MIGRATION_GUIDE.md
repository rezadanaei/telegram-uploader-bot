# Migration Guide: Upgrading to Advanced Bot v2.0

## Pre-Deployment Checklist

- [ ] Backup existing D1 database
- [ ] Review all new files added
- [ ] Test in development environment first
- [ ] Update wrangler.toml if needed (usually not required)
- [ ] Run schema migration
- [ ] Verify bot token and channel IDs are correct

---

## Step 1: Backup Current Database

Before making any changes, backup your existing D1 database:

```bash
# Export current schema and data
# This varies by Cloudflare D1 CLI or your backup method
```

---

## Step 2: Deploy New Files

The following NEW files have been created:

```
src/
├── admin-panel.js          ← NEW: Admin panel with inline keyboards
├── post-processor.js       ← NEW: Caption generation & approval workflow
├── db-channel.js           ← NEW: Secure Database Channel integration
```

Ensure these files are in your `src/` directory.

---

## Step 3: Update Existing Files

The following files have been MODIFIED:

### Modified Files:

```
src/admin.js               ← Updated: Integrated AdminPanel & PostProcessor
src/index.js               ← Updated: New callback routing & /panel command
src/telegram.js            ← Updated: New API methods (editMessageText, copyMessage)
src/db.js                  ← Updated: New database methods
src/utils.js               ← Updated: renderTemplate() & parseCallbackData()
src/i18n.js                ← Updated: Admin panel translations
schema.sql                 ← Updated: 3 new tables + indexes
```

Review each file to ensure compatibility with your environment.

---

## Step 4: Database Migration

### Option A: Cloudflare D1 Web Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages → D1 Databases
2. Select your database
3. Open "Console" tab
4. Copy and paste the new table creation SQL from `schema.sql` (sections for new tables):

```sql
-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  template TEXT NOT NULL DEFAULT '{title}\n\n📽️ {max_quality}\n\n{qualities_list}',
  button_language TEXT NOT NULL DEFAULT 'fa',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Pending Posts Table
CREATE TABLE IF NOT EXISTS pending_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  caption TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  preview_message_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Database Channel Files Tracking
CREATE TABLE IF NOT EXISTS db_channel_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_file_id INTEGER NOT NULL UNIQUE,
  db_channel_msg_id INTEGER NOT NULL,
  db_channel_file_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_file_id) REFERENCES video_files(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_posts_movie_id ON pending_posts(movie_id);
CREATE INDEX IF NOT EXISTS idx_pending_posts_status ON pending_posts(status);
CREATE INDEX IF NOT EXISTS idx_db_channel_files_video_id ON db_channel_files(video_file_id);
```

5. Execute the SQL

### Option B: Using `wrangler d1`

```bash
# If using Wrangler CLI
wrangler d1 execute movie_bot_db --file=schema.sql
```

---

## Step 5: Verify Configuration

Check that `wrangler.toml` contains:

```toml
# KV Binding (must exist)
[[kv_namespaces]]
binding = "DB_KV"
id = "YOUR_KV_NAMESPACE_ID"

# D1 Binding (must exist)
[[d1_databases]]
binding = "DB_D1"
database_name = "movie_bot_db"
database_id = "YOUR_DATABASE_ID"

# Environment Variables (must exist)
[vars]
BOT_TOKEN = "YOUR_BOT_TOKEN"
BOT_USERNAME = "YOUR_BOT_USERNAME"
MAIN_CHANNEL_ID = "-YOUR_CHANNEL_ID"
DATABASE_CHANNEL_ID = "-YOUR_DATABASE_CHANNEL_ID"
```

✅ **DO NOT MODIFY** these values - they should already be set.

---

## Step 6: Test Database Channel Access

Before deploying to production, verify the bot can access the Database Channel:

```bash
# In your admin code or via manual test:
const dbChannelManager = new DatabaseChannelManager(
  telegramAPI,
  dbManager,
  parseInt(env.DATABASE_CHANNEL_ID)
);

const isAccessible = await dbChannelManager.verifyDatabaseChannelAccess();
console.log("Database Channel accessible:", isAccessible);
```

If this fails:

- ✅ Check DATABASE_CHANNEL_ID is correct
- ✅ Verify bot is a member of the Database Channel
- ✅ Ensure bot has send/receive permissions

---

## Step 7: Deploy

### Option A: Using Wrangler

```bash
wrangler deploy
```

### Option B: Using Git Integration

Push changes to your connected Git repository (if configured).

---

## Step 8: Post-Deployment Testing

### Test Admin Panel

1. Send `/panel` to the bot as an admin
2. You should see the admin menu with options:
   - 📝 Edit Template
   - ⚙️ Settings
   - 📋 Pending Posts

### Test Template Management

1. Click "📝 Edit Template"
2. Verify preview of current template
3. Try "Reset to Default"
4. Template should revert to default

### Test Settings

1. Click "⚙️ Settings"
2. Click "🌐 Button Language"
3. Select Persian (فارسی) or English
4. Verify selection was saved

### Test Upload & Approval Workflow

1. Send `/newmovie` as admin
2. Complete the upload (title, banner, videos)
3. Send `/finish`
4. You should see a preview with quality buttons
5. Click "✅ Approve & Publish"
6. Verify post appears in Main Channel with quality buttons

### Test Secure Video Delivery

1. Go to Main Channel
2. Click a quality button (e.g., "📥 Quality 1080p")
3. Bot should send video without revealing Database Channel
4. Check logs to confirm Database Channel was NOT mentioned to user

---

## Troubleshooting

### Issue: "admin_panel not found" error

**Solution:** Ensure `admin-panel.js` is in `src/` and properly imported.

```javascript
import { AdminPanel } from "./admin-panel.js";
```

### Issue: Template variables not rendering

**Solution:** Verify `renderTemplate()` in `utils.js` is correctly implemented:

```javascript
export function renderTemplate(template, data) {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const pattern = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(pattern, String(value || ""));
  }
  return result;
}
```

### Issue: Database Channel errors

**Solution:** Check Database Channel ID in wrangler.toml:

```bash
# Test with curl
curl "https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage" \
  -d "chat_id={DATABASE_CHANNEL_ID}&text=Test"
```

Should respond with success.

### Issue: Pending posts table empty after publishing

**Solution:** Verify `approveAndPublishPost()` updates status correctly:

```javascript
await this.db.updatePendingPostStatus(postId, "approved");
```

---

## Rollback Plan

If you need to rollback to the previous version:

### Step 1: Restore from Git

```bash
git revert <commit-hash>
git push
wrangler deploy
```

### Step 2: Preserve Database

The new tables won't interfere with existing data. You can safely:

- Keep the new tables (they're empty)
- Or drop them if needed

```sql
-- To remove new features (optional)
DROP TABLE IF EXISTS admin_settings;
DROP TABLE IF EXISTS pending_posts;
DROP TABLE IF EXISTS db_channel_files;
```

---

## Features by Version

### v2.0 (Current - Advanced Features)

- ✅ Admin Panel with Inline Keyboards
- ✅ Post Template Management
- ✅ Approval Workflow (Posts require approval)
- ✅ Multi-language Button Support
- ✅ Secure Database Channel Integration
- ✅ New Admin Commands: `/panel`

### v1.0 (Previous)

- Auto-publish to Main Channel
- Basic inline keyboards
- Single button for download

---

## Performance Considerations

### Expected Performance Impact

- **Minimal:** New features add < 100ms latency per operation
- **Storage:** New tables use ~10MB for ~1000 movies

### Optimization Tips

- Admin settings cached in KV (2-hour TTL recommended)
- Batch video uploads for faster processing
- Pending posts cleared regularly (archive old ones)

---

## Support

### Common Commands

```
/newmovie              - Start movie upload (unchanged)
/finish                - Complete upload & show preview for approval (updated)
/panel                 - Open Admin Panel (NEW)
/help                  - Show help message (unchanged)
```

### Admin Workflow Summary

```
1. /newmovie
2. Enter title
3. Send banner image
4. Send videos (one by one)
5. /finish
6. Preview appears with quality buttons
7. ✅ Approve & Publish button
8. Post published to Main Channel
9. Users click quality buttons to watch
```

---

## Additional Resources

- See `ARCHITECTURE_ADVANCED.md` for detailed technical architecture
- See `API.md` for API endpoints documentation
- See `DEPLOYMENT.md` for deployment instructions

---

## Final Checklist Before Going Live

- [ ] All new files deployed
- [ ] All existing files updated
- [ ] Database migration completed
- [ ] Admin panel tested
- [ ] Template system verified
- [ ] Secure video delivery confirmed
- [ ] Multi-language buttons working
- [ ] Database Channel access verified
- [ ] No console errors
- [ ] Rollback plan documented

---

**Migration Completed Successfully! 🎉**

Your bot now has professional admin controls, template management, and secure backup storage!

---

**Version:** 2.0.0
**Date:** May 27, 2026
**Compatibility:** Cloudflare Workers, D1, KV Storage
