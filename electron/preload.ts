import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // Event listeners
  onSchedulerToggle: (callback: (paused: boolean) => void) => {
    ipcRenderer.on('scheduler:toggle', (_event, paused) => callback(paused))
  },
  onAccountConnected: (callback: (account: unknown) => void) => {
    ipcRenderer.on('accounts:connected', (_event, account) => callback(account))
  },
  onAccountDisconnected: (callback: (accountId: string) => void) => {
    ipcRenderer.on('accounts:disconnected', (_event, accountId) => callback(accountId))
  },

  // Settings (to be implemented)
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('settings:save', settings),

  // Accounts (to be implemented)
  getAccounts: () => ipcRenderer.invoke('accounts:getAll'),
  connectAccount: (platform: string) => ipcRenderer.invoke('accounts:connect', platform),
  disconnectAccount: (accountId: string) => ipcRenderer.invoke('accounts:disconnect', accountId),

  // Drive
  listDriveFolders: (parentId?: string) => ipcRenderer.invoke('drive:listFolders', parentId),
  selectFolder: (folderId: string, folderName: string) =>
    ipcRenderer.invoke('drive:selectFolder', folderId, folderName),
  unselectFolder: (folderId: string) => ipcRenderer.invoke('drive:unselectFolder', folderId),
  getSelectedFolders: () => ipcRenderer.invoke('drive:getSelectedFolders'),
  scanContent: () => ipcRenderer.invoke('drive:scanContent'),
  getContent: (options?: { status?: string; limit?: number }) =>
    ipcRenderer.invoke('drive:getContent', options),
  getThumbnail: (fileId: string) => ipcRenderer.invoke('drive:getThumbnail', fileId),
  onFolderSelected: (callback: (folder: { folderId: string; folderName: string }) => void) => {
    ipcRenderer.on('drive:folderSelected', (_event, folder) => callback(folder))
  },
  onScanComplete: (callback: (result: { discovered: number; skipped: number }) => void) => {
    ipcRenderer.on('drive:scanComplete', (_event, result) => callback(result))
  },

  // Queue
  getQueue: (platform: string) => ipcRenderer.invoke('queue:get', platform),
  skipQueueItem: (itemId: string) => ipcRenderer.invoke('queue:skip', itemId),
  retryQueueItem: (itemId: string) => ipcRenderer.invoke('queue:retry', itemId),
  deleteQueueItem: (itemId: string) => ipcRenderer.invoke('queue:delete', itemId),
  rescheduleQueueItem: (itemId: string, newTime: string) =>
    ipcRenderer.invoke('queue:reschedule', itemId, newTime),
  getQueueStats: () => ipcRenderer.invoke('queue:getStats'),
  clearCompletedQueue: () => ipcRenderer.invoke('queue:clearCompleted'),
  getPostedQueue: () => ipcRenderer.invoke('queue:getPosted'),
  onQueueUpdated: (callback: () => void) => {
    ipcRenderer.on('queue:updated', () => callback())
  },

  // Schedule
  getSchedules: () => ipcRenderer.invoke('schedule:getAll'),
  getScheduleForPlatform: (platform: string) =>
    ipcRenderer.invoke('schedule:getForPlatform', platform),
  saveSchedule: (schedule: unknown) => ipcRenderer.invoke('schedule:save', schedule),
  toggleSchedule: (platform: string, enabled: boolean) =>
    ipcRenderer.invoke('schedule:toggle', platform, enabled),
  deleteSchedule: (scheduleId: string) => ipcRenderer.invoke('schedule:delete', scheduleId),
  generateQueueFromSchedule: (daysAhead?: number) =>
    ipcRenderer.invoke('schedule:generateQueue', daysAhead),
  getNextScheduledTime: (platform: string) =>
    ipcRenderer.invoke('schedule:getNextTime', platform),
  onScheduleUpdated: (callback: () => void) => {
    ipcRenderer.on('schedule:updated', () => callback())
  },

  // Activity
  getActivityLog: (limit?: number) => ipcRenderer.invoke('activity:get', limit),

  // Posting
  pausePosting: () => ipcRenderer.invoke('posting:pause'),
  resumePosting: () => ipcRenderer.invoke('posting:resume'),
  getPostingStatus: () => ipcRenderer.invoke('posting:getStatus'),
  postNow: (queueId: string) => ipcRenderer.invoke('posting:postNow', queueId),
  onPostingProgress: (
    callback: (progress: {
      platform: string
      status: string
      filename: string
      error?: string
    }) => void
  ) => {
    ipcRenderer.on('posting:progress', (_event, progress) => callback(progress))
  },
  onPostingPaused: (callback: (paused: boolean) => void) => {
    ipcRenderer.on('posting:paused', (_event, paused) => callback(paused))
  },
})

// Type definitions for renderer process
export interface ElectronAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  onSchedulerToggle: (callback: (paused: boolean) => void) => void
  getSettings: () => Promise<unknown>
  saveSettings: (settings: unknown) => Promise<void>
  getAccounts: () => Promise<unknown[]>
  connectAccount: (platform: string) => Promise<unknown>
  disconnectAccount: (accountId: string) => Promise<void>
  listDriveFolders: (parentId?: string) => Promise<unknown[]>
  selectFolder: (folderId: string) => Promise<void>
  getSelectedFolders: () => Promise<unknown[]>
  scanContent: () => Promise<void>
  getQueue: (platform: string) => Promise<unknown[]>
  skipQueueItem: (itemId: string) => Promise<void>
  retryQueueItem: (itemId: string) => Promise<void>
  getSchedules: () => Promise<unknown[]>
  saveSchedule: (schedule: unknown) => Promise<void>
  toggleSchedule: (platform: string, enabled: boolean) => Promise<void>
  getActivityLog: (limit?: number) => Promise<unknown[]>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
