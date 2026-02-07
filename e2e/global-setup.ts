/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests
 */

import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  console.log('🚀 Setting up E2E test environment...');

  // Check if .env file exists with valid credentials
  const envPath = path.join(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  Warning: .env file not found. Some tests may fail.');
    console.warn('   Create .env file with Google OAuth credentials to test authentication.');
  } else {
    const envContent = fs.readFileSync(envPath, 'utf-8');

    // Check for placeholder values
    if (
      envContent.includes('YOUR_GOOGLE_CLIENT_ID_HERE') ||
      envContent.includes('YOUR_GOOGLE_CLIENT_SECRET_HERE')
    ) {
      console.warn('⚠️  Warning: .env contains placeholder credentials.');
      console.warn('   Update with actual Google OAuth credentials to test authentication.');
      console.warn('   See SETUP_CREDENTIALS.md for instructions.');
    } else {
      console.log('✅ Credentials configured');
    }
  }

  // Ensure test database doesn't conflict with dev database
  const testDbPath = path.join(
    require('os').homedir(),
    'Library/Application Support/socialsync-test'
  );

  if (!fs.existsSync(testDbPath)) {
    fs.mkdirSync(testDbPath, { recursive: true });
  }

  console.log('✅ E2E environment ready\n');
}
