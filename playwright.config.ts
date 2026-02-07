import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for SocialSync E2E testing
 * Tests the Electron app including OAuth flows and posting functionality
 */
export default defineConfig({
  testDir: './e2e',

  // Test timeout
  timeout: 60000,

  // Fail tests on console errors (helps catch issues early)
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Test artifacts
  outputDir: 'test-results',

  // Projects for different test scenarios
  projects: [
    {
      name: 'electron',
      use: {
        // Electron-specific settings
        launchOptions: {
          executablePath: require('electron'),
        },
      },
    },
  ],

  // Global setup/teardown
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});
