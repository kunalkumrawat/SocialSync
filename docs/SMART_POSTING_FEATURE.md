# Smart Posting Feature - Logo Detection

**Feature:** Automatically approve and post only videos that contain the STAGE logo

---

## Overview

Smart Posting uses AI/Computer Vision to detect the STAGE logo in videos before posting. Videos without the logo are automatically skipped or held for manual review.

## Implementation Plan

### Phase 1: Frontend UI (Settings & Controls)

**Settings Section:**
- Toggle: Enable/Disable Smart Posting
- Upload: STAGE logo reference image
- Slider: Detection sensitivity (50-100%)
- Options:
  - Auto-skip videos without logo
  - Hold for manual review
  - Notification on skipped videos

**Queue Item Indicators:**
- ✅ Logo Detected (green badge)
- ❌ No Logo Found (red badge)
- 🔍 Checking... (blue badge)
- ⚠️ Manual Review Needed (yellow badge)

**Content Library:**
- Pre-scan videos when added
- Show logo detection status
- Filter by logo status

---

### Phase 2: Backend Implementation (Required)

#### 1. Video Frame Extraction

**Dependencies:**
```bash
npm install fluent-ffmpeg
npm install @ffmpeg-installer/ffmpeg
```

**Extract frames:**
```javascript
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
ffmpeg.setFfmpegPath(ffmpegPath)

function extractFrames(videoPath, outputDir, count = 10) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: count, // Extract 10 frames
        folder: outputDir,
        filename: 'frame-%i.png',
        size: '1280x720'
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
  })
}
```

#### 2. Logo Detection

**Option A: Template Matching (Simple, Fast)**

```bash
npm install sharp
npm install pixelmatch
```

```javascript
const sharp = require('sharp')
const pixelmatch = require('pixelmatch')

async function detectLogo(framePath, logoPath, threshold = 0.1) {
  // Load images
  const frame = await sharp(framePath).raw().toBuffer()
  const logo = await sharp(logoPath).raw().toBuffer()

  // Convert to same size for comparison
  const frameResized = await sharp(framePath)
    .resize(1280, 720)
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Search for logo in different regions
  const regions = [
    { top: 0, left: 0, width: 400, height: 200 },      // Top-left
    { top: 0, right: 0, width: 400, height: 200 },     // Top-right
    { bottom: 0, left: 0, width: 400, height: 200 },   // Bottom-left
    { bottom: 0, right: 0, width: 400, height: 200 },  // Bottom-right
  ]

  for (const region of regions) {
    const cropped = await sharp(framePath)
      .extract(region)
      .raw()
      .toBuffer()

    // Compare with logo
    const diff = pixelmatch(cropped, logo, null, region.width, region.height, { threshold })
    const similarity = 1 - (diff / (region.width * region.height))

    if (similarity > 0.8) { // 80% match
      return { detected: true, confidence: similarity, region }
    }
  }

  return { detected: false, confidence: 0 }
}
```

**Option B: OpenCV (Advanced, More Accurate)**

```bash
npm install opencv4nodejs
```

```javascript
const cv = require('opencv4nodejs')

function detectLogoOpenCV(framePath, logoPath) {
  const frame = cv.imread(framePath)
  const logo = cv.imread(logoPath)

  // Convert to grayscale
  const frameGray = frame.bgrToGray()
  const logoGray = logo.bgrToGray()

  // Template matching
  const matched = frameGray.matchTemplate(logoGray, cv.TM_CCOEFF_NORMED)
  const minMax = matched.minMaxLoc()

  const threshold = 0.7 // 70% confidence
  if (minMax.maxVal >= threshold) {
    return {
      detected: true,
      confidence: minMax.maxVal,
      location: minMax.maxLoc
    }
  }

  return { detected: false, confidence: minMax.maxVal }
}
```

#### 3. Integration with Queue System

**Database Schema Update:**
```sql
ALTER TABLE queue_items ADD COLUMN logo_detected BOOLEAN DEFAULT NULL;
ALTER TABLE queue_items ADD COLUMN logo_confidence REAL DEFAULT NULL;
ALTER TABLE queue_items ADD COLUMN logo_checked_at TIMESTAMP;
```

**Scan before queuing:**
```javascript
async function addToQueue(videoPath, platform, scheduledFor) {
  // Extract frames
  const framesDir = path.join(tmpDir, 'frames')
  await extractFrames(videoPath, framesDir)

  // Check each frame for logo
  const frames = fs.readdirSync(framesDir)
  let maxConfidence = 0
  let detected = false

  for (const frame of frames) {
    const framePath = path.join(framesDir, frame)
    const result = await detectLogo(framePath, logoReferencePath)

    if (result.detected) {
      detected = true
      maxConfidence = Math.max(maxConfidence, result.confidence)
    }
  }

  // Add to queue with logo status
  const queueItem = {
    video_path: videoPath,
    platform,
    scheduled_for: scheduledFor,
    logo_detected: detected,
    logo_confidence: maxConfidence,
    logo_checked_at: new Date(),
    status: detected ? 'pending' : 'hold' // Hold if no logo
  }

  await db.run(`
    INSERT INTO queue_items (video_path, platform, scheduled_for, logo_detected, logo_confidence, logo_checked_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [queueItem.video_path, queueItem.platform, queueItem.scheduled_for, queueItem.logo_detected, queueItem.logo_confidence, queueItem.logo_checked_at, queueItem.status])

  return queueItem
}
```

---

### Phase 3: Frontend Integration

#### Settings Page

**New Section in Settings:**
```tsx
<div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
  <h3 className="text-lg font-semibold mb-4">Smart Posting (Logo Detection)</h3>

  {/* Enable/Disable */}
  <div className="flex items-center justify-between py-2 mb-4">
    <div>
      <p className="text-white font-medium">Enable Smart Posting</p>
      <p className="text-sm text-gray-400">Only post videos with STAGE logo</p>
    </div>
    <button
      onClick={() => handleToggleSmartPosting()}
      className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
        smartPostingEnabled ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
      }`}
    >
      <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
        smartPostingEnabled ? 'translate-x-9' : 'translate-x-1'
      }`}></span>
    </button>
  </div>

  {/* Logo Upload */}
  <div className="mb-4">
    <label className="text-sm text-gray-400 mb-2 block">STAGE Logo Reference</label>
    <div className="flex items-center gap-3">
      {logoImage && (
        <img src={logoImage} alt="STAGE Logo" className="h-16 w-auto border-2 border-stage-ribbon rounded" />
      )}
      <button
        onClick={() => uploadLogoRef()}
        className="px-4 py-2 bg-stage-red rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        {logoImage ? 'Change Logo' : 'Upload Logo'}
      </button>
    </div>
    <p className="text-xs text-gray-500 mt-2">Upload a clear image of the STAGE logo for detection</p>
  </div>

  {/* Detection Sensitivity */}
  <div className="mb-4">
    <label className="text-sm text-gray-400 mb-2 block">
      Detection Sensitivity: {sensitivity}%
    </label>
    <input
      type="range"
      min="50"
      max="100"
      value={sensitivity}
      onChange={(e) => setSensitivity(e.target.value)}
      className="w-full accent-stage-red"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>Loose (50%)</span>
      <span>Strict (100%)</span>
    </div>
  </div>

  {/* Action for non-logo videos */}
  <div>
    <label className="text-sm text-gray-400 mb-2 block">When logo not detected:</label>
    <select
      value={noLogoAction}
      onChange={(e) => setNoLogoAction(e.target.value)}
      className="w-full bg-stage-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-white"
    >
      <option value="skip">Skip posting automatically</option>
      <option value="hold">Hold for manual review</option>
      <option value="notify">Post but notify me</option>
    </select>
  </div>
</div>
```

#### Queue Item Status Badge

```tsx
{item.logo_detected !== null && (
  <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
    item.logo_detected
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white'
  }`}>
    {item.logo_detected ? (
      <>
        <iconMap.success size={12} />
        Logo Detected
      </>
    ) : (
      <>
        <iconMap.warning size={12} />
        No Logo
      </>
    )}
  </span>
)}
```

---

## User Workflow

### Setup Phase
1. Go to Settings
2. Enable "Smart Posting"
3. Upload STAGE logo reference image
4. Set detection sensitivity (default: 80%)
5. Choose action for videos without logo

### Automatic Workflow
```
New video discovered in Google Drive
           ↓
    Extract 10 frames
           ↓
    Check each frame for STAGE logo
           ↓
   Logo detected? ────YES──→ Add to queue (status: pending)
           │
          NO
           ↓
   Action setting?
      ├─ Skip: Don't add to queue
      ├─ Hold: Add to queue (status: hold)
      └─ Notify: Add to queue + send notification
```

### Manual Review Workflow
1. Videos with "Hold" status appear in Queue
2. User can manually approve or reject
3. Approved videos change to "pending"
4. Rejected videos are removed from queue

---

## Performance Considerations

### Optimization Strategies

1. **Frame Sampling**
   - Extract 10 frames instead of all frames
   - Sample at: 0%, 10%, 20%, ..., 90% of video duration
   - Reduces processing time by 90%

2. **Caching**
   - Cache logo detection results per video
   - Store in database: `content_items.logo_detected`
   - Only re-scan if video modified

3. **Background Processing**
   - Scan videos in background queue
   - Don't block UI during scanning
   - Show "Checking..." status during scan

4. **Batch Processing**
   - Scan multiple videos in parallel
   - Use worker threads for CPU-intensive tasks
   - Limit concurrent scans to 3-5

### Performance Metrics
- **Frame extraction:** ~2-5 seconds per video
- **Logo detection:** ~100-500ms per frame
- **Total per video:** ~5-10 seconds
- **Batch of 10 videos:** ~1-2 minutes

---

## UI States

### Queue Item States

1. **Logo Detected ✅**
   - Green badge: "Logo Detected"
   - Status: pending/processing/posted
   - Can be posted automatically

2. **No Logo ❌**
   - Red badge: "No Logo"
   - Status: hold/skipped
   - Requires manual approval or is skipped

3. **Checking 🔍**
   - Blue badge: "Checking..."
   - Status: scanning
   - Logo detection in progress

4. **Manual Review ⚠️**
   - Yellow badge: "Manual Review"
   - Status: hold
   - Waiting for user decision

5. **Detection Error ⚠️**
   - Orange badge: "Check Failed"
   - Status: error
   - Logo detection failed, needs retry

---

## Error Handling

### Common Issues

1. **Logo reference not uploaded**
   - Show error: "Please upload STAGE logo reference"
   - Disable smart posting until logo uploaded

2. **Video extraction failed**
   - Retry extraction once
   - If still fails, mark as "Check Failed"
   - Allow manual override

3. **False positives**
   - Logo detected but user says it's wrong
   - Add "Report False Positive" button
   - Improve detection with feedback

4. **False negatives**
   - Logo present but not detected
   - Add "Mark as Has Logo" manual override
   - Lower sensitivity threshold

---

## Database Schema

```sql
-- Settings table
CREATE TABLE IF NOT EXISTS smart_posting_settings (
  id INTEGER PRIMARY KEY,
  enabled BOOLEAN DEFAULT 0,
  logo_reference_path TEXT,
  sensitivity REAL DEFAULT 0.8,
  no_logo_action TEXT DEFAULT 'skip', -- 'skip', 'hold', 'notify'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update queue_items table
ALTER TABLE queue_items ADD COLUMN logo_detected BOOLEAN DEFAULT NULL;
ALTER TABLE queue_items ADD COLUMN logo_confidence REAL DEFAULT NULL;
ALTER TABLE queue_items ADD COLUMN logo_checked_at TIMESTAMP;

-- Update content_items table (cache results)
ALTER TABLE content_items ADD COLUMN logo_detected BOOLEAN DEFAULT NULL;
ALTER TABLE content_items ADD COLUMN logo_confidence REAL DEFAULT NULL;
ALTER TABLE content_items ADD COLUMN logo_checked_at TIMESTAMP;
```

---

## API Endpoints (Electron IPC)

```typescript
// Enable/disable smart posting
ipcMain.handle('smart-posting:toggle', async (event, enabled: boolean) => {
  await db.run('UPDATE smart_posting_settings SET enabled = ?', [enabled])
  return { success: true }
})

// Upload logo reference
ipcMain.handle('smart-posting:upload-logo', async (event, filePath: string) => {
  // Copy logo to app data directory
  const logoPath = path.join(app.getPath('userData'), 'logo-reference.png')
  await fs.copyFile(filePath, logoPath)

  await db.run('UPDATE smart_posting_settings SET logo_reference_path = ?', [logoPath])
  return { success: true, path: logoPath }
})

// Set sensitivity
ipcMain.handle('smart-posting:set-sensitivity', async (event, sensitivity: number) => {
  await db.run('UPDATE smart_posting_settings SET sensitivity = ?', [sensitivity / 100])
  return { success: true }
})

// Scan video for logo
ipcMain.handle('smart-posting:scan-video', async (event, videoPath: string) => {
  try {
    // Extract frames
    const framesDir = await extractFrames(videoPath)

    // Get logo reference
    const settings = await db.get('SELECT * FROM smart_posting_settings')
    if (!settings.logo_reference_path) {
      throw new Error('Logo reference not configured')
    }

    // Check frames
    const result = await checkFramesForLogo(framesDir, settings.logo_reference_path, settings.sensitivity)

    return {
      success: true,
      detected: result.detected,
      confidence: result.confidence
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Manual override - mark as has logo
ipcMain.handle('smart-posting:override-logo', async (event, itemId: string, hasLogo: boolean) => {
  await db.run(
    'UPDATE queue_items SET logo_detected = ?, logo_confidence = 1.0, logo_checked_at = ? WHERE id = ?',
    [hasLogo, new Date(), itemId]
  )
  return { success: true }
})
```

---

## Testing Strategy

### Unit Tests

1. **Frame extraction**
   - Test with sample videos
   - Verify frame count and quality
   - Test error handling

2. **Logo detection**
   - Test with videos that have logo
   - Test with videos without logo
   - Test different logo positions
   - Test different video qualities

3. **Sensitivity threshold**
   - Test 50%, 70%, 90%, 100%
   - Measure false positive/negative rates

### Integration Tests

1. **End-to-end workflow**
   - Add video to content library
   - Scan for logo automatically
   - Add to queue based on result
   - Post video if logo detected

2. **Manual override**
   - Mark video as has logo
   - Verify it moves to queue
   - Verify it posts correctly

---

## Future Enhancements

1. **ML Model Training**
   - Collect false positives/negatives
   - Train custom STAGE logo detector
   - Improve accuracy over time

2. **Multiple Logo Variants**
   - Support different STAGE logos
   - Horizontal, vertical, icon-only
   - Different color schemes

3. **Logo Position Detection**
   - Detect where logo appears in video
   - Prefer videos with logo in corners
   - Watermark detection

4. **Confidence Score Display**
   - Show percentage: "Logo detected (87%)"
   - Visual confidence indicator
   - Adjust sensitivity based on confidence

5. **Batch Re-scanning**
   - Re-scan all content library
   - Update logo status for all videos
   - Progress bar for bulk scanning

---

## Implementation Priority

**Phase 1: Frontend (This session)** ✅
- Add Smart Posting settings section
- Add logo status badges to queue items
- Add manual override buttons

**Phase 2: Backend (Next session)**
- Implement frame extraction
- Implement logo detection
- Integrate with queue system

**Phase 3: Optimization (Future)**
- Add caching
- Add batch processing
- Performance tuning

---

**Status:** Phase 1 (Frontend) - Ready to implement
**Estimated Time:** Phase 1: 2 hours, Phase 2: 8-12 hours, Phase 3: 4-6 hours

