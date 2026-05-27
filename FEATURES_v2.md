# Feature Overview: Advanced Bot Capabilities

## Quick Start for Admins

### Feature 1: Admin Panel (Professional Control Center)

**Access Command:**

```
/panel
```

**What You Can Do:**

- 📝 Manage post templates with custom captions
- ⚙️ Configure button language (Persian/English/Arabic)
- 📋 Approve/reject posts before publishing
- 👁️ Preview exactly how movies will look to users

**Example Flow:**

```
/panel
  ↓
Main Menu appears
  ↓
Click "📝 Edit Template"
  ↓
See sample render
  ↓
Back to Menu
  ↓
Click "⚙️ Settings"
  ↓
Select button language
  ↓
✅ Saved!
```

---

### Feature 2: Smart Post Template System

**What is a Template?**
A customizable caption that appears with every movie post. Uses variables that automatically fill with movie details.

**Default Template:**

```
<b>{title}</b>

📽️ <b>Max Quality:</b> {max_quality}p

{qualities_list}

👇 <i>Click below to watch in your preferred quality</i>
```

**Available Variables:**

| Variable           | Example             | Description                             |
| ------------------ | ------------------- | --------------------------------------- |
| `{title}`          | "Inception 2024"    | Movie title (auto-filled)               |
| `{max_quality}`    | 1080                | Highest quality available (auto-filled) |
| `{qualities_list}` | "1080p, 720p, 480p" | All available qualities (auto-filled)   |

**How to Customize:**

1. Go to `/panel`
2. Click "📝 Edit Template"
3. Click "🔄 Custom Template"
4. Send new template in chat (e.g., using paste)
5. Template saved automatically

**Custom Example:**

```
🎬 <b>{title}</b> 🎬

Maximum Quality: {max_quality}p
Available: {qualities_list}

Ready to watch? Click button below!
```

**Reset Template:**
If you mess up, click "Reset to Default" to restore the original.

---

### Feature 3: Post Approval Workflow

**How It Works:**

Previously: Movies auto-published immediately ❌
Now: Movies require your explicit approval ✅

**Approval Flow:**

```
1. Upload movie with /newmovie
   ↓
2. Send /finish
   ↓
3. Preview appears in your chat
   (Shows exactly how post will look)
   ↓
4. Two options:
   ├─ ✅ Approve & Publish
   │  (Posts to Main Channel immediately)
   │
   └─ ❌ Edit / Reject
      (Make changes or discard)
```

**Before Publishing:**

- You see the exact caption that will be posted
- You see quality buttons with your configured language
- You can edit caption or reject if needed
- No automatic publishing (full control)

---

### Feature 4: Multi-Language Quality Buttons

**What Are These?**
When a movie is published to your Main Channel, each quality level appears as a button in the user's selected language.

**Example for 3-Quality Movie:**

**If Language = Persian (فارسی):**

```
[📥 کیفیت 1080p] [📥 کیفیت 720p] [📥 کیفیت 480p]
```

**If Language = English:**

```
[📥 Quality 1080p] [📥 Quality 720p] [📥 Quality 480p]
```

**If Language = Arabic (العربية):**

```
[📥 جودة 1080p] [📥 جودة 720p] [📥 جودة 480p]
```

**How to Configure:**

1. Open `/panel`
2. Click "⚙️ Settings"
3. Click "🌐 Button Language"
4. Select language:
   - 🇮🇷 فارسی (Default)
   - 🇬🇧 English
   - 🇸🇦 العربية
5. ✅ Saved for all future posts

---

### Feature 5: Secure Database Channel (Invisible to Users)

**What Is It?**
A backup storage location where ALL videos are kept safely. Users never see or know about it.

**How It Protects You:**

- 🛡️ If main bot gets banned → videos are safe in Database Channel
- 📹 Every video automatically backed up
- 🔒 Channel name/identity completely hidden from users
- 🚀 Instant delivery without revealing backup location

**How It Works (Behind the Scenes):**

```
When admin uploads video:
  ↓
Video goes to Database Channel (backup)
  ↓
Bot saves mapping in database
  ↓

When user requests video:
  ↓
Bot fetches from Database Channel
  ↓
Sends to user directly
  ↓
User never knows Database Channel exists!
```

**Verification:**
Admins can verify Database Channel is accessible:

- Bot can read/write to Database Channel ✅
- No performance impact
- Automatic on every upload

---

## Complete Admin Workflow (v2.0)

### Uploading a Movie

```
Step 1: /newmovie
  ↓ Bot asks for title

Step 2: Enter movie title
  Example: "Dune: Part Two (2024)"
  ↓ Bot asks for banner image

Step 3: Send banner image
  ↓ Bot saves & asks for videos

Step 4: Send video files (one at a time)
  - Upload 1080p video → bot detects quality
  - Upload 720p video → bot detects quality
  - Upload 480p video → bot detects quality
  ↓ Send /finish when done

Step 5: /finish command
  ↓ Bot creates preview

Step 6: Preview appears in chat
  Shows:
  - Banner image
  - Caption from your template
  - Quality buttons in your language
  ✓ Approve & Publish
  ✗ Edit / Reject

Step 7: Click Approve & Publish
  ↓ Post goes to Main Channel

Step 8: Confirmation message
  Shows you:
  - Movie title
  - Max quality
  - Number of videos
  - Deep link for sharing
```

### Managing Settings

```
/panel
  ↓
Main Menu with 3 options:
  ├─ 📝 Edit Template
  │  ├─ View Current (see template + sample render)
  │  ├─ Reset to Default (restore original)
  │  └─ Custom Template (create new)
  │
  ├─ ⚙️ Settings
  │  └─ 🌐 Button Language
  │     ├─ 🇮🇷 فارسی
  │     ├─ 🇬🇧 English
  │     └─ 🇸🇦 العربية
  │
  └─ 📋 Pending Posts
     ├─ Show posts awaiting approval
     ├─ Approve & Publish
     ├─ Reject
     └─ Preview/Edit
```

---

## User Experience (From User Perspective)

### How Users Watch Movies

```
User sees post in Main Channel:

┌─────────────────────────────┐
│ [Banner Image]              │
│                             │
│ <b>Dune: Part Two</b>      │
│                             │
│ 📽️ <b>Max Quality:</b> 1080p│
│                             │
│ 🎬 1080p                    │
│ 🎬 720p                     │
│ 🎬 480p                     │
│                             │
│ [📥 کیفیت 1080p]            │
│ [📥 کیفیت 720p]             │
│ [📥 کیفیت 480p]             │
└─────────────────────────────┘

User clicks [📥 کیفیت 1080p]
  ↓
Bot sends video directly
  (from Database Channel, hidden from user)
  ↓
User receives video instantly
```

**User Never Sees:**

- ❌ Database Channel name
- ❌ Backup mechanism
- ❌ Where video comes from
- ✅ Just gets video in preferred quality

---

## Security & Privacy

### What's Protected?

| Item           | Protection                    |
| -------------- | ----------------------------- |
| Videos         | Backed up in Database Channel |
| Admin Settings | Stored securely in D1         |
| Templates      | Per-admin, private            |
| Pending Posts  | Only visible to admin         |
| User Data      | No personal data stored       |

### What's Hidden?

- 🔒 Database Channel identity
- 🔒 Backup mechanism
- 🔒 Internal file IDs
- 🔒 Server-side routing

### What's Transparent?

- ✅ Quality options (user sees them)
- ✅ Movie titles (public)
- ✅ Captions (customizable by admin)
- ✅ Button languages (admin chooses)

---

## Comparison: v1.0 → v2.0

| Feature          | v1.0                     | v2.0                             |
| ---------------- | ------------------------ | -------------------------------- |
| Post Publishing  | Auto-publish immediately | Requires admin approval ✨       |
| Templates        | Fixed caption            | Customizable with variables ✨   |
| Admin Panel      | None                     | Full control panel with UI ✨    |
| Button Languages | English only             | Persian/English/Arabic ✨        |
| Video Backup     | Manual                   | Automatic to Database Channel ✨ |
| Post Preview     | None                     | See exactly how post looks ✨    |
| Settings         | None                     | Language, template options ✨    |
| Control          | Limited                  | Full admin control ✨            |

---

## Tips & Best Practices

### Template Tips

✅ **Good Practice:**

- Use all variables: `{title}`, `{max_quality}`, `{qualities_list}`
- Keep captions brief (mobile users)
- Use emojis for visual appeal
- Test with "View Current"

❌ **Avoid:**

- Making template too long (truncated)
- Removing required variables
- Special characters (use HTML entities)
- Testing directly on Main Channel

### Approval Workflow Tips

✅ **Good Practice:**

- Review preview carefully before approving
- Check template renders correctly
- Verify buttons show right language
- Test a video download before mass posting

❌ **Avoid:**

- Approving without reviewing
- Posting low-quality banners
- Using wrong language settings
- Uploading videos without testing

### Database Channel Tips

✅ **Good Practice:**

- Create a private channel for backups
- Disable comments/reactions
- Add bot with full permissions
- Verify access regularly

❌ **Avoid:**

- Making Database Channel public
- Removing bot permissions
- Using public channels
- Changing channel settings

---

## FAQ

### Q: Can I edit a caption after approving?

**A:** In v2.0, not yet. You can:

1. Reject the post
2. Update template
3. Upload again and approve new version
   (Caption editing coming in future version)

### Q: What if video upload fails?

**A:** You'll see error message. Try:

1. Check file size (Telegram limit: 2GB)
2. Check file format (MP4 recommended)
3. Check internet connection
4. Try again

### Q: Can I delete a published post?

**A:** Not yet automated. You can:

1. Manually delete from Main Channel
2. Reject before publishing

### Q: Does Database Channel need to be secret?

**A:** It's better if private, but not required:

- Users can't access it directly
- Bot hides its identity
- Videos still delivered securely

### Q: Can I change button language for old posts?

**A:** No, language is set when post publishes:

- Change language in settings first
- Then upload new movies
- Old posts keep their language

### Q: How many qualities can I upload?

**A:** As many as you want:

- 480p, 720p, 1080p, 2K, 4K, etc.
- Buttons created automatically
- Quality auto-detected from video dimensions

---

## Keyboard Shortcuts

### Admin Panel Navigation

| Action          | Method                           |
| --------------- | -------------------------------- |
| Open Panel      | Send `/panel`                    |
| Back to Menu    | Click "← Back" buttons           |
| View Template   | Click "📋 View Current"          |
| Change Language | ⚙️ Settings → 🌐 Button Language |
| Approve Post    | Click "✅ Approve & Publish"     |

---

## Troubleshooting

### Issue: Template preview not showing

**Solution:** Check template has `{title}` variable

### Issue: Buttons not in right language

**Solution:** Change language in `/panel` → Settings before uploading

### Issue: Post not appearing in Main Channel

**Solution:**

1. Check bot has permission to post
2. Check MAIN_CHANNEL_ID is correct
3. Check post was actually approved

### Issue: Video not delivering to user

**Solution:**

1. Check Database Channel is accessible
2. Verify video file is valid
3. Check bot permissions in Database Channel

---

**You're all set! 🚀**

Explore the new Admin Panel with `/panel` and enjoy professional-grade bot management!

---

**Version:** 2.0.0
**Last Updated:** May 27, 2026
