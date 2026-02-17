import { getDatabase } from '../database/DatabaseService'
import { getYouTubeChannelService } from '../youtube/YouTubeChannelService'
import { getDriveService } from '../drive/DriveService'
import { YouTubePublisher } from '../publishing/YouTubePublisher'
import { v4 as uuidv4 } from 'uuid'

interface ScheduleResult {
  success: boolean
  totalScheduled: number
  scheduledUntil: string | null
  error?: string
  details: {
    channelName: string
    videosScheduled: number
  }[]
}

export class BulkScheduler {
  private youtubePublisher = new YouTubePublisher()

  /**
   * Bulk schedule videos for the next N days
   * Respects quota limits (6 per day per channel)
   * Uploads immediately to YouTube with future publish dates
   */
  async scheduleNextDays(daysAhead: number = 30): Promise<ScheduleResult> {
    try {
      console.log(`[BulkScheduler] Starting bulk schedule for next ${daysAhead} days...`)

      const db = getDatabase()
      const channelService = getYouTubeChannelService()
      const driveService = getDriveService()

      // Get all enabled channels with folders
      const channels = channelService.getEnabledChannels().filter(ch => ch.drive_folder_id)

      if (channels.length === 0) {
        return {
          success: false,
          totalScheduled: 0,
          scheduledUntil: null,
          error: 'No channels with linked folders found',
          details: [],
        }
      }

      console.log(`[BulkScheduler] Found ${channels.length} channels to schedule`)

      const result: ScheduleResult = {
        success: true,
        totalScheduled: 0,
        scheduledUntil: null,
        details: [],
      }

      // For each channel, schedule videos
      for (const channel of channels) {
        const channelResult = await this.scheduleChannelVideos(channel, daysAhead)
        result.totalScheduled += channelResult.scheduled
        result.details.push({
          channelName: channel.channel_name || channel.channel_handle || 'Unknown',
          videosScheduled: channelResult.scheduled,
        })

        // Track furthest scheduled date
        if (channelResult.lastScheduledDate) {
          if (!result.scheduledUntil || channelResult.lastScheduledDate > result.scheduledUntil) {
            result.scheduledUntil = channelResult.lastScheduledDate
          }
        }
      }

      // Save scheduling horizon to settings
      if (result.scheduledUntil) {
        db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('youtube_scheduled_until', ?)",
          [result.scheduledUntil]
        )
        db.run(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('last_bulk_schedule_at', ?)",
          [new Date().toISOString()]
        )
      }

      console.log(`[BulkScheduler] ✅ Scheduled ${result.totalScheduled} videos until ${result.scheduledUntil}`)

      return result
    } catch (error) {
      console.error('[BulkScheduler] Error:', error)
      return {
        success: false,
        totalScheduled: 0,
        scheduledUntil: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: [],
      }
    }
  }

  /**
   * Schedule videos for a single channel
   */
  private async scheduleChannelVideos(
    channel: any,
    daysAhead: number
  ): Promise<{ scheduled: number; lastScheduledDate: string | null }> {
    try {
      const db = getDatabase()
      const driveService = getDriveService()

      console.log(`[BulkScheduler] Scheduling for channel: ${channel.channel_name}`)

      // Get pending content from this channel's folder (approved OR pending_review)
      const content = db.all(
        `SELECT * FROM content_items
         WHERE folder_id = ?
         AND (approval_status = 'approved' OR approval_status = 'pending_review' OR approval_status IS NULL)
         AND status = 'pending'
         ORDER BY discovered_at ASC`,
        [channel.drive_folder_id]
      )

      if (content.length === 0) {
        console.log(`[BulkScheduler] No approved content for ${channel.channel_name}`)
        return { scheduled: 0, lastScheduledDate: null }
      }

      console.log(`[BulkScheduler] Found ${content.length} approved videos for ${channel.channel_name}`)

      // Calculate schedule slots: 6 videos per day * daysAhead
      const totalSlots = Math.min(content.length, channel.daily_quota * daysAhead)
      const intervalMinutes = channel.posting_interval_minutes || 30

      // Start scheduling from now + 1 hour (give buffer time)
      let currentDate = new Date()
      currentDate.setHours(currentDate.getHours() + 1)
      currentDate.setMinutes(0, 0, 0) // Round to nearest hour

      let scheduled = 0
      let videosScheduledToday = 0
      let lastScheduledDate: string | null = null

      for (let i = 0; i < totalSlots && i < content.length; i++) {
        const item = content[i]

        // Reset daily counter at midnight
        if (videosScheduledToday >= channel.daily_quota) {
          // Move to next day at 9 AM
          currentDate.setDate(currentDate.getDate() + 1)
          currentDate.setHours(9, 0, 0, 0)
          videosScheduledToday = 0
        }

        // Schedule this video
        const scheduledFor = currentDate.toISOString()

        try {
          // Download file from Drive
          const filePath = await driveService.downloadFile(item.drive_file_id, item.filename)

          // Upload to YouTube with scheduled publish date
          const result = await this.youtubePublisher.publish(
            item.id,
            filePath,
            {
              title: item.title,
              description: item.description,
              tags: item.tags,
            },
            scheduledFor
          )

          if (result.success && result.postId) {
            // Add to queue with scheduled status
            const queueId = uuidv4()
            const videoUrl = `https://www.youtube.com/watch?v=${result.postId}`

            db.run(
              `INSERT INTO queue (
                id, content_id, platform, channel_id, scheduled_for,
                youtube_scheduled_publish_at, youtube_video_url, status, created_at
              ) VALUES (?, ?, 'youtube', ?, ?, ?, ?, 'scheduled', CURRENT_TIMESTAMP)`,
              [queueId, item.id, channel.id, scheduledFor, scheduledFor, videoUrl]
            )

            // Mark content as queued
            db.run(
              `UPDATE content_items SET status = 'queued' WHERE id = ?`,
              [item.id]
            )

            console.log(`[BulkScheduler] ✅ Scheduled ${item.filename} for ${scheduledFor}`)
            scheduled++
            videosScheduledToday++
            lastScheduledDate = scheduledFor

            // Cleanup downloaded file
            driveService.cleanupFile(filePath)
          } else {
            console.error(`[BulkScheduler] Failed to schedule ${item.filename}:`, result.error)
          }
        } catch (error) {
          console.error(`[BulkScheduler] Error scheduling ${item.filename}:`, error)
        }

        // Move to next time slot
        currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes)
      }

      return { scheduled, lastScheduledDate }
    } catch (error) {
      console.error(`[BulkScheduler] Error scheduling channel:`, error)
      return { scheduled: 0, lastScheduledDate: null }
    }
  }

  /**
   * Get current scheduling status
   */
  async getScheduleStatus(): Promise<{
    scheduledUntil: string | null
    totalScheduled: number
    byChannel: { channelName: string; count: number }[]
  }> {
    const db = getDatabase()

    // Get scheduled until date from settings
    const setting = db.get<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'youtube_scheduled_until'"
    )
    const scheduledUntil = setting?.value || null

    // Count scheduled videos
    const totalResult = db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM queue WHERE status = 'scheduled' AND platform = 'youtube'"
    )
    const totalScheduled = totalResult?.count || 0

    // Get count by channel
    const byChannelResults = db.all<{ channel_name: string; count: number }>(
      `SELECT yc.channel_name, COUNT(*) as count
       FROM queue q
       JOIN youtube_channels yc ON q.channel_id = yc.id
       WHERE q.status = 'scheduled' AND q.platform = 'youtube'
       GROUP BY yc.channel_name`
    )

    const byChannel = byChannelResults.map(r => ({
      channelName: r.channel_name,
      count: r.count,
    }))

    return {
      scheduledUntil,
      totalScheduled,
      byChannel,
    }
  }
}

// Singleton
let instance: BulkScheduler | null = null

export function getBulkScheduler(): BulkScheduler {
  if (!instance) {
    instance = new BulkScheduler()
  }
  return instance
}
