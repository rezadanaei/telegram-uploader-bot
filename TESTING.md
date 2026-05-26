# 🧪 Testing Guide

Comprehensive testing procedures to verify all bot functionality.

## Pre-Test Checklist

- [ ] Worker deployed successfully
- [ ] Webhook configured and active
- [ ] D1 database initialized with schema
- [ ] KV namespace created and bound
- [ ] Bot is admin of both channels
- [ ] All environment variables set correctly
- [ ] Channel IDs verified

## Unit Tests (Manual)

### Test 1: Admin Verification

**Objective**: Verify only admins can execute commands

**Steps**:

1. Open private chat with your bot
2. Verify you are admin of DATABASE_CHANNEL
3. Send `/newmovie`
4. **Expected**: Bot asks for movie title
5. Send message as non-admin user (if possible)
6. **Expected**: Bot ignores message or returns no response

**Result**: ✅ / ❌

### Test 2: KV Caching

**Objective**: Verify admin status is cached for 1 hour

**Steps**:

1. In DATABASE_CHANNEL, remove bot's admin status
2. Immediately send `/newmovie` to bot
3. **Expected**: Command still works (using cached status)
4. Wait and retry after cache clear or manually delete `admin:${userId}` key
5. Send `/newmovie` again
6. **Expected**: Command fails (not in cache, verified as non-admin)
7. Re-add bot as admin
8. Clear cache manually via KV dashboard
9. Send `/newmovie`
10. **Expected**: Command works again

**Result**: ✅ / ❌

### Test 3: State Management

**Objective**: Verify user state transitions correctly

**Steps**:

1. Send `/newmovie`
2. **Expected**: State set to AWAITING_TITLE, bot asks for title
3. Check KV: `state:${userId}` should be `AWAITING_TITLE`
4. Send invalid title (empty or >100 chars)
5. **Expected**: Rejected, state remains AWAITING_TITLE
6. Send valid title: "Test Movie"
7. **Expected**: Title saved, state → AWAITING_BANNER
8. Check KV: `draft:${userId}:title` should be "Test Movie"

**Result**: ✅ / ❌

### Test 4: Banner Upload

**Objective**: Verify banner photo is correctly stored

**Steps**:

1. In AWAITING_BANNER state, send a photo
2. **Expected**: Photo accepted, state → AWAITING_VIDEOS
3. Check KV: `draft:${userId}:banner` should contain file_id
4. Verify file_id format (long string)

**Result**: ✅ / ❌

### Test 5: Video Quality Detection

**Objective**: Verify auto-quality detection works correctly

**Steps**:

1. In AWAITING_VIDEOS state, send 1080p video (1920x1080 or higher)
2. **Expected**: Quality detected as 1080p
3. Check KV: `draft:${userId}:v_1_quality` should be 1080
4. Send 720p video (1280x720)
5. **Expected**: Quality detected as 720p
6. Check KV: `draft:${userId}:v_2_quality` should be 720
7. Send SD video (lower resolution)
8. **Expected**: Quality detected as 480p
9. Check KV: `draft:${userId}:v_3_quality` should be 480

**Result**: ✅ / ❌

### Test 6: Movie Completion

**Objective**: Verify /finish saves to D1 correctly

**Steps**:

1. After uploading title, banner, and videos
2. Send `/finish`
3. **Expected**:
   - Movie created in D1 `movies` table
   - All videos saved in `video_files` table
   - Movie posted to MAIN_CHANNEL with banner and download button
   - Draft data cleared from KV
   - Confirmation message sent to admin
4. Query D1:
   ```bash
   wrangler d1 execute telegram-uploader-bot --command "SELECT * FROM movies WHERE title='Test Movie';"
   ```
5. **Expected**: Movie found with correct fields
6. Verify KV cleared:
   ```bash
   wrangler kv:key get --namespace-id YOUR_KV_ID "draft:${userId}:title"
   ```
7. **Expected**: Key not found

**Result**: ✅ / ❌

### Test 7: User Download Flow

**Objective**: Verify users can download movies via deep link

**Steps**:

1. From MAIN_CHANNEL movie post, click "📥 Download" button
2. **Expected**: Bot opens deep link with `/start movie_${movieId}`
3. **Expected**: Bot displays movie banner with quality options
4. Click "📥 Download 1080p" button
5. **Expected**:
   - Callback query processed
   - Video file sent to user instantly
   - No re-upload (using cached file_id)
6. Check video plays correctly

**Result**: ✅ / ❌

### Test 8: Error Handling

**Objective**: Verify graceful error handling

**Steps**:

1. Send `/newmovie`, then cancel by sending a command: `/start`
2. **Expected**: State cleared, bot shows start message
3. Try accessing non-existent movie: Send `/start movie_99999`
4. **Expected**: "Movie not found" message
5. Try to send invalid file (text) in AWAITING_VIDEOS state
6. **Expected**: Error message, state maintained
7. Disconnect temporarily and reconnect, send command
8. **Expected**: Bot handles gracefully without errors

**Result**: ✅ / ❌

## Integration Tests

### Test 9: Full Admin Workflow

**Objective**: Complete end-to-end admin upload

**Steps**:

1. Clean up: Clear all draft data for test user from KV
2. Start fresh: Send `/newmovie`
3. Enter title: "Inception"
4. Upload banner: Send high-quality image
5. Upload videos:
   - 1080p video (The Dark Knight)
   - 720p video (alternate)
   - 480p video (mobile)
6. Complete: Send `/finish`
7. **Expected**: Movie appears in MAIN_CHANNEL with correct info

**Verification**:

- Check D1: Movie exists with correct data
- Check MAIN_CHANNEL: Post is visible with banner and buttons
- Manually test download links

**Result**: ✅ / ❌

### Test 10: Full User Download Workflow

**Objective**: Complete end-to-end user download

**Steps**:

1. From completed movie (Test 9):
2. As different user, click download link
3. **Expected**: Bot shows banner and quality options
4. Select 1080p
5. **Expected**: 1080p video sent
6. Select 720p
7. **Expected**: 720p video sent (verify different file)
8. Select 480p
9. **Expected**: 480p video sent

**Result**: ✅ / ❌

### Test 11: Multiple Admins

**Objective**: Verify multiple admins can upload independently

**Steps**:

1. As Admin 1: Upload "Movie A" (1 video)
2. As Admin 2: Upload "Movie B" (2 videos)
3. Verify both movies in D1 with correct ownership context
4. As Admin 1: Upload "Movie A - Part 2" (different movie)
5. Verify no state collision between admins

**Result**: ✅ / ❌

### Test 12: High-Volume Testing

**Objective**: Verify stability under load

**Steps**:

1. Upload 5 movies with 3-5 videos each
2. Monitor Cloudflare dashboard for rate limits
3. 10+ users download simultaneously
4. Monitor D1 and KV performance
5. Check for any errors in worker logs

**Result**: ✅ / ❌

## Performance Tests

### Test 13: Response Time

**Objective**: Verify acceptable response times

**Measurements**:

- Bot response to command: < 2 seconds
- Movie posting to channel: < 5 seconds
- Video delivery to user: < 3 seconds
- KV operations: < 100ms
- D1 queries: < 200ms

**Tool**: Use `wrangler tail` to measure

**Result**: ✅ / ❌

### Test 14: KV Cache Hit Rate

**Objective**: Verify caching reduces API calls

**Steps**:

1. First command from admin: getChatMember API called
2. Repeated commands within 1 hour: KV cache used (no API call)
3. After 1 hour expiry: getChatMember API called again

**Measurement**: Monitor Telegram API requests via bot token

**Result**: ✅ / ❌

## Edge Cases

### Test 15: Unusual Inputs

**Steps**:

1. Very long title (500+ chars)
   - **Expected**: Rejected with error
2. Special characters in title (emojis, unicode)
   - **Expected**: Accepted and saved correctly
3. Multiple spaces in title
   - **Expected**: Trimmed and saved
4. Extremely small video (< 1 second)
   - **Expected**: Accepted, quality detected
5. Corrupted media file
   - **Expected**: Handled gracefully with error

**Result**: ✅ / ❌

### Test 16: Concurrent Operations

**Steps**:

1. Two admins simultaneously:
   - Admin 1: Upload title
   - Admin 2: Send video (wrong state for Admin 2)
2. **Expected**: Each maintains separate state, no collision
3. Same admin, multiple /newmovie commands
4. **Expected**: Latest state wins, previous draft abandoned

**Result**: ✅ / ❌

### Test 17: Network Issues

**Steps**:

1. Simulate network delay (slow connection)
2. Send large video file
3. **Expected**: Eventually completes or times out gracefully
4. Retry with better connection
5. **Expected**: Works correctly

**Result**: ✅ / ❌

## Security Tests

### Test 18: Access Control

**Steps**:

1. Non-admin user attempts `/newmovie`
   - **Expected**: Ignored or "unauthorized"
2. Non-admin attempts `/finish`
   - **Expected**: Ignored or "unauthorized"
3. Non-admin clicks download link
   - **Expected**: Works (download is public)
4. Remove bot from DATABASE_CHANNEL
5. Admin attempts `/newmovie`
   - **Expected**: Fails after cache expires (1 hour)

**Result**: ✅ / ❌

### Test 19: Data Isolation

**Steps**:

1. Two admins uploading simultaneously
2. Verify each admin's draft data is isolated
3. Check D1 data: only expected movies present
4. Clear Admin 1's draft, verify Admin 2's unaffected
5. Check movie permissions: any user can download

**Result**: ✅ / ❌

### Test 20: Token Security

**Steps**:

1. Verify BOT_TOKEN not exposed in logs
2. Check worker logs: `wrangler tail`
   - **Expected**: Token not visible in plaintext
3. Verify database queries don't log sensitive data
4. Check error messages don't leak tokens or sensitive IDs

**Result**: ✅ / ❌

## Cleanup & Reporting

After all tests:

```bash
# Cleanup test data
wrangler d1 execute telegram-uploader-bot --command "DELETE FROM video_files;"
wrangler d1 execute telegram-uploader-bot --command "DELETE FROM movies;"

# Clear test KV entries
wrangler kv:key list --namespace-id YOUR_KV_ID | grep -E "admin:|state:|draft:"

# View worker logs
wrangler tail > test_logs.txt
```

## Test Summary Template

```
Bot Version: 1.0.0
Test Date: 2026-05-26
Tester: [Your Name]

Test Results:
- [ ] Test 1: Admin Verification - ✅
- [ ] Test 2: KV Caching - ✅
- [ ] Test 3: State Management - ✅
- [ ] Test 4: Banner Upload - ✅
- [ ] Test 5: Video Quality Detection - ✅
- [ ] Test 6: Movie Completion - ✅
- [ ] Test 7: User Download Flow - ✅
- [ ] Test 8: Error Handling - ✅
- [ ] Test 9: Full Admin Workflow - ✅
- [ ] Test 10: Full User Download - ✅
- [ ] Test 11: Multiple Admins - ✅
- [ ] Test 12: High-Volume - ✅
- [ ] Test 13: Response Time - ✅
- [ ] Test 14: Cache Hit Rate - ✅
- [ ] Test 15: Edge Cases - ✅
- [ ] Test 16: Concurrent Operations - ✅
- [ ] Test 17: Network Issues - ✅
- [ ] Test 18: Access Control - ✅
- [ ] Test 19: Data Isolation - ✅
- [ ] Test 20: Token Security - ✅

Overall Status: ✅ PASS / ❌ FAIL

Issues Found:
1. [Issue]
2. [Issue]

Notes:
[Additional observations]
```

---

**All tests passing? You're ready for production! 🚀**
