import cron from 'node-cron'
import { randomUUID } from 'crypto'
import { getDriveService } from '../drive'
import { getDatabase } from '../database/DatabaseService'
import { BrowserWindow } from 'electron'

class ContentScheduler {
  private scanTask: cron.ScheduledTask | null = null
  private mainWindow: BrowserWindow | null = null

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  start() {
    // Run content scan every hour at minute 0
    this.scanTask = cron.schedule('0 * * * *', async () => {
      console.log('[ContentScheduler] Running hourly content scan...')
      await this.runContentScan()
    })

    console.log('[ContentScheduler] Started hourly content scan job')
  }

  stop() {
    if (this.scanTask) {
      this.scanTask.stop()
      this.scanTask = null
      console.log('[ContentScheduler] Stopped content scan job')
    }
  }

  async runContentScan() {
    try {
      const driveService = getDriveService()
      const db = getDatabase()

      // Get Google account
      const googleAccount = db.get<{ account_id: string }>(
        "SELECT account_id FROM accounts WHERE platform = 'google' LIMIT 1"
      )

      if (!googleAccount) {
        console.log('[ContentScheduler] No Google account connected, skipping scan')
        return
      }

      driveService.setAccount(googleAccount.account_id)
      const result = await driveService.scanForContent()

      console.log(
        `[ContentScheduler] Scan complete: ${result.discovered} discovered, ${result.skipped} skipped`
      )

      // Notify renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('drive:scanComplete', result)
      }

      // Log activity
      this.logScanActivity(result.discovered, result.skipped)
    } catch (error) {
      console.error('[ContentScheduler] Scan failed:', error)
    }
  }

  private logScanActivity(discovered: number, skipped: number) {
    const db = getDatabase()
    const id = randomUUID()

    db.run(
      `INSERT INTO activity_log (id, event_type, message, metadata)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        'content_scan',
        `Hourly scan: ${discovered} new videos, ${skipped} duplicates`,
        JSON.stringify({ discovered, skipped, automated: true }),
      ]
    )
  }
}

let schedulerInstance: ContentScheduler | null = null

export function getContentScheduler(): ContentScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ContentScheduler()
  }
  return schedulerInstance
}
