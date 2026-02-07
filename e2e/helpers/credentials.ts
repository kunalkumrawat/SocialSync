/**
 * Helper utilities for checking and validating credentials
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CredentialStatus {
  configured: boolean;
  hasPlaceholders: boolean;
  googleConfigured: boolean;
  metaConfigured: boolean;
  errors: string[];
}

/**
 * Check if credentials are properly configured
 */
export function checkCredentials(): CredentialStatus {
  const status: CredentialStatus = {
    configured: false,
    hasPlaceholders: false,
    googleConfigured: false,
    metaConfigured: false,
    errors: [],
  };

  const envPath = path.join(__dirname, '../../.env');

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    status.errors.push('.env file not found');
    return status;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');

  // Check for placeholders
  if (
    envContent.includes('YOUR_GOOGLE_CLIENT_ID_HERE') ||
    envContent.includes('YOUR_GOOGLE_CLIENT_SECRET_HERE')
  ) {
    status.hasPlaceholders = true;
    status.errors.push('Google credentials contain placeholder values');
  } else {
    // Check if Google credentials are set
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (googleClientId && googleClientSecret) {
      status.googleConfigured = true;
    } else {
      status.errors.push('Google credentials not loaded in environment');
    }
  }

  // Check Meta/Instagram credentials
  if (
    envContent.includes('YOUR_META_APP_ID_HERE') ||
    envContent.includes('YOUR_META_APP_SECRET_HERE')
  ) {
    status.hasPlaceholders = true;
  } else {
    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;

    if (metaAppId && metaAppSecret) {
      status.metaConfigured = true;
    }
  }

  status.configured = status.googleConfigured || status.metaConfigured;

  return status;
}

/**
 * Print credential status to console
 */
export function printCredentialStatus(status: CredentialStatus): void {
  console.log('\n📋 Credential Status:');
  console.log(`   Configured: ${status.configured ? '✅' : '❌'}`);
  console.log(`   Google: ${status.googleConfigured ? '✅' : '❌'}`);
  console.log(`   Meta/Instagram: ${status.metaConfigured ? '✅' : '❌'}`);

  if (status.errors.length > 0) {
    console.log('\n⚠️  Issues found:');
    status.errors.forEach((error) => console.log(`   - ${error}`));
    console.log('\n💡 See SETUP_CREDENTIALS.md for setup instructions\n');
  }
}

/**
 * Generate mock .env for testing without real credentials
 */
export function generateMockEnv(): string {
  return `# Test credentials (mock values)
GOOGLE_CLIENT_ID=mock-client-id-for-testing
GOOGLE_CLIENT_SECRET=mock-client-secret-for-testing
META_APP_ID=mock-meta-app-id
META_APP_SECRET=mock-meta-app-secret
`;
}
