import { getDatabase } from '../database/DatabaseService'
import { getQueueService } from '../queue'
import { v4 as uuidv4 } from 'uuid'

export interface Schedule {
  id: string
  platform: 'instagram' | 'youtube'
  account_id: string
  days_of_week: number[] // 0 = Sunday, 6 = Saturday
  times: string[] // ["09:00", "18:00"]
  timezone: string
  enabled: boolean
  created_at: string
}

export class ScheduleService {
  /**
   * Get all schedules
   */
  getAllSchedules(): Schedule[] {
    const db = getDatabase()
    const rows = db.all<{
      id: string
      platform: 'instagram' | 'youtube'
      account_id: string
      days_of_week: string
      times: string
      timezone: string
      enabled: number
      created_at: string
    }>('SELECT * FROM schedules ORDER BY platform')

    return rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      account_id: row.account_id,
      days_of_week: JSON.parse(row.days_of_week),
      times: JSON.parse(row.times),
      timezone: row.timezone,
      enabled: row.enabled === 1,
      created_at: row.created_at,
    }))
  }

  /**
   * Get schedule for a specific platform
   */
  getScheduleForPlatform(platform: 'instagram' | 'youtube'): Schedule | null {
    const db = getDatabase()
    const row = db.get<{
      id: string
      platform: 'instagram' | 'youtube'
      account_id: string
      days_of_week: string
      times: string
      timezone: string
      enabled: number
      created_at: string
    }>('SELECT * FROM schedules WHERE platform = ? LIMIT 1', [platform])

    if (!row) return null

    return {
      id: row.id,
      platform: row.platform,
      account_id: row.account_id,
      days_of_week: JSON.parse(row.days_of_week),
      times: JSON.parse(row.times),
      timezone: row.timezone,
      enabled: row.enabled === 1,
      created_at: row.created_at,
    }
  }

  /**
   * Create or update a schedule
   */
  saveSchedule(schedule: Omit<Schedule, 'id' | 'created_at'> & { id?: string }): string {
    const db = getDatabase()

    if (schedule.id) {
      // Update existing
      db.run(
        `UPDATE schedules
         SET account_id = ?, days_of_week = ?, times = ?, timezone = ?, enabled = ?
         WHERE id = ?`,
        [
          schedule.account_id,
          JSON.stringify(schedule.days_of_week),
          JSON.stringify(schedule.times),
          schedule.timezone,
          schedule.enabled ? 1 : 0,
          schedule.id,
        ]
      )
      return schedule.id
    } else {
      // Create new
      const id = uuidv4()
      db.run(
        `INSERT INTO schedules (id, platform, account_id, days_of_week, times, timezone, enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          schedule.platform,
          schedule.account_id,
          JSON.stringify(schedule.days_of_week),
          JSON.stringify(schedule.times),
          schedule.timezone,
          schedule.enabled ? 1 : 0,
        ]
      )
      return id
    }
  }

  /**
   * Toggle schedule enabled/disabled
   */
  toggleSchedule(platform: 'instagram' | 'youtube', enabled: boolean): void {
    const db = getDatabase()
    db.run('UPDATE schedules SET enabled = ? WHERE platform = ?', [enabled ? 1 : 0, platform])

    // If disabling, we might want to clear pending queue items
    if (!enabled) {
      console.log(`[ScheduleService] Schedule disabled for ${platform}`)
    }
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(scheduleId: string): void {
    const db = getDatabase()
    db.run('DELETE FROM schedules WHERE id = ?', [scheduleId])
  }

  /**
   * Generate queue items from active schedules
   * This should be called when:
   * - A schedule is created/updated
   * - Content is added
   * - Periodically (daily) to maintain queue
   */
  generateQueueFromActiveSchedules(daysAhead: number = 7): {
    instagram: number
    youtube: number
  } {
    const schedules = this.getAllSchedules().filter((s) => s.enabled)
    const queueService = getQueueService()

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    const result = { instagram: 0, youtube: 0 }

    for (const schedule of schedules) {
      const count = queueService.generateQueueFromSchedule(schedule.id, startDate, endDate)
      result[schedule.platform] += count
      console.log(
        `[ScheduleService] Generated ${count} queue items for ${schedule.platform}`
      )
    }

    return result
  }

  /**
   * Validate schedule configuration
   */
  validateSchedule(schedule: Partial<Schedule>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!schedule.platform) {
      errors.push('Platform is required')
    }

    if (!schedule.account_id) {
      errors.push('Account is required')
    }

    if (!schedule.days_of_week || schedule.days_of_week.length === 0) {
      errors.push('At least one day must be selected')
    }

    if (schedule.days_of_week?.some((day) => day < 0 || day > 6)) {
      errors.push('Invalid day of week')
    }

    if (!schedule.times || schedule.times.length === 0) {
      errors.push('At least one time slot is required')
    }

    if (schedule.times?.some((time) => !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time))) {
      errors.push('Invalid time format (use HH:MM)')
    }

    if (!schedule.timezone) {
      errors.push('Timezone is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get next scheduled post time for a platform
   */
  getNextScheduledTime(platform: 'instagram' | 'youtube'): Date | null {
    const schedule = this.getScheduleForPlatform(platform)
    if (!schedule || !schedule.enabled) return null

    const now = new Date()
    const today = now.getDay()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    // Check today's remaining times
    if (schedule.days_of_week.includes(today)) {
      const remainingTimes = schedule.times.filter((time) => time > currentTime)
      if (remainingTimes.length > 0) {
        const [hours, minutes] = remainingTimes[0].split(':').map(Number)
        const next = new Date(now)
        next.setHours(hours, minutes, 0, 0)
        return next
      }
    }

    // Find next day with schedule
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const checkDate = new Date(now)
      checkDate.setDate(checkDate.getDate() + daysAhead)
      const checkDay = checkDate.getDay()

      if (schedule.days_of_week.includes(checkDay)) {
        const firstTime = schedule.times.sort()[0]
        const [hours, minutes] = firstTime.split(':').map(Number)
        checkDate.setHours(hours, minutes, 0, 0)
        return checkDate
      }
    }

    return null
  }

  /**
   * Get schedule statistics
   */
  getScheduleStats(): {
    totalSchedules: number
    activeSchedules: number
    instagramScheduled: boolean
    youtubeScheduled: boolean
  } {
    const schedules = this.getAllSchedules()

    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter((s) => s.enabled).length,
      instagramScheduled: schedules.some((s) => s.platform === 'instagram' && s.enabled),
      youtubeScheduled: schedules.some((s) => s.platform === 'youtube' && s.enabled),
    }
  }
}

// Singleton instance
let instance: ScheduleService | null = null

export function getScheduleService(): ScheduleService {
  if (!instance) {
    instance = new ScheduleService()
  }
  return instance
}
