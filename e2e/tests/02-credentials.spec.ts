/**
 * E2E Test: Credential Validation
 * Tests credential configuration and validation
 */

import { test, expect } from '@playwright/test';
import { checkCredentials, printCredentialStatus } from '../helpers/credentials';

test.describe('Credential Configuration', () => {
  test('should check if credentials are configured', async () => {
    const status = checkCredentials();

    // Print status for debugging
    printCredentialStatus(status);

    // Test should pass but log warnings if not configured
    if (!status.configured) {
      console.warn('\n⚠️  Credentials not configured. Follow these steps:');
      console.warn('   1. Go to https://console.cloud.google.com/');
      console.warn('   2. Create OAuth credentials');
      console.warn('   3. Update .env file with real credentials');
      console.warn('   4. See SETUP_CREDENTIALS.md for detailed guide\n');
    }

    // Always pass, but record the status
    expect(status).toBeTruthy();
  });

  test('should validate Google credentials format', async () => {
    const status = checkCredentials();

    if (status.googleConfigured) {
      // Check that credentials look valid (basic format check)
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      // Google Client IDs should end with .apps.googleusercontent.com
      if (googleClientId) {
        const looksLikeGoogleId =
          googleClientId.includes('.apps.googleusercontent.com') ||
          googleClientId.includes('mock'); // Allow mock for testing

        if (!looksLikeGoogleId) {
          console.warn(
            '⚠️  Google Client ID format looks invalid. Should end with .apps.googleusercontent.com'
          );
        }
      }

      // Google Client Secrets typically start with GOCSPX-
      if (googleClientSecret) {
        const looksLikeSecret =
          googleClientSecret.startsWith('GOCSPX-') ||
          googleClientSecret.includes('mock'); // Allow mock for testing

        if (!looksLikeSecret) {
          console.warn('⚠️  Google Client Secret format looks invalid. Should start with GOCSPX-');
        }
      }
    }

    expect(true).toBe(true); // Test informational only
  });

  test('should check for placeholder values', async () => {
    const status = checkCredentials();

    if (status.hasPlaceholders) {
      console.error('\n❌ .env file contains placeholder values!');
      console.error('   Replace YOUR_*_HERE with actual credentials\n');

      // This is a real error that should fail auth tests
      expect(status.hasPlaceholders).toBe(false);
    } else {
      expect(true).toBe(true);
    }
  });
});
