# E2E Testing Guide for SocialSync

This directory contains End-to-End (E2E) tests for the SocialSync Electron application using Playwright.

## 📁 Structure

```
e2e/
├── helpers/           # Test utilities and helper functions
│   ├── electron-app.ts    # Electron app launcher and helpers
│   └── credentials.ts     # Credential validation utilities
├── tests/             # Test suites
│   ├── 01-app-launch.spec.ts     # App initialization tests
│   ├── 02-credentials.spec.ts    # Credential validation tests
│   └── 03-google-auth.spec.ts    # Google OAuth flow tests
├── global-setup.ts    # Runs before all tests
├── global-teardown.ts # Runs after all tests
└── README.md         # This file
```

## 🚀 Running Tests

### Prerequisites

1. Build the Electron app first:
   ```bash
   npm run build:vite
   ```

2. (Optional) Configure credentials in `.env` for auth tests:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Run All Tests

```bash
npm test
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests in Headed Mode (visible browser)

```bash
npm run test:headed
```

### Debug Tests

```bash
npm run test:debug
```

### View Test Report

```bash
npm run test:report
```

## 📝 Test Suites

### 1. App Launch Tests (`01-app-launch.spec.ts`)

Tests basic app functionality:
- ✅ App launches successfully
- ✅ Main navigation tabs are visible
- ✅ Database initializes
- ✅ App closes gracefully

**Status**: Always runs, no credentials required

### 2. Credential Validation Tests (`02-credentials.spec.ts`)

Tests credential configuration:
- ✅ Checks if credentials are configured
- ✅ Validates credential format
- ✅ Detects placeholder values

**Status**: Always runs, informational

### 3. Google Authentication Tests (`03-google-auth.spec.ts`)

Tests Google OAuth flow:
- ✅ Settings tab navigation
- ✅ Google Drive connection UI
- ✅ OAuth initiation (requires credentials)
- ✅ Error handling

**Status**: Skips OAuth tests if credentials not configured

## 🔧 Writing New Tests

### Example: Basic Test

```typescript
import { test, expect } from '@playwright/test';
import { ElectronAppHelper } from '../helpers/electron-app';

test.describe('My Feature', () => {
  let appHelper: ElectronAppHelper;

  test.beforeEach(async () => {
    appHelper = new ElectronAppHelper();
  });

  test.afterEach(async () => {
    await appHelper.close();
  });

  test('should do something', async () => {
    const { app, page } = await appHelper.launch();

    // Your test code here
    await page.click('button');

    expect(true).toBe(true);
  });
});
```

### Helper Utilities

#### ElectronAppHelper

```typescript
// Launch app
const { app, page } = await appHelper.launch();

// Wait for text
await appHelper.waitForText('Dashboard', 5000);

// Check if element exists
const exists = await appHelper.elementExists('.my-class');

// Take screenshot
await appHelper.screenshot('test-screenshot');

// Close app
await appHelper.close();
```

#### Credential Checker

```typescript
import { checkCredentials } from '../helpers/credentials';

const status = checkCredentials();
console.log(status.googleConfigured); // true/false
```

## 🐛 Debugging Tests

### View Screenshots

Failed tests automatically save screenshots to:
```
test-results/
```

### View Videos

Test videos (for failures) are saved to:
```
test-results/
```

### Console Logs

Enable verbose logging:
```bash
DEBUG=pw:api npm test
```

## ⚠️ Common Issues

### Issue: "Cannot find Electron app"

**Solution**: Build the app first
```bash
npm run build:vite
```

### Issue: "Port 8585 already in use"

**Solution**: Kill the process using port 8585
```bash
lsof -ti:8585 | xargs kill -9
```

### Issue: "Credentials not configured"

**Solution**: Update `.env` file with real credentials or tests will skip auth flows

### Issue: "Tests timeout"

**Solution**: Increase timeout in `playwright.config.ts`:
```typescript
timeout: 120000, // 2 minutes
```

## 📊 Test Coverage

Current test coverage:
- ✅ App initialization
- ✅ Navigation and UI
- ✅ Credential validation
- ⏳ Google OAuth (requires manual browser interaction)
- ⏳ Instagram OAuth (future)
- ⏳ YouTube OAuth (future)
- ⏳ Video upload (future)
- ⏳ Scheduling (future)

## 🎯 Best Practices

1. **Always clean up**: Use `afterEach` to close apps
2. **Take screenshots**: Helps debug failures
3. **Use descriptive test names**: "should connect to Google Drive" not "test1"
4. **Handle async properly**: Always use `await`
5. **Don't hardcode timeouts**: Use reasonable defaults
6. **Mock external APIs when possible**: Faster, more reliable tests

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [SocialSync Setup Guide](../SETUP_CREDENTIALS.md)

## 🤝 Contributing

When adding new tests:
1. Create test file in `e2e/tests/` with descriptive name
2. Use helpers from `e2e/helpers/` for common operations
3. Add documentation to this README
4. Ensure tests clean up after themselves
5. Handle cases where credentials aren't configured

---

**Need help?** Check the main project README or SETUP_CREDENTIALS.md
