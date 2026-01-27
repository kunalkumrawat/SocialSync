import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { getDatabase } from './services/database/DatabaseService'
import { getSettings } from './services/settings/SettingsService'
import { getGoogleAuth, getYouTubeAuth, getInstagramAuth } from './services/auth'
import { getDriveService } from './services/drive'
import { getContentScheduler } from './services/scheduler'
import { getQueueService } from './services/queue'
import { getScheduleService } from './services/schedule'
import { getPostingService } from './services/posting'

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
  postingService.start()
  console.log('[Main] Posting service started')

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
  mainWindow?.webContents.send('schedule:updated')
})

ipcMain.handle('schedule:delete', async (_event, scheduleId: string) => {
  const scheduleService = getScheduleService()
  scheduleService.deleteSchedule(scheduleId)
  mainWindow?.webContents.send('schedule:updated')
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

// Activity log
ipcMain.handle('activity:get', async (_event, limit = 50) => {
  const db = getDatabase()
  return db.all('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?', [limit])
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
