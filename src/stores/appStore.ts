import { create } from 'zustand'

export type View = 'dashboard' | 'queue' | 'schedule' | 'settings'

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

export interface AppState {
  // Navigation
  currentView: View
  setCurrentView: (view: View) => void

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

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

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

  // Loading
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
