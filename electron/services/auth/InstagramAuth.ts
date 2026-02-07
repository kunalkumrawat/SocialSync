import axios from 'axios'
import { AuthService, OAuthConfig } from './AuthService'
import { getTokenStore, TokenData } from './TokenStore'
import { validateAndThrow } from '../../utils/credential-validator'

// Instagram uses Facebook/Meta OAuth
// Requires a Facebook App with Instagram Basic Display or Instagram Graph API
const INSTAGRAM_CONFIG: OAuthConfig = {
  clientId: process.env.META_APP_ID || 'YOUR_META_APP_ID',
  clientSecret: process.env.META_APP_SECRET || 'YOUR_META_APP_SECRET',
  authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  scopes: [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
  ],
  redirectUri: 'http://localhost:8585/callback',
}

interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

interface MetaLongLivedTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface FacebookPagesResponse {
  data: Array<{
    id: string
    name: string
    access_token: string
    instagram_business_account?: {
      id: string
    }
  }>
}

interface InstagramAccountResponse {
  id: string
  username: string
  name?: string
  profile_picture_url?: string
}

export class InstagramAuthService extends AuthService {
  constructor() {
    super('instagram', INSTAGRAM_CONFIG)

    // Validate credentials on initialization
    this.validateCredentials()
  }

  private credentialValidationError: any = null

  /**
   * Validate Meta/Instagram OAuth credentials
   */
  private validateCredentials(): void {
    try {
      validateAndThrow('meta', this.config.clientId, this.config.clientSecret)
      console.log('[InstagramAuth] Credentials validated successfully')
    } catch (error: any) {
      console.error('[InstagramAuth] Credential validation failed:', error.message)
      this.credentialValidationError = error
    }
  }

  /**
   * Override authenticate to check credentials first
   */
  async authenticate() {
    if (this.credentialValidationError) {
      throw new Error(
        'Instagram/Meta OAuth credentials not configured. ' +
        'Please update .env file with valid META_APP_ID and META_APP_SECRET. ' +
        'See SETUP_CREDENTIALS.md for instructions.'
      )
    }

    return super.authenticate()
  }

  protected async exchangeCodeForTokens(code: string): Promise<TokenData> {
    // Exchange code for short-lived token
    const shortLivedResponse = await axios.get<MetaTokenResponse>(this.config.tokenUrl, {
      params: {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code: code,
      },
    })

    const shortLivedToken = shortLivedResponse.data.access_token

    // Exchange for long-lived token (60 days)
    const longLivedResponse = await axios.get<MetaLongLivedTokenResponse>(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          fb_exchange_token: shortLivedToken,
        },
      }
    )

    const data = longLivedResponse.data
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  }

  protected async fetchUserInfo(accessToken: string): Promise<{
    accountId: string
    accountName: string
    email?: string
    profileUrl?: string
    pageAccessToken?: string
  }> {
    // Get Facebook pages connected to the user
    const pagesResponse = await axios.get<FacebookPagesResponse>(
      'https://graph.facebook.com/v18.0/me/accounts',
      {
        params: {
          fields: 'id,name,access_token,instagram_business_account',
          access_token: accessToken,
        },
      }
    )

    // Find a page with an Instagram business account
    const pageWithInstagram = pagesResponse.data.data.find(
      (page) => page.instagram_business_account
    )

    if (!pageWithInstagram || !pageWithInstagram.instagram_business_account) {
      throw new Error(
        'No Instagram Business account found. Please connect an Instagram Business or Creator account to a Facebook Page.'
      )
    }

    const instagramAccountId = pageWithInstagram.instagram_business_account.id
    const pageAccessToken = pageWithInstagram.access_token

    // Get Instagram account details
    const igResponse = await axios.get<InstagramAccountResponse>(
      `https://graph.facebook.com/v18.0/${instagramAccountId}`,
      {
        params: {
          fields: 'id,username,name,profile_picture_url',
          access_token: pageAccessToken,
        },
      }
    )

    const igAccount = igResponse.data

    // Store the page access token with the account (needed for posting)
    return {
      accountId: igAccount.id,
      accountName: igAccount.username || igAccount.name || 'Instagram Account',
      profileUrl: igAccount.profile_picture_url,
      pageAccessToken: pageAccessToken,
    }
  }

  /**
   * Override saveAccount to also store the page access token
   */
  protected async saveAccount(userInfo: {
    accountId: string
    accountName: string
    email?: string
    profileUrl?: string
    pageAccessToken?: string
  }): Promise<{
    id: string
    platform: string
    accountId: string
    accountName: string
    email?: string
    profileUrl?: string
  }> {
    // Store the page access token separately
    if (userInfo.pageAccessToken) {
      const tokenStore = getTokenStore()
      const existingTokens = await tokenStore.getTokens(this.platform, userInfo.accountId)

      await tokenStore.setTokens(this.platform, userInfo.accountId, {
        ...existingTokens!,
        // Store page token in a custom field
        accessToken: userInfo.pageAccessToken,
      })
    }

    // Call parent saveAccount
    return super.saveAccount({
      accountId: userInfo.accountId,
      accountName: userInfo.accountName,
      email: userInfo.email,
      profileUrl: userInfo.profileUrl,
    })
  }

  async refreshTokens(accountId: string): Promise<TokenData> {
    const tokenStore = getTokenStore()
    const currentTokens = await tokenStore.getTokens(this.platform, accountId)

    if (!currentTokens?.accessToken) {
      throw new Error('No access token available')
    }

    // For Instagram/Facebook, refresh the long-lived token
    // Long-lived tokens can be refreshed as long as they haven't expired
    const response = await axios.get<MetaLongLivedTokenResponse>(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          fb_exchange_token: currentTokens.accessToken,
        },
      }
    )

    const data = response.data
    const newTokens: TokenData = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }

    await tokenStore.setTokens(this.platform, accountId, newTokens)

    return newTokens
  }

  /**
   * Get Instagram-specific rate limit info
   */
  getRateLimitInfo(): { postsPerDay: number; used: number } {
    // Instagram allows 25 posts per 24 hours
    // This would need to be tracked locally
    return { postsPerDay: 25, used: 0 }
  }
}

// Singleton instance
let instance: InstagramAuthService | null = null

export function getInstagramAuth(): InstagramAuthService {
  if (!instance) {
    instance = new InstagramAuthService()
  }
  return instance
}
