import { getDatabase } from '../database/DatabaseService'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

// NOTE: Automatic logo detection with ffmpeg/sharp disabled for now due to Electron bundling issues
// This version uses manual review - users can manually mark videos as having logo or not
// Automatic detection can be added later as a separate feature

export interface SmartPostingSettings {
  enabled: boolean
  logoReferencePath: string | null
  sensitivity: number // 0.5 to 1.0
  noLogoAction: 'skip' | 'hold' | 'notify'
}

export interface LogoDetectionResult {
  detected: boolean
  confidence: number
  checkedAt: string
}

export class SmartPostingService {
  private logoReferencePath: string | null = null
  private tempDir: string

  constructor() {
    // Create temp directory for frame extraction
    const userDataPath = app.getPath('userData')
    this.tempDir = path.join(userDataPath, 'temp-frames')
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  /**
   * Get smart posting settings
   */
  getSettings(): SmartPostingSettings {
    const db = getDatabase()

    const enabled = db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'smart_posting_enabled'")
    const logoPath = db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'smart_posting_logo_path'")
    const sensitivity = db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'smart_posting_sensitivity'")
    const action = db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'smart_posting_no_logo_action'")

    return {
      enabled: enabled?.value === 'true',
      logoReferencePath: logoPath?.value || null,
      sensitivity: parseFloat(sensitivity?.value || '0.7'),
      noLogoAction: (action?.value || 'skip') as 'skip' | 'hold' | 'notify',
    }
  }

  /**
   * Update smart posting settings
   */
  updateSettings(settings: Partial<SmartPostingSettings>): void {
    const db = getDatabase()

    if (settings.enabled !== undefined) {
      db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smart_posting_enabled', ?, CURRENT_TIMESTAMP)",
        [settings.enabled.toString()]
      )
    }

    if (settings.logoReferencePath !== undefined) {
      db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smart_posting_logo_path', ?, CURRENT_TIMESTAMP)",
        [settings.logoReferencePath || '']
      )
      this.logoReferencePath = settings.logoReferencePath
    }

    if (settings.sensitivity !== undefined) {
      db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smart_posting_sensitivity', ?, CURRENT_TIMESTAMP)",
        [settings.sensitivity.toString()]
      )
    }

    if (settings.noLogoAction !== undefined) {
      db.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smart_posting_no_logo_action', ?, CURRENT_TIMESTAMP)",
        [settings.noLogoAction]
      )
    }

    console.log('[SmartPostingService] Settings updated:', settings)
  }

  /**
   * Upload and save logo reference image
   */
  async uploadLogo(sourcePath: string): Promise<string> {
    const userDataPath = app.getPath('userData')
    const logoDir = path.join(userDataPath, 'logos')

    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true })
    }

    // Generate unique filename
    const ext = path.extname(sourcePath)
    const logoPath = path.join(logoDir, `logo-reference${ext}`)

    // Simple copy (no processing needed for manual review system)
    fs.copyFileSync(sourcePath, logoPath)

    this.logoReferencePath = logoPath

    // Update settings
    this.updateSettings({ logoReferencePath: logoPath })

    console.log('[SmartPostingService] Logo uploaded:', logoPath)
    return logoPath
  }

  /**
   * Check if video contains logo (Manual review version)
   * NOTE: Automatic scanning disabled - returns "not scanned" status
   * Users must manually mark videos as having logo or not
   */
  async checkVideoForLogo(videoPath: string): Promise<LogoDetectionResult> {
    const settings = this.getSettings()

    if (!settings.enabled) {
      return {
        detected: true, // If Smart Posting disabled, assume all videos are OK
        confidence: 1.0,
        checkedAt: new Date().toISOString(),
      }
    }

    // Manual review system: return "needs review" status
    // Users will manually mark videos via UI
    console.log('[SmartPostingService] Manual review mode - video needs manual verification:', videoPath)

    return {
      detected: true, // Allow through for now (manual review)
      confidence: 0, // 0 confidence = not automatically scanned
      checkedAt: new Date().toISOString(),
    }
  }

  /**
   * Update content item with logo detection result
   */
  updateContentLogoStatus(contentId: string, result: LogoDetectionResult): void {
    const db = getDatabase()
    db.run(
      `UPDATE content_items
       SET logo_detected = ?, logo_confidence = ?, logo_checked_at = ?
       WHERE id = ?`,
      [result.detected ? 1 : 0, result.confidence, result.checkedAt, contentId]
    )
  }

  /**
   * Get logo detection status for content
   */
  getContentLogoStatus(contentId: string): LogoDetectionResult | null {
    const db = getDatabase()
    const row = db.get<{
      logo_detected: number | null
      logo_confidence: number | null
      logo_checked_at: string | null
    }>(
      'SELECT logo_detected, logo_confidence, logo_checked_at FROM content_items WHERE id = ?',
      [contentId]
    )

    if (!row || row.logo_detected === null) {
      return null
    }

    return {
      detected: row.logo_detected === 1,
      confidence: row.logo_confidence || 0,
      checkedAt: row.logo_checked_at || new Date().toISOString(),
    }
  }

  /**
   * Check if content should be queued based on logo detection
   */
  shouldQueueContent(contentId: string, videoPath: string): { shouldQueue: boolean; reason?: string } {
    const settings = this.getSettings()

    if (!settings.enabled) {
      return { shouldQueue: true }
    }

    // Check if already scanned
    const existingStatus = this.getContentLogoStatus(contentId)
    if (existingStatus) {
      if (existingStatus.detected) {
        return { shouldQueue: true }
      } else {
        return {
          shouldQueue: false,
          reason: `No STAGE logo detected (confidence: ${(existingStatus.confidence * 100).toFixed(0)}%)`,
        }
      }
    }

    // Need to scan
    return { shouldQueue: true } // Will be scanned during queue generation
  }

  /**
   * Manually mark content as having STAGE logo (for manual review workflow)
   * @param contentId - Content ID to update
   * @param hasLogo - true if video has STAGE logo, false if not
   */
  manuallyMarkLogoStatus(contentId: string, hasLogo: boolean): void {
    const db = getDatabase()
    db.run(
      `UPDATE content_items
       SET logo_detected = ?, logo_confidence = ?, logo_checked_at = ?
       WHERE id = ?`,
      [hasLogo ? 1 : 0, 1.0, new Date().toISOString(), contentId]
    )
    console.log(`[SmartPostingService] Manually marked content ${contentId} as ${hasLogo ? 'HAS' : 'NO'} logo`)
  }

  /**
   * Bulk mark multiple content items with logo status
   */
  bulkMarkLogoStatus(contentIds: string[], hasLogo: boolean): void {
    const db = getDatabase()
    const timestamp = new Date().toISOString()

    for (const contentId of contentIds) {
      db.run(
        `UPDATE content_items
         SET logo_detected = ?, logo_confidence = ?, logo_checked_at = ?
         WHERE id = ?`,
        [hasLogo ? 1 : 0, 1.0, timestamp, contentId]
      )
    }
    console.log(`[SmartPostingService] Bulk marked ${contentIds.length} items as ${hasLogo ? 'HAS' : 'NO'} logo`)
  }
}

// Singleton instance
let instance: SmartPostingService | null = null

export function getSmartPostingService(): SmartPostingService {
  if (!instance) {
    instance = new SmartPostingService()
  }
  return instance
}
