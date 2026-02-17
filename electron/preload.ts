import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),

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
  updateContentMetadata: (
    contentId: string,
    metadata: {
      title?: string
      description?: string
      tags?: string
      category?: string
      metadata_approved?: boolean
    }
  ) => ipcRenderer.invoke('drive:updateMetadata', contentId, metadata),
  approveContent: (contentId: string) => ipcRenderer.invoke('drive:approveContent', contentId),
  rejectContent: (contentId: string, reason?: string) =>
    ipcRenderer.invoke('drive:rejectContent', contentId, reason),
  bulkApproveContent: (contentIds: string[]) =>
    ipcRenderer.invoke('drive:bulkApproveContent', contentIds),
  bulkRejectContent: (contentIds: string[], reason?: string) =>
    ipcRenderer.invoke('drive:bulkRejectContent', contentIds, reason),
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

  // YouTube Channels (Multi-Channel)
  getYouTubeChannels: () => ipcRenderer.invoke('youtube:channels:getAll'),
  syncYouTubeChannels: () => ipcRenderer.invoke('youtube:channels:sync'),
  addYouTubeChannel: (channelData: {
    channelId: string
    channelHandle: string
    channelName?: string
    channelUrl?: string
    dailyQuota?: number
  }) => ipcRenderer.invoke('youtube:channels:add', channelData),
  toggleYouTubeChannel: (channelId: string, enabled: boolean) =>
    ipcRenderer.invoke('youtube:channels:toggle', channelId, enabled),
  removeYouTubeChannel: (channelId: string) =>
    ipcRenderer.invoke('youtube:channels:remove', channelId),
  getYouTubeChannelStats: () => ipcRenderer.invoke('youtube:channels:getStats'),
  onYouTubeChannelsUpdated: (callback: () => void) => {
    ipcRenderer.on('youtube:channels:updated', () => callback())
  },
  getContentForChannel: (channelId: string) =>
    ipcRenderer.invoke('youtube:channels:getContentForChannel', channelId),
  getQueueForChannel: (channelId: string) =>
    ipcRenderer.invoke('youtube:channels:getQueueForChannel', channelId),
  getPostedForChannel: (channelId: string) =>
    ipcRenderer.invoke('youtube:channels:getPostedForChannel', channelId),
  linkFolderToChannel: (channelId: string, folderId: string) =>
    ipcRenderer.invoke('youtube:channels:linkFolder', channelId, folderId),
  updateChannelSettings: (
    channelId: string,
    settings: {
      posting_interval_minutes?: number
      daily_quota?: number
      auto_post_enabled?: boolean
    }
  ) => ipcRenderer.invoke('youtube:channels:updateSettings', channelId, settings),
  linkAccountToChannel: (channelId: string, accountId: string) =>
    ipcRenderer.invoke('youtube:channels:linkAccount', channelId, accountId),
  getFolders: () => ipcRenderer.invoke('drive:getFolders'),
  postImmediately: (queueId: string) => ipcRenderer.invoke('posting:postNow', queueId),

  // Bulk Scheduling
  bulkScheduleVideos: (daysAhead?: number) => ipcRenderer.invoke('scheduling:bulkSchedule', daysAhead),
  getScheduleStatus: () => ipcRenderer.invoke('scheduling:getStatus'),

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

  // Safety settings
  getDryRunMode: () => ipcRenderer.invoke('safety:getDryRunMode'),
  setDryRunMode: (enabled: boolean) => ipcRenderer.invoke('safety:setDryRunMode', enabled),
  getRateLimit: () => ipcRenderer.invoke('safety:getRateLimit'),
  setRateLimit: (limit: number) => ipcRenderer.invoke('safety:setRateLimit', limit),

  // Smart Posting / Logo Detection
  getSmartPostingSettings: () => ipcRenderer.invoke('smartPosting:getSettings'),
  updateSmartPostingSettings: (settings: unknown) =>
    ipcRenderer.invoke('smartPosting:updateSettings', settings),
  uploadSmartPostingLogo: () => ipcRenderer.invoke('smartPosting:uploadLogo'),
  scanVideoForLogo: (contentId: string, videoPath: string) =>
    ipcRenderer.invoke('smartPosting:scanVideo', contentId, videoPath),
  markContentLogoStatus: (contentId: string, hasLogo: boolean) =>
    ipcRenderer.invoke('smartPosting:markLogoStatus', contentId, hasLogo),
  bulkMarkLogoStatus: (contentIds: string[], hasLogo: boolean) =>
    ipcRenderer.invoke('smartPosting:bulkMarkLogoStatus', contentIds, hasLogo),
  getContentLogoStatus: (contentId: string) =>
    ipcRenderer.invoke('smartPosting:getContentLogoStatus', contentId),
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
  selectFolder: (folderId: string, folderName: string) => Promise<void>
  unselectFolder: (folderId: string) => Promise<void>
  getSelectedFolders: () => Promise<unknown[]>
  scanContent: () => Promise<void>
  getContent: (options?: { status?: string; limit?: number }) => Promise<unknown[]>
  getThumbnail: (fileId: string) => Promise<string | null>
  updateContentMetadata: (
    contentId: string,
    metadata: {
      title?: string
      description?: string
      tags?: string
      category?: string
      metadata_approved?: boolean
    }
  ) => Promise<{ success: boolean; error?: string }>
  approveContent: (contentId: string) => Promise<{ success: boolean; error?: string }>
  rejectContent: (contentId: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  bulkApproveContent: (contentIds: string[]) => Promise<{ success: boolean; error?: string }>
  bulkRejectContent: (contentIds: string[], reason?: string) => Promise<{ success: boolean; error?: string }>
  getQueue: (platform: string) => Promise<unknown[]>
  skipQueueItem: (itemId: string) => Promise<void>
  retryQueueItem: (itemId: string) => Promise<void>
  getSchedules: () => Promise<unknown[]>
  saveSchedule: (schedule: unknown) => Promise<void>
  toggleSchedule: (platform: string, enabled: boolean) => Promise<void>
  getActivityLog: (limit?: number) => Promise<unknown[]>
  getDryRunMode: () => Promise<boolean>
  setDryRunMode: (enabled: boolean) => Promise<{ success: boolean }>
  getRateLimit: () => Promise<number>
  setRateLimit: (limit: number) => Promise<{ success: boolean }>
  getSmartPostingSettings?: () => Promise<unknown>
  updateSmartPostingSettings?: (settings: unknown) => Promise<unknown>
  uploadSmartPostingLogo?: () => Promise<unknown>
  scanVideoForLogo?: (contentId: string, videoPath: string) => Promise<unknown>
  markContentLogoStatus?: (contentId: string, hasLogo: boolean) => Promise<unknown>
  bulkMarkLogoStatus?: (contentIds: string[], hasLogo: boolean) => Promise<unknown>
  getContentLogoStatus?: (contentId: string) => Promise<unknown>
  getYouTubeChannels?: () => Promise<unknown[]>
  syncYouTubeChannels?: () => Promise<{
    success: boolean
    channelsFound?: number
    channelsAdded?: number
    error?: string
  }>
  addYouTubeChannel?: (channelData: {
    channelId: string
    channelHandle: string
    channelName?: string
    channelUrl?: string
    dailyQuota?: number
  }) => Promise<{ success: boolean; id?: string; error?: string }>
  toggleYouTubeChannel?: (channelId: string, enabled: boolean) => Promise<void>
  removeYouTubeChannel?: (channelId: string) => Promise<void>
  getYouTubeChannelStats?: () => Promise<{
    totalChannels: number
    enabledChannels: number
    totalQuota: number
    usedQuota: number
    availableQuota: number
  }>
  onYouTubeChannelsUpdated?: (callback: () => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
