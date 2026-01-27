import { getDatabase } from '../database/DatabaseService'
import { getDriveService } from '../drive'
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
   */
  addToQueue(
    contentId: string,
    platform: 'instagram' | 'youtube',
    accountId: string,
    scheduledFor: Date
  ): string {
    const db = getDatabase()
    const id = uuidv4()

    db.run(
      `INSERT INTO queue (id, content_id, platform, account_id, scheduled_for, status, attempts)
       VALUES (?, ?, ?, ?, ?, 'pending', 0)`,
      [id, contentId, platform, accountId, scheduledFor.toISOString()]
    )

    // Update content item status
    db.run("UPDATE content_items SET status = 'queued' WHERE id = ?", [contentId])

    return id
  }

  /**
   * Update queue item status
   */
  updateQueueStatus(
    queueId: string,
    status: 'pending' | 'processing' | 'posted' | 'failed' | 'skipped',
    error?: string
  ): void {
    const db = getDatabase()

    if (status === 'posted') {
      db.run(
        `UPDATE queue SET status = ?, posted_at = ?, last_error = NULL WHERE id = ?`,
        [status, new Date().toISOString(), queueId]
      )
    } else if (status === 'failed') {
      db.run(
        `UPDATE queue SET status = ?, attempts = attempts + 1, last_error = ? WHERE id = ?`,
        [status, error || 'Unknown error', queueId]
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

          // Get next available content
          const content = driveService.getNextContent()
          if (!content) {
            console.log('[QueueService] No more content available')
            return itemsCreated
          }

          // Check if content is already queued for this platform
          if (this.isContentQueued(content.id, schedule.platform)) {
            continue
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

          // Add to queue
          this.addToQueue(content.id, schedule.platform, schedule.account_id, scheduledTime)
          itemsCreated++
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log(`[QueueService] Generated ${itemsCreated} queue items from schedule`)
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
