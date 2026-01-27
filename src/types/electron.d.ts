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
  deleteQueueItem: (itemId: string) => Promise<void>
  rescheduleQueueItem: (itemId: string, newTime: string) => Promise<void>
  getQueueStats: () => Promise<{
    total: number
    pending: number
    processing: number
    posted: number
    failed: number
    skipped: number
  }>
  clearCompletedQueue: () => Promise<number>
  onQueueUpdated: (callback: () => void) => void
  getSchedules: () => Promise<unknown[]>
  getScheduleForPlatform: (platform: string) => Promise<unknown | null>
  saveSchedule: (schedule: unknown) => Promise<{ success?: boolean; error?: string; scheduleId?: string }>
  toggleSchedule: (platform: string, enabled: boolean) => Promise<void>
  deleteSchedule: (scheduleId: string) => Promise<void>
  generateQueueFromSchedule: (daysAhead?: number) => Promise<{ instagram: number; youtube: number }>
  getNextScheduledTime: (platform: string) => Promise<Date | null>
  onScheduleUpdated: (callback: () => void) => void
  getActivityLog: (limit?: number) => Promise<unknown[]>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI | undefined
  }
}

export {}
