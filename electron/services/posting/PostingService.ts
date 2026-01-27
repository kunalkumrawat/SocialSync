import cron from 'node-cron'
import { getQueueService } from '../queue'
import { getDriveService } from '../drive'
import { logActivity } from '../../main'
import { BrowserWindow } from 'electron'

export interface Publisher {
  publish(contentId: string, filePath: string, metadata?: Record<string, unknown>): Promise<{
    success: boolean
    postId?: string
    error?: string
  }>
}

export class PostingService {
  private checkTask: cron.ScheduledTask | null = null
  private mainWindow: BrowserWindow | null = null
  private isProcessing = false
  private publishers: Map<string, Publisher> = new Map()
  private paused = false

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  /**
   * Register a publisher for a platform
   */
  registerPublisher(platform: 'instagram' | 'youtube', publisher: Publisher) {
    this.publishers.set(platform, publisher)
    console.log(`[PostingService] Registered publisher for ${platform}`)
  }

  /**
   * Start the posting scheduler
   * Checks for due posts every minute
   */
  start() {
    // Run check every minute
    this.checkTask = cron.schedule('* * * * *', async () => {
      if (!this.isProcessing && !this.paused) {
        await this.checkAndPostDueItems()
      }
    })

    console.log('[PostingService] Started posting scheduler (checks every minute)')
  }

  /**
   * Stop the posting scheduler
   */
  stop() {
    if (this.checkTask) {
      this.checkTask.stop()
      this.checkTask = null
      console.log('[PostingService] Stopped posting scheduler')
    }
  }

  /**
   * Pause posting (can be resumed later)
   */
  pause() {
    this.paused = true
    console.log('[PostingService] Posting paused')
    this.mainWindow?.webContents.send('posting:paused', true)
  }

  /**
   * Resume posting
   */
  resume() {
    this.paused = false
    console.log('[PostingService] Posting resumed')
    this.mainWindow?.webContents.send('posting:paused', false)
  }

  /**
   * Check if posting is paused
   */
  isPaused(): boolean {
    return this.paused
  }

  /**
   * Check for and post due items
   */
  async checkAndPostDueItems() {
    if (this.isProcessing || this.paused) return

    this.isProcessing = true

    try {
      const queueService = getQueueService()
      const dueItems = queueService.getDueQueueItems()

      if (dueItems.length === 0) {
        this.isProcessing = false
        return
      }

      console.log(`[PostingService] Found ${dueItems.length} due items`)

      // Process items one at a time to avoid rate limits
      for (const item of dueItems) {
        await this.processQueueItem(item)
        // Wait 10 seconds between posts to avoid rate limits
        await this.sleep(10000)
      }
    } catch (error) {
      console.error('[PostingService] Error checking due items:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: {
    id: string
    content_id: string
    platform: 'instagram' | 'youtube'
    drive_file_id: string
    filename: string
    attempts: number
  }) {
    const queueService = getQueueService()
    const driveService = getDriveService()

    // Skip if already attempted 3 times
    if (item.attempts >= 3) {
      console.log(
        `[PostingService] Skipping ${item.filename} - max attempts reached`
      )
      queueService.updateQueueStatus(item.id, 'failed', 'Max attempts reached')
      driveService.updateContentStatus(item.content_id, 'failed')
      return
    }

    try {
      // Update status to processing
      queueService.updateQueueStatus(item.id, 'processing')
      this.notifyProgress(item.platform, 'processing', item.filename)

      // Get publisher for platform
      const publisher = this.publishers.get(item.platform)
      if (!publisher) {
        throw new Error(`No publisher registered for ${item.platform}`)
      }

      // Download file from Drive
      console.log(
        `[PostingService] Downloading ${item.filename} for ${item.platform}...`
      )
      const filePath = await driveService.downloadFile(item.drive_file_id, item.filename)

      // Publish
      console.log(`[PostingService] Publishing ${item.filename} to ${item.platform}...`)
      const result = await publisher.publish(item.content_id, filePath, {
        queueId: item.id,
        platform: item.platform,
      })

      // Cleanup downloaded file
      driveService.cleanupFile(filePath)

      if (result.success) {
        // Success!
        queueService.updateQueueStatus(item.id, 'posted')
        driveService.updateContentStatus(item.content_id, 'posted')

        logActivity('post_success', `Successfully posted to ${item.platform}`, {
          contentId: item.content_id,
          platform: item.platform,
          metadata: { postId: result.postId, filename: item.filename },
        })

        this.notifyProgress(item.platform, 'posted', item.filename)
        console.log(`[PostingService] ✅ Successfully posted ${item.filename} to ${item.platform}`)
      } else {
        throw new Error(result.error || 'Unknown publishing error')
      }
    } catch (error) {
      // Failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(
        `[PostingService] ❌ Failed to post ${item.filename} to ${item.platform}:`,
        errorMessage
      )

      queueService.updateQueueStatus(item.id, 'failed', errorMessage)

      // Only mark content as failed if we've exceeded max attempts
      if (item.attempts >= 2) {
        driveService.updateContentStatus(item.content_id, 'failed')
      }

      logActivity('post_failed', `Failed to post to ${item.platform}`, {
        contentId: item.content_id,
        platform: item.platform,
        metadata: { error: errorMessage, filename: item.filename, attempts: item.attempts + 1 },
      })

      this.notifyProgress(item.platform, 'failed', item.filename, errorMessage)
    }
  }

  /**
   * Manually trigger posting for a specific queue item
   */
  async postNow(queueId: string): Promise<{ success: boolean; error?: string }> {
    const queueService = getQueueService()
    const items = queueService.getAllQueueItems()
    const item = items.find((i) => i.id === queueId)

    if (!item) {
      return { success: false, error: 'Queue item not found' }
    }

    try {
      await this.processQueueItem(item)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Get posting statistics
   */
  getStats(): {
    isProcessing: boolean
    isPaused: boolean
    dueCount: number
  } {
    const queueService = getQueueService()
    const dueItems = queueService.getDueQueueItems()

    return {
      isProcessing: this.isProcessing,
      isPaused: this.paused,
      dueCount: dueItems.length,
    }
  }

  /**
   * Notify renderer of posting progress
   */
  private notifyProgress(
    platform: string,
    status: 'processing' | 'posted' | 'failed',
    filename: string,
    error?: string
  ) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('posting:progress', {
        platform,
        status,
        filename,
        error,
      })
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
let instance: PostingService | null = null

export function getPostingService(): PostingService {
  if (!instance) {
    instance = new PostingService()
  }
  return instance
}
