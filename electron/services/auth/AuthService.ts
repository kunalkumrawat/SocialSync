import { BrowserWindow, shell } from 'electron'
import http from 'http'
import { URL } from 'url'
import { getTokenStore, TokenData } from './TokenStore'
import { getDatabase } from '../database/DatabaseService'
import { v4 as uuidv4 } from 'uuid'

export interface OAuthConfig {
  clientId: string
  clientSecret?: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  redirectUri: string
}

export interface AccountInfo {
  id: string
  platform: string
  accountId: string
  accountName: string
  email?: string
  profileUrl?: string
}

/**
 * Base class for OAuth authentication providers
 */
export abstract class AuthService {
  protected platform: string
  protected config: OAuthConfig
  private callbackServer: http.Server | null = null

  constructor(platform: string, config: OAuthConfig) {
    this.platform = platform
    this.config = config
  }

  /**
   * Start the OAuth flow
   * Opens browser for user consent and handles callback
   */
  async authenticate(): Promise<AccountInfo> {
    return new Promise((resolve, reject) => {
      const state = uuidv4()

      // Start local callback server
      this.startCallbackServer(state)
        .then(async (code) => {
          try {
            // Exchange code for tokens
            const tokens = await this.exchangeCodeForTokens(code)

            // Get user info from the provider
            const userInfo = await this.fetchUserInfo(tokens.accessToken)

            // Store tokens securely
            const tokenStore = getTokenStore()
            await tokenStore.setTokens(this.platform, userInfo.accountId, tokens)

            // Store account in database
            const account = await this.saveAccount(userInfo)

            resolve(account)
          } catch (error) {
            reject(error)
          }
        })
        .catch(reject)

      // Build authorization URL
      const authUrl = this.buildAuthUrl(state)

      // Open in system browser
      shell.openExternal(authUrl)
    })
  }

  /**
   * Build the authorization URL with all required parameters
   */
  protected buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent', // Force consent to get refresh token
    })

    return `${this.config.authUrl}?${params.toString()}`
  }

  /**
   * Start a local HTTP server to receive the OAuth callback
   */
  private startCallbackServer(expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const port = 8585 // Fixed port for OAuth callback

      this.callbackServer = http.createServer((req, res) => {
        const url = new URL(req.url || '', `http://localhost:${port}`)

        if (url.pathname === '/callback') {
          const code = url.searchParams.get('code')
          const state = url.searchParams.get('state')
          const error = url.searchParams.get('error')

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(this.getErrorHtml(error))
            this.stopCallbackServer()
            reject(new Error(`OAuth error: ${error}`))
            return
          }

          if (state !== expectedState) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(this.getErrorHtml('Invalid state parameter'))
            this.stopCallbackServer()
            reject(new Error('Invalid state parameter - possible CSRF attack'))
            return
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(this.getErrorHtml('No authorization code received'))
            this.stopCallbackServer()
            reject(new Error('No authorization code received'))
            return
          }

          // Success!
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(this.getSuccessHtml())
          this.stopCallbackServer()
          resolve(code)
        } else {
          res.writeHead(404)
          res.end('Not found')
        }
      })

      this.callbackServer.listen(port, () => {
        console.log(`[AuthService] Callback server listening on port ${port}`)
      })

      this.callbackServer.on('error', (err) => {
        reject(new Error(`Failed to start callback server: ${err.message}`))
      })

      // Timeout after 5 minutes
      setTimeout(() => {
        this.stopCallbackServer()
        reject(new Error('OAuth timeout - user did not complete authentication'))
      }, 5 * 60 * 1000)
    })
  }

  private stopCallbackServer(): void {
    if (this.callbackServer) {
      this.callbackServer.close()
      this.callbackServer = null
    }
  }

  /**
   * Exchange authorization code for access/refresh tokens
   * Must be implemented by each provider
   */
  protected abstract exchangeCodeForTokens(code: string): Promise<TokenData>

  /**
   * Fetch user information using the access token
   * Must be implemented by each provider
   */
  protected abstract fetchUserInfo(accessToken: string): Promise<{
    accountId: string
    accountName: string
    email?: string
    profileUrl?: string
  }>

  /**
   * Refresh the access token using the refresh token
   */
  abstract refreshTokens(accountId: string): Promise<TokenData>

  /**
   * Save account to database
   */
  protected async saveAccount(userInfo: {
    accountId: string
    accountName: string
    email?: string
    profileUrl?: string
  }): Promise<AccountInfo> {
    const db = getDatabase()
    const id = uuidv4()

    // Check if account already exists
    const existing = db.get<{ id: string }>(
      'SELECT id FROM accounts WHERE platform = ? AND account_id = ?',
      [this.platform, userInfo.accountId]
    )

    if (existing) {
      // Update existing account
      db.run(
        'UPDATE accounts SET account_name = ?, metadata = ? WHERE id = ?',
        [
          userInfo.accountName,
          JSON.stringify({ email: userInfo.email, profileUrl: userInfo.profileUrl }),
          existing.id,
        ]
      )
      return {
        id: existing.id,
        platform: this.platform,
        accountId: userInfo.accountId,
        accountName: userInfo.accountName,
        email: userInfo.email,
        profileUrl: userInfo.profileUrl,
      }
    }

    // Insert new account
    db.run(
      `INSERT INTO accounts (id, platform, account_id, account_name, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        this.platform,
        userInfo.accountId,
        userInfo.accountName,
        JSON.stringify({ email: userInfo.email, profileUrl: userInfo.profileUrl }),
      ]
    )

    return {
      id,
      platform: this.platform,
      accountId: userInfo.accountId,
      accountName: userInfo.accountName,
      email: userInfo.email,
      profileUrl: userInfo.profileUrl,
    }
  }

  /**
   * Disconnect account - remove tokens and database entry
   */
  async disconnect(accountId: string): Promise<void> {
    const tokenStore = getTokenStore()
    await tokenStore.deleteTokens(this.platform, accountId)

    const db = getDatabase()
    db.run('DELETE FROM accounts WHERE platform = ? AND account_id = ?', [
      this.platform,
      accountId,
    ])
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(accountId: string): Promise<string | null> {
    const tokenStore = getTokenStore()
    const tokens = await tokenStore.getTokens(this.platform, accountId)

    if (!tokens) return null

    // Check if token is expired (with 5 min buffer)
    if (tokens.expiresAt && tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
      // Token expired or about to expire, refresh it
      if (tokens.refreshToken) {
        try {
          const newTokens = await this.refreshTokens(accountId)
          return newTokens.accessToken
        } catch {
          // Refresh failed, token is invalid
          return null
        }
      }
      return null
    }

    return tokens.accessToken
  }

  // HTML templates for callback page
  private getSuccessHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SocialSync - Connected!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                   display: flex; justify-content: center; align-items: center; height: 100vh;
                   margin: 0; background: #1f2937; color: white; }
            .container { text-align: center; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #10b981; }
            p { color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Connected Successfully!</h1>
            <p>You can close this window and return to SocialSync.</p>
          </div>
        </body>
      </html>
    `
  }

  private getErrorHtml(error: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SocialSync - Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                   display: flex; justify-content: center; align-items: center; height: 100vh;
                   margin: 0; background: #1f2937; color: white; }
            .container { text-align: center; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #ef4444; }
            p { color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Connection Failed</h1>
            <p>${error}</p>
            <p>Please close this window and try again.</p>
          </div>
        </body>
      </html>
    `
  }
}
