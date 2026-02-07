# Fix 403 Errors - Quick Action Required

## ⚠️ Issue Found:
You're getting **403 Forbidden** errors because the required Google APIs are not enabled in your Google Cloud Console project.

## ✅ What I've Done:
- Opened both API pages in your browser
- Added better error messages to the app
- Created this quick fix guide

## 🚀 Quick Fix (1 minute):

### Two browser windows should have opened. In each one:

#### Window 1: Google Drive API
1. **URL**: https://console.cloud.google.com/apis/library/drive.googleapis.com
2. **Select your SocialSync project** from the dropdown at the top
3. Click the blue **"ENABLE"** button
4. Wait ~5 seconds for it to enable

#### Window 2: YouTube Data API v3
1. **URL**: https://console.cloud.google.com/apis/library/youtube.googleapis.com
2. **Select your SocialSync project** (same project as above)
3. Click the blue **"ENABLE"** button
4. Wait ~5 seconds for it to enable

### Back in SocialSync app:

5. Go to **Settings** tab
6. Click **"Connect"** next to **Google Drive** first
7. Complete the OAuth authorization
8. Then click **"Connect"** next to **YouTube**
9. Complete the OAuth authorization

## ✅ That's it!

Once both APIs are enabled, you'll be able to:
- ✅ Browse Google Drive folders
- ✅ Scan for video content
- ✅ Connect YouTube for posting

---

## 🔍 APIs Required:

Your Google Cloud Project needs these APIs enabled:
- 🔲 Google Drive API (enable this now) - **Required for browsing folders**
- 🔲 YouTube Data API v3 (enable this now) - **Required for YouTube posting**

---

## Current Status:
- ✅ Google OAuth Client ID: Configured
- ✅ Google OAuth Secret: Configured
- ✅ Redirect URI: http://localhost:8585/callback
- ❌ Google Drive API: Not enabled (causes "No folders found")
- ❌ YouTube Data API v3: Not enabled (causes connection error)

Everything is configured - just enable both APIs!
