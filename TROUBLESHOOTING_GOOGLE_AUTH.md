# Troubleshooting Google Authentication Issues

## 🔍 Problem Identified

Your SocialSync app cannot connect to Google Drive/YouTube because:

**Root Cause**: OAuth credentials in `.env` file contain placeholder values instead of actual Google Cloud credentials.

```env
# ❌ Current (Invalid)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

# ✅ Need Real Values Like:
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
```

---

## ✅ Solution: Step-by-Step Fix

### Step 1: Create Google Cloud Project (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Click "**Select a project**" → "**NEW PROJECT**"
   - Name: `SocialSync` (or any name you prefer)
   - Click "**Create**"
   - Wait for project creation (~10 seconds)

3. **Enable Required APIs**

   a. Click hamburger menu (☰) → "**APIs & Services**" → "**Enable APIs and Services**"

   b. Search for "**Google Drive API**"
      - Click on it
      - Click "**Enable**"
      - Wait for confirmation

   c. Click "**+ ENABLE APIS AND SERVICES**" again

   d. Search for "**YouTube Data API v3**"
      - Click on it
      - Click "**Enable**"
      - Wait for confirmation

### Step 2: Create OAuth Credentials

1. In the left sidebar, click "**Credentials**"

2. If prompted to configure consent screen:
   - Click "**Configure Consent Screen**"
   - Select "**External**"
   - Click "**Create**"

   Fill in required fields:
   - App name: `SocialSync`
   - User support email: (your email)
   - Developer contact: (your email)
   - Click "**Save and Continue**"
   - Click "**Save and Continue**" (skip scopes)
   - Click "**Save and Continue**" (skip test users)
   - Click "**Back to Dashboard**"

3. Click "**Create Credentials**" → "**OAuth client ID**"

4. Configure OAuth:
   - Application type: **Web application**
   - Name: `SocialSync Desktop` (or any name)

5. **CRITICAL**: Add Authorized redirect URI:
   ```
   http://localhost:8585/callback
   ```
   - Click "**+ ADD URI**"
   - Paste: `http://localhost:8585/callback`
   - Click "**Create**"

6. **Copy Your Credentials** (Modal will appear)

   You'll see:
   ```
   Your Client ID: 123456789-abc...def.apps.googleusercontent.com
   Your Client Secret: GOCSPX-abc123def456
   ```

   **⚠️ IMPORTANT**: Keep this window open or download JSON!

### Step 3: Update Your .env File

1. Open `.env` file in the `socialsync` directory

2. Replace placeholder values with your actual credentials:

   ```env
   # Google OAuth (Required for Google Drive and YouTube)
   GOOGLE_CLIENT_ID=123456789-abc...def.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

   # Instagram / Meta (Optional - for later)
   META_APP_ID=YOUR_META_APP_ID_HERE
   META_APP_SECRET=YOUR_META_APP_SECRET_HERE
   ```

3. **Save the file** (Cmd+S or Ctrl+S)

### Step 4: Restart the App

```bash
npm run electron:dev
```

### Step 5: Test the Connection

1. App should open
2. Go to "**Settings**" tab
3. Find "**Google Drive**" section
4. Click "**Connect**"
5. Browser should open with Google login
6. Sign in with your Google account
7. Click "**Allow**" to grant permissions
8. Browser shows "**Success! You can close this window**"
9. App shows "**Account connected!**" ✅

---

## 🎯 Verification Checklist

After setup, verify:

- [ ] `.env` file has real credentials (no `YOUR_*_HERE`)
- [ ] Google Drive API is enabled
- [ ] YouTube Data API v3 is enabled
- [ ] Redirect URI is `http://localhost:8585/callback`
- [ ] OAuth consent screen is configured
- [ ] App restarts without credential errors
- [ ] Clicking "Connect" opens browser
- [ ] Google login page appears
- [ ] After login, connection succeeds

---

## 🧪 Testing with E2E Framework

We've installed Playwright for automated testing to help catch issues early!

### Build and Run Tests

```bash
# First, build the app
npm run build:vite

# Run all E2E tests
npm test

# Run with visual UI
npm run test:ui

# Run in debug mode
npm run test:debug
```

### Test Suites

1. **App Launch Tests** - Verifies app starts correctly
2. **Credential Validation** - Checks if credentials are configured
3. **Google Auth Tests** - Tests OAuth flow (requires valid credentials)

### What Tests Will Check

✅ **Before credentials configured:**
- Tests run but skip OAuth tests
- Shows warnings about missing credentials
- Helps verify app structure

✅ **After credentials configured:**
- All tests run including auth flows
- Verifies OAuth initiation works
- Catches configuration errors early

### Example Test Output

```
🚀 Setting up E2E test environment...
⚠️  Warning: .env contains placeholder credentials.
   Update with actual Google OAuth credentials to test authentication.

Running 8 tests...

✓ App Launch » should launch successfully (2s)
✓ App Launch » should display navigation (1s)
✓ Credentials » should check configuration (100ms)
✓ Credentials » should detect placeholders (50ms)
⊘ Google Auth » OAuth flow (skipped - no credentials)

4 passed, 1 skipped
```

---

## ⚠️ Common Errors and Solutions

### Error: "Error 401: invalid_client"

**Cause**: Credentials not set or incorrect

**Fix**:
1. Verify `.env` has real credentials (no placeholders)
2. Check Client ID ends with `.apps.googleusercontent.com`
3. Check Client Secret starts with `GOCSPX-`
4. Restart the app after changing `.env`

---

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI not configured in Google Cloud

**Fix**:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth client
3. Under "Authorized redirect URIs", add:
   ```
   http://localhost:8585/callback
   ```
4. Click "Save"
5. Try connecting again (no restart needed)

---

### Error: "Access blocked: This app's request is invalid"

**Cause**: APIs not enabled

**Fix**:
1. Go to [Google Cloud Console APIs](https://console.cloud.google.com/apis/library)
2. Enable "Google Drive API"
3. Enable "YouTube Data API v3"
4. Wait 1-2 minutes for changes to propagate
5. Try connecting again

---

### Error: "Port 8585 already in use"

**Cause**: Another process using the OAuth callback port

**Fix**:
```bash
# Kill process using port 8585
lsof -ti:8585 | xargs kill -9

# Restart app
npm run electron:dev
```

---

### Warning: "Client Secret format looks unusual"

**Cause**: Client Secret doesn't start with `GOCSPX-`

**Impact**: May still work, but worth double-checking

**Fix**: Verify you copied the Client Secret correctly from Google Cloud Console

---

## 🔐 Security Notes

✅ **Safe Practices:**
- `.env` is in `.gitignore` (not committed to git)
- Tokens encrypted with OS-level encryption
- OAuth 2.0 with state parameter (CSRF protection)
- Tokens auto-refresh before expiration

⚠️ **Important:**
- Never commit `.env` file to version control
- Never share your Client Secret publicly
- If credentials leak, revoke them in Google Cloud Console

---

## 📊 What Changed

### Files Added/Modified

1. **E2E Testing Framework**
   - `playwright.config.ts` - Test configuration
   - `e2e/` - Test directory with helpers and tests
   - `e2e/README.md` - Testing documentation

2. **Credential Validation**
   - `electron/utils/credential-validator.ts` - Validates credentials before auth
   - Updated `GoogleAuth.ts` - Now checks credentials on startup
   - Updated `InstagramAuth.ts` - Now checks credentials on startup

3. **Package Updates**
   - Added Playwright and test scripts to `package.json`

### Benefits

✅ **Better Error Messages**
- Clear error when credentials not configured
- Helpful setup instructions in console
- Validation happens before OAuth attempt

✅ **Automated Testing**
- Catch issues before manual testing
- Verify app structure and initialization
- Test auth flow (with valid credentials)

✅ **Developer Experience**
- Faster debugging with E2E tests
- Screenshot capture on failures
- Detailed test reports

---

## 🚀 Next Steps

### Immediate (Required)

1. ✅ Complete Google Cloud setup (Steps 1-2 above)
2. ✅ Update `.env` file with real credentials (Step 3)
3. ✅ Test Google Drive connection (Steps 4-5)

### Optional (Recommended)

4. Run E2E tests to verify setup:
   ```bash
   npm run build:vite
   npm test
   ```

5. Set up Instagram credentials (for Instagram posting):
   - See `SETUP_CREDENTIALS.md` for Instagram setup
   - Update `META_APP_ID` and `META_APP_SECRET` in `.env`

### Future

6. Add more E2E tests for:
   - Video upload flow
   - Scheduling functionality
   - Queue management
   - Error recovery

---

## 📚 Additional Resources

- [SETUP_CREDENTIALS.md](./SETUP_CREDENTIALS.md) - Detailed credential setup guide
- [e2e/README.md](./e2e/README.md) - E2E testing guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - General testing guide
- [Google Cloud Console](https://console.cloud.google.com/)
- [Playwright Documentation](https://playwright.dev/)

---

## ❓ Still Having Issues?

1. Check console logs when app starts:
   ```bash
   npm run electron:dev
   ```
   Look for: `[GoogleAuth] Credentials validated successfully`

2. Run credential validation test:
   ```bash
   npm test e2e/tests/02-credentials.spec.ts
   ```

3. Take screenshots of:
   - Your Google Cloud Console credentials page
   - The error message in the app
   - Console output when running `npm run electron:dev`

4. Check that:
   - `.env` file is in the root directory (same level as `package.json`)
   - No typos in environment variable names
   - No extra spaces or quotes around values
   - File is saved after editing

---

**🎉 Once configured, SocialSync will automatically post your videos to Instagram and YouTube!**
