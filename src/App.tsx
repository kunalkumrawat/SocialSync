import { useEffect, useState } from 'react'
import { useAppStore, View } from './stores/appStore'
import { ToastContainer, useToast } from './components/Toast'
import { iconMap } from './lib/iconMap'
import type { LucideIcon } from 'lucide-react'

interface QueueItem {
  id: string
  content_id: string
  platform: 'instagram' | 'youtube'
  filename?: string
  mime_type?: string
  scheduled_for: string
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'skipped'
  attempts: number
  last_error: string | null
}

function App() {
  const {
    currentView,
    setCurrentView,
    appVersion,
    setAppVersion,
    schedulerPaused,
    setSchedulerPaused,
    accounts,
    setAccounts,
    stats,
  } = useAppStore()

  const toast = useToast()

  useEffect(() => {
    // Get app version from Electron
    window.electronAPI?.getVersion().then(setAppVersion).catch(console.error)

    // Load accounts
    const loadAccounts = () => {
      window.electronAPI?.getAccounts().then((accts) => {
        setAccounts(accts as typeof accounts)
      }).catch(console.error)
    }
    loadAccounts()

    // Listen for scheduler toggle from tray
    window.electronAPI?.onSchedulerToggle((paused) => {
      setSchedulerPaused(paused)
    })

    // Listen for account changes
    window.electronAPI?.onAccountConnected(() => {
      loadAccounts()
      toast.success('Account connected successfully!')
    })

    window.electronAPI?.onAccountDisconnected(() => {
      loadAccounts()
      toast.info('Account disconnected')
    })

    // Listen for posting progress
    window.electronAPI?.onPostingProgress((progress) => {
      if (progress.status === 'posted') {
        toast.success(`Posted ${progress.filename} to ${progress.platform}`)
        showDesktopNotification('Post Successful', `Published to ${progress.platform}`)
      } else if (progress.status === 'failed') {
        toast.error(`Failed to post ${progress.filename}: ${progress.error}`)
        showDesktopNotification('Post Failed', progress.error || 'Unknown error')
      } else if (progress.status === 'processing') {
        toast.info(`Posting ${progress.filename} to ${progress.platform}...`)
      }
    })

    // Listen for scan completion
    window.electronAPI?.onScanComplete((result) => {
      if (result.discovered > 0) {
        toast.success(`Content scan complete: ${result.discovered} new videos found`)
        showDesktopNotification('Content Scan Complete', `${result.discovered} new videos discovered`)
      }
    })

    // Listen for folder selection
    window.electronAPI?.onFolderSelected((folder) => {
      toast.success(`Folder "${folder.folderName}" added to content sources`)
    })
  }, [setAppVersion, setAccounts, setSchedulerPaused])

  const showDesktopNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' })
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const navItems: { id: View; label: string; icon: LucideIcon }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: iconMap.dashboard },
    { id: 'content', label: 'Content', icon: iconMap.content },
    { id: 'queue', label: 'Queue', icon: iconMap.queue },
    { id: 'posted', label: 'Posted', icon: iconMap.posted },
    { id: 'schedule', label: 'Schedule', icon: iconMap.schedule },
    { id: 'settings', label: 'Settings', icon: iconMap.settings },
  ]

  const isConnected = (platform: string) =>
    accounts.some((a) => a.platform === platform)

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0a] via-netflix-black to-netflix-black text-white">
      {/* Sidebar with 3D depth */}
      <aside className="w-64 bg-gradient-to-b from-[#2F2F2F] to-[#1a1a1a] flex flex-col border-r border-netflix-red/30 shadow-2xl shadow-netflix-red/30">
        {/* Logo - Enhanced with glow */}
        <div className="p-5 border-b border-netflix-red/30 drag-region bg-gradient-to-br from-black/20 to-transparent backdrop-blur-sm">
          <div className="flex flex-col gap-2.5 no-drag">
            {/* SocialSync Brand */}
            <div className="relative">
              <h1 className="text-xl font-black text-white tracking-tight font-poppins">
                SocialSync
              </h1>

              {/* by STAGE */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-gray-400 font-medium">by</span>
                <img src="/stage-logo-horizontal.png" alt="STAGE" className="h-4 w-auto opacity-90" />
              </div>

              {/* Tagline */}
              <p className="text-xs text-gray-400 font-medium mt-2 tracking-wide">
                Your Social Media Executive
              </p>

              {/* Elegant underline */}
              <div className="h-[1px] bg-gradient-to-r from-transparent via-[#7a0600]/50 to-transparent mt-2"></div>
            </div>
          </div>
        </div>

        {/* Navigation - Enhanced 3D effect */}
        <nav className="flex-1 p-4 space-y-1">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-[#7a0600] to-[#a01010] text-white shadow-[0_8px_16px] shadow-[#7a0600]/40 scale-105 border border-[#7a0600]/50'
                      : 'text-netflix-lightGray hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:text-white hover:shadow-lg shadow-[#7a0600]/20 hover:scale-[1.02] border border-transparent'
                  }`}
                >
                  <item.icon
                    size={22}
                    strokeWidth={1.75}
                    className={`transition-transform duration-300 ${
                      currentView === item.id ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                  <span className="font-semibold">{item.label}</span>
                  {currentView === item.id && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#7a0600] shadow-lg shadow-white/50 animate-pulse"></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

      </aside>

      {/* Main Content - Enhanced depth */}
      <main className="flex-1 flex flex-col">
        {/* Header - 3D elevated look */}
        <header className="h-16 bg-gradient-to-br from-[#2F2F2F] to-[#1a1a1a] border-b-2 border-[#7a0600]/40 flex items-center px-6 drag-region shadow-lg shadow-black/50">
          <div className="flex items-center gap-3 no-drag">
            <div className="w-1 h-8 bg-gradient-to-r from-[#7a0600] to-[#c60c0c] rounded-full shadow-lg shadow-[#7a0600]/30"></div>
            <h2 className="text-2xl font-black capitalize text-transparent bg-clip-text bg-gradient-to-r from-[#c60c0c] to-white drop-shadow-lg">{currentView}</h2>
          </div>
        </header>

        {/* Content Area - Enhanced with pattern */}
        <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-stage-black via-stage-gray-900 to-stage-maroon/5 relative">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, #e10d37 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
          <div className="relative z-10">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'content' && <ContentView isConnected={isConnected} toast={toast} />}
          {currentView === 'queue' && <QueueView toast={toast} />}
          {currentView === 'posted' && <PostedView toast={toast} />}
          {currentView === 'schedule' && <ScheduleView toast={toast} />}
          {currentView === 'settings' && (
            <SettingsView accounts={accounts} isConnected={isConnected} toast={toast} />
          )}
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}

// ============================================
// View Components
// ============================================

function DashboardView() {
  const { accounts } = useAppStore()
  const [queueStats, setQueueStats] = useState({ pending: 0, posted: 0, failed: 0 })
  const [contentCount, setContentCount] = useState(0)
  const [instagramQueue, setInstagramQueue] = useState<QueueItem[]>([])
  const [youtubeQueue, setYoutubeQueue] = useState<QueueItem[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [postingStatus, setPostingStatus] = useState({ isPaused: false, dueCount: 0 })

  const loadDashboard = async () => {
    // Load queue stats
    const stats = await window.electronAPI?.getQueueStats()
    if (stats) {
      setQueueStats(stats)
    }

    // Load content count
    const content = await window.electronAPI?.getContent({ limit: 1000 })
    if (content && Array.isArray(content)) {
      setContentCount(content.length)
    }

    // Load upcoming posts for each platform
    const igQueue = await window.electronAPI?.getQueue('instagram')
    const ytQueue = await window.electronAPI?.getQueue('youtube')
    if (igQueue && Array.isArray(igQueue)) setInstagramQueue(igQueue.slice(0, 3) as QueueItem[])
    if (ytQueue && Array.isArray(ytQueue)) setYoutubeQueue(ytQueue.slice(0, 3) as QueueItem[])

    // Load recent activity
    const activity = await window.electronAPI?.getActivityLog(10)
    if (activity && Array.isArray(activity)) {
      setRecentActivity(activity as Activity[])
    }

    // Load posting status
    const status = await window.electronAPI?.getPostingStatus()
    if (status) {
      setPostingStatus(status)
    }
  }

  useEffect(() => {
    loadDashboard()

    // Refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const isConnected = (platform: string) => accounts.some((a) => a.platform === platform)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Content Library"
          value={contentCount.toString()}
          icon={iconMap.content}
        />
        <StatCard
          title="Pending Posts"
          value={queueStats.pending.toString()}
          icon={iconMap.pending}
          color={postingStatus.dueCount > 0 ? 'yellow' : undefined}
        />
        <StatCard
          title="Posted"
          value={queueStats.posted.toString()}
          icon={iconMap.success}
          color="green"
        />
        <StatCard
          title="Failed"
          value={queueStats.failed.toString()}
          icon={iconMap.failed}
          color={queueStats.failed > 0 ? 'red' : undefined}
        />
      </div>

      {/* Posting Status */}
      {postingStatus.isPaused && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <iconMap.warning size={20} strokeWidth={2} />
            <p>Automated posting is paused. Posts will not be published automatically.</p>
          </div>
        </div>
      )}

      {/* Upcoming Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformDashboard
          platform="instagram"
          icon={iconMap.instagram}
          label="Instagram"
          isConnected={isConnected('instagram')}
          upcomingPosts={instagramQueue}
        />
        <PlatformDashboard
          platform="youtube"
          icon={iconMap.youtube}
          label="YouTube"
          isConnected={isConnected('youtube')}
          upcomingPosts={youtubeQueue}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-400">No recent activity.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface Activity {
  id: string
  event_type: string
  message: string
  platform?: string
  created_at: string
}

function ActivityItem({ activity }: { activity: Activity }) {
  const getIcon = (eventType: string): LucideIcon => {
    if (eventType.includes('success')) return iconMap.success
    if (eventType.includes('failed')) return iconMap.failed
    if (eventType.includes('scan')) return iconMap.search
    return iconMap.activity
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const IconComponent = getIcon(activity.event_type)

  return (
    <div className="flex items-start gap-3 p-3 bg-stage-gray-600 rounded-lg">
      <IconComponent size={20} strokeWidth={1.75} className="text-stage-ribbon mt-0.5" />
      <div className="flex-1">
        <p className="text-sm">{activity.message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(activity.created_at)}</p>
      </div>
    </div>
  )
}

function PlatformDashboard({
  platform,
  icon: IconComponent,
  label,
  isConnected,
  upcomingPosts,
}: {
  platform: string
  icon: LucideIcon
  label: string
  isConnected: boolean
  upcomingPosts: QueueItem[]
}) {
  const iconColor = platform === 'instagram' ? 'text-platform-instagram' : 'text-platform-youtube'

  return (
    <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <IconComponent size={24} strokeWidth={1.75} className={iconColor} />
        {label}
      </h3>
      {!isConnected ? (
        <p className="text-gray-400">Connect {label} to see upcoming posts.</p>
      ) : upcomingPosts.length === 0 ? (
        <p className="text-gray-400">No upcoming posts scheduled.</p>
      ) : (
        <div className="space-y-2">
          {upcomingPosts.map((post) => (
            <div key={post.id} className="p-2 bg-stage-gray-600 rounded text-sm">
              <p className="font-medium truncate">{post.filename}</p>
              <p className="text-xs text-gray-400">
                {new Date(post.scheduled_for).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: IconComponent,
  color,
}: {
  title: string
  value: string
  icon: LucideIcon
  color?: 'red' | 'green' | 'yellow'
}) {
  const colorClasses = {
    red: 'text-stage-ribbon',
    green: 'text-semantic-success-500',
    yellow: 'text-semantic-warning-500',
  }

  const glowClasses = {
    red: 'shadow-stage-ribbon/30',
    green: 'shadow-semantic-success-500/30',
    yellow: 'shadow-semantic-warning-500/30',
  }

  return (
    <div className={`group relative bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 border-2 border-stage-red/30 rounded-2xl p-6 hover:border-stage-ribbon hover:shadow-2xl ${color ? glowClasses[color] : 'hover:shadow-stage-maroon/30'} transition-all duration-300 hover:scale-105 hover:-translate-y-1`}>
      <div className="absolute inset-0 bg-gradient-to-br from-stage-ribbon/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-sm font-bold uppercase tracking-wide">{title}</p>
          <p className={`text-4xl font-black mt-2 ${color ? colorClasses[color] : 'text-white'} drop-shadow-lg`}>
            {value}
          </p>
        </div>
        <IconComponent
          size={48}
          strokeWidth={1.5}
          className="text-stage-ribbon/80 drop-shadow-[0_0_10px_rgba(225,13,55,0.3)] group-hover:scale-110 transition-transform"
        />
      </div>
    </div>
  )
}

function QueueView({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'youtube'>('instagram')
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadQueue = async (platform: 'instagram' | 'youtube') => {
    setLoading(true)
    const items = await window.electronAPI?.getQueue(platform)
    if (items && Array.isArray(items)) {
      setQueueItems(items as QueueItem[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadQueue(selectedPlatform)

    // Listen for queue updates
    window.electronAPI?.onQueueUpdated(() => {
      loadQueue(selectedPlatform)
    })
  }, [selectedPlatform])

  const handlePlatformSwitch = (platform: 'instagram' | 'youtube') => {
    setSelectedPlatform(platform)
    loadQueue(platform)
  }

  const handleRefresh = () => {
    loadQueue(selectedPlatform)
  }

  const handleSkip = async (itemId: string) => {
    try {
      await window.electronAPI?.skipQueueItem(itemId)
      toast.info('Post skipped')
    } catch (error) {
      toast.error('Failed to skip post')
    }
  }

  const handleRetry = async (itemId: string) => {
    try {
      await window.electronAPI?.retryQueueItem(itemId)
      toast.success('Post will be retried')
    } catch (error) {
      toast.error('Failed to retry post')
    }
  }

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to remove this item from the queue?')) {
      try {
        await window.electronAPI?.deleteQueueItem(itemId)
        toast.success('Post removed from queue')
      } catch (error) {
        toast.error('Failed to remove post')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 border-b-2 border-[#7a0600]/30 pb-4">
        <button
          onClick={() => handlePlatformSwitch('instagram')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            selectedPlatform === 'instagram'
              ? 'bg-gradient-to-r from-[#7a0600] to-[#c60c0c] text-white shadow-lg shadow-[#7a0600]/40 scale-105 border-2 border-[#7a0600]/50'
              : 'bg-stage-gray-600 text-gray-300 hover:bg-stage-gray-500 hover:text-white hover:shadow-lg hover:scale-[1.02] border-2 border-transparent'
          }`}
        >
          <iconMap.instagram size={20} strokeWidth={1.75} className="inline mr-2" />
          Instagram ({queueItems.filter(() => selectedPlatform === 'instagram').length})
        </button>
        <button
          onClick={() => handlePlatformSwitch('youtube')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            selectedPlatform === 'youtube'
              ? 'bg-gradient-to-r from-[#7a0600] to-[#c60c0c] text-white shadow-lg shadow-[#7a0600]/40 scale-105 border-2 border-[#7a0600]/50'
              : 'bg-stage-gray-600 text-gray-300 hover:bg-stage-gray-500 hover:text-white hover:shadow-lg hover:scale-[1.02] border-2 border-transparent'
          }`}
        >
          <iconMap.youtube size={20} strokeWidth={1.75} className="inline mr-2" />
          YouTube ({queueItems.filter(() => selectedPlatform === 'youtube').length})
        </button>
      </div>

      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {selectedPlatform === 'instagram' ? 'Instagram' : 'YouTube'} Queue
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-stage-gray-600 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading queue...</div>
        ) : queueItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No items in queue.</p>
            <p className="text-gray-500 text-sm">
              Go to Schedule tab to configure automated posting times.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {queueItems.map((item) => (
              <QueueItemRow
                key={item.id}
                item={item}
                platform={selectedPlatform}
                onSkip={handleSkip}
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function QueueItemRow({
  item,
  platform,
  onSkip,
  onRetry,
  onDelete,
}: {
  item: QueueItem
  platform: 'instagram' | 'youtube'
  onSkip: (id: string) => void
  onRetry: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isPast = new Date(item.scheduled_for) < new Date()
  const isUpcoming = new Date(item.scheduled_for) > new Date()

  const PlatformIcon = platform === 'instagram' ? iconMap.instagram : iconMap.youtube
  const platformColor = platform === 'instagram' ? 'text-platform-instagram' : 'text-platform-youtube'

  return (
    <div className="flex items-center justify-between p-3 bg-stage-gray-600 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <PlatformIcon size={24} strokeWidth={1.75} className={platformColor} />
        <div className="flex-1">
          <p className="font-medium">{item.filename || 'Unknown file'}</p>
          <p className="text-sm text-gray-400">
            Scheduled: {new Date(item.scheduled_for).toLocaleString()}
            {isPast && item.status === 'pending' && (
              <span className="ml-2 text-yellow-400">(Overdue)</span>
            )}
            {isUpcoming && <span className="ml-2 text-blue-400">(Upcoming)</span>}
          </p>
          {item.last_error && (
            <p className="text-xs text-red-400 mt-1">Error: {item.last_error}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-1 text-xs rounded ${
            item.status === 'pending'
              ? 'bg-yellow-600'
              : item.status === 'processing'
              ? 'bg-stage-red'
              : item.status === 'posted'
              ? 'bg-green-600'
              : 'bg-red-600'
          }`}
        >
          {item.status}
        </span>
        {item.status === 'pending' && (
          <button
            onClick={() => onSkip(item.id)}
            className="p-1 hover:bg-gray-600 rounded text-sm"
            title="Skip this post"
          >
            ⏭️
          </button>
        )}
        {item.status === 'failed' && (
          <button
            onClick={() => onRetry(item.id)}
            className="p-1 hover:bg-gray-600 rounded text-sm"
            title="Retry posting"
          >
            🔄
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 hover:bg-gray-600 rounded text-sm text-red-400"
          title="Remove from queue"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

function ContentView({ isConnected, toast }: { isConnected: (platform: string) => boolean; toast: ReturnType<typeof useToast> }) {
  const {
    selectedFolders,
    setSelectedFolders,
    contentItems,
    setContentItems,
    isScanning,
    setIsScanning,
  } = useAppStore()

  const [browsing, setBrowsing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Array<{ id: string; name: string }>>([])
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  // Load selected folders and content on mount
  useEffect(() => {
    const loadData = async () => {
      const folders = await window.electronAPI?.getSelectedFolders()
      if (folders && Array.isArray(folders)) {
        setSelectedFolders(folders as typeof selectedFolders)
      }

      const content = await window.electronAPI?.getContent({ limit: 100 })
      if (content && Array.isArray(content)) {
        setContentItems(content as typeof contentItems)
      }
    }
    loadData()

    // Listen for scan completion
    window.electronAPI?.onScanComplete(() => {
      setIsScanning(false)
      // Reload content
      window.electronAPI?.getContent({ limit: 100 }).then((content) => {
        if (content && Array.isArray(content)) {
          setContentItems(content as typeof contentItems)
        }
      })
    })
  }, [setSelectedFolders, setContentItems, setIsScanning])

  // Fetch thumbnails for content items
  useEffect(() => {
    const fetchThumbnails = async () => {
      const newThumbnails: Record<string, string> = {}

      for (const item of contentItems.slice(0, 20)) { // Limit to first 20 to avoid rate limits
        if (!thumbnails[item.drive_file_id]) {
          const thumb = await window.electronAPI?.getThumbnail(item.drive_file_id)
          if (thumb) {
            newThumbnails[item.drive_file_id] = thumb
          }
        }
      }

      if (Object.keys(newThumbnails).length > 0) {
        setThumbnails(prev => ({ ...prev, ...newThumbnails }))
      }
    }

    if (contentItems.length > 0) {
      fetchThumbnails()
    }
  }, [contentItems, thumbnails])

  const handleBrowseFolders = async (parentId?: string) => {
    if (!isConnected('google')) return

    setLoadingFolders(true)
    const result = await window.electronAPI?.listDriveFolders(parentId)

    if (result && !('error' in result)) {
      setFolders(result as Array<{ id: string; name: string }>)
    }
    setLoadingFolders(false)
  }

  const openBrowser = () => {
    setBrowsing(true)
    setCurrentPath([])
    handleBrowseFolders()
  }

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentPath([...currentPath, { id: folderId, name: folderName }])
    handleBrowseFolders(folderId)
  }

  const navigateBack = () => {
    const newPath = [...currentPath]
    newPath.pop()
    setCurrentPath(newPath)
    const parentId = newPath.length > 0 ? newPath[newPath.length - 1].id : undefined
    handleBrowseFolders(parentId)
  }

  const selectFolder = async (folderId: string, folderName: string) => {
    try {
      const result = await window.electronAPI?.selectFolder(folderId, folderName)
      if (result?.error) {
        toast.error(`Failed to select folder: ${result.error}`)
      } else if (result?.success) {
        // Refresh selected folders
        const folders = await window.electronAPI?.getSelectedFolders()
        if (folders && Array.isArray(folders)) {
          setSelectedFolders(folders as typeof selectedFolders)
        }
      }
    } catch (error) {
      toast.error('Failed to select folder')
    }
  }

  const unselectFolder = async (folderId: string) => {
    try {
      await window.electronAPI?.unselectFolder(folderId)
      // Refresh selected folders
      const folders = await window.electronAPI?.getSelectedFolders()
      if (folders && Array.isArray(folders)) {
        setSelectedFolders(folders as typeof selectedFolders)
      }
      toast.info('Folder removed from content sources')
    } catch (error) {
      toast.error('Failed to remove folder')
    }
  }

  const handleScan = async () => {
    try {
      setIsScanning(true)
      await window.electronAPI?.scanContent()
    } catch (error) {
      toast.error('Content scan failed')
      setIsScanning(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isConnected('google')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <iconMap.googleDrive size={64} strokeWidth={1.5} className="text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connect Google Drive</h3>
        <p className="text-gray-400 mb-4">
          Go to Settings and connect your Google Drive to browse and select content folders.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selected Folders */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Selected Folders</h3>
          <div className="flex gap-2">
            <button
              onClick={openBrowser}
              className="px-4 py-2 bg-stage-red rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Browse Folders
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning || selectedFolders.length === 0}
              className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? 'Scanning...' : 'Scan for Content'}
            </button>
          </div>
        </div>

        {selectedFolders.length === 0 ? (
          <p className="text-gray-400">No folders selected. Click "Browse Folders" to add content sources.</p>
        ) : (
          <div className="space-y-2">
            {selectedFolders.map((folder) => (
              <div
                key={folder.folderId}
                className="flex items-center justify-between p-3 bg-stage-gray-600 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📂</span>
                  <span>{folder.folderName}</span>
                </div>
                <button
                  onClick={() => unselectFolder(folder.folderId)}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Folder Browser Modal */}
      {browsing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-stage-gray-700 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Browse Google Drive</h3>
                <button
                  onClick={() => setBrowsing(false)}
                  className="p-1 hover:bg-stage-gray-600 rounded"
                >
                  ✕
                </button>
              </div>
              {currentPath.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <button onClick={() => { setCurrentPath([]); handleBrowseFolders(); }} className="hover:text-white">
                    Root
                  </button>
                  {currentPath.map((p, i) => (
                    <span key={p.id} className="flex items-center gap-2">
                      <span>/</span>
                      <button
                        onClick={() => {
                          const newPath = currentPath.slice(0, i + 1)
                          setCurrentPath(newPath)
                          handleBrowseFolders(p.id)
                        }}
                        className="hover:text-white"
                      >
                        {p.name}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {currentPath.length > 0 && (
                <button
                  onClick={navigateBack}
                  className="flex items-center gap-2 w-full p-3 bg-stage-gray-600 rounded-lg mb-2 hover:bg-gray-600"
                >
                  <span>⬆️</span>
                  <span>Go Back</span>
                </button>
              )}

              {loadingFolders ? (
                <div className="text-center py-8 text-gray-400">Loading folders...</div>
              ) : folders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No folders found</div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => {
                    const isSelected = selectedFolders.some((f) => f.folderId === folder.id)
                    return (
                      <div
                        key={folder.id}
                        className="flex items-center justify-between p-3 bg-stage-gray-600 rounded-lg"
                      >
                        <button
                          onClick={() => navigateToFolder(folder.id, folder.name)}
                          className="flex items-center gap-3 flex-1 text-left hover:text-blue-400"
                        >
                          <iconMap.content size={20} strokeWidth={1.75} className="text-gray-400" />
                          <span>{folder.name}</span>
                        </button>
                        <button
                          onClick={() => selectFolder(folder.id, folder.name)}
                          disabled={isSelected}
                          className={`px-3 py-1 rounded text-sm ${
                            isSelected
                              ? 'bg-green-600 cursor-not-allowed'
                              : 'bg-stage-red hover:bg-blue-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Library */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4">
          Content Library ({contentItems.length} items)
        </h3>

        {contentItems.length === 0 ? (
          <p className="text-gray-400">
            No content discovered yet. Select folders and click "Scan for Content".
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-auto">
            {contentItems.map((item) => (
              <div
                key={item.id}
                className="bg-stage-gray-600 rounded-lg overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="aspect-[9/16] bg-stage-gray-700 relative">
                  {thumbnails[item.drive_file_id] ? (
                    <img
                      src={thumbnails[item.drive_file_id]}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stage-gray-700">
                      <iconMap.youtube size={48} strokeWidth={1.5} className="text-gray-500" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                      item.status === 'pending'
                        ? 'bg-yellow-600'
                        : item.status === 'queued'
                        ? 'bg-stage-red'
                        : item.status === 'posted'
                        ? 'bg-green-600'
                        : 'bg-red-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="font-medium text-sm truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatFileSize(item.size_bytes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduleView({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { accounts } = useAppStore()
  const [instagramSchedule, setInstagramSchedule] = useState<Schedule | null>(null)
  const [youtubeSchedule, setYoutubeSchedule] = useState<Schedule | null>(null)

  const loadSchedules = async () => {
    const igSchedule = await window.electronAPI?.getScheduleForPlatform('instagram')
    const ytSchedule = await window.electronAPI?.getScheduleForPlatform('youtube')
    setInstagramSchedule(igSchedule as Schedule | null)
    setYoutubeSchedule(ytSchedule as Schedule | null)
  }

  useEffect(() => {
    loadSchedules()

    // Listen for schedule updates
    window.electronAPI?.onScheduleUpdated(() => {
      loadSchedules()
    })
  }, [])

  const getAccountForPlatform = (platform: 'instagram' | 'youtube') => {
    return accounts.find((a) => a.platform === platform)
  }

  return (
    <div className="space-y-6">
      <PlatformSchedule
        platform="instagram"
        icon={iconMap.instagram}
        label="Instagram"
        account={getAccountForPlatform('instagram')}
        schedule={instagramSchedule}
        onScheduleChange={loadSchedules}
        toast={toast}
      />
      <PlatformSchedule
        platform="youtube"
        icon={iconMap.youtube}
        label="YouTube"
        account={getAccountForPlatform('youtube')}
        schedule={youtubeSchedule}
        onScheduleChange={loadSchedules}
        toast={toast}
      />
    </div>
  )
}

interface Schedule {
  id?: string
  platform: 'instagram' | 'youtube'
  account_id: string
  days_of_week: number[]
  times: string[]
  timezone: string
  enabled: boolean
}

function PlatformSchedule({
  platform,
  icon: IconComponent,
  label,
  account,
  schedule,
  onScheduleChange,
  toast,
}: {
  platform: 'instagram' | 'youtube'
  icon: LucideIcon
  label: string
  account?: { id: string; account_id: string; account_name: string }
  schedule: Schedule | null
  onScheduleChange: () => void
  toast: ReturnType<typeof useToast>
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>(schedule?.days_of_week || [])
  const [times, setTimes] = useState<string[]>(schedule?.times || [])
  const [enabled, setEnabled] = useState(schedule?.enabled || false)
  const [newTime, setNewTime] = useState('09:00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (schedule) {
      setSelectedDays(schedule.days_of_week)
      setTimes(schedule.times)
      setEnabled(schedule.enabled)
    }
  }, [schedule])

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const addTime = () => {
    if (newTime && !times.includes(newTime)) {
      setTimes([...times, newTime].sort())
      setNewTime('09:00')
    }
  }

  const removeTime = (time: string) => {
    setTimes(times.filter((t) => t !== time))
  }

  const handleSave = async () => {
    if (!account) return

    setSaving(true)
    try {
      const scheduleData: Schedule = {
        id: schedule?.id,
        platform,
        account_id: account.account_id,
        days_of_week: selectedDays,
        times,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled,
      }

      const result = await window.electronAPI?.saveSchedule(scheduleData)
      if (result?.error) {
        toast.error(`Failed to save schedule: ${result.error}`)
      } else {
        toast.success(`${label} schedule saved successfully!`)
        onScheduleChange()
      }
    } catch (error) {
      toast.error('Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    await window.electronAPI?.toggleSchedule(platform, newEnabled)
  }

  const iconColor = platform === 'instagram' ? 'text-platform-instagram' : 'text-platform-youtube'

  if (!account) {
    return (
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <IconComponent size={20} strokeWidth={1.75} className={iconColor} />
          {label} Schedule
        </h3>
        <p className="text-gray-400">
          Connect {label} account in Settings to configure posting schedule.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <IconComponent size={20} strokeWidth={1.75} className={iconColor} />
          {label} Schedule
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-sm">{enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      <div className="space-y-4">
        {/* Day selection */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Post on days:</label>
          <div className="flex gap-2 flex-wrap">
            {dayNames.map((day, index) => (
              <button
                key={day}
                onClick={() => toggleDay(index)}
                className={`px-3 py-2 rounded transition-colors text-sm ${
                  selectedDays.includes(index)
                    ? 'bg-stage-red text-white'
                    : 'bg-stage-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time selection */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Post at times:</label>
          <div className="flex gap-2 items-center mb-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-stage-gray-600 border border-gray-600 rounded px-3 py-2 text-sm"
            />
            <button
              onClick={addTime}
              className="px-3 py-2 bg-stage-red rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Add Time
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {times.map((time) => (
              <span
                key={time}
                className="px-3 py-1.5 bg-stage-gray-600 rounded text-sm flex items-center gap-2"
              >
                {time}
                <button
                  onClick={() => removeTime(time)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || selectedDays.length === 0 || times.length === 0}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
          {selectedDays.length === 0 && (
            <p className="text-sm text-yellow-400 mt-2">Select at least one day</p>
          )}
          {times.length === 0 && (
            <p className="text-sm text-yellow-400 mt-2">Add at least one time slot</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsView({
  accounts,
  isConnected,
  toast,
}: {
  accounts: { id: string; platform: string; account_name: string }[]
  isConnected: (platform: string) => boolean
  toast: ReturnType<typeof useToast>
}) {
  const { appVersion } = useAppStore()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    notifySuccess: true,
    notifyFailed: true,
    minimizeToTray: true,
    startOnBoot: false,
  })

  useEffect(() => {
    // Load settings
    window.electronAPI?.getSettings().then((loadedSettings: any) => {
      if (loadedSettings) {
        setSettings({
          notifySuccess: loadedSettings.notifySuccess !== false,
          notifyFailed: loadedSettings.notifyFailed !== false,
          minimizeToTray: loadedSettings.minimizeToTray !== false,
          startOnBoot: loadedSettings.startOnBoot === true,
        })
      }
    })
  }, [])

  const handleConnect = async (platform: string) => {
    setConnecting(platform)
    setError(null)
    try {
      const result = await window.electronAPI?.connectAccount(platform) as { error?: string }
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    await window.electronAPI?.disconnectAccount(accountId)
  }

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    try {
      await window.electronAPI?.saveSettings(newSettings)
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const { schedulerPaused, setSchedulerPaused } = useAppStore()
  const [postingStatus, setPostingStatus] = useState({ isPaused: false })

  useEffect(() => {
    // Load posting status
    window.electronAPI?.getPostingStatus().then((status: any) => {
      if (status) {
        setPostingStatus(status)
        setSchedulerPaused(status.isPaused)
      }
    })
  }, [setSchedulerPaused])

  const handleToggleScheduler = async () => {
    try {
      if (postingStatus.isPaused) {
        await window.electronAPI?.resumePosting()
        toast.success('Posting scheduler resumed')
      } else {
        await window.electronAPI?.pausePosting()
        toast.success('Posting scheduler paused')
      }
      // Reload status
      const status = await window.electronAPI?.getPostingStatus()
      if (status) {
        setPostingStatus(status)
        setSchedulerPaused(status.isPaused)
      }
    } catch (error) {
      toast.error('Failed to toggle scheduler')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-300 text-xs mt-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scheduler Status */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4 text-white">Posting Scheduler</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${
                postingStatus.isPaused ? 'bg-gray-400 shadow-gray-400/50' : 'bg-green-500 shadow-green-500/50'
              }`}
            ></span>
            <div>
              <p className="font-semibold text-white">
                {postingStatus.isPaused ? 'Paused' : 'Active'}
              </p>
              <p className="text-sm text-gray-400">
                {postingStatus.isPaused
                  ? 'Posts will not be published automatically'
                  : 'Posts will be published on schedule'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleScheduler}
            className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
              postingStatus.isPaused ? 'bg-gray-600' : 'bg-green-500 shadow-lg shadow-green-500/40'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                postingStatus.isPaused ? 'translate-x-1' : 'translate-x-9'
              }`}
            ></span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
        <div className="space-y-3">
          <AccountRow
            name="Google Drive"
            icon={iconMap.googleDrive}
            connected={isConnected('google')}
            connecting={connecting === 'google'}
            account={accounts.find((a) => a.platform === 'google')}
            onConnect={() => handleConnect('google')}
            onDisconnect={handleDisconnect}
          />
          <AccountRow
            name="Instagram"
            icon={iconMap.instagram}
            connected={isConnected('instagram')}
            connecting={connecting === 'instagram'}
            account={accounts.find((a) => a.platform === 'instagram')}
            onConnect={() => handleConnect('instagram')}
            onDisconnect={handleDisconnect}
          />
          <AccountRow
            name="YouTube"
            icon={iconMap.youtube}
            connected={isConnected('youtube')}
            connecting={connecting === 'youtube'}
            account={accounts.find((a) => a.platform === 'youtube')}
            onConnect={() => handleConnect('youtube')}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Notify on successful post</span>
            <input
              type="checkbox"
              checked={settings.notifySuccess}
              onChange={(e) => handleSettingChange('notifySuccess', e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Notify on failed post</span>
            <input
              type="checkbox"
              checked={settings.notifyFailed}
              onChange={(e) => handleSettingChange('notifyFailed', e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
          </label>
        </div>
      </div>

      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4">General</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Minimize to system tray</span>
            <input
              type="checkbox"
              checked={settings.minimizeToTray}
              onChange={(e) => handleSettingChange('minimizeToTray', e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Start on system boot</span>
            <input
              type="checkbox"
              checked={settings.startOnBoot}
              onChange={(e) => handleSettingChange('startOnBoot', e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Version Footer */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-[#7a0600]/20 shadow-lg shadow-[#7a0600]/10">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-white font-poppins">
              SocialSync
            </h4>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Your Social Media Executive</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">Version</p>
            <p className="text-sm font-bold text-white">{appVersion}</p>
          </div>
        </div>

        {/* Tech Details */}
        <div className="mt-4 pt-4 border-t border-[#7a0600]/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Platform</p>
              <p className="text-xs font-bold text-gray-300">Electron + React</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <p className="text-xs font-bold text-green-400">Online</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Powered By</p>
              <img src="/stage-logo-horizontal.png" alt="STAGE" className="h-3 w-auto mx-auto opacity-80" />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-500">
            Built with <span className="text-[#7a0600]">❤</span> by{' '}
            <span className="text-[#7a0600] font-bold">STAGE OTT</span>
            {' · '}
            <span className="text-gray-600">© 2026</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function AccountRow({
  name,
  icon: IconComponent,
  connected,
  connecting,
  account,
  onConnect,
  onDisconnect,
}: {
  name: string
  icon: LucideIcon
  connected: boolean
  connecting: boolean
  account?: { id: string; account_name: string }
  onConnect: () => void
  onDisconnect: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
      <div className="flex items-center gap-3">
        <IconComponent size={24} strokeWidth={1.75} className="text-stage-ribbon" />
        <div>
          <p className="font-medium">{name}</p>
          {connected && account && (
            <p className="text-sm text-gray-400">{account.account_name}</p>
          )}
          {connecting && (
            <p className="text-sm text-blue-400">Waiting for authorization...</p>
          )}
        </div>
      </div>
      <button
        onClick={() => (connected && account ? onDisconnect(account.id) : onConnect())}
        disabled={connecting}
        className={`px-4 py-1.5 rounded text-sm font-medium ${
          connecting
            ? 'bg-gray-600 cursor-wait'
            : connected
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-stage-red hover:bg-blue-700'
        } transition-colors disabled:opacity-50`}
      >
        {connecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}

function PostedView({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [postedVideos, setPostedVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'instagram' | 'youtube'>('all')

  const loadPostedVideos = async () => {
    setLoading(true)
    try {
      const items = await window.electronAPI?.getPostedQueue()
      if (items && Array.isArray(items)) {
        setPostedVideos(items)
      }
    } catch (error) {
      toast.error('Failed to load posted videos')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPostedVideos()
  }, [])

  const filteredVideos = selectedPlatform === 'all'
    ? postedVideos
    : postedVideos.filter(v => v.platform === selectedPlatform)

  const openVideoLink = (url: string) => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Posted Videos</h2>
        <button
          onClick={loadPostedVideos}
          disabled={loading}
          className="px-4 py-2 bg-stage-red rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-4">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPlatform === 'all' ? 'bg-stage-red' : 'bg-stage-gray-600 hover:bg-gray-600'
          }`}
        >
          All ({postedVideos.length})
        </button>
        <button
          onClick={() => setSelectedPlatform('youtube')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPlatform === 'youtube' ? 'bg-stage-red' : 'bg-stage-gray-600 hover:bg-gray-600'
          }`}
        >
          <iconMap.youtube size={20} strokeWidth={1.75} className="inline mr-2" />
          YouTube ({postedVideos.filter(v => v.platform === 'youtube').length})
        </button>
        <button
          onClick={() => setSelectedPlatform('instagram')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPlatform === 'instagram' ? 'bg-stage-red' : 'bg-stage-gray-600 hover:bg-gray-600'
          }`}
        >
          <iconMap.instagram size={20} strokeWidth={1.75} className="inline mr-2" />
          Instagram ({postedVideos.filter(v => v.platform === 'instagram').length})
        </button>
      </div>

      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading posted videos...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">No posted videos yet.</p>
            <p className="text-gray-500 text-sm">
              Videos will appear here once they are successfully posted.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-4 bg-stage-gray-600 rounded-lg hover:bg-gray-650 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {video.platform === 'youtube' ? (
                    <iconMap.youtube size={32} strokeWidth={1.5} className="text-platform-youtube" />
                  ) : (
                    <iconMap.instagram size={32} strokeWidth={1.5} className="text-platform-instagram" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{video.filename}</p>
                    <p className="text-sm text-gray-400">
                      Posted {new Date(video.posted_at).toLocaleString()}
                    </p>
                    {video.platform === 'youtube' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Channel: Kunal Kumrawat
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs rounded bg-green-600">
                    Posted
                  </span>
                  {video.postUrl && (
                    <button
                      onClick={() => openVideoLink(video.postUrl)}
                      className="px-4 py-2 bg-stage-red rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <span>View on {video.platform === 'youtube' ? 'YouTube' : 'Instagram'}</span>
                      <span>↗</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          💡 <strong>Tip:</strong> Click "View on YouTube" to open the posted video in your browser and get the shareable link!
        </p>
      </div>
    </div>
  )
}

export default App
