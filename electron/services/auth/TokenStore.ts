import Store from 'electron-store'
import { safeStorage } from 'electron'

interface StoredTokens {
  [key: string]: string // encrypted token strings
}

interface TokenData {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  scope?: string
}

/**
 * Secure token storage using Electron's safeStorage API
 * Tokens are encrypted at rest using OS-level encryption
 */
class TokenStore {
  private store: Store<StoredTokens>

  constructor() {
    this.store = new Store<StoredTokens>({
      name: 'tokens',
      encryptionKey: 'socialsync-token-store', // Additional layer
    })
  }

  /**
   * Store tokens securely for a platform
   */
  async setTokens(platform: string, accountId: string, tokens: TokenData): Promise<void> {
    const key = `${platform}:${accountId}`
    const tokenString = JSON.stringify(tokens)

    // Use safeStorage if available (requires app to be ready)
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(tokenString)
      this.store.set(key, encrypted.toString('base64'))
    } else {
      // Fallback to electron-store's built-in encryption
      this.store.set(key, tokenString)
    }
  }

  /**
   * Retrieve tokens for a platform
   */
  async getTokens(platform: string, accountId: string): Promise<TokenData | null> {
    const key = `${platform}:${accountId}`
    const stored = this.store.get(key)

    if (!stored) return null

    try {
      if (safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(Buffer.from(stored, 'base64'))
        return JSON.parse(decrypted)
      } else {
        return JSON.parse(stored)
      }
    } catch {
      // Invalid or corrupted token
      this.store.delete(key)
      return null
    }
  }

  /**
   * Delete tokens for a platform
   */
  async deleteTokens(platform: string, accountId: string): Promise<void> {
    const key = `${platform}:${accountId}`
    this.store.delete(key)
  }

  /**
   * Check if tokens exist for a platform
   */
  hasTokens(platform: string, accountId: string): boolean {
    const key = `${platform}:${accountId}`
    return this.store.has(key)
  }

  /**
   * Get all stored account IDs for a platform
   */
  getAccountIds(platform: string): string[] {
    const allKeys = Object.keys(this.store.store)
    const prefix = `${platform}:`
    return allKeys
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
  }

  /**
   * Clear all tokens (for logout/reset)
   */
  clearAll(): void {
    this.store.clear()
  }
}

// Singleton instance
let instance: TokenStore | null = null

export function getTokenStore(): TokenStore {
  if (!instance) {
    instance = new TokenStore()
  }
  return instance
}

export type { TokenData }
