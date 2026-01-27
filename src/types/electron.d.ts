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
  listDriveFolders: (parentId?: string) => Promise<unknown[] | { error: string }>
  selectFolder: (folderId: string, folderName: string) => Promise<{ success?: boolean; error?: string }>
  unselectFolder: (folderId: string) => Promise<{ success?: boolean; error?: string }>
  getSelectedFolders: () => Promise<unknown[]>
  scanContent: () => Promise<{ discovered?: number; skipped?: number; error?: string }>
  getContent: (options?: { status?: string; limit?: number }) => Promise<unknown[]>
  getThumbnail: (fileId: string) => Promise<string | null>
  onFolderSelected: (callback: (folder: { folderId: string; folderName: string }) => void) => void
  onScanComplete: (callback: (result: { discovered: number; skipped: number }) => void) => void
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
