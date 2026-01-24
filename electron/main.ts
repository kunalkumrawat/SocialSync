import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import { getDatabase } from './services/database/DatabaseService'
import { getSettings } from './services/settings/SettingsService'
import { getGoogleAuth, getYouTubeAuth, getInstagramAuth } from './services/auth'

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

// Drive (placeholder - to be implemented in Epic 3)
ipcMain.handle('drive:listFolders', async (_event, _parentId?: string) => {
  // TODO: Implement in Epic 3
  return []
})

ipcMain.handle('drive:selectFolder', async (_event, _folderId: string) => {
  // TODO: Implement in Epic 3
})

ipcMain.handle('drive:getSelectedFolders', async () => {
  const db = getDatabase()
  return db.all('SELECT * FROM drive_folders ORDER BY created_at DESC')
})

ipcMain.handle('drive:scanContent', async () => {
  // TODO: Implement in Epic 3
})

// Queue (placeholder - to be implemented in Epic 4)
ipcMain.handle('queue:get', async (_event, platform: string) => {
  const db = getDatabase()
  return db.all(
    `SELECT q.*, c.filename, c.mime_type
     FROM queue q
     LEFT JOIN content_items c ON q.content_id = c.id
     WHERE q.platform = ? AND q.status IN ('pending', 'processing')
     ORDER BY q.scheduled_for ASC`,
    [platform]
  )
})

ipcMain.handle('queue:skip', async (_event, itemId: string) => {
  const db = getDatabase()
  db.run("UPDATE queue SET status = 'skipped' WHERE id = ?", [itemId])
})

ipcMain.handle('queue:retry', async (_event, itemId: string) => {
  const db = getDatabase()
  db.run("UPDATE queue SET status = 'pending', attempts = 0, last_error = NULL WHERE id = ?", [
    itemId,
  ])
})

// Schedule (placeholder - to be implemented in Epic 5)
ipcMain.handle('schedule:getAll', async () => {
  const db = getDatabase()
  return db.all('SELECT * FROM schedules ORDER BY platform')
})

ipcMain.handle('schedule:save', async (_event, schedule) => {
  const db = getDatabase()
  const { id, platform, account_id, days_of_week, times, timezone, enabled } = schedule

  if (id) {
    db.run(
      `UPDATE schedules
       SET days_of_week = ?, times = ?, timezone = ?, enabled = ?
       WHERE id = ?`,
      [JSON.stringify(days_of_week), JSON.stringify(times), timezone, enabled ? 1 : 0, id]
    )
  } else {
    const newId = crypto.randomUUID()
    db.run(
      `INSERT INTO schedules (id, platform, account_id, days_of_week, times, timezone, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        platform,
        account_id,
        JSON.stringify(days_of_week),
        JSON.stringify(times),
        timezone,
        enabled ? 1 : 0,
      ]
    )
  }
})

ipcMain.handle('schedule:toggle', async (_event, platform: string, enabled: boolean) => {
  const db = getDatabase()
  db.run('UPDATE schedules SET enabled = ? WHERE platform = ?', [enabled ? 1 : 0, platform])
})

// Activity log
ipcMain.handle('activity:get', async (_event, limit = 50) => {
  const db = getDatabase()
  return db.all('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?', [limit])
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
