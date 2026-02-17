# SocialSync User Guide
**Your Social Media Executive with Built-in Safeguards**

Version: 1.0
Last Updated: February 10, 2026

---

## 🎯 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Daily Workflow](#daily-workflow)
4. [Content Management](#content-management)
5. [Logo Verification](#logo-verification)
6. [Approval Workflow](#approval-workflow)
7. [Metadata Management](#metadata-management)
8. [Safety Features](#safety-features)
9. [Emergency Procedures](#emergency-procedures)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

SocialSync automatically posts your STAGE content to YouTube and Instagram based on configured schedules. The system includes **5 layers of protection** to ensure only verified, approved content goes live:

### 🛡️ Safety Layers

1. **Logo Detection** - Blocks videos without STAGE logo
2. **Approval Workflow** - Only explicitly approved content posts
3. **Metadata Validation** - Requires proper titles and descriptions
4. **Rate Limiting** - Maximum 10 posts per hour
5. **Dry-Run Mode** - Test without actually posting

### ✅ What Gets Posted

A video will ONLY be posted if ALL of these are true:
- ✅ Has verified STAGE logo (`logo_detected = 1`)
- ✅ Is explicitly approved (`approval_status = 'approved'`)
- ✅ Has metadata (title, description, tags)
- ✅ Scheduled time has arrived
- ✅ Rate limit not exceeded

**If ANY check fails, the video is BLOCKED.**

---

## 🚀 Getting Started

### First-Time Setup

1. **Connect Accounts** (Settings view)
   - Connect Google Drive (for content library)
   - Connect YouTube account
   - Connect Instagram account (optional)

2. **Configure Schedules** (Schedule view)
   - YouTube: Set days and times for posting
   - Instagram: Set days and times for posting
   - Enable/disable each schedule

3. **Enable Smart Posting** (Settings view)
   - Toggle "Smart Posting" ON
   - Upload STAGE logo reference (or system uses manual marking)
   - Set sensitivity (70% recommended)

4. **Scan Content** (Content view)
   - Click "Scan Drive" to discover videos
   - Content appears in library for review

---

## 📅 Daily Workflow

### Morning Routine (15-30 minutes)

#### Step 1: Review New Content
Navigate to **Content View**

```
For each new video:
1. Watch preview or check thumbnail
2. Verify STAGE logo is visible
3. Mark logo status (see Logo Verification section)
4. Approve or reject content
5. Add metadata (title, description, tags)
```

#### Step 2: Check Queue
Navigate to **Queue View**

```
Review upcoming posts:
- Verify correct videos scheduled
- Check posting times
- Reorder if needed (drag & drop)
- Delete any incorrect items
```

#### Step 3: Monitor Status
Navigate to **Dashboard**

```
Check metrics:
- Pending posts count
- Posted today count
- Failed posts (investigate if any)
- Recent activity log
```

---

## 📁 Content Management

### Content Library

**Location:** Content View

All videos from your Google Drive folders appear here.

**Statuses:**
- `pending` - New, not reviewed
- `queued` - Added to posting queue
- `posted` - Successfully published
- `failed` - Posting error occurred
- `skipped` - Manually skipped

**Actions:**
- **Approve** - Mark as ready to post
- **Reject** - Mark as not STAGE content
- **Edit Metadata** - Add title/description
- **Mark Logo** - Indicate if STAGE logo present

---

## 🔍 Logo Verification

### Manual Logo Marking

Since automatic logo detection requires native dependencies, we use **manual verification**:

#### How to Mark Videos

**Has STAGE Logo:**
```javascript
// Via UI (when implemented)
Click video → "Mark as Has Logo" button

// Via database (temporary)
UPDATE content_items
SET logo_detected = 1,
    logo_confidence = 1.0,
    logo_checked_at = CURRENT_TIMESTAMP
WHERE id = 'video-id';
```

**No STAGE Logo:**
```javascript
// Via UI (when implemented)
Click video → "Mark as No Logo" button

// Via database (temporary)
UPDATE content_items
SET logo_detected = 0,
    logo_confidence = 1.0,
    logo_checked_at = CURRENT_TIMESTAMP
WHERE id = 'video-id';
```

### Bulk Logo Marking

For multiple videos at once:

```javascript
// Mark multiple videos as having logo
bulkMarkLogoStatus(['id1', 'id2', 'id3'], true)

// Mark multiple videos as no logo
bulkMarkLogoStatus(['id1', 'id2', 'id3'], false)
```

### Logo Status Meanings

- `logo_detected = 1` - ✅ HAS STAGE LOGO (can be queued when approved)
- `logo_detected = 0` - ❌ NO LOGO (will be BLOCKED from queue)
- `logo_detected = NULL` - ⚠️ UNCHECKED (will be BLOCKED from queue)

**Important:** Only videos with `logo_detected = 1` can be queued!

---

## ✅ Approval Workflow

### Approval Statuses

Every video starts as `pending_review` and must be explicitly approved:

- **pending_review** - Default state, video is BLOCKED
- **approved** - Video can be queued (if logo verified)
- **rejected** - Video is permanently BLOCKED

### Approving Content

**Single Video:**
```javascript
approveContent('video-id')
```

**Bulk Approval:**
```javascript
bulkApproveContent(['id1', 'id2', 'id3'])
```

**Result:** Video gets:
- `approval_status = 'approved'`
- `approved_by = 'user'`
- `approved_at = TIMESTAMP`
- Entry in approval_log table

### Rejecting Content

**Single Video:**
```javascript
rejectContent('video-id', 'Not STAGE content')
```

**Bulk Rejection:**
```javascript
bulkRejectContent(['id1', 'id2'], 'Wrong branding')
```

**Result:** Video gets:
- `approval_status = 'rejected'`
- `rejection_reason = 'reason text'`
- Entry in approval_log table
- **Permanently blocked from queue**

### Approval Audit

All approvals and rejections are logged:

```sql
SELECT * FROM approval_log
ORDER BY created_at DESC;
```

Shows:
- What was approved/rejected
- When it happened
- Why (for rejections)

---

## 📝 Metadata Management

### Why Metadata Matters

Without metadata, videos post with **random filenames** as titles:
- ❌ Bad: "2021-08-17_19-04-26.mp4"
- ✅ Good: "What is a Mandate? | STAGE OTT"

### Adding Metadata

**Required Fields:**
- **Title** - Video title (max 100 characters for YouTube)
- **Description** - Video description
- **Tags** - Hashtags/keywords (#STAGE #Education)
- **Category** - Content category

**Via API:**
```javascript
updateContentMetadata('video-id', {
  title: 'What is a Mandate? | STAGE OTT',
  description: 'Understanding political mandates in simple Hindi',
  tags: '#STAGE #Politics #Education #Hindi',
  category: 'Education',
  metadata_approved: true
})
```

**Via Database:**
```sql
UPDATE content_items SET
  title = 'Video Title',
  description = 'Video description here',
  tags = '#STAGE #Tag1 #Tag2',
  category = 'Education',
  metadata_approved = 1
WHERE id = 'video-id';
```

### Metadata Best Practices

**Titles:**
- Keep under 100 characters (YouTube limit)
- Include "STAGE OTT" for brand recognition
- Make it descriptive and searchable
- Example: "Political Mandate Explained | Hindi | STAGE OTT"

**Descriptions:**
- Include show name if applicable
- Add call-to-action
- Include relevant hashtags
- Example:
  ```
  Understanding political mandates in simple Hindi.

  Watch more on STAGE OTT!

  #STAGE #Politics #Education #Hindi
  ```

**Tags:**
- Always include #STAGE
- Add content-specific tags
- Use hashtags that improve discoverability
- Example: `#STAGE #Education #Politics #Hindi #ExplainerVideo`

---

## 🔒 Safety Features

### 1. Logo Detection Blocking

**What it does:** Prevents videos without STAGE logo from being posted

**How it works:**
- Checks `logo_detected` field before queueing
- If `logo_detected != 1`, video is BLOCKED
- Logged as: "BLOCKED: STAGE logo not verified"

**Override:** Not possible (by design for safety)

---

### 2. Approval Workflow

**What it does:** Requires explicit approval before queuing

**How it works:**
- All content starts as `pending_review`
- Only `approval_status = 'approved'` can be queued
- Rejected content is permanently blocked

**Override:** Manual approval required (no bypass)

---

### 3. Metadata Validation

**What it does:** Ensures proper titles instead of filenames

**How it works:**
- YouTubePublisher checks for `title` field
- If missing, uses formatted filename (fallback)
- If present, uses proper title

**Best Practice:** Always add metadata before approving

---

### 4. Rate Limiting

**What it does:** Prevents posting too many videos too fast

**How it works:**
- Counts posts in last 60 minutes
- If count >= limit, posting pauses
- Default: 10 posts/hour

**Configure:**
```sql
UPDATE settings
SET value = '15'
WHERE key = 'rate_limit_per_hour';
```

**Why it matters:**
- Prevents platform API rate limits
- Avoids spam detection
- Protects channel reputation

---

### 5. Dry-Run Mode

**What it does:** Simulates posting without actually posting

**How it works:**
- PostingService checks `dry_run_mode` setting
- If enabled, simulates 2-second upload
- Returns fake Post ID
- Marks as 'posted' in database (for testing)

**Enable/Disable:**
```sql
-- Enable dry-run (safe testing)
UPDATE settings SET value = 'true' WHERE key = 'dry_run_mode';

-- Disable dry-run (real posting)
UPDATE settings SET value = 'false' WHERE key = 'dry_run_mode';
```

**Use Cases:**
- Testing workflows
- Verifying queue generation
- Training new users
- Debugging issues

---

## 🚨 Emergency Procedures

### Scenario 1: Videos Posting Unintentionally

**IMMEDIATE ACTION:**
```sql
-- 1. PAUSE POSTING
UPDATE settings SET value = 'true' WHERE key = 'posting_paused';

-- 2. Kill app
pkill -f electron

-- 3. Clear pending queue
DELETE FROM queue WHERE status = 'pending';
```

**Investigation:**
```sql
-- Check what was posted
SELECT c.filename, c.title, q.posted_at, q.platform_post_id
FROM queue q
JOIN content_items c ON q.content_id = c.id
WHERE q.status = 'posted'
  AND q.posted_at >= datetime('now', '-1 hour')
ORDER BY q.posted_at DESC;
```

---

### Scenario 2: Wrong Content Was Posted

**Options:**

**A. Delete from YouTube:**
```bash
# Using gh CLI or YouTube Studio
# Find video ID from platform_post_id in database
# Delete manually from YouTube Studio
```

**B. Mark as failed and investigate:**
```sql
-- Mark as failed to prevent showing as success
UPDATE queue
SET status = 'failed',
    last_error = 'Posted incorrect content - deleted'
WHERE id = 'queue-item-id';
```

---

### Scenario 3: Rate Limit Hit

**Symptoms:**
- "Rate limit reached" in logs
- Posting stops mid-cycle

**Solution:**
```sql
-- Check current rate limit
SELECT value FROM settings WHERE key = 'rate_limit_per_hour';

-- Increase if needed (carefully!)
UPDATE settings SET value = '15' WHERE key = 'rate_limit_per_hour';

-- Or wait 1 hour for reset
```

---

### Scenario 4: App Won't Start

**Troubleshooting:**

1. **Check if already running:**
```bash
ps aux | grep electron
# If found, kill it:
pkill -f electron
```

2. **Check database corruption:**
```bash
sqlite3 ~/Library/Application\ Support/socialsync/socialsync.db "PRAGMA integrity_check;"
# Should return: ok
```

3. **Check disk space:**
```bash
df -h
# Need at least 1GB free
```

4. **Restart fresh:**
```bash
cd /Users/kunalkumrawat/socialsync
npm run dev
```

---

### Scenario 5: Queue Not Generating

**Check:**

1. **Schedule enabled?**
```sql
SELECT * FROM schedules WHERE enabled = 1;
```

2. **Content approved?**
```sql
SELECT COUNT(*) FROM content_items
WHERE approval_status = 'approved'
  AND logo_detected = 1;
```

3. **Smart Posting enabled?**
```sql
SELECT value FROM settings WHERE key = 'smart_posting_enabled';
```

4. **Content already queued?**
```sql
-- Content can't be in queue for same platform
SELECT * FROM queue WHERE status IN ('pending', 'processing');
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "STAGE logo not detected"

**Cause:** Video has `logo_detected = 0` or `NULL`

**Solution:**
```sql
-- Manually mark as having logo
UPDATE content_items
SET logo_detected = 1,
    logo_confidence = 1.0,
    logo_checked_at = CURRENT_TIMESTAMP
WHERE id = 'video-id';
```

---

#### Issue: "No approved content available"

**Cause:** All content is `pending_review`

**Solution:**
```sql
-- Check approval status
SELECT COUNT(*), approval_status
FROM content_items
GROUP BY approval_status;

-- Approve specific videos
UPDATE content_items
SET approval_status = 'approved',
    approved_by = 'user',
    approved_at = CURRENT_TIMESTAMP
WHERE id IN ('id1', 'id2', 'id3');
```

---

#### Issue: Videos posting with random titles

**Cause:** No metadata set

**Solution:**
```sql
-- Add metadata before approving
UPDATE content_items SET
  title = 'Proper Title Here',
  description = 'Description here',
  tags = '#STAGE #Tags',
  category = 'Education'
WHERE id = 'video-id';
```

---

#### Issue: "Rate limit reached"

**Cause:** More than 10 posts in last hour

**Solution:**
```sql
-- Check recent posts
SELECT COUNT(*) FROM queue
WHERE status = 'posted'
  AND posted_at >= datetime('now', '-1 hour');

-- Either wait or increase limit
UPDATE settings
SET value = '15'
WHERE key = 'rate_limit_per_hour';
```

---

#### Issue: Posting not happening at scheduled time

**Possible Causes:**

1. **Posting paused:**
```sql
SELECT value FROM settings WHERE key = 'posting_paused';
-- If 'true', unpause:
UPDATE settings SET value = 'false' WHERE key = 'posting_paused';
```

2. **Dry-run mode enabled:**
```sql
SELECT value FROM settings WHERE key = 'dry_run_mode';
-- If 'true' and you want real posting:
UPDATE settings SET value = 'false' WHERE key = 'dry_run_mode';
```

3. **App not running:**
```bash
ps aux | grep electron
# If not found, start it:
cd /Users/kunalkumrawat/socialsync && npm run dev
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

**Morning:**
- Check dashboard for failed posts
- Review new content from overnight scan
- Verify queue has content for today

**Evening:**
- Check posted count vs. scheduled
- Review activity log for errors
- Plan next day's approvals

### Weekly Maintenance

**Every Monday:**
```sql
-- Clean up old completed queue items (older than 30 days)
DELETE FROM queue
WHERE status IN ('posted', 'skipped', 'failed')
  AND created_at < datetime('now', '-30 days');

-- Check database size
-- Should be under 100MB for 10,000 videos
```

### Monthly Review

**First of each month:**
- Review posting statistics
- Check approval/rejection ratios
- Update metadata templates if needed
- Review and adjust schedules

---

## 📈 Best Practices

### Content Organization

1. **Use clear folder structure in Google Drive**
   ```
   STAGE_Content/
   ├── Education/
   ├── Entertainment/
   ├── News/
   └── Shorts/
   ```

2. **Name files descriptively**
   - Good: `mandate_explanation_hindi.mp4`
   - Bad: `video123.mp4`

3. **Keep master files backed up**
   - Don't rely solely on Google Drive
   - Maintain local backups of originals

### Workflow Efficiency

1. **Batch processing**
   - Review 10-20 videos at once
   - Use bulk approve for similar content
   - Pre-write metadata templates

2. **Schedule optimization**
   - Spread posts throughout day
   - Avoid clustering at same hour
   - Consider audience timezone

3. **Quality over quantity**
   - Better to post less with high quality
   - Always verify logo before approving
   - Take time to write good metadata

---

## 🎓 Training New Users

### Week 1: Learn the System
- Day 1-2: Understand safeguards
- Day 3-4: Practice logo marking
- Day 5: Practice approvals

### Week 2: Supervised Usage
- Mark logos under supervision
- Approve content with review
- Add metadata with feedback

### Week 3: Independent Use
- Handle daily workflow independently
- Monitor for 1-2 days
- Full handoff

### Certification Checklist

Before operating independently, user should:
- [ ] Understand all 5 safety layers
- [ ] Know how to mark logos correctly
- [ ] Know approval workflow
- [ ] Can add proper metadata
- [ ] Knows emergency procedures
- [ ] Can troubleshoot common issues

---

## 📞 Support

### Getting Help

**Common Issues:** Check Troubleshooting section first

**Database Queries:** All examples use SQLite syntax

**Emergency:** Use Emergency Procedures section

---

## 📄 Appendix

### Database Schema Reference

**Key Tables:**
- `content_items` - Video library
- `queue` - Posting queue
- `schedules` - Posting schedules
- `accounts` - Connected accounts
- `settings` - System configuration
- `approval_log` - Audit trail
- `activity_log` - Event history

### Important Settings

```sql
-- View all settings
SELECT * FROM settings ORDER BY key;

-- Key settings:
posting_paused           -- true/false
dry_run_mode            -- true/false
rate_limit_per_hour     -- number
smart_posting_enabled   -- true/false
```

### SQL Quick Reference

**Check system status:**
```sql
SELECT
  (SELECT COUNT(*) FROM content_items WHERE approval_status = 'approved') as approved,
  (SELECT COUNT(*) FROM queue WHERE status = 'pending') as queued,
  (SELECT COUNT(*) FROM queue WHERE status = 'posted' AND posted_at >= datetime('now', '-24 hours')) as posted_today;
```

**Find videos needing review:**
```sql
SELECT id, filename, created_at
FROM content_items
WHERE approval_status = 'pending_review'
  AND logo_detected IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

**Check recent failures:**
```sql
SELECT c.filename, q.last_error, q.scheduled_for
FROM queue q
JOIN content_items c ON q.content_id = c.id
WHERE q.status = 'failed'
ORDER BY q.scheduled_for DESC
LIMIT 10;
```

---

## 🎉 Conclusion

SocialSync with safeguards provides:
- ✅ Automated posting with safety nets
- ✅ Logo verification to protect brand
- ✅ Approval workflow for quality control
- ✅ Proper metadata for professional presence
- ✅ Rate limiting to protect accounts
- ✅ Dry-run mode for safe testing

**Remember:** All 5 safeguards must pass for a video to post. When in doubt, the system blocks rather than posts.

---

**Document Version:** 1.0
**Last Updated:** February 10, 2026
**Maintained by:** BMad Team
