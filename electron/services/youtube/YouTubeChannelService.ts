import { getDatabase } from '../database/DatabaseService'
import { v4 as uuidv4 } from 'uuid'

export interface YouTubeChannel {
  id: string
  channel_id: string
  channel_handle: string | null
  channel_name: string | null
  channel_url: string | null
  account_id: string
  daily_quota: number
  posts_today: number
  enabled: boolean
  created_at: string
  last_reset_at: string
  drive_folder_id: string | null
  posting_interval_minutes: number
  auto_post_enabled: boolean
}

export class YouTubeChannelService {
  /**
   * Add a YouTube channel to the system
   */
  addChannel(
    channelId: string,
    channelHandle: string,
    accountId: string,
    options?: {
      channelName?: string
      channelUrl?: string
      dailyQuota?: number
    }
  ): string {
    const db = getDatabase()

    // Check if channel already exists
    const existing = db.get<{ id: string }>(
      'SELECT id FROM youtube_channels WHERE channel_id = ?',
      [channelId]
    )

    if (existing) {
      console.log(`[YouTubeChannelService] Channel ${channelHandle} already exists`)
      return existing.id
    }

    const id = uuidv4()
    const channelUrl = options?.channelUrl || `https://youtube.com/${channelHandle}`

    db.run(
      `INSERT INTO youtube_channels
       (id, channel_id, channel_handle, channel_name, channel_url, account_id, daily_quota, posts_today, enabled, last_reset_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP)`,
      [
        id,
        channelId,
        channelHandle,
        options?.channelName || channelHandle,
        channelUrl,
        accountId,
        options?.dailyQuota || 6,
      ]
    )

    console.log(`[YouTubeChannelService] Added channel: ${channelHandle} (${channelId})`)
    return id
  }

  /**
   * Get all YouTube channels
   */
  getAllChannels(): YouTubeChannel[] {
    const db = getDatabase()
    const channels = db.all<YouTubeChannel>('SELECT * FROM youtube_channels ORDER BY created_at ASC')
    return channels
  }

  /**
   * Get enabled YouTube channels only
   */
  getEnabledChannels(): YouTubeChannel[] {
    const db = getDatabase()
    const channels = db.all<YouTubeChannel>(
      'SELECT * FROM youtube_channels WHERE enabled = 1 ORDER BY created_at ASC'
    )
    return channels
  }

  /**
   * Get next available channel for posting (with quota available)
   * Uses round-robin distribution
   */
  getNextAvailableChannel(): YouTubeChannel | null {
    const db = getDatabase()

    // Reset daily counters if needed (daily reset at midnight UTC)
    this.resetDailyCountersIfNeeded()

    // Find channel with available quota, ordered by least posts today
    const channel = db.get<YouTubeChannel>(
      `SELECT * FROM youtube_channels
       WHERE enabled = 1
       AND posts_today < daily_quota
       ORDER BY posts_today ASC, last_reset_at ASC
       LIMIT 1`
    )

    if (!channel) {
      console.log('[YouTubeChannelService] No channels with available quota')
      return null
    }

    return channel
  }

  /**
   * Increment post count for a channel
   */
  incrementPostCount(channelId: string): void {
    const db = getDatabase()
    db.run(
      `UPDATE youtube_channels
       SET posts_today = posts_today + 1
       WHERE id = ?`,
      [channelId]
    )
  }

  /**
   * Reset daily post counters if a new day has started
   */
  resetDailyCountersIfNeeded(): void {
    const db = getDatabase()

    // Check if any channel needs reset (last_reset_at is not today)
    const needsReset = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM youtube_channels
       WHERE DATE(last_reset_at) < DATE('now')`
    )

    if (needsReset && needsReset.count > 0) {
      console.log(`[YouTubeChannelService] Resetting daily counters for ${needsReset.count} channels`)

      db.run(
        `UPDATE youtube_channels
         SET posts_today = 0,
             last_reset_at = CURRENT_TIMESTAMP
         WHERE DATE(last_reset_at) < DATE('now')`
      )
    }
  }

  /**
   * Get channel by ID
   */
  getChannelById(channelId: string): YouTubeChannel | null {
    const db = getDatabase()
    return db.get<YouTubeChannel>('SELECT * FROM youtube_channels WHERE id = ?', [channelId])
  }

  /**
   * Enable/disable a channel
   */
  toggleChannel(channelId: string, enabled: boolean): void {
    const db = getDatabase()
    db.run('UPDATE youtube_channels SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, channelId])
    console.log(`[YouTubeChannelService] Channel ${channelId} ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Remove a channel
   */
  removeChannel(channelId: string): void {
    const db = getDatabase()
    db.run('DELETE FROM youtube_channels WHERE id = ?', [channelId])
    console.log(`[YouTubeChannelService] Removed channel ${channelId}`)
  }

  /**
   * Get total posts across all channels today
   */
  getTotalPostsToday(): number {
    const db = getDatabase()
    const result = db.get<{ total: number }>(
      'SELECT SUM(posts_today) as total FROM youtube_channels WHERE enabled = 1'
    )
    return result?.total || 0
  }

  /**
   * Get total available quota across all channels
   */
  getTotalAvailableQuota(): number {
    const db = getDatabase()
    this.resetDailyCountersIfNeeded()

    const result = db.get<{ available: number }>(
      'SELECT SUM(daily_quota - posts_today) as available FROM youtube_channels WHERE enabled = 1'
    )
    return result?.available || 0
  }

  /**
   * Get channel stats for dashboard
   */
  getChannelStats(): {
    totalChannels: number
    enabledChannels: number
    totalQuota: number
    usedQuota: number
    availableQuota: number
  } {
    const db = getDatabase()
    this.resetDailyCountersIfNeeded()

    const totalChannels = db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM youtube_channels'
    )?.count || 0

    const enabledChannels = db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM youtube_channels WHERE enabled = 1'
    )?.count || 0

    const quotaStats = db.get<{ total_quota: number; used_quota: number }>(
      `SELECT
         SUM(daily_quota) as total_quota,
         SUM(posts_today) as used_quota
       FROM youtube_channels
       WHERE enabled = 1`
    )

    return {
      totalChannels,
      enabledChannels,
      totalQuota: quotaStats?.total_quota || 0,
      usedQuota: quotaStats?.used_quota || 0,
      availableQuota: (quotaStats?.total_quota || 0) - (quotaStats?.used_quota || 0),
    }
  }

  /**
   * Link a Google Drive folder to a channel
   */
  linkFolder(channelId: string, folderId: string): void {
    const db = getDatabase()
    db.run('UPDATE youtube_channels SET drive_folder_id = ? WHERE id = ?', [folderId, channelId])
    console.log(`[YouTubeChannelService] Linked folder ${folderId} to channel ${channelId}`)
  }

  /**
   * Update channel settings
   */
  updateChannelSettings(
    channelId: string,
    settings: {
      posting_interval_minutes?: number
      daily_quota?: number
      auto_post_enabled?: boolean
    }
  ): void {
    const db = getDatabase()
    const updates: string[] = []
    const values: unknown[] = []

    if (settings.posting_interval_minutes !== undefined) {
      updates.push('posting_interval_minutes = ?')
      values.push(settings.posting_interval_minutes)
    }
    if (settings.daily_quota !== undefined) {
      updates.push('daily_quota = ?')
      values.push(settings.daily_quota)
    }
    if (settings.auto_post_enabled !== undefined) {
      updates.push('auto_post_enabled = ?')
      values.push(settings.auto_post_enabled ? 1 : 0)
    }

    if (updates.length > 0) {
      values.push(channelId)
      db.run(`UPDATE youtube_channels SET ${updates.join(', ')} WHERE id = ?`, values)
      console.log(`[YouTubeChannelService] Updated settings for channel ${channelId}`)
    }
  }
}

// Singleton instance
let instance: YouTubeChannelService | null = null

export function getYouTubeChannelService(): YouTubeChannelService {
  if (!instance) {
    instance = new YouTubeChannelService()
  }
  return instance
}
