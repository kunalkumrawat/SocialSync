# Smart Posting - Implementation Summary

**Date:** February 8, 2026
**Status:** ✅ Frontend UI Complete | ⏳ Backend Pending

---

## What Was Implemented (Frontend)

### 1. Smart Posting Settings Section

**Location:** Settings page, after General settings

**Features:**
- ✅ **Enable/Disable Toggle** - Turn Smart Posting on/off
- ✅ **Logo Upload Button** - Upload STAGE logo reference image
- ✅ **Detection Sensitivity Slider** - Adjust from 50% (loose) to 100% (strict)
- ✅ **No Logo Action Dropdown** - Choose what happens to videos without logo:
  - Skip posting automatically
  - Hold for manual review
  - Post but notify me
- ✅ **Rejected Videos Folder Button** - Opens Google Drive folder with rejected videos

**Visual Design:**
- AI badge next to "Smart Posting" title
- Collapsible - only shows details when enabled
- STAGE-themed colors and styling
- Clear descriptions for each setting

---

## How It Works (User Workflow)

### Setup (One-time)

1. **Go to Settings** → Scroll to "Smart Posting"

2. **Enable Smart Posting** → Toggle ON (green)

3. **Upload STAGE Logo**
   - Click "Upload Logo" button
   - Select PNG/JPG of STAGE logo
   - Logo saved as reference

4. **Set Sensitivity** (Default: 80%)
   - Move slider left for loose detection (catches more)
   - Move slider right for strict detection (fewer false positives)

5. **Choose Action for Videos Without Logo**
   - **Skip:** Don't add to queue at all
   - **Hold:** Add to queue but mark for review
   - **Notify:** Post anyway but send notification

---

### Automatic Operation

```
New video discovered in Google Drive
           ↓
   Smart Posting enabled? ──NO──→ Add to queue normally
           ↓ YES
    Extract video frames
           ↓
  Compare frames with STAGE logo
           ↓
   Logo detected at X% confidence
           ↓
  Confidence > Sensitivity threshold?
           │
      YES  │  NO
       ↓   │   ↓
  Add to  │  Take action based on setting:
  queue   │  - Skip: Don't add to queue
  (post)  │  - Hold: Add with "Manual Review" status
          │  - Notify: Add to queue + send notification
          │           Move to "Rejected Videos" folder
          └───────────→
```

---

## UI Components Implemented

### Settings Section

```
┌─────────────────────────────────────────────────────┐
│ Smart Posting [AI]                                  │
│ Only post videos with STAGE logo detected          │
├─────────────────────────────────────────────────────┤
│ Enable Smart Posting                          [●──] │
│ Automatically detect STAGE logo in videos     ON    │
├─────────────────────────────────────────────────────┤
│ STAGE Logo Reference                                │
│ [✓ Icon]  [Upload Logo]  ✓ Logo uploaded          │
│ Upload a clear PNG/JPG image of the STAGE logo     │
├─────────────────────────────────────────────────────┤
│ Detection Sensitivity                          80%  │
│ [========●=====] ← Slider                          │
│ Loose (50%)    Balanced (75%)    Strict (100%)     │
├─────────────────────────────────────────────────────┤
│ When logo not detected:                             │
│ [Hold for manual review ▼]                         │
│ Videos without logo will be held for your review   │
├─────────────────────────────────────────────────────┤
│ ℹ Review Rejected Videos                           │
│ Videos without STAGE logo are moved to a separate  │
│ folder in your Google Drive for review.            │
│ [📁 Open Rejected Videos Folder]                   │
└─────────────────────────────────────────────────────┘
```

### Queue Item Status Badges (Future)

When backend is implemented, queue items will show:

```
[Video Title]  [●●● Pending]  [✅ Logo Detected 87%]  [Actions...]
               ↑ Status      ↑ Smart detection result

[Video Title]  [●●● Hold]     [❌ No Logo Found]      [Actions...]
               ↑ Needs review ↑ Rejected by smart detection

[Video Title]  [●●● Scanning] [🔍 Checking...]        [Actions...]
               ↑ In progress  ↑ Logo detection running
```

---

## Backend Implementation Needed

### 1. Install Dependencies

```bash
# Video frame extraction
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg

# Image comparison (choose one)
npm install sharp pixelmatch  # Simple template matching
# OR
npm install opencv4nodejs      # Advanced OpenCV (more accurate)
```

### 2. Create Backend Functions

**File:** `electron/smart-posting.js`

```javascript
const ffmpeg = require('fluent-ffmpeg')
const sharp = require('sharp')
const pixelmatch = require('pixelmatch')
const path = require('path')
const fs = require('fs').promises

// Extract frames from video
async function extractFrames(videoPath, outputDir, count = 10) {
  await fs.mkdir(outputDir, { recursive: true })

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: count,
        folder: outputDir,
        filename: 'frame-%i.png',
        size: '1280x720'
      })
      .on('end', () => resolve(outputDir))
      .on('error', (err) => reject(err))
  })
}

// Detect logo in a single frame
async function detectLogoInFrame(framePath, logoPath, threshold = 0.8) {
  try {
    // Load logo
    const logoImage = await sharp(logoPath)
      .resize(200, 200, { fit: 'contain' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Load frame and search in different regions
    const regions = [
      { left: 0, top: 0, width: 400, height: 200 },           // Top-left
      { left: 880, top: 0, width: 400, height: 200 },         // Top-right
      { left: 0, top: 520, width: 400, height: 200 },         // Bottom-left
      { left: 880, top: 520, width: 400, height: 200 },       // Bottom-right
    ]

    for (const region of regions) {
      // Extract region from frame
      const frameRegion = await sharp(framePath)
        .extract(region)
        .resize(200, 200, { fit: 'contain' })
        .raw()
        .toBuffer({ resolveWithObject: true })

      // Compare with logo
      const diff = pixelmatch(
        logoImage.data,
        frameRegion.data,
        null,
        200,
        200,
        { threshold: 0.1 }
      )

      const similarity = 1 - (diff / (200 * 200))

      if (similarity > threshold) {
        return {
          detected: true,
          confidence: similarity,
          region: region
        }
      }
    }

    return { detected: false, confidence: 0 }
  } catch (error) {
    console.error('Logo detection error:', error)
    return { detected: false, confidence: 0, error: error.message }
  }
}

// Scan video for logo
async function scanVideoForLogo(videoPath, logoPath, sensitivityPercent = 80) {
  const tmpDir = path.join(require('os').tmpdir(), 'socialsync-frames')
  const threshold = sensitivityPercent / 100

  try {
    // Extract frames
    const framesDir = await extractFrames(videoPath, tmpDir)

    // Get all frame files
    const frameFiles = await fs.readdir(framesDir)
    const framePaths = frameFiles
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(framesDir, f))

    // Check each frame
    let maxConfidence = 0
    let detectedInFrame = null

    for (const framePath of framePaths) {
      const result = await detectLogoInFrame(framePath, logoPath, threshold)

      if (result.detected && result.confidence > maxConfidence) {
        maxConfidence = result.confidence
        detectedInFrame = framePath
      }
    }

    // Cleanup
    await fs.rm(framesDir, { recursive: true, force: true })

    return {
      success: true,
      detected: maxConfidence > threshold,
      confidence: maxConfidence,
      detectedInFrame
    }
  } catch (error) {
    console.error('Video scan error:', error)
    return {
      success: false,
      detected: false,
      confidence: 0,
      error: error.message
    }
  }
}

module.exports = {
  extractFrames,
  detectLogoInFrame,
  scanVideoForLogo
}
```

### 3. Add IPC Handlers

**File:** `electron/main.js` (add these handlers)

```javascript
const { scanVideoForLogo } = require('./smart-posting')
const { ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs').promises

// Toggle Smart Posting
ipcMain.handle('smart-posting:toggle', async (event, enabled) => {
  // Save to database
  await db.run(
    'UPDATE smart_posting_settings SET enabled = ?, updated_at = ?',
    [enabled ? 1 : 0, new Date()]
  )
  return { success: true }
})

// Upload logo reference
ipcMain.handle('smart-posting:upload-logo', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
    ]
  })

  if (result.canceled) {
    return { success: false, canceled: true }
  }

  const sourcePath = result.filePaths[0]
  const destPath = path.join(app.getPath('userData'), 'stage-logo-reference.png')

  // Copy file
  await fs.copyFile(sourcePath, destPath)

  // Save path to database
  await db.run(
    'UPDATE smart_posting_settings SET logo_reference_path = ?, updated_at = ?',
    [destPath, new Date()]
  )

  return { success: true, path: destPath }
})

// Update sensitivity
ipcMain.handle('smart-posting:set-sensitivity', async (event, sensitivity) => {
  await db.run(
    'UPDATE smart_posting_settings SET sensitivity = ?, updated_at = ?',
    [sensitivity / 100, new Date()]
  )
  return { success: true }
})

// Update no-logo action
ipcMain.handle('smart-posting:set-no-logo-action', async (event, action) => {
  await db.run(
    'UPDATE smart_posting_settings SET no_logo_action = ?, updated_at = ?',
    [action, new Date()]
  )
  return { success: true }
})

// Scan video for logo
ipcMain.handle('smart-posting:scan-video', async (event, videoPath) => {
  // Get settings
  const settings = await db.get('SELECT * FROM smart_posting_settings')

  if (!settings || !settings.logo_reference_path) {
    return {
      success: false,
      error: 'Logo reference not configured'
    }
  }

  // Scan video
  const result = await scanVideoForLogo(
    videoPath,
    settings.logo_reference_path,
    settings.sensitivity * 100
  )

  return result
})

// Open rejected videos folder
ipcMain.handle('smart-posting:open-rejected-folder', async (event) => {
  const { shell } = require('electron')

  // Get rejected folder ID from settings or create it
  const settings = await db.get('SELECT * FROM smart_posting_settings')

  if (settings && settings.rejected_folder_id) {
    // Open Google Drive folder in browser
    shell.openExternal(`https://drive.google.com/drive/folders/${settings.rejected_folder_id}`)
    return { success: true }
  } else {
    return {
      success: false,
      error: 'Rejected videos folder not configured'
    }
  }
})
```

### 4. Update Frontend to Call Backend

**File:** `src/App.tsx` (update handlers)

```typescript
const handleUploadLogo = async () => {
  try {
    const result = await window.electronAPI?.smartPostingUploadLogo()
    if (result.success) {
      setSmartPosting({ ...smartPosting, logoPath: result.path })
      toast.success('Logo uploaded successfully')
    } else if (!result.canceled) {
      toast.error('Failed to upload logo')
    }
  } catch (error) {
    toast.error('Failed to upload logo')
  }
}

const handleSensitivityChange = async (value: number) => {
  setSmartPosting({ ...smartPosting, sensitivity: value })
  await window.electronAPI?.smartPostingSetSensitivity(value)
}

const handleNoLogoActionChange = async (action: 'skip' | 'hold' | 'notify') => {
  setSmartPosting({ ...smartPosting, noLogoAction: action })
  await window.electronAPI?.smartPostingSetNoLogoAction(action)
  toast.success('Settings updated')
}

// In Rejected Videos button
onClick={async () => {
  const result = await window.electronAPI?.smartPostingOpenRejectedFolder()
  if (!result.success) {
    toast.error(result.error || 'Failed to open folder')
  }
}}
```

### 5. Update Queue System Integration

**When scanning content library:**

```javascript
// In content scanning function
for (const video of discoveredVideos) {
  // Check if Smart Posting is enabled
  const smartSettings = await db.get('SELECT * FROM smart_posting_settings')

  if (smartSettings && smartSettings.enabled) {
    // Scan for logo
    const scanResult = await scanVideoForLogo(
      video.path,
      smartSettings.logo_reference_path,
      smartSettings.sensitivity * 100
    )

    // Save result
    video.logo_detected = scanResult.detected
    video.logo_confidence = scanResult.confidence

    // Take action based on setting
    if (!scanResult.detected) {
      if (smartSettings.no_logo_action === 'skip') {
        // Don't add to content library
        continue
      } else if (smartSettings.no_logo_action === 'hold') {
        // Add but mark as needing review
        video.status = 'hold'
      }
      // 'notify' action just adds normally and sends notification
    }
  }

  // Add to content library
  await db.run(`
    INSERT INTO content_items (drive_file_id, filename, logo_detected, logo_confidence, status)
    VALUES (?, ?, ?, ?, ?)
  `, [video.id, video.name, video.logo_detected, video.logo_confidence, video.status || 'available'])
}
```

---

## Database Schema Required

```sql
-- Create Smart Posting settings table
CREATE TABLE IF NOT EXISTS smart_posting_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT 0,
  logo_reference_path TEXT,
  sensitivity REAL DEFAULT 0.8,
  no_logo_action TEXT DEFAULT 'hold',
  rejected_folder_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default row
INSERT INTO smart_posting_settings (id) VALUES (1);

-- Update content_items table
ALTER TABLE content_items ADD COLUMN logo_detected BOOLEAN DEFAULT NULL;
ALTER TABLE content_items ADD COLUMN logo_confidence REAL DEFAULT NULL;
ALTER TABLE content_items ADD COLUMN logo_checked_at TIMESTAMP;

-- Update queue_items table
ALTER TABLE queue_items ADD COLUMN logo_detected BOOLEAN DEFAULT NULL;
ALTER TABLE queue_items ADD COLUMN logo_confidence REAL DEFAULT NULL;
ALTER TABLE queue_items ADD COLUMN logo_checked_at TIMESTAMP;
```

---

## Testing Checklist

### Frontend UI
- [x] Smart Posting settings section appears
- [x] Toggle switch works
- [x] Upload button visible
- [x] Sensitivity slider works (50-100%)
- [x] Dropdown shows 3 options
- [x] Rejected videos button visible
- [x] Settings collapse when disabled

### Backend (Needs Implementation)
- [ ] Logo upload opens file picker
- [ ] Logo saved to app data directory
- [ ] Frames extracted from test video
- [ ] Logo detected in test video
- [ ] Confidence score calculated correctly
- [ ] Videos without logo skipped
- [ ] Videos without logo held for review
- [ ] Rejected folder created in Drive
- [ ] Rejected videos moved to folder

---

## Build Status

✅ **Frontend UI Complete**
✅ **Build successful**
✅ **No TypeScript errors**
⏳ **Backend implementation needed**

---

## Next Steps (Backend Development)

1. **Install Dependencies** (5 minutes)
   ```bash
   npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg sharp pixelmatch
   ```

2. **Create `electron/smart-posting.js`** (2 hours)
   - Frame extraction function
   - Logo detection function
   - Video scanning function

3. **Add IPC Handlers in `electron/main.js`** (1 hour)
   - Toggle handler
   - Upload handler
   - Scan handler
   - Open folder handler

4. **Update Database Schema** (15 minutes)
   - Run SQL migrations
   - Add smart_posting_settings table
   - Update content_items and queue_items

5. **Integrate with Content Scanner** (2 hours)
   - Call logo detection during scan
   - Apply no-logo actions
   - Move rejected videos to folder

6. **Testing** (2 hours)
   - Test with videos that have logo
   - Test with videos without logo
   - Test different sensitivity levels
   - Test all three no-logo actions

**Total Estimated Time:** 8-10 hours

---

## User Benefits

**Before:**
- ❌ All videos posted regardless of branding
- ❌ Manual review of every video required
- ❌ Risk of posting unbranded content
- ❌ Time-consuming quality control

**After:**
- ✅ Only STAGE-branded videos posted automatically
- ✅ Automatic logo detection using AI
- ✅ Rejected videos accessible for review
- ✅ Configurable sensitivity and actions
- ✅ Time saved on manual checks
- ✅ Consistent brand presence on social media

---

## Summary

### What's Working Now (Frontend)
- ✅ Complete UI for Smart Posting settings
- ✅ Toggle to enable/disable
- ✅ Logo upload button
- ✅ Sensitivity slider (50-100%)
- ✅ No-logo action dropdown
- ✅ Rejected videos folder button
- ✅ Clear descriptions and tooltips

### What Needs Backend Work
- ⏳ Actual logo upload file picker
- ⏳ Video frame extraction
- ⏳ Logo detection algorithm
- ⏳ Database storage
- ⏳ Queue integration
- ⏳ Rejected videos folder creation
- ⏳ Status badges on queue items

The frontend UI is complete and ready. Once the backend is implemented, users will be able to automatically filter videos based on STAGE logo presence, saving time and ensuring consistent branding across all social media posts.

---

**© 2026 STAGE OTT. All rights reserved.**
