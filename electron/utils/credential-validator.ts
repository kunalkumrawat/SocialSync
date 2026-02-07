/**
 * Credential Validation Utility
 * Validates OAuth credentials before attempting authentication
 */

export interface CredentialValidationError {
  platform: string
  field: string
  message: string
  helpUrl?: string
}

export class CredentialValidationException extends Error {
  constructor(
    public errors: CredentialValidationError[],
    message?: string
  ) {
    super(message || 'Invalid credentials configuration')
    this.name = 'CredentialValidationException'
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    const messages = this.errors.map((error) => {
      return `${error.platform}: ${error.message}`
    })

    return messages.join('\n')
  }

  /**
   * Get help instructions
   */
  getHelpMessage(): string {
    return `
⚠️  OAuth Credentials Not Configured

Please set up your API credentials:

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable required APIs:
   - Google Drive API
   - YouTube Data API v3
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Redirect URI: http://localhost:8585/callback
5. Update .env file with your credentials:
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
6. Restart the application

For detailed instructions, see: SETUP_CREDENTIALS.md
    `.trim()
  }
}

/**
 * Validate Google OAuth credentials
 */
export function validateGoogleCredentials(
  clientId: string | undefined,
  clientSecret: string | undefined
): CredentialValidationError[] {
  const errors: CredentialValidationError[] = []

  // Check if credentials exist
  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
    errors.push({
      platform: 'Google',
      field: 'client_id',
      message: 'GOOGLE_CLIENT_ID not configured or contains placeholder value',
      helpUrl: 'https://console.cloud.google.com/apis/credentials',
    })
  }

  if (!clientSecret || clientSecret === 'YOUR_GOOGLE_CLIENT_SECRET') {
    errors.push({
      platform: 'Google',
      field: 'client_secret',
      message: 'GOOGLE_CLIENT_SECRET not configured or contains placeholder value',
      helpUrl: 'https://console.cloud.google.com/apis/credentials',
    })
  }

  // Validate format (if credentials are provided)
  if (clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID') {
    // Google Client IDs should end with .apps.googleusercontent.com
    if (!clientId.includes('.apps.googleusercontent.com')) {
      errors.push({
        platform: 'Google',
        field: 'client_id',
        message:
          'Client ID format looks invalid. Should end with .apps.googleusercontent.com',
        helpUrl: 'https://console.cloud.google.com/apis/credentials',
      })
    }
  }

  if (clientSecret && clientSecret !== 'YOUR_GOOGLE_CLIENT_SECRET') {
    // Google Client Secrets typically start with GOCSPX-
    if (!clientSecret.startsWith('GOCSPX-')) {
      console.warn(
        '[CredentialValidator] Warning: Google Client Secret format looks unusual (should start with GOCSPX-)'
      )
      // Don't add to errors as this is just a warning
    }
  }

  return errors
}

/**
 * Validate Instagram/Meta credentials
 */
export function validateMetaCredentials(
  appId: string | undefined,
  appSecret: string | undefined
): CredentialValidationError[] {
  const errors: CredentialValidationError[] = []

  if (!appId || appId === 'YOUR_META_APP_ID_HERE') {
    errors.push({
      platform: 'Instagram/Meta',
      field: 'app_id',
      message: 'META_APP_ID not configured or contains placeholder value',
      helpUrl: 'https://developers.facebook.com/apps/',
    })
  }

  if (!appSecret || appSecret === 'YOUR_META_APP_SECRET_HERE') {
    errors.push({
      platform: 'Instagram/Meta',
      field: 'app_secret',
      message: 'META_APP_SECRET not configured or contains placeholder value',
      helpUrl: 'https://developers.facebook.com/apps/',
    })
  }

  return errors
}

/**
 * Validate all credentials and throw if invalid
 */
export function validateAndThrow(
  platform: 'google' | 'meta',
  clientId?: string,
  clientSecret?: string
): void {
  let errors: CredentialValidationError[] = []

  if (platform === 'google') {
    errors = validateGoogleCredentials(clientId, clientSecret)
  } else if (platform === 'meta') {
    errors = validateMetaCredentials(clientId, clientSecret)
  }

  if (errors.length > 0) {
    throw new CredentialValidationException(errors)
  }
}
