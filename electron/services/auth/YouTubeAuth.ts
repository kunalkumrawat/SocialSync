import axios from 'axios'
import { AuthService, OAuthConfig } from './AuthService'
import { getTokenStore, TokenData } from './TokenStore'

// YouTube uses Google OAuth with YouTube-specific scopes
const YOUTUBE_CONFIG: OAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
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

interface YouTubeChannelResponse {
  items: Array<{
    id: string
    snippet: {
      title: string
      description: string
      customUrl?: string
      thumbnails: {
        default: { url: string }
      }
    }
  }>
}

export class YouTubeAuthService extends AuthService {
  constructor() {
    super('youtube', YOUTUBE_CONFIG)
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
    // Get the user's YouTube channel info
    const response = await axios.get<YouTubeChannelResponse>(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: {
          part: 'snippet',
          mine: true,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const channel = response.data.items?.[0]
    if (!channel) {
      throw new Error('No YouTube channel found for this account')
    }

    return {
      accountId: channel.id,
      accountName: channel.snippet.title,
      profileUrl: channel.snippet.thumbnails.default.url,
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
      refreshToken: currentTokens.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    }

    await tokenStore.setTokens(this.platform, accountId, newTokens)

    return newTokens
  }

  /**
   * Get quota usage for the YouTube Data API
   */
  async getQuotaInfo(): Promise<{ used: number; limit: number }> {
    // YouTube API doesn't provide direct quota info
    // This would need to be tracked locally
    return { used: 0, limit: 10000 }
  }
}

// Singleton instance
let instance: YouTubeAuthService | null = null

export function getYouTubeAuth(): YouTubeAuthService {
  if (!instance) {
    instance = new YouTubeAuthService()
  }
  return instance
}
