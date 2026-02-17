# Queue Generation Fix - Summary

**Date:** February 8, 2026
**Issue:** Only 2 videos in YouTube queue, app not automatically adding more videos

---

## Problem Identified

### Root Cause
The `addToQueue()` method in QueueService was updating the content_items status to 'queued' when a video was added to ANY platform queue. This caused the following cascade:

1. Video added to Instagram queue → status changed to 'queued'
2. `DriveService.getNextContent()` only returns videos with status='pending'
3. Video no longer available for YouTube queue
4. Queue generation stopped after 2 videos (all pending videos exhausted)

### Code Location
**File:** `/Users/kunalkumrawat/socialsync/electron/services/queue/QueueService.ts`
**Method:** `addToQueue()` (lines 74-93)

---

## Fix Applied

### Fix #1: Remove Content Status Update (QueueService.ts)

**REMOVED:**
```typescript
// Update content item status
db.run("UPDATE content_items SET status = 'queued' WHERE id = ?", [contentId])
```

**ADDED COMMENT:**
```typescript
// DON'T update content item status to 'queued' - allow same video to be queued for multiple platforms
// Status will be updated to 'posted' only after successful posting to all platforms
```

### Fix #2: Add Platform-Specific Content Selection (DriveService.ts)

**NEW METHOD ADDED:**
```typescript
/**
 * Get next available content for a specific platform
 * Excludes content already queued for that platform
 */
getNextContentForPlatform(platform: 'instagram' | 'youtube'): ContentItem | null {
  const db = getDatabase()
  const row = db.get<any>(
    `SELECT * FROM content_items
     WHERE status = 'pending'
     AND id NOT IN (
       SELECT content_id FROM queue
       WHERE platform = ? AND status IN ('pending', 'processing')
     )
     ORDER BY created_at ASC LIMIT 1`,
    [platform]
  )
  // ... map to ContentItem
}
```

### Fix #3: Use New Method in Queue Generation (QueueService.ts)

**CHANGED:**
```typescript
// OLD (BUGGY):
const content = driveService.getNextContent()
if (this.isContentQueued(content.id, schedule.platform)) {
  continue  // Skips time slot but same video returned next iteration!
}

// NEW (FIXED):
const content = driveService.getNextContentForPlatform(schedule.platform)
if (!content) {
  console.log('[QueueService] No more content available for', schedule.platform)
  return itemsCreated
}
// Removed redundant isContentQueued check - handled in SQL query
```

### Why This Works

1. **Multi-platform support:** Same video can be queued for both Instagram AND YouTube
2. **No duplicate queueing:** SQL query excludes videos already queued for the specific platform
3. **Efficient iteration:** Each platform gets different videos without skipping time slots
4. **Correct status flow:** Videos stay as 'pending' until actually posted

**Example Flow:**
- Instagram schedule: Gets videos [1, 2, 3, 4, 5] excluding ones already in Instagram queue
- YouTube schedule: Gets videos [1, 2, 3, 4, 5] excluding ones already in YouTube queue
- Result: Videos 1-5 are queued for BOTH platforms (10 queue items total)

---

## Build Status

✅ **TypeScript compilation:** PASSED
✅ **Vite build:** PASSED
✅ **Electron builder:** PASSED
✅ **Output files created:**
- `release/SocialSync-0.1.0-arm64.dmg`
- `release/SocialSync-0.1.0-arm64-mac.zip`

---

## Files Modified

### 1. QueueService.ts (Critical Fix)
- **Location:** `/Users/kunalkumrawat/socialsync/electron/services/queue/QueueService.ts`
- **Line 89-91:** Removed `db.run("UPDATE content_items SET status = 'queued'...")` and added explanatory comment
- **Line 321:** Changed `driveService.getNextContent()` to `driveService.getNextContentForPlatform(schedule.platform)`
- **Line 327-330:** Removed redundant `isContentQueued` check (now handled in SQL)
- **Impact:** Videos can be queued for multiple platforms, no more infinite loop on same video

### 2. DriveService.ts (Critical Enhancement)
- **Location:** `/Users/kunalkumrawat/socialsync/electron/services/drive/DriveService.ts`
- **Lines 498-529:** Added new method `getNextContentForPlatform(platform)`
- **Impact:** Efficiently selects content not already queued for specific platform via SQL query

### 3. App.tsx (TypeScript fixes only - non-functional)
- **Location:** `/Users/kunalkumrawat/socialsync/src/App.tsx`
- **Changes:**
  - Line 24: Prefix unused `appVersion` with underscore
  - Line 26: Prefix unused `schedulerPaused` with underscore
  - Line 30: Prefix unused `stats` with underscore
  - Line 1616: Added `setSchedulerPaused` to SettingsView useAppStore destructuring
  - Line 1727: Removed duplicate `schedulerPaused` destructuring
- **Impact:** Fixed TypeScript compilation errors, no runtime behavior changes

---

## Testing Instructions

### 1. Restart the Application

The fix requires a full application restart to take effect:

```bash
# Option A: Run the built DMG
open release/SocialSync-0.1.0-arm64.dmg

# Option B: Run in development mode
npm run dev
```

### 2. Verify Queue Generation

After restart, check the queue:

1. Open the app
2. Navigate to **Queue** view
3. Click the **YouTube** tab
4. **Expected:** Should see many more than 2 videos queued
5. Click the **Instagram** tab
6. **Expected:** Should see the SAME videos queued for Instagram

### 3. Check Console Logs

Open DevTools (View → Toggle Developer Tools) and look for startup logs:

```
[Main] Startup queue generation: Instagram=X, YouTube=Y
```

Where X and Y should be similar numbers (e.g., 42 for Instagram, 42 for YouTube if schedules are similar)

---

## How Queue Generation Works

### On Startup (Line 172 of main.ts)

```typescript
const scheduleService = getScheduleService()
const queueResult = scheduleService.generateQueueFromActiveSchedules(7)
```

This generates queue items for the next **7 days** based on:
- Active schedules (enabled=1)
- Days of week configured in each schedule
- Time slots configured in each schedule
- Available content in Google Drive

### Example Calculation

**Instagram Schedule:**
- Days: Monday, Wednesday, Friday (3 days)
- Times: 09:00, 18:00 (2 times per day)
- Date range: 7 days

**Maximum potential:** 7 days × 2 times = 14 slots
**Actual on schedule days:** 3 days × 2 times = 6 videos queued for Instagram

**YouTube Schedule:**
- Days: Tuesday, Thursday, Saturday (3 days)
- Times: 10:00, 20:00 (2 times per day)

**Actual:** 3 days × 2 times = 6 videos queued for YouTube

**Total:** 12 queue items (6 Instagram + 6 YouTube) using potentially 6-12 unique videos

---

## Expected Behavior After Fix

### Before Fix (Buggy)
- Video 1 → Instagram queue → marked 'queued' → unavailable for YouTube
- Video 2 → YouTube queue → marked 'queued' → unavailable for Instagram
- **Result:** Only 2 videos total across both platforms

### After Fix (Correct)
- Video 1 → Instagram queue → stays 'pending' → available for YouTube
- Video 1 → YouTube queue → stays 'pending'
- Video 2 → Instagram queue → stays 'pending' → available for YouTube
- Video 2 → YouTube queue → stays 'pending'
- ... continues for all scheduled slots
- **Result:** Full queue depth on both platforms (e.g., 42 Instagram + 42 YouTube = 84 queue items)

---

## Technical Details

### Status Lifecycle

**Before (Buggy):**
```
pending → queued → posted/failed
   ↑        ↑         ↑
  Added   Added    After
to Drive  to any   posting
         platform
```

**After (Fixed):**
```
pending → pending → posted/failed
   ↑         ↑          ↑
  Added    Added      After
to Drive  to queue   posting
         (any/all
         platforms)
```

### Database Schema

**queue table:**
- `content_id` (foreign key to content_items)
- `platform` (instagram | youtube)
- `status` (pending | processing | posted | failed | skipped)

**content_items table:**
- `id` (primary key)
- `status` (pending | queued | posted | failed | skipped)

### Key Methods

1. **QueueService.addToQueue()** - Adds to queue, NO LONGER updates content_items status
2. **QueueService.isContentQueued()** - Checks per-platform, prevents duplicates on same platform
3. **DriveService.getNextContent()** - Returns videos with status='pending'
4. **ScheduleService.generateQueueFromActiveSchedules()** - Triggers queue generation

---

## Potential Issues & Solutions

### Issue: Still only 2 videos in queue after restart

**Possible causes:**
1. **Not enough content:** Check Content Library view - need at least as many videos as queue slots
2. **No active schedules:** Check Schedule view - at least one schedule must be enabled
3. **Schedule times in past:** Scheduled times must be in the future (queue skips past times)

**Solution:**
```bash
# Check content count
# Open DevTools, run:
window.electronAPI.getDriveContent().then(c => console.log('Content count:', c.length))

# Check schedules
# Navigate to Schedule view, verify at least one schedule is enabled (green)
```

### Issue: Videos not posting

**Note:** This fix only affects queue GENERATION. Video posting logic is unchanged.

If videos are queued but not posting:
1. Check posting scheduler is running (Settings → Posting Status)
2. Check account connections (Settings → Connected Accounts)
3. Check posting service logs in DevTools console

---

## Rollback Plan

If this fix causes issues, rollback with:

```bash
cd /Users/kunalkumrawat/socialsync
git checkout HEAD~1 electron/services/queue/QueueService.ts
npm run build
```

Or manually restore line 89 in QueueService.ts:
```typescript
db.run("UPDATE content_items SET status = 'queued' WHERE id = ?", [contentId])
```

---

## Next Steps

1. ✅ **Fix applied and compiled** (DONE)
2. ⏳ **Restart application** (USER ACTION REQUIRED)
3. ⏳ **Verify queue generation** (USER ACTION REQUIRED)
4. ⏳ **Monitor for 24 hours** (ensure posting works correctly)

---

## Complete Solution Flow

### Before Fix (Buggy Behavior)

```
Instagram Schedule Processing:
  ↓
  Get oldest pending video (Video A)
  ↓
  Queue Video A for Instagram
  ↓
  Mark Video A as 'queued' in content_items  ← BUG #1
  ↓
YouTube Schedule Processing:
  ↓
  Get oldest pending video → Returns Video B (Video A is 'queued', not 'pending')
  ↓
  Queue Video B for YouTube
  ↓
  Mark Video B as 'queued' in content_items  ← BUG #1
  ↓
Instagram Next Time Slot:
  ↓
  Get oldest pending video → Returns Video C
  ↓
  Check if Video C already queued for Instagram? NO
  ↓
  Queue Video C... (continues but videos can't be shared between platforms)

RESULT: Videos split between platforms, no sharing, limited queue depth
```

### After Fix (Correct Behavior)

```
Instagram Schedule Processing:
  ↓
  Get oldest pending video NOT in Instagram queue (Video A)
  ↓
  Queue Video A for Instagram
  ↓
  Video A stays 'pending' in content_items  ← FIX #1
  ↓
YouTube Schedule Processing:
  ↓
  Get oldest pending video NOT in YouTube queue → Returns Video A (still pending!)
  ↓
  Queue Video A for YouTube  ← SAME VIDEO, DIFFERENT PLATFORM
  ↓
  Video A stays 'pending'
  ↓
Instagram Next Time Slot:
  ↓
  Get oldest pending video NOT in Instagram queue → Returns Video B (A is already queued)
  ↓
  Queue Video B for Instagram
  ↓
YouTube Next Time Slot:
  ↓
  Get oldest pending video NOT in YouTube queue → Returns Video B
  ↓
  Queue Video B for YouTube
  ↓
  (Continues for all available videos and time slots...)

RESULT: Videos queued for BOTH platforms, maximum queue utilization
```

### Key Improvements

1. **SQL-Level Filtering (FIX #2):** `getNextContentForPlatform()` uses SQL subquery to exclude already-queued content
2. **No Status Lock (FIX #1):** Videos stay 'pending' after queueing, remain available for other platforms
3. **Efficient Iteration (FIX #3):** No redundant checks, no infinite loops, each time slot gets a video

---

## Summary

**Problem:** Queue limited to 2 videos due to:
1. Content status locked to 'queued' after first platform (prevented multi-platform sharing)
2. Queue generation logic returned same video repeatedly when already queued (infinite skip loop)

**Solution:**
1. Removed status update to allow multi-platform queueing (QueueService.ts)
2. Added platform-specific content selection with SQL filtering (DriveService.ts)
3. Simplified queue generation logic (QueueService.ts)

**Impact:** Videos can now be queued for BOTH Instagram and YouTube simultaneously with efficient iteration

**Build Status:** ✅ Success - ready for restart

**Action Required:** Restart the application to activate the fix.

---

**© 2026 STAGE OTT. All rights reserved.**
