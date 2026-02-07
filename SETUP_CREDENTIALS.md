# OAuth Credentials Setup Guide

## 🚨 **You're seeing "Error 401: invalid_client" because OAuth credentials aren't configured yet!**

Follow these steps to fix it:

---

## 📋 **Quick Fix (5 minutes)**

### **Step 1: Create Google OAuth Credentials**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
   - Name: `SocialSync` (or any name)
   - Click "Create"

3. **Enable APIs:**
   - Click "Enable APIs and Services"
   - Search and enable: **Google Drive API**
   - Search and enable: **YouTube Data API v3**

4. **Create OAuth Credentials:**
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "OAuth client ID"
   - Configure consent screen (if prompted):
     - User Type: **External**
     - App name: `SocialSync`
     - User support email: your email
     - Developer contact: your email
     - Click "Save and Continue" through all steps

   - Application type: **Web application**
   - Name: `SocialSync Desktop`
   - Authorized redirect URIs:
     ```
     http://localhost:8585/callback
     ```
   - Click "Create"

5. **Copy Credentials:**
   - You'll see a modal with:
     - **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
     - **Client Secret** (looks like: `GOCSPX-abc123def456`)
   - **Keep this window open** (we'll use these in Step 2)

---

### **Step 2: Configure SocialSync**

#### **Option A: Environment Variables (Recommended for Development)**

**macOS/Linux:**
```bash
# In terminal, in the socialsync directory:
export GOOGLE_CLIENT_ID="your-client-id-here"
export GOOGLE_CLIENT_SECRET="your-client-secret-here"

# Restart the app
npm run electron:dev
```

**Windows (PowerShell):**
```powershell
$env:GOOGLE_CLIENT_ID="your-client-id-here"
$env:GOOGLE_CLIENT_SECRET="your-client-secret-here"

# Restart the app
npm run electron:dev
```

#### **Option B: Create .env File (Better for Permanent Setup)**

1. Create `.env` file in project root:

```bash
# Create the file
touch .env
```

2. Add credentials (replace with your actual values):

```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
```

3. Install dotenv package:

```bash
npm install dotenv
```

4. I'll create the code to load it automatically.

---

### **Step 3: Test Connection**

1. Restart SocialSync
2. Go to **Settings** tab
3. Click "Connect" next to Google Drive
4. Browser should open with Google login
5. ✅ If successful, you'll be redirected back and see "Account connected!"

---

## 🎯 **For Instagram & YouTube**

### **Instagram (Optional - for posting to Instagram)**

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an App
3. Add "Instagram Graph API" product
4. Get App ID and App Secret
5. Add to `.env`:
   ```
   INSTAGRAM_APP_ID=your-app-id
   INSTAGRAM_APP_SECRET=your-app-secret
   ```

### **YouTube (Uses Same Google Credentials)**

YouTube uses the same Google OAuth credentials - no extra setup needed!

---

## ⚠️ **Common Issues**

### **"Error 401: invalid_client"**
- ✅ **Fix:** Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (Step 2)

### **"redirect_uri_mismatch"**
- ✅ **Fix:** Add `http://localhost:8585/callback` to authorized redirect URIs

### **"Access blocked: This app's request is invalid"**
- ✅ **Fix:** Enable Google Drive API and YouTube Data API in Cloud Console

### **"OAuth timeout"**
- ✅ **Fix:** Complete the OAuth flow within 2 minutes

---

## 🚀 **After Setup**

Once credentials are configured:
1. Restart the app
2. Connect Google Drive in Settings
3. Everything else will work automatically!

---

## 📝 **Quick Reference**

**What you need:**
- Google Cloud Project (free)
- OAuth 2.0 Client ID and Secret
- 5 minutes of setup time

**What you get:**
- ✅ Google Drive access
- ✅ YouTube posting
- ✅ Full automation

---

Need help? The credentials are FREE and take just 5 minutes to set up!
