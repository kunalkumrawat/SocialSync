import { create } from 'zustand'

export type View = 'dashboard' | 'channels' | 'settings'

export interface Account {
  id: string
  platform: 'google' | 'instagram' | 'youtube'
  account_name: string
  account_id: string
  connected_at: string
}

export interface QueueItem {
  id: string
  content_id: string
  platform: string
  scheduled_for: string
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'skipped'
  filename?: string
}

export interface DriveFolder {
  id: string
  folderId: string
  folderName: string
}

export interface ContentItem {
  id: string
  drive_file_id: string
  folder_id: string
  filename: string
  mime_type: string
  size_bytes: number
  duration_seconds?: number
  created_at: string
  discovered_at: string
  status: 'pending' | 'queued' | 'posted' | 'failed' | 'skipped'

  // Smart Posting / Logo Detection
  logo_detected?: number | null // 0=no logo, 1=has logo, null=not checked
  logo_confidence?: number | null
  logo_checked_at?: string | null

  // Approval Workflow
  approval_status?: 'pending_review' | 'approved' | 'rejected'
  approved_by?: string | null
  approved_at?: string | null
  rejection_reason?: string | null

  // Metadata
  title?: string | null
  description?: string | null
  tags?: string | null
  category?: string | null
  metadata_approved?: number // 0 or 1
}

export interface AppState {
  // Navigation
  currentView: View
  setCurrentView: (view: View) => void
  selectedChannelId: string | null
  setSelectedChannelId: (channelId: string | null) => void

  // App info
  appVersion: string
  setAppVersion: (version: string) => void

  // Scheduler
  schedulerPaused: boolean
  setSchedulerPaused: (paused: boolean) => void

  // Accounts
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void

  // Queue
  instagramQueue: QueueItem[]
  youtubeQueue: QueueItem[]
  setInstagramQueue: (items: QueueItem[]) => void
  setYoutubeQueue: (items: QueueItem[]) => void

  // Stats
  stats: {
    pendingPosts: number
    postedToday: number
    failed: number
  }
  setStats: (stats: AppState['stats']) => void

  // Drive/Content
  selectedFolders: DriveFolder[]
  setSelectedFolders: (folders: DriveFolder[]) => void
  contentItems: ContentItem[]
  setContentItems: (items: ContentItem[]) => void
  isScanning: boolean
  setIsScanning: (scanning: boolean) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  selectedChannelId: null,
  setSelectedChannelId: (selectedChannelId) => set({ selectedChannelId }),

  // App info
  appVersion: '0.0.0',
  setAppVersion: (appVersion) => set({ appVersion }),

  // Scheduler
  schedulerPaused: false,
  setSchedulerPaused: (schedulerPaused) => set({ schedulerPaused }),

  // Accounts
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),

  // Queue
  instagramQueue: [],
  youtubeQueue: [],
  setInstagramQueue: (instagramQueue) => set({ instagramQueue }),
  setYoutubeQueue: (youtubeQueue) => set({ youtubeQueue }),

  // Stats
  stats: {
    pendingPosts: 0,
    postedToday: 0,
    failed: 0,
  },
  setStats: (stats) => set({ stats }),

  // Drive/Content
  selectedFolders: [],
  setSelectedFolders: (selectedFolders) => set({ selectedFolders }),
  contentItems: [],
  setContentItems: (contentItems) => set({ contentItems }),
  isScanning: false,
  setIsScanning: (isScanning) => set({ isScanning }),

  // Loading
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
