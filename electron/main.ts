import 'dotenv/config'
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import crypto from 'crypto'
import { getDatabase } from './services/database/DatabaseService'
import { getSettings } from './services/settings/SettingsService'
import { getGoogleAuth, getYouTubeAuth, getInstagramAuth } from './services/auth'
import { getDriveService } from './services/drive'
import { getContentScheduler } from './services/scheduler'
import { getQueueService } from './services/queue'
import { getScheduleService } from './services/schedule'
import { getPostingService } from './services/posting'
import { getInstagramPublisher, getYouTubePublisher } from './services/publishing'
import { getSmartPostingService } from './services/smartPosting/SmartPostingService'
import { getYouTubeChannelService } from './services/youtube/YouTubeChannelService'
import { fetchUserYouTubeChannels } from './services/youtube/YouTubeFetcher'
import { getBulkScheduler } from './services/scheduling/BulkScheduler'
import { dialog } from 'electron'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Only applies to Windows builds with Squirrel installer
try {
  if (process.platform === 'win32' && require('electron-squirrel-startup')) {
    app.quit()
  }
} catch {
  // electron-squirrel-startup not available in dev mode
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#1f2937',
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle window close - minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  // Create a 16x16 tray icon (simple colored square for now)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  updateTrayMenu()

  tray.setToolTip('SocialSync')

  tray.on('click', () => {
    mainWindow?.show()
  })
}

function updateTrayMenu(schedulerPaused = false) {
  if (!tray) return

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open SocialSync',
      click: () => {
        mainWindow?.show()
      },
    },
    {
      label: schedulerPaused ? 'Resume Scheduling' : 'Pause Scheduling',
      click: () => {
        const newState = !schedulerPaused
        mainWindow?.webContents.send('scheduler:toggle', newState)
        updateTrayMenu(newState)
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
}

// Extend app type for isQuitting property
declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}

// Initialize services
async function initializeServices() {
  console.log('[Main] Initializing services...')

  // Initialize database
  const db = getDatabase()
  await db.initialize()
  console.log('[Main] Database initialized')

  // Initialize settings (loads from DB)
  const settings = getSettings()
  await settings.getAll()
  console.log('[Main] Settings loaded')

  // Initialize DriveService with Google account
  const driveService = getDriveService()
  const googleAccount = db.get<{ account_id: string }>(
    "SELECT account_id FROM accounts WHERE platform = 'google' LIMIT 1"
  )
  if (googleAccount) {
    driveService.setAccount(googleAccount.account_id)
    console.log('[Main] DriveService initialized with Google account')
  } else {
    console.log('[Main] No Google account found - DriveService not initialized')
  }

}

// App lifecycle
app.whenReady().then(async () => {
  await initializeServices()

  createWindow()
  createTray()

  // Start content scheduler for hourly scans
  const contentScheduler = getContentScheduler()
  if (mainWindow) {
    contentScheduler.setMainWindow(mainWindow)
  }
  contentScheduler.start()
  console.log('[Main] Content scheduler started')

  // Start posting service for automated posting
  const postingService = getPostingService()
  if (mainWindow) {
    postingService.setMainWindow(mainWindow)
  }

  // Register publishers
  const instagramPublisher = getInstagramPublisher()
  const youtubePublisher = getYouTubePublisher()
  postingService.registerPublisher('instagram', instagramPublisher)
  postingService.registerPublisher('youtube', youtubePublisher)
  console.log('[Main] Publishers registered')

  postingService.start()
  console.log('[Main] Posting service started')

  // Generate queue from active schedules on startup
  const scheduleService = getScheduleService()
  const queueResult = scheduleService.generateQueueFromActiveSchedules(7)
  console.log(`[Main] Startup queue generation: Instagram=${queueResult.instagram}, YouTube=${queueResult.youtube}`)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true

  // Stop content scheduler
  const contentScheduler = getContentScheduler()
  contentScheduler.stop()

  // Stop posting service
  const postingService = getPostingService()
  postingService.stop()

  // Close database cleanly
  const db = getDatabase()
  db.close()
})

// ============================================
// IPC Handlers
// ============================================

// App info
ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

ipcMain.handle('app:getPlatform', () => {
  return process.platform
})

ipcMain.handle('app:openExternal', async (_event, url: string) => {
  const { shell } = require('electron')
  await shell.openExternal(url)
})

// Settings
ipcMain.handle('settings:get', async () => {
  const settings = getSettings()
  return await settings.getAll()
})

ipcMain.handle('settings:save', async (_event, newSettings) => {
  const settings = getSettings()
  await settings.saveAll(newSettings)
})

// Accounts
ipcMain.handle('accounts:getAll', async () => {
  const db = getDatabase()
  return db.all('SELECT * FROM accounts ORDER BY connected_at DESC')
})

ipcMain.handle('accounts:connect', async (_event, platform: string) => {
  console.log(`[IPC] Connect account request for: ${platform}`)

  try {
    let authService
    switch (platform) {
      case 'google':
        authService = getGoogleAuth()
        break
      case 'youtube':
        authService = getYouTubeAuth()
        break
      case 'instagram':
        authService = getInstagramAuth()
        break
      default:
        throw new Error(`Unknown platform: ${platform}`)
    }

    const account = await authService.authenticate()
    console.log(`[IPC] Successfully connected ${platform} account:`, account.accountName)

    // Notify renderer of success
    mainWindow?.webContents.send('accounts:connected', account)

    return account
  } catch (error) {
    console.error(`[IPC] Failed to connect ${platform}:`, error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { error: message }
  }
})

ipcMain.handle('accounts:disconnect', async (_event, accountId: string) => {
  const db = getDatabase()

  // Get account info first to determine platform
  const account = db.get<{ platform: string; account_id: string }>(
    'SELECT platform, account_id FROM accounts WHERE id = ?',
    [accountId]
  )

  if (account) {
    // Remove tokens
    let authService
    switch (account.platform) {
      case 'google':
        authService = getGoogleAuth()
        break
      case 'youtube':
        authService = getYouTubeAuth()
        break
      case 'instagram':
        authService = getInstagramAuth()
        break
    }

    if (authService) {
      await authService.disconnect(account.account_id)
    }
  }

  // Remove from database
  db.run('DELETE FROM accounts WHERE id = ?', [accountId])

  // Notify renderer
  mainWindow?.webContents.send('accounts:disconnected', accountId)
})

// Drive
ipcMain.handle('drive:listFolders', async (_event, parentId?: string) => {
  try {
    const driveService = getDriveService()

    // Get the Google account
    const db = getDatabase()
    const googleAccount = db.get<{ account_id: string }>(
      "SELECT account_id FROM accounts WHERE platform = 'google' LIMIT 1"
    )

    if (!googleAccount) {
      return { error: 'Google Drive not connected' }
    }

    driveService.setAccount(googleAccount.account_id)
    const folders = await driveService.listFolders(parentId)
    return folders
  } catch (error) {
    console.error('[IPC] drive:listFolders error:', error)
    const message = error instanceof Error ? error.message : 'Failed to list folders'
    return { error: message }
  }
})

ipcMain.handle('drive:selectFolder', async (_event, folderId: string, folderName: string) => {
  try {
    const driveService = getDriveService()

    const db = getDatabase()
    const googleAccount = db.get<{ account_id: string }>(
      "SELECT account_id FROM accounts WHERE platform = 'google' LIMIT 1"
    )

    if (!googleAccount) {
      return { error: 'Google Drive not connected' }
    }

    driveService.setAccount(googleAccount.account_id)
    await driveService.selectFolder(folderId, folderName)

    // Notify renderer
    mainWindow?.webContents.send('drive:folderSelected', { folderId, folderName })

    return { success: true }
  } catch (error) {
    console.error('[IPC] drive:selectFolder error:', error)
    const message = error instanceof Error ? error.message : 'Failed to select folder'
    return { error: message }
  }
})

ipcMain.handle('drive:unselectFolder', async (_event, folderId: string) => {
  try {
    const driveService = getDriveService()
    await driveService.unselectFolder(folderId)
    return { success: true }
  } catch (error) {
    console.error('[IPC] drive:unselectFolder error:', error)
    const message = error instanceof Error ? error.message : 'Failed to unselect folder'
    return { error: message }
  }
})

ipcMain.handle('drive:getSelectedFolders', async () => {
  const driveService = getDriveService()
  return driveService.getSelectedFolders()
})

ipcMain.handle('drive:getFolders', async () => {
  const db = getDatabase()
  const folders = db.all('SELECT * FROM drive_folders ORDER BY folder_name ASC')
  return folders
})

ipcMain.handle('drive:scanContent', async () => {
  try {
    const driveService = getDriveService()

    const db = getDatabase()
    const googleAccount = db.get<{ account_id: string }>(
      "SELECT account_id FROM accounts WHERE platform = 'google' LIMIT 1"
    )

    if (!googleAccount) {
      return { error: 'Google Drive not connected' }
    }

    driveService.setAccount(googleAccount.account_id)
    const result = await driveService.scanForContent()

    // Notify renderer of new content
    mainWindow?.webContents.send('drive:scanComplete', result)

    return result
  } catch (error) {
    console.error('[IPC] drive:scanContent error:', error)
    const message = error instanceof Error ? error.message : 'Failed to scan content'
    return { error: message }
  }
})

ipcMain.handle('drive:getContent', async (_event, options?: { status?: string; limit?: number }) => {
  const driveService = getDriveService()
  return driveService.getContentItems(options)
})

ipcMain.handle('drive:getThumbnail', async (_event, fileId: string) => {
  try {
    const driveService = getDriveService()

    const db = getDatabase()
    const googleAccount = db.get<{ account_id: string }>(
      "SELECT account_id FROM accounts WHERE platform = 'google' LIMIT 1"
    )

    if (!googleAccount) {
      return null
    }

    driveService.setAccount(googleAccount.account_id)
    return await driveService.getThumbnail(fileId)
  } catch (error) {
    console.error('[IPC] drive:getThumbnail error:', error)
    return null
  }
})

ipcMain.handle(
  'drive:updateMetadata',
  async (
    _event,
    contentId: string,
    metadata: {
      title?: string
      description?: string
      tags?: string
      category?: string
      metadata_approved?: boolean
    }
  ) => {
    try {
      const driveService = getDriveService()
      driveService.updateContentMetadata(contentId, metadata)
      return { success: true }
    } catch (error) {
      console.error('[IPC] drive:updateMetadata error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update metadata' }
    }
  }
)

// Content approval workflow
ipcMain.handle('drive:approveContent', async (_event, contentId: string) => {
  try {
    const driveService = getDriveService()
    driveService.approveContent(contentId)
    return { success: true }
  } catch (error) {
    console.error('[IPC] drive:approveContent error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to approve content' }
  }
})

ipcMain.handle('drive:rejectContent', async (_event, contentId: string, reason?: string) => {
  try {
    const driveService = getDriveService()
    driveService.rejectContent(contentId, reason)
    return { success: true }
  } catch (error) {
    console.error('[IPC] drive:rejectContent error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reject content' }
  }
})

ipcMain.handle('drive:bulkApproveContent', async (_event, contentIds: string[]) => {
  try {
    const driveService = getDriveService()
    driveService.bulkApproveContent(contentIds)
    return { success: true }
  } catch (error) {
    console.error('[IPC] drive:bulkApproveContent error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to bulk approve content' }
  }
})

ipcMain.handle('drive:bulkRejectContent', async (_event, contentIds: string[], reason?: string) => {
  try {
    const driveService = getDriveService()
    driveService.bulkRejectContent(contentIds, reason)
    return { success: true }
  } catch (error) {
    console.error('[IPC] drive:bulkRejectContent error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to bulk reject content' }
  }
})

// Queue
ipcMain.handle('queue:get', async (_event, platform: string) => {
  const queueService = getQueueService()
  return queueService.getQueueForPlatform(platform as 'instagram' | 'youtube')
})

ipcMain.handle('queue:skip', async (_event, itemId: string) => {
  const queueService = getQueueService()
  queueService.skipQueueItem(itemId)
  mainWindow?.webContents.send('queue:updated')
})

ipcMain.handle('queue:retry', async (_event, itemId: string) => {
  const queueService = getQueueService()
  queueService.retryQueueItem(itemId)
  mainWindow?.webContents.send('queue:updated')
})

ipcMain.handle('queue:delete', async (_event, itemId: string) => {
  const queueService = getQueueService()
  queueService.deleteQueueItem(itemId)
  mainWindow?.webContents.send('queue:updated')
})

ipcMain.handle('queue:reschedule', async (_event, itemId: string, newTime: string) => {
  const queueService = getQueueService()
  queueService.rescheduleQueueItem(itemId, new Date(newTime))
  mainWindow?.webContents.send('queue:updated')
})

ipcMain.handle('queue:getStats', async () => {
  const queueService = getQueueService()
  return queueService.getQueueStats()
})

ipcMain.handle('queue:clearCompleted', async () => {
  const queueService = getQueueService()
  const count = queueService.clearCompletedItems()
  mainWindow?.webContents.send('queue:updated')
  return count
})

ipcMain.handle('queue:getPosted', async () => {
  const queueService = getQueueService()
  return queueService.getPostedItems()
})

// Schedule
ipcMain.handle('schedule:getAll', async () => {
  const scheduleService = getScheduleService()
  return scheduleService.getAllSchedules()
})

ipcMain.handle('schedule:getForPlatform', async (_event, platform: string) => {
  const scheduleService = getScheduleService()
  return scheduleService.getScheduleForPlatform(platform as 'instagram' | 'youtube')
})

ipcMain.handle('schedule:save', async (_event, schedule) => {
  const scheduleService = getScheduleService()

  // Validate schedule
  const validation = scheduleService.validateSchedule(schedule)
  if (!validation.valid) {
    return { error: validation.errors.join(', ') }
  }

  const scheduleId = scheduleService.saveSchedule(schedule)

  // Generate queue items for the next week
  if (schedule.enabled) {
    const queueService = getQueueService()
    queueService.generateQueueFromSchedule(scheduleId, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  }

  mainWindow?.webContents.send('schedule:updated')
  return { success: true, scheduleId }
})

ipcMain.handle('schedule:toggle', async (_event, platform: string, enabled: boolean) => {
  const scheduleService = getScheduleService()
  scheduleService.toggleSchedule(platform as 'instagram' | 'youtube', enabled)

  // If enabling, generate queue for the next 7 days
  if (enabled) {
    console.log(`[Main] Generating queue for ${platform} after enabling schedule`)
    const result = scheduleService.generateQueueFromActiveSchedules(7)
    console.log(`[Main] Generated queue:`, result)
  }

  mainWindow?.webContents.send('schedule:updated')
  mainWindow?.webContents.send('queue:updated')
})

ipcMain.handle('schedule:delete', async (_event, scheduleId: string) => {
  const scheduleService = getScheduleService()
  scheduleService.deleteSchedule(scheduleId)
  mainWindow?.webContents.send('schedule:updated')
})

// YouTube Channels (Multi-Channel Support)
ipcMain.handle('youtube:channels:getAll', async () => {
  const channelService = getYouTubeChannelService()
  return channelService.getAllChannels()
})

ipcMain.handle('youtube:channels:sync', async () => {
  try {
    const result = await fetchUserYouTubeChannels()

    if (!result.success || !result.channels) {
      return { success: false, error: result.error }
    }

    // Add channels to database
    const channelService = getYouTubeChannelService()

    const db = getDatabase()
    const youtubeAccount = db.get<{ id: string }>(
      "SELECT id FROM accounts WHERE platform = 'youtube' LIMIT 1"
    )

    if (!youtubeAccount) {
      return { success: false, error: 'No YouTube account found' }
    }

    let addedCount = 0
    for (const channel of result.channels) {
      channelService.addChannel(
        channel.channelId,
        channel.channelHandle || channel.channelTitle,
        youtubeAccount.id,
        {
          channelName: channel.channelTitle,
          channelUrl: channel.channelUrl,
          dailyQuota: 6,
        }
      )
      addedCount++
    }

    console.log(`[Main] Synced ${addedCount} YouTube channels`)
    mainWindow?.webContents.send('youtube:channels:updated')

    return {
      success: true,
      channelsFound: result.channels.length,
      channelsAdded: addedCount
    }
  } catch (error) {
    console.error('[Main] Error syncing YouTube channels:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('youtube:channels:add', async (_event, channelData: {
  channelId: string
  channelHandle: string
  channelName?: string
  channelUrl?: string
  dailyQuota?: number
}) => {
  try {
    const channelService = getYouTubeChannelService()

    // Get YouTube account
    const db = getDatabase()
    const account = db.get<{ id: string }>('SELECT id FROM accounts WHERE platform = "youtube" LIMIT 1')

    if (!account) {
      return { success: false, error: 'No YouTube account connected' }
    }

    const id = channelService.addChannel(
      channelData.channelId,
      channelData.channelHandle,
      account.id,
      {
        channelName: channelData.channelName,
        channelUrl: channelData.channelUrl,
        dailyQuota: channelData.dailyQuota,
      }
    )

    mainWindow?.webContents.send('youtube:channels:updated')
    return { success: true, id }
  } catch (error) {
    console.error('[Main] Error adding YouTube channel:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('youtube:channels:toggle', async (_event, channelId: string, enabled: boolean) => {
  const channelService = getYouTubeChannelService()
  channelService.toggleChannel(channelId, enabled)
  mainWindow?.webContents.send('youtube:channels:updated')
})

ipcMain.handle('youtube:channels:remove', async (_event, channelId: string) => {
  const channelService = getYouTubeChannelService()
  channelService.removeChannel(channelId)
  mainWindow?.webContents.send('youtube:channels:updated')
})

ipcMain.handle('youtube:channels:getStats', async () => {
  const channelService = getYouTubeChannelService()
  return channelService.getChannelStats()
})

ipcMain.handle('youtube:channels:linkFolder', async (_event, channelId: string, folderId: string) => {
  const channelService = getYouTubeChannelService()
  channelService.linkFolder(channelId, folderId)
  mainWindow?.webContents.send('youtube:channels:updated')
  return { success: true }
})

ipcMain.handle('youtube:channels:updateSettings', async (_event, channelId: string, settings: {
  posting_interval_minutes?: number
  daily_quota?: number
  auto_post_enabled?: boolean
}) => {
  const channelService = getYouTubeChannelService()
  channelService.updateChannelSettings(channelId, settings)
  mainWindow?.webContents.send('youtube:channels:updated')
  return { success: true }
})

ipcMain.handle('youtube:channels:getContentForChannel', async (_event, channelId: string) => {
  const channelService = getYouTubeChannelService()
  const channel = channelService.getChannelById(channelId)

  if (!channel || !channel.drive_folder_id) {
    return []
  }

  // Get content from this channel's folder
  const db = getDatabase()
  const content = db.all(
    `SELECT * FROM content_items WHERE folder_id = ? ORDER BY discovered_at DESC`,
    [channel.drive_folder_id]
  )
  return content
})

ipcMain.handle('youtube:channels:getQueueForChannel', async (_event, channelId: string) => {
  const db = getDatabase()
  const queue = db.all(
    `SELECT q.*, c.filename, c.mime_type, c.drive_file_id, c.size_bytes
     FROM queue q
     LEFT JOIN content_items c ON q.content_id = c.id
     WHERE q.channel_id = ? AND q.status IN ('pending', 'processing')
     ORDER BY q.scheduled_for ASC`,
    [channelId]
  )
  return queue
})

ipcMain.handle('youtube:channels:getPostedForChannel', async (_event, channelId: string) => {
  const db = getDatabase()
  const posted = db.all(
    `SELECT q.*, c.filename, c.mime_type, c.drive_file_id
     FROM queue q
     LEFT JOIN content_items c ON q.content_id = c.id
     WHERE q.channel_id = ? AND q.status = 'posted'
     ORDER BY q.posted_at DESC
     LIMIT 50`,
    [channelId]
  )
  return posted
})

ipcMain.handle('youtube:channels:linkAccount', async (_event, channelId: string, accountId: string) => {
  try {
    const db = getDatabase()
    db.run('UPDATE youtube_channels SET account_id = ? WHERE id = ?', [accountId, channelId])
    mainWindow?.webContents.send('youtube:channels:updated')
    return { success: true }
  } catch (error) {
    console.error('[IPC] youtube:channels:linkAccount error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to link account' }
  }
})

ipcMain.handle('schedule:generateQueue', async (_event, daysAhead: number = 7) => {
  const scheduleService = getScheduleService()
  const result = scheduleService.generateQueueFromActiveSchedules(daysAhead)
  mainWindow?.webContents.send('queue:updated')
  return result
})

ipcMain.handle('schedule:getNextTime', async (_event, platform: string) => {
  const scheduleService = getScheduleService()
  return scheduleService.getNextScheduledTime(platform as 'instagram' | 'youtube')
})

// Bulk Scheduling
ipcMain.handle('scheduling:bulkSchedule', async (_event, daysAhead: number = 30) => {
  const scheduler = getBulkScheduler()
  return scheduler.scheduleNextDays(daysAhead)
})

ipcMain.handle('scheduling:getStatus', async () => {
  const scheduler = getBulkScheduler()
  return scheduler.getScheduleStatus()
})

// Activity log
ipcMain.handle('activity:get', async (_event, limit = 50) => {
  const db = getDatabase()
  return db.all(
    `SELECT
      id,
      event_type,
      content_id,
      platform,
      message,
      metadata,
      created_at || 'Z' as created_at
    FROM activity_log
    ORDER BY created_at DESC
    LIMIT ?`,
    [limit]
  )
})

// Posting
ipcMain.handle('posting:pause', async () => {
  const postingService = getPostingService()
  postingService.pause()
})

ipcMain.handle('posting:resume', async () => {
  const postingService = getPostingService()
  postingService.resume()
})

ipcMain.handle('posting:getStatus', async () => {
  const postingService = getPostingService()
  return postingService.getStats()
})

ipcMain.handle('posting:postNow', async (_event, queueId: string) => {
  const postingService = getPostingService()
  return await postingService.postNow(queueId)
})

// Safety settings (dry-run, rate limiting, etc.)
ipcMain.handle('safety:getDryRunMode', async () => {
  const db = getDatabase()
  const setting = db.get<{ value: string }>(" SELECT value FROM settings WHERE key = 'dry_run_mode'")
  return setting?.value === 'true'
})

ipcMain.handle('safety:setDryRunMode', async (_event, enabled: boolean) => {
  const db = getDatabase()
  db.run(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('dry_run_mode', ?, CURRENT_TIMESTAMP)",
    [enabled.toString()]
  )
  console.log(`[Safety] Dry-run mode ${enabled ? 'ENABLED' : 'DISABLED'}`)
  return { success: true }
})

ipcMain.handle('safety:getRateLimit', async () => {
  const db = getDatabase()
  const setting = db.get<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'rate_limit_per_hour'"
  )
  return parseInt(setting?.value || '10')
})

ipcMain.handle('safety:setRateLimit', async (_event, limit: number) => {
  const db = getDatabase()
  db.run(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('rate_limit_per_hour', ?, CURRENT_TIMESTAMP)",
    [limit.toString()]
  )
  console.log(`[Safety] Rate limit set to ${limit} posts/hour`)
  return { success: true }
})

// Smart Posting / Logo Detection
ipcMain.handle('smartPosting:getSettings', async () => {
  const smartPosting = getSmartPostingService()
  return smartPosting.getSettings()
})

ipcMain.handle('smartPosting:updateSettings', async (_event, settings) => {
  const smartPosting = getSmartPostingService()
  smartPosting.updateSettings(settings)
  return { success: true }
})

ipcMain.handle('smartPosting:uploadLogo', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
    ],
    title: 'Select STAGE Logo Reference'
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'No file selected' }
  }

  try {
    const smartPosting = getSmartPostingService()
    const logoPath = await smartPosting.uploadLogo(result.filePaths[0])
    return { success: true, path: logoPath }
  } catch (error) {
    console.error('[IPC] Logo upload error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' }
  }
})

ipcMain.handle('smartPosting:scanVideo', async (_event, contentId: string, videoPath: string) => {
  try {
    const smartPosting = getSmartPostingService()
    const result = await smartPosting.checkVideoForLogo(videoPath)
    smartPosting.updateContentLogoStatus(contentId, result)
    return { success: true, result }
  } catch (error) {
    console.error('[IPC] Video scan error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Scan failed' }
  }
})

// Manual logo marking (for manual review workflow)
ipcMain.handle('smartPosting:markLogoStatus', async (_event, contentId: string, hasLogo: boolean) => {
  try {
    const smartPosting = getSmartPostingService()
    smartPosting.manuallyMarkLogoStatus(contentId, hasLogo)
    return { success: true }
  } catch (error) {
    console.error('[IPC] Mark logo status error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark logo status' }
  }
})

ipcMain.handle('smartPosting:bulkMarkLogoStatus', async (_event, contentIds: string[], hasLogo: boolean) => {
  try {
    const smartPosting = getSmartPostingService()
    smartPosting.bulkMarkLogoStatus(contentIds, hasLogo)
    return { success: true }
  } catch (error) {
    console.error('[IPC] Bulk mark logo status error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to bulk mark logo status' }
  }
})

ipcMain.handle('smartPosting:getContentLogoStatus', async (_event, contentId: string) => {
  try {
    const smartPosting = getSmartPostingService()
    const status = smartPosting.getContentLogoStatus(contentId)
    return { success: true, status }
  } catch (error) {
    console.error('[IPC] Get logo status error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get logo status' }
  }
})

// Helper to log activity
export function logActivity(
  eventType: string,
  message: string,
  options?: { contentId?: string; platform?: string; metadata?: Record<string, unknown> }
) {
  const db = getDatabase()
  const id = crypto.randomUUID()

  db.run(
    `INSERT INTO activity_log (id, event_type, content_id, platform, message, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      eventType,
      options?.contentId ?? null,
      options?.platform ?? null,
      message,
      options?.metadata ? JSON.stringify(options.metadata) : null,
    ]
  )
}
