export interface ElectronAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  openExternal: (url: string) => Promise<void>
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
  getPostedQueue: () => Promise<unknown[]>
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
  pausePosting: () => Promise<void>
  resumePosting: () => Promise<void>
  getPostingStatus: () => Promise<{
    isProcessing: boolean
    isPaused: boolean
    dueCount: number
  }>
  postNow: (queueId: string) => Promise<{ success: boolean; error?: string }>
  onPostingProgress: (
    callback: (progress: {
      platform: string
      status: string
      filename: string
      error?: string
    }) => void
  ) => void
  onPostingPaused: (callback: (paused: boolean) => void) => void
  getSmartPostingSettings: () => Promise<{
    enabled: boolean
    logoReferencePath: string | null
    sensitivity: number
    noLogoAction: 'skip' | 'hold' | 'notify'
  }>
  updateSmartPostingSettings: (settings: {
    enabled?: boolean
    logoReferencePath?: string | null
    sensitivity?: number
    noLogoAction?: 'skip' | 'hold' | 'notify'
  }) => Promise<{ success: boolean }>
  uploadSmartPostingLogo: () => Promise<{ success: boolean; path?: string; error?: string }>
  scanVideoForLogo: (contentId: string, videoPath: string) => Promise<{
    success: boolean
    result?: { detected: boolean; confidence: number; checkedAt: string }
    error?: string
  }>
  // YouTube Channels
  getYouTubeChannels: () => Promise<unknown[]>
  syncYouTubeChannels: () => Promise<{ success: boolean; channelsFound?: number; channelsAdded?: number; error?: string }>
  addYouTubeChannel: (channelData: {
    channelId: string
    channelHandle: string
    channelName?: string
    channelUrl?: string
    dailyQuota?: number
  }) => Promise<{ success: boolean; id?: string; error?: string }>
  toggleYouTubeChannel: (channelId: string, enabled: boolean) => Promise<void>
  removeYouTubeChannel: (channelId: string) => Promise<void>
  getYouTubeChannelStats: () => Promise<{
    totalChannels: number
    enabledChannels: number
    totalQuota: number
    usedQuota: number
    availableQuota: number
  }>
  onYouTubeChannelsUpdated: (callback: () => void) => void
  getContentForChannel: (channelId: string) => Promise<unknown[]>
  getQueueForChannel: (channelId: string) => Promise<unknown[]>
  getPostedForChannel: (channelId: string) => Promise<unknown[]>
  linkFolderToChannel: (channelId: string, folderId: string) => Promise<{ success: boolean; error?: string }>
  updateChannelSettings: (channelId: string, settings: {
    posting_interval_minutes?: number
    daily_quota?: number
    auto_post_enabled?: boolean
  }) => Promise<{ success: boolean; error?: string }>
  linkAccountToChannel: (channelId: string, accountId: string) => Promise<{ success: boolean; error?: string }>
  // Content management
  getFolders: () => Promise<unknown[]>
  approveContent: (contentId: string) => Promise<{ success: boolean; error?: string }>
  rejectContent: (contentId: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  bulkApproveContent: (contentIds: string[]) => Promise<{ success: boolean; error?: string }>
  bulkRejectContent: (contentIds: string[], reason?: string) => Promise<{ success: boolean; error?: string }>
  markContentLogoStatus: (contentId: string, hasLogo: boolean) => Promise<void>
  bulkMarkLogoStatus: (contentIds: string[], hasLogo: boolean) => Promise<void>
  postImmediately: (queueId: string) => Promise<{ success: boolean; error?: string }>
  // Bulk Scheduling
  bulkScheduleVideos: (daysAhead?: number) => Promise<{
    success: boolean
    totalScheduled: number
    scheduledUntil: string | null
    error?: string
    details: { channelName: string; videosScheduled: number }[]
  }>
  getScheduleStatus: () => Promise<{
    scheduledUntil: string | null
    totalScheduled: number
    byChannel: { channelName: string; count: number }[]
  }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI | undefined
  }
}

export {}
