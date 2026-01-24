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

  // Settings (to be implemented)
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('settings:save', settings),

  // Accounts (to be implemented)
  getAccounts: () => ipcRenderer.invoke('accounts:getAll'),
  connectAccount: (platform: string) => ipcRenderer.invoke('accounts:connect', platform),
  disconnectAccount: (accountId: string) => ipcRenderer.invoke('accounts:disconnect', accountId),

  // Drive (to be implemented)
  listDriveFolders: (parentId?: string) => ipcRenderer.invoke('drive:listFolders', parentId),
  selectFolder: (folderId: string) => ipcRenderer.invoke('drive:selectFolder', folderId),
  getSelectedFolders: () => ipcRenderer.invoke('drive:getSelectedFolders'),
  scanContent: () => ipcRenderer.invoke('drive:scanContent'),

  // Queue (to be implemented)
  getQueue: (platform: string) => ipcRenderer.invoke('queue:get', platform),
  skipQueueItem: (itemId: string) => ipcRenderer.invoke('queue:skip', itemId),
  retryQueueItem: (itemId: string) => ipcRenderer.invoke('queue:retry', itemId),

  // Schedule (to be implemented)
  getSchedules: () => ipcRenderer.invoke('schedule:getAll'),
  saveSchedule: (schedule: unknown) => ipcRenderer.invoke('schedule:save', schedule),
  toggleSchedule: (platform: string, enabled: boolean) =>
    ipcRenderer.invoke('schedule:toggle', platform, enabled),

  // Activity (to be implemented)
  getActivityLog: (limit?: number) => ipcRenderer.invoke('activity:get', limit),
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
