# SocialSync Quick Reference Card

## 🚨 Emergency Commands

### Stop Everything
```bash
# Pause posting
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db \
  "UPDATE settings SET value='true' WHERE key='posting_paused';"

# Kill app
pkill -f electron

# Clear queue
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db \
  "DELETE FROM queue WHERE status='pending';"
```

---

## ✅ Daily Workflow Checklist

### Morning (15 min)
- [ ] Open app → Dashboard
- [ ] Check for failed posts
- [ ] Go to Content view
- [ ] Review new videos (10-20)
- [ ] Mark logo status for each
- [ ] Approve STAGE content
- [ ] Add metadata (title, description, tags)
- [ ] Check Queue view
- [ ] Verify today's schedule looks correct

---

## 🔍 Quick Status Check

```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
SELECT
  (SELECT COUNT(*) FROM content_items WHERE approval_status='pending_review') as needs_review,
  (SELECT COUNT(*) FROM queue WHERE status='pending') as queued,
  (SELECT COUNT(*) FROM queue WHERE status='posted' AND posted_at >= datetime('now','-24 hours')) as posted_today,
  (SELECT value FROM settings WHERE key='posting_paused') as paused,
  (SELECT value FROM settings WHERE key='dry_run_mode') as dry_run;
"
```

---

## 🛡️ Safety Checks (All Must Pass)

A video posts ONLY if:
1. ✅ `logo_detected = 1` (has STAGE logo)
2. ✅ `approval_status = 'approved'` (explicitly approved)
3. ✅ Has metadata (title, description)
4. ✅ Scheduled time arrived
5. ✅ Rate limit not exceeded (10/hour)

**If ANY fails → Video is BLOCKED**

---

## 📝 Common Tasks

### Mark Video as Has Logo
```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
UPDATE content_items
SET logo_detected=1, logo_confidence=1.0, logo_checked_at=CURRENT_TIMESTAMP
WHERE id='VIDEO_ID_HERE';
"
```

### Approve Video
```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
UPDATE content_items
SET approval_status='approved', approved_by='user', approved_at=CURRENT_TIMESTAMP
WHERE id='VIDEO_ID_HERE';
"
```

### Add Metadata
```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
UPDATE content_items SET
  title='Video Title Here',
  description='Description here',
  tags='#STAGE #Tag1 #Tag2',
  category='Education'
WHERE id='VIDEO_ID_HERE';
"
```

### Bulk Approve (Multiple Videos)
```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
UPDATE content_items
SET approval_status='approved', approved_by='user', approved_at=CURRENT_TIMESTAMP
WHERE id IN ('ID1','ID2','ID3');
"
```

---

## ⚙️ Toggle Settings

### Enable/Disable Dry-Run Mode
```sql
# Enable (safe testing - no real posts)
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db \
  "UPDATE settings SET value='true' WHERE key='dry_run_mode';"

# Disable (real posting)
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db \
  "UPDATE settings SET value='false' WHERE key='dry_run_mode';"
```

### Pause/Resume Posting
```sql
# Pause
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db \
  "UPDATE settings SET value='true' WHERE key='posting_paused';"

# Resume
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db \
  "UPDATE settings SET value='false' WHERE key='posting_paused';"
```

### Adjust Rate Limit
```sql
# Set to 15 posts/hour
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db \
  "UPDATE settings SET value='15' WHERE key='rate_limit_per_hour';"
```

---

## 🔍 Troubleshooting Quick Fixes

### Videos not queueing?
```sql
# Check: Are any approved with logo?
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
SELECT COUNT(*) FROM content_items
WHERE approval_status='approved' AND logo_detected=1;
"
# If 0, approve some videos and mark logos
```

### Posts not happening?
```sql
# Check if paused or dry-run
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
SELECT key, value FROM settings
WHERE key IN ('posting_paused', 'dry_run_mode');
"
# Both should be 'false' for real posting
```

### Random titles on YouTube?
```sql
# Check if metadata exists
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
SELECT id, filename, title FROM content_items
WHERE approval_status='approved' LIMIT 5;
"
# If title is NULL, add metadata
```

---

## 📊 Monitoring Queries

### Check Recent Posts
```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
SELECT c.filename, c.title, q.posted_at, q.platform
FROM queue q
JOIN content_items c ON q.content_id=c.id
WHERE q.status='posted'
ORDER BY q.posted_at DESC
LIMIT 10;
"
```

### Find Failed Posts
```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
SELECT c.filename, q.last_error
FROM queue q
JOIN content_items c ON q.content_id=c.id
WHERE q.status='failed'
LIMIT 10;
"
```

### Check Approval Status Distribution
```sql
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "
SELECT approval_status, COUNT(*) as count
FROM content_items
GROUP BY approval_status;
"
```

---

## 🎯 Keyboard Shortcuts (Future)

```
Planned shortcuts:
Ctrl+A - Approve selected
Ctrl+R - Reject selected
Ctrl+M - Add metadata
Ctrl+L - Mark has logo
Ctrl+Q - Add to queue
```

---

## 📞 Quick Support

**Issue:** Videos posting unintentionally
**Fix:** Run "Stop Everything" commands above

**Issue:** App not starting
**Fix:** `pkill -f electron && cd /Users/kunalkumrawat/socialsync && npm run dev`

**Issue:** Queue empty
**Fix:** Check if content is approved AND has logo verified

**Issue:** Rate limited
**Fix:** Wait 1 hour OR increase limit (carefully)

---

## 💡 Pro Tips

1. **Batch process:** Review 10-20 videos at once
2. **Template metadata:** Copy/paste similar descriptions
3. **Schedule wisely:** Spread posts throughout day
4. **Monitor daily:** Check dashboard every morning
5. **Test first:** Use dry-run mode when unsure

---

**Keep this card handy for daily operations!**

Last Updated: February 10, 2026
