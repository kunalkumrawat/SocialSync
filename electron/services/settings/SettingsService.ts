import { getDatabase } from '../database/DatabaseService'

export interface AppSettings {
  // General
  theme: 'dark' | 'light' | 'system'
  minimizeToTray: boolean
  startOnBoot: boolean

  // Notifications
  notifyOnSuccess: boolean
  notifyOnFailure: boolean

  // Scheduler
  schedulerEnabled: boolean

  // Content
  defaultContentSelectionMode: 'sequential' | 'random'

  // Platform-specific
  instagram: {
    defaultCaption: string
    defaultHashtags: string[]
  }
  youtube: {
    defaultTitle: string
    defaultDescription: string
    defaultTags: string[]
    privacyStatus: 'public' | 'unlisted' | 'private'
  }
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  minimizeToTray: true,
  startOnBoot: false,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  schedulerEnabled: true,
  defaultContentSelectionMode: 'sequential',
  instagram: {
    defaultCaption: '',
    defaultHashtags: [],
  },
  youtube: {
    defaultTitle: '',
    defaultDescription: '',
    defaultTags: [],
    privacyStatus: 'public',
  },
}

export class SettingsService {
  private cache: AppSettings | null = null

  async getAll(): Promise<AppSettings> {
    if (this.cache) return this.cache

    const db = getDatabase()
    const settings = { ...defaultSettings }

    // Load all settings from database
    const rows = db.all<{ key: string; value: string }>('SELECT key, value FROM settings')

    for (const row of rows) {
      try {
        const value = JSON.parse(row.value)
        this.setNestedValue(settings, row.key, value)
      } catch {
        // Skip invalid JSON
      }
    }

    this.cache = settings
    return settings
  }

  async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getAll()
    return settings[key]
  }

  async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    const db = getDatabase()
    const jsonValue = JSON.stringify(value)

    db.run(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [key, jsonValue, jsonValue]
    )

    // Update cache
    if (this.cache) {
      this.cache[key] = value
    }
  }

  async saveAll(settings: Partial<AppSettings>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.set(key as keyof AppSettings, value as AppSettings[keyof AppSettings])
    }
  }

  async reset(): Promise<void> {
    const db = getDatabase()
    db.run('DELETE FROM settings')
    this.cache = null
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    current[keys[keys.length - 1]] = value
  }
}

// Singleton instance
let instance: SettingsService | null = null

export function getSettings(): SettingsService {
  if (!instance) {
    instance = new SettingsService()
  }
  return instance
}
