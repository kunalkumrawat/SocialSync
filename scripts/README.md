# YouTube Channel ID Fetcher

Get real YouTube channel IDs for your 6 channels to complete multi-channel setup.

## 🎯 Quick Start (Recommended)

### Option 1: Browser Tool (Easiest)

1. **Open the HTML file:**
   ```bash
   open scripts/get-channel-ids.html
   ```
   Or double-click `get-channel-ids.html` in Finder

2. **Get YouTube API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Enable "YouTube Data API v3" if not already enabled
   - Copy the API key

3. **Fetch Channel IDs:**
   - Paste API key in the web tool
   - Click "Fetch Channel IDs"
   - Copy the generated code

4. **Update Your App:**
   - Open `/Users/kunalkumrawat/socialsync/electron/main.ts`
   - Find the `initializeYouTubeChannels` function (around line 156)
   - Replace the `channels` array with your copied code

---

### Option 2: Node.js Script

1. **Edit the script:**
   ```bash
   nano scripts/fetch-channel-ids.js
   ```
   Replace `YOUR_YOUTUBE_API_KEY` with your actual API key

2. **Run the script:**
   ```bash
   node scripts/fetch-channel-ids.js
   ```

3. **Copy the output** and update `main.ts` as described above

---

## 📋 Your Channels

- @stage_promos
- @stage_shortss
- @STAGE_Reelss
- @STAGE_Dramas
- @STAGE_Cinema
- @kunalkumrawat09

---

## 🔑 Getting YouTube Data API Key

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Enable YouTube Data API v3:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "YouTube Data API v3"
   - Click "Enable"

3. **Create API Key:**
   - Navigate to Credentials tab
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

4. **Secure Your Key (Optional but Recommended):**
   - Click "Restrict Key"
   - Under "API restrictions", select "Restrict key"
   - Select "YouTube Data API v3"
   - Save

---

## 📝 After Fetching IDs

Once you have the real channel IDs, update this section in `electron/main.ts`:

```typescript
// Around line 175
const channels = [
  { handle: '@stage_promos', id: 'UC...', name: 'STAGE Promos' },
  { handle: '@stage_shortss', id: 'UC...', name: 'STAGE Shorts' },
  { handle: '@STAGE_Reelss', id: 'UC...', name: 'STAGE Reels' },
  { handle: '@STAGE_Dramas', id: 'UC...', name: 'STAGE Dramas' },
  { handle: '@STAGE_Cinema', id: 'UC...', name: 'STAGE Cinema' },
  { handle: '@kunalkumrawat09', id: 'UC...', name: 'Kunal Kumrawat' },
]
```

Then restart the app!

---

## ✅ Verification

After updating with real IDs:

1. Go to **Settings** in SocialSync
2. Scroll to **YouTube Channels** section
3. You should see all 6 channels with correct names and stats
4. Toggle channels on/off as needed

---

## 🚀 Next Steps

With real channel IDs in place, you'll be able to:
- Track posting quota per channel
- Enable/disable specific channels
- See which channel each post goes to in the Queue view
- Monitor multi-channel statistics in Dashboard

**Note:** To actually post to different channels, you'll still need to either:
- Connect multiple Google accounts (one per channel), OR
- Use YouTube Content Owner API (requires YouTube Partner Program)

For now, the system tracks which channel each post is assigned to, even if posting goes to the default channel.
