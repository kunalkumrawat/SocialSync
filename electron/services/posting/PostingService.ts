import cron from 'node-cron'
import { getQueueService } from '../queue'
import { getDriveService } from '../drive'
import { getDatabase } from '../database/DatabaseService'
import { logActivity } from '../../main'
import { BrowserWindow } from 'electron'

export interface Publisher {
  publish(
    contentId: string,
    filePath: string,
    metadata?: Record<string, unknown>,
    scheduledPublishAt?: string
  ): Promise<{
    success: boolean
    postId?: string
    error?: string
    scheduledFor?: string
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
      const db = getDatabase()
      const queueService = getQueueService()

      // Check rate limiting
      const rateLimitSetting = db.get<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'rate_limit_per_hour'"
      )
      const rateLimit = parseInt(rateLimitSetting?.value || '10')

      // Count posts in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const recentPosts = db.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM queue WHERE status = 'posted' AND posted_at >= ?`,
        [oneHourAgo]
      )

      if (recentPosts && recentPosts.count >= rateLimit) {
        console.log(
          `[PostingService] ⚠️ Rate limit reached (${recentPosts.count}/${rateLimit} posts in last hour). Waiting...`
        )
        this.isProcessing = false
        return
      }

      const dueItems = queueService.getDueQueueItems()

      if (dueItems.length === 0) {
        this.isProcessing = false
        return
      }

      console.log(`[PostingService] Found ${dueItems.length} due items`)

      // Process items one at a time to avoid rate limits
      for (const item of dueItems) {
        // Re-check rate limit for each item
        const currentPosts = db.get<{ count: number }>(
          `SELECT COUNT(*) as count FROM queue WHERE status = 'posted' AND posted_at >= ?`,
          [oneHourAgo]
        )
        if (currentPosts && currentPosts.count >= rateLimit) {
          console.log(`[PostingService] Rate limit reached mid-processing. Stopping.`)
          break
        }

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
    scheduled_for?: string
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

      // Fetch content metadata from database
      const db = getDatabase()
      const contentMeta = db.get<{
        title: string | null
        description: string | null
        tags: string | null
        category: string | null
      }>('SELECT title, description, tags, category FROM content_items WHERE id = ?', [
        item.content_id,
      ])

      // Check dry-run mode
      const dryRunSetting = db.get<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'dry_run_mode'"
      )
      const isDryRun = dryRunSetting?.value === 'true'

      let result: { success: boolean; postId?: string; error?: string }

      if (isDryRun) {
        // DRY RUN MODE: Simulate posting without actually posting
        console.log(
          `[PostingService] 🔷 DRY RUN: Would publish ${item.filename} to ${item.platform}`
        )
        console.log(`[PostingService] 🔷 DRY RUN: Title: "${contentMeta?.title || 'No title'}"`)
        console.log(
          `[PostingService] 🔷 DRY RUN: Description: "${contentMeta?.description?.substring(0, 50) || 'No description'}..."`
        )

        // Simulate success after 2 seconds
        await this.sleep(2000)
        result = {
          success: true,
          postId: `dry-run-${Date.now()}`,
        }
      } else {
        // REAL POSTING: Actually publish to platform
        console.log(`[PostingService] Publishing ${item.filename} to ${item.platform}...`)

        // For YouTube, use scheduled publishing with the scheduled_for time
        const scheduledPublishAt = item.platform === 'youtube' && item.scheduled_for
          ? item.scheduled_for
          : undefined

        result = await publisher.publish(item.content_id, filePath, {
          queueId: item.id,
          platform: item.platform,
          title: contentMeta?.title || undefined,
          description: contentMeta?.description || undefined,
          tags: contentMeta?.tags || undefined,
          category: contentMeta?.category || undefined,
        }, scheduledPublishAt)
      }

      // Cleanup downloaded file
      driveService.cleanupFile(filePath)

      if (result.success) {
        // Success! Save the post ID (YouTube video ID or Instagram post ID)
        queueService.updateQueueStatus(item.id, 'posted', result.postId)
        driveService.updateContentStatus(item.content_id, 'posted')

        logActivity('post_success', `Successfully posted to ${item.platform}`, {
          contentId: item.content_id,
          platform: item.platform,
          metadata: { postId: result.postId, filename: item.filename },
        })

        this.notifyProgress(item.platform, 'posted', item.filename)
        console.log(`[PostingService] ✅ Successfully posted ${item.filename} to ${item.platform} (Post ID: ${result.postId})`)
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
