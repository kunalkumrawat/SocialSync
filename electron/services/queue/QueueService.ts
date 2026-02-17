import { getDatabase } from '../database/DatabaseService'
import { getDriveService } from '../drive'
import { getYouTubeChannelService } from '../youtube/YouTubeChannelService'
import { v4 as uuidv4 } from 'uuid'

export interface QueueItem {
  id: string
  content_id: string
  platform: 'instagram' | 'youtube'
  account_id: string
  scheduled_for: string
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'skipped'
  attempts: number
  last_error: string | null
  created_at: string
  posted_at: string | null
}

export interface QueueItemWithContent extends QueueItem {
  filename: string
  mime_type: string
  drive_file_id: string
  size_bytes: number
}

export class QueueService {
  /**
   * Get queue items for a platform
   */
  getQueueForPlatform(platform: 'instagram' | 'youtube'): QueueItemWithContent[] {
    const db = getDatabase()
    return db.all(
      `SELECT q.*, c.filename, c.mime_type, c.drive_file_id, c.size_bytes
       FROM queue q
       LEFT JOIN content_items c ON q.content_id = c.id
       WHERE q.platform = ? AND q.status IN ('pending', 'processing')
       ORDER BY q.scheduled_for ASC`,
      [platform]
    )
  }

  /**
   * Get all queue items regardless of platform
   */
  getAllQueueItems(): QueueItemWithContent[] {
    const db = getDatabase()
    return db.all(
      `SELECT q.*, c.filename, c.mime_type, c.drive_file_id, c.size_bytes
       FROM queue q
       LEFT JOIN content_items c ON q.content_id = c.id
       WHERE q.status IN ('pending', 'processing')
       ORDER BY q.scheduled_for ASC`
    )
  }

  /**
   * Get queue items that are due to be posted
   */
  getDueQueueItems(): QueueItemWithContent[] {
    const db = getDatabase()
    const now = new Date().toISOString()
    return db.all(
      `SELECT q.*, c.filename, c.mime_type, c.drive_file_id, c.size_bytes
       FROM queue q
       LEFT JOIN content_items c ON q.content_id = c.id
       WHERE q.status = 'pending' AND q.scheduled_for <= ?
       ORDER BY q.scheduled_for ASC`,
      [now]
    )
  }

  /**
   * Add an item to the queue
   * @param manualOverride - If true, bypass logo detection checks (for manual approval)
   * @param channelId - Optional YouTube channel ID for multi-channel posting
   */
  addToQueue(
    contentId: string,
    platform: 'instagram' | 'youtube',
    accountId: string,
    scheduledFor: Date,
    manualOverride = false,
    channelId?: string
  ): { success: boolean; queueId?: string; error?: string } {
    const db = getDatabase()

    // CRITICAL: Check logo detection status before queueing
    if (!manualOverride) {
      // Check if Smart Posting is enabled
      const smartPostingSettings = db.get<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'smart_posting_enabled'"
      )
      const smartPostingEnabled = smartPostingSettings?.value === 'true'

      if (smartPostingEnabled) {
        // Get content item logo status
        const content = db.get<{ logo_detected: number | null; filename: string }>(
          'SELECT logo_detected, filename FROM content_items WHERE id = ?',
          [contentId]
        )

        if (!content) {
          return { success: false, error: 'Content not found' }
        }

        // Block if logo not detected
        if (content.logo_detected !== 1) {
          console.log(
            `[QueueService] ❌ BLOCKED: "${content.filename}" - STAGE logo not verified (logo_detected=${content.logo_detected})`
          )
          return {
            success: false,
            error: 'STAGE logo not detected. Video must have verified STAGE logo before queueing.',
          }
        }

        console.log(`[QueueService] ✅ Logo verified for "${content.filename}"`)
      }
    } else {
      console.log(`[QueueService] ⚠️ Manual override - bypassing logo check for content ${contentId}`)
    }

    const id = uuidv4()

    db.run(
      `INSERT INTO queue (id, content_id, platform, account_id, scheduled_for, status, attempts, channel_id)
       VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)`,
      [id, contentId, platform, accountId, scheduledFor.toISOString(), channelId || null]
    )

    // DON'T update content item status to 'queued' - allow same video to be queued for multiple platforms
    // Status will be updated to 'posted' only after successful posting to all platforms

    return { success: true, queueId: id }
  }

  /**
   * Update queue item status
   */
  updateQueueStatus(
    queueId: string,
    status: 'pending' | 'processing' | 'posted' | 'failed' | 'skipped',
    errorOrPostId?: string
  ): void {
    const db = getDatabase()

    if (status === 'posted') {
      // errorOrPostId is the platform post ID when status is 'posted'
      db.run(
        `UPDATE queue SET status = ?, posted_at = ?, platform_post_id = ?, last_error = NULL WHERE id = ?`,
        [status, new Date().toISOString(), errorOrPostId || null, queueId]
      )
    } else if (status === 'failed') {
      db.run(
        `UPDATE queue SET status = ?, attempts = attempts + 1, last_error = ? WHERE id = ?`,
        [status, errorOrPostId || 'Unknown error', queueId]
      )
    } else {
      db.run(`UPDATE queue SET status = ? WHERE id = ?`, [status, queueId])
    }
  }

  /**
   * Skip a queue item
   */
  skipQueueItem(queueId: string): void {
    const db = getDatabase()

    // Get the content_id before updating
    const queueItem = db.get<{ content_id: string }>(
      'SELECT content_id FROM queue WHERE id = ?',
      [queueId]
    )

    db.run("UPDATE queue SET status = 'skipped' WHERE id = ?", [queueId])

    // Update content status back to pending
    if (queueItem) {
      db.run("UPDATE content_items SET status = 'pending' WHERE id = ?", [
        queueItem.content_id,
      ])
    }
  }

  /**
   * Retry a failed queue item
   */
  retryQueueItem(queueId: string): void {
    const db = getDatabase()
    db.run(
      "UPDATE queue SET status = 'pending', attempts = 0, last_error = NULL WHERE id = ?",
      [queueId]
    )
  }

  /**
   * Reschedule a queue item to a new time
   */
  rescheduleQueueItem(queueId: string, newScheduledTime: Date): void {
    const db = getDatabase()
    db.run("UPDATE queue SET scheduled_for = ?, status = 'pending' WHERE id = ?", [
      newScheduledTime.toISOString(),
      queueId,
    ])
  }

  /**
   * Delete a queue item
   */
  deleteQueueItem(queueId: string): void {
    const db = getDatabase()

    // Get the content_id before deleting
    const queueItem = db.get<{ content_id: string }>(
      'SELECT content_id FROM queue WHERE id = ?',
      [queueId]
    )

    db.run('DELETE FROM queue WHERE id = ?', [queueId])

    // Update content status back to pending
    if (queueItem) {
      db.run("UPDATE content_items SET status = 'pending' WHERE id = ?", [
        queueItem.content_id,
      ])
    }
  }

  /**
   * Clear all completed items from queue (posted, failed, skipped)
   */
  clearCompletedItems(): number {
    const db = getDatabase()
    const result = db.run(
      "DELETE FROM queue WHERE status IN ('posted', 'failed', 'skipped') AND posted_at < datetime('now', '-7 days')"
    )
    return result.changes || 0
  }

  /**
   * Get posted items with their platform URLs
   */
  getPostedItems(): Array<QueueItemWithContent & { postUrl: string }> {
    const db = getDatabase()
    const items = db.all<QueueItemWithContent>(
      `SELECT q.*, c.filename, c.mime_type, c.drive_file_id, c.size_bytes
       FROM queue q
       LEFT JOIN content_items c ON q.content_id = c.id
       WHERE q.status = 'posted' AND q.platform_post_id IS NOT NULL
       ORDER BY q.posted_at DESC
       LIMIT 100`
    )

    // Add platform URLs
    return items.map((item) => {
      let postUrl = ''
      if (item.platform === 'youtube' && item.platform_post_id) {
        postUrl = `https://youtube.com/shorts/${item.platform_post_id}`
      } else if (item.platform === 'instagram' && item.platform_post_id) {
        postUrl = `https://www.instagram.com/p/${item.platform_post_id}/`
      }
      return { ...item, postUrl }
    })
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number
    pending: number
    processing: number
    posted: number
    failed: number
    skipped: number
  } {
    const db = getDatabase()

    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      posted: 0,
      failed: 0,
      skipped: 0,
    }

    const rows = db.all<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM queue GROUP BY status'
    )

    rows.forEach((row) => {
      stats.total += row.count
      stats[row.status as keyof typeof stats] = row.count
    })

    return stats
  }

  /**
   * Check if content is already queued
   */
  isContentQueued(contentId: string, platform: 'instagram' | 'youtube'): boolean {
    const db = getDatabase()
    const result = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM queue
       WHERE content_id = ? AND platform = ? AND status IN ('pending', 'processing')`,
      [contentId, platform]
    )
    return (result?.count || 0) > 0
  }

  /**
   * Generate queue items from schedule
   * This will be called by the scheduling service
   */
  generateQueueFromSchedule(
    scheduleId: string,
    startDate: Date,
    endDate: Date
  ): number {
    const db = getDatabase()

    // Get schedule details
    const schedule = db.get<{
      platform: 'instagram' | 'youtube'
      account_id: string
      days_of_week: string
      times: string
      enabled: number
    }>('SELECT * FROM schedules WHERE id = ? AND enabled = 1', [scheduleId])

    if (!schedule) {
      console.log('[QueueService] Schedule not found or disabled:', scheduleId)
      return 0
    }

    const daysOfWeek = JSON.parse(schedule.days_of_week) as number[] // 0 = Sunday, 6 = Saturday
    const times = JSON.parse(schedule.times) as string[] // ["09:00", "18:00"]

    let itemsCreated = 0
    const driveService = getDriveService()

    // Iterate through date range
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()

      // Check if this day is in the schedule
      if (daysOfWeek.includes(dayOfWeek)) {
        // For each time slot on this day
        for (const time of times) {
          const [hours, minutes] = time.split(':').map(Number)
          const scheduledTime = new Date(currentDate)
          scheduledTime.setHours(hours, minutes, 0, 0)

          // Skip if time is in the past
          if (scheduledTime <= new Date()) {
            continue
          }

          // Get next available content for this platform (excludes already-queued content)
          const content = driveService.getNextContentForPlatform(schedule.platform)
          if (!content) {
            console.log('[QueueService] No more content available for', schedule.platform)
            return itemsCreated
          }

          // Validate content for platform
          const validation = driveService.validateForPlatform(content, schedule.platform)
          if (!validation.valid) {
            console.log(
              `[QueueService] Skipping ${content.filename}: ${validation.reason}`
            )
            driveService.updateContentStatus(content.id, 'skipped')
            continue
          }

          // Add to queue with logo verification check
          const result = this.addToQueue(content.id, schedule.platform, schedule.account_id, scheduledTime)
          if (!result.success) {
            console.log(
              `[QueueService] ❌ Failed to queue ${content.filename}: ${result.error}`
            )
            // Mark content as needing review if logo not detected
            if (result.error?.includes('logo')) {
              driveService.updateContentStatus(content.id, 'pending') // Keep as pending for manual review
            } else {
              driveService.updateContentStatus(content.id, 'skipped')
            }
            continue
          }

          itemsCreated++
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log(`[QueueService] Generated ${itemsCreated} queue items from schedule`)
    return itemsCreated
  }

  /**
   * Generate automatic queue with fixed interval (30 minutes default)
   * Maintains a rolling queue of approved content
   * @param platform - Platform to generate queue for
   * @param intervalMinutes - Minutes between posts (default 30)
   * @param hoursAhead - How many hours ahead to maintain queue (default 24)
   */
  generateAutomaticQueue(
    platform: 'instagram' | 'youtube',
    intervalMinutes: number = 30,
    hoursAhead: number = 24
  ): number {
    const db = getDatabase()
    const driveService = getDriveService()

    // Get account for platform
    const account = db.get<{ id: string; account_id: string }>(
      'SELECT id, account_id FROM accounts WHERE platform = ? LIMIT 1',
      [platform]
    )

    if (!account) {
      console.log(`[QueueService] No account found for ${platform}`)
      return 0
    }

    // For YouTube, verify we have channels configured
    if (platform === 'youtube') {
      const channelService = getYouTubeChannelService()
      const availableQuota = channelService.getTotalAvailableQuota()
      if (availableQuota === 0) {
        console.log(`[QueueService] No YouTube channels with available quota`)
        return 0
      }
      console.log(`[QueueService] YouTube multi-channel mode: ${availableQuota} posts available today`)
    }

    // Check how many items are already queued for this platform
    const existingQueueCount = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM queue
       WHERE platform = ? AND status IN ('pending', 'processing')`,
      [platform]
    )?.count || 0

    // Calculate target queue size (posts needed to fill hoursAhead)
    const targetQueueSize = Math.ceil((hoursAhead * 60) / intervalMinutes)

    // How many new items do we need?
    const itemsNeeded = Math.max(0, targetQueueSize - existingQueueCount)

    if (itemsNeeded === 0) {
      console.log(`[QueueService] Queue for ${platform} is full (${existingQueueCount}/${targetQueueSize} items)`)
      return 0
    }

    console.log(`[QueueService] Need ${itemsNeeded} more items for ${platform} queue (current: ${existingQueueCount}, target: ${targetQueueSize})`)

    // Get last scheduled time for this platform
    const lastScheduled = db.get<{ scheduled_for: string }>(
      `SELECT scheduled_for FROM queue
       WHERE platform = ? AND status IN ('pending', 'processing')
       ORDER BY scheduled_for DESC LIMIT 1`,
      [platform]
    )

    // Start scheduling from last item + interval, or from now if queue is empty
    let nextScheduledTime: Date
    if (lastScheduled) {
      nextScheduledTime = new Date(lastScheduled.scheduled_for)
      nextScheduledTime.setMinutes(nextScheduledTime.getMinutes() + intervalMinutes)
    } else {
      nextScheduledTime = new Date()
      // If starting fresh, schedule first item immediately
    }

    let itemsCreated = 0

    // Generate queue items
    for (let i = 0; i < itemsNeeded; i++) {
      // For YouTube, get next available channel (round-robin with quota checking)
      let channelId: string | undefined = undefined
      if (platform === 'youtube') {
        const channelService = getYouTubeChannelService()
        const channel = channelService.getNextAvailableChannel()
        if (!channel) {
          console.log(`[QueueService] No YouTube channels with available quota`)
          break
        }
        channelId = channel.id
        console.log(`[QueueService] Selected channel: ${channel.channel_handle} (${channel.posts_today}/${channel.daily_quota} used)`)
      }

      // Get next available approved content
      const content = driveService.getNextContentForPlatform(platform)
      if (!content) {
        console.log(`[QueueService] No more approved content available for ${platform}`)
        break
      }

      // Validate content for platform
      const validation = driveService.validateForPlatform(content, platform)
      if (!validation.valid) {
        console.log(
          `[QueueService] Skipping ${content.filename}: ${validation.reason}`
        )
        driveService.updateContentStatus(content.id, 'skipped')
        i-- // Don't count this as an attempt
        continue
      }

      // Add to queue with logo verification check and channel ID
      const result = this.addToQueue(content.id, platform, account.account_id, nextScheduledTime, false, channelId)
      if (!result.success) {
        console.log(
          `[QueueService] ❌ Failed to queue ${content.filename}: ${result.error}`
        )
        // Don't count as created, but continue trying
        i--
        continue
      }

      // Increment channel post count for YouTube
      if (platform === 'youtube' && channelId) {
        const channelService = getYouTubeChannelService()
        channelService.incrementPostCount(channelId)
      }

      itemsCreated++

      // Schedule next item at interval minutes later
      nextScheduledTime = new Date(nextScheduledTime.getTime() + intervalMinutes * 60 * 1000)
    }

    console.log(`[QueueService] Auto-generated ${itemsCreated} queue items for ${platform} at ${intervalMinutes}min intervals`)
    return itemsCreated
  }
}

// Singleton instance
let instance: QueueService | null = null

export function getQueueService(): QueueService {
  if (!instance) {
    instance = new QueueService()
  }
  return instance
}
