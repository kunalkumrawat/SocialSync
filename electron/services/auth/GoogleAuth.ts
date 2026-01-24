import axios from 'axios'
import { AuthService, OAuthConfig } from './AuthService'
import { getTokenStore, TokenData } from './TokenStore'

// Google OAuth configuration
// NOTE: In production, these should be in environment variables or a config file
// For development, you'll need to create OAuth credentials at https://console.cloud.google.com
const GOOGLE_CONFIG: OAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  redirectUri: 'http://localhost:8585/callback',
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
}

export class GoogleAuthService extends AuthService {
  constructor() {
    super('google', GOOGLE_CONFIG)
  }

  protected async exchangeCodeForTokens(code: string): Promise<TokenData> {
    const response = await axios.post<GoogleTokenResponse>(
      this.config.tokenUrl,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    }
  }

  protected async fetchUserInfo(accessToken: string): Promise<{
    accountId: string
    accountName: string
    email?: string
    profileUrl?: string
  }> {
    const response = await axios.get<GoogleUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const data = response.data
    return {
      accountId: data.id,
      accountName: data.name || data.email,
      email: data.email,
      profileUrl: data.picture,
    }
  }

  async refreshTokens(accountId: string): Promise<TokenData> {
    const tokenStore = getTokenStore()
    const currentTokens = await tokenStore.getTokens(this.platform, accountId)

    if (!currentTokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await axios.post<GoogleTokenResponse>(
      this.config.tokenUrl,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret || '',
        refresh_token: currentTokens.refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const data = response.data
    const newTokens: TokenData = {
      accessToken: data.access_token,
      refreshToken: currentTokens.refreshToken, // Keep existing refresh token
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    }

    // Update stored tokens
    await tokenStore.setTokens(this.platform, accountId, newTokens)

    return newTokens
  }
}

// Singleton instance
let instance: GoogleAuthService | null = null

export function getGoogleAuth(): GoogleAuthService {
  if (!instance) {
    instance = new GoogleAuthService()
  }
  return instance
}
