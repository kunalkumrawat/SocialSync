export interface ElectronAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  onSchedulerToggle: (callback: (paused: boolean) => void) => void
  onAccountConnected: (callback: (account: unknown) => void) => void
  onAccountDisconnected: (callback: (accountId: string) => void) => void
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
    electronAPI: ElectronAPI | undefined
  }
}

export {}
