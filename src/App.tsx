import { useEffect, useState } from 'react'
import { useAppStore, View } from './stores/appStore'

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
      loadAccounts() // Reload accounts when one is connected
    })

    window.electronAPI?.onAccountDisconnected(() => {
      loadAccounts() // Reload accounts when one is disconnected
    })
  }, [setAppVersion, setAccounts, setSchedulerPaused])

  const navItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'content', label: 'Content', icon: '📁' },
    { id: 'queue', label: 'Queue', icon: '📋' },
    { id: 'schedule', label: 'Schedule', icon: '🕐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const isConnected = (platform: string) =>
    accounts.some((a) => a.platform === platform)

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 drag-region">
          <h1 className="text-xl font-bold text-blue-400 no-drag">SocialSync</h1>
          <p className="text-xs text-gray-500 mt-1">v{appVersion}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Status Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                schedulerPaused ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            ></span>
            <span className="text-sm text-gray-400">
              {schedulerPaused ? 'Scheduler Paused' : 'Scheduler Active'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-6 drag-region">
          <h2 className="text-lg font-semibold capitalize no-drag">{currentView}</h2>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {currentView === 'dashboard' && <DashboardView stats={stats} />}
          {currentView === 'content' && <ContentView isConnected={isConnected} />}
          {currentView === 'queue' && <QueueView />}
          {currentView === 'schedule' && <ScheduleView />}
          {currentView === 'settings' && (
            <SettingsView accounts={accounts} isConnected={isConnected} />
          )}
        </div>
      </main>
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
          icon="📁"
        />
        <StatCard
          title="Pending Posts"
          value={queueStats.pending.toString()}
          icon="📤"
          color={postingStatus.dueCount > 0 ? 'yellow' : undefined}
        />
        <StatCard
          title="Posted"
          value={queueStats.posted.toString()}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Failed"
          value={queueStats.failed.toString()}
          icon="❌"
          color={queueStats.failed > 0 ? 'red' : undefined}
        />
      </div>

      {/* Posting Status */}
      {postingStatus.isPaused && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-400">
            ⚠️ Automated posting is paused. Posts will not be published automatically.
          </p>
        </div>
      )}

      {/* Upcoming Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformDashboard
          platform="instagram"
          icon="📸"
          label="Instagram"
          isConnected={isConnected('instagram')}
          upcomingPosts={instagramQueue}
        />
        <PlatformDashboard
          platform="youtube"
          icon="🎬"
          label="YouTube"
          isConnected={isConnected('youtube')}
          upcomingPosts={youtubeQueue}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6">
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
  const getIcon = (eventType: string) => {
    if (eventType.includes('success')) return '✅'
    if (eventType.includes('failed')) return '❌'
    if (eventType.includes('scan')) return '🔍'
    return '📝'
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
      <span className="text-xl">{getIcon(activity.event_type)}</span>
      <div className="flex-1">
        <p className="text-sm">{activity.message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(activity.created_at)}</p>
      </div>
    </div>
  )
}

function PlatformDashboard({
  platform,
  icon,
  label,
  isConnected,
  upcomingPosts,
}: {
  platform: string
  icon: string
  label: string
  isConnected: boolean
  upcomingPosts: QueueItem[]
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>{icon}</span> {label}
      </h3>
      {!isConnected ? (
        <p className="text-gray-400">Connect {label} to see upcoming posts.</p>
      ) : upcomingPosts.length === 0 ? (
        <p className="text-gray-400">No upcoming posts scheduled.</p>
      ) : (
        <div className="space-y-2">
          {upcomingPosts.map((post) => (
            <div key={post.id} className="p-2 bg-gray-700 rounded text-sm">
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
  icon,
  color,
}: {
  title: string
  value: string
  icon: string
  color?: 'red' | 'green' | 'yellow'
}) {
  const colorClasses = {
    red: 'text-red-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color ? colorClasses[color] : ''}`}>
            {value}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}

function QueueView() {
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
    await window.electronAPI?.skipQueueItem(itemId)
  }

  const handleRetry = async (itemId: string) => {
    await window.electronAPI?.retryQueueItem(itemId)
  }

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to remove this item from the queue?')) {
      await window.electronAPI?.deleteQueueItem(itemId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-700 pb-4">
        <button
          onClick={() => handlePlatformSwitch('instagram')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPlatform === 'instagram'
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          📸 Instagram ({queueItems.filter(() => selectedPlatform === 'instagram').length})
        </button>
        <button
          onClick={() => handlePlatformSwitch('youtube')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPlatform === 'youtube'
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          🎬 YouTube ({queueItems.filter(() => selectedPlatform === 'youtube').length})
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {selectedPlatform === 'instagram' ? 'Instagram' : 'YouTube'} Queue
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
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

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">{platform === 'instagram' ? '📸' : '🎬'}</span>
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
              ? 'bg-blue-600'
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

function ContentView({ isConnected }: { isConnected: (platform: string) => boolean }) {
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
    const result = await window.electronAPI?.selectFolder(folderId, folderName)
    if (result?.success) {
      // Refresh selected folders
      const folders = await window.electronAPI?.getSelectedFolders()
      if (folders && Array.isArray(folders)) {
        setSelectedFolders(folders as typeof selectedFolders)
      }
    }
  }

  const unselectFolder = async (folderId: string) => {
    await window.electronAPI?.unselectFolder(folderId)
    // Refresh selected folders
    const folders = await window.electronAPI?.getSelectedFolders()
    if (folders && Array.isArray(folders)) {
      setSelectedFolders(folders as typeof selectedFolders)
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    await window.electronAPI?.scanContent()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isConnected('google')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <span className="text-6xl mb-4">📁</span>
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
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Selected Folders</h3>
          <div className="flex gap-2">
            <button
              onClick={openBrowser}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
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
          <div className="bg-gray-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Browse Google Drive</h3>
                <button
                  onClick={() => setBrowsing(false)}
                  className="p-1 hover:bg-gray-700 rounded"
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
                  className="flex items-center gap-2 w-full p-3 bg-gray-700 rounded-lg mb-2 hover:bg-gray-600"
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
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <button
                          onClick={() => navigateToFolder(folder.id, folder.name)}
                          className="flex items-center gap-3 flex-1 text-left hover:text-blue-400"
                        >
                          <span className="text-xl">📁</span>
                          <span>{folder.name}</span>
                        </button>
                        <button
                          onClick={() => selectFolder(folder.id, folder.name)}
                          disabled={isSelected}
                          className={`px-3 py-1 rounded text-sm ${
                            isSelected
                              ? 'bg-green-600 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
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
      <div className="bg-gray-800 rounded-lg p-6">
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
                className="bg-gray-700 rounded-lg overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="aspect-[9/16] bg-gray-800 relative">
                  {thumbnails[item.drive_file_id] ? (
                    <img
                      src={thumbnails[item.drive_file_id]}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                      item.status === 'pending'
                        ? 'bg-yellow-600'
                        : item.status === 'queued'
                        ? 'bg-blue-600'
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

function ScheduleView() {
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
        icon="📸"
        label="Instagram"
        account={getAccountForPlatform('instagram')}
        schedule={instagramSchedule}
        onScheduleChange={loadSchedules}
      />
      <PlatformSchedule
        platform="youtube"
        icon="🎬"
        label="YouTube"
        account={getAccountForPlatform('youtube')}
        schedule={youtubeSchedule}
        onScheduleChange={loadSchedules}
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
  icon,
  label,
  account,
  schedule,
  onScheduleChange,
}: {
  platform: 'instagram' | 'youtube'
  icon: string
  label: string
  account?: { id: string; account_id: string; account_name: string }
  schedule: Schedule | null
  onScheduleChange: () => void
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
      alert(`Error: ${result.error}`)
    } else {
      onScheduleChange()
    }
    setSaving(false)
  }

  const handleToggle = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    await window.electronAPI?.toggleSchedule(platform, newEnabled)
  }

  if (!account) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <span>{icon}</span> {label} Schedule
        </h3>
        <p className="text-gray-400">
          Connect {label} account in Settings to configure posting schedule.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>{icon}</span> {label} Schedule
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
            />
            <button
              onClick={addTime}
              className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Add Time
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {times.map((time) => (
              <span
                key={time}
                className="px-3 py-1.5 bg-gray-700 rounded text-sm flex items-center gap-2"
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
}: {
  accounts: { id: string; platform: string; account_name: string }[]
  isConnected: (platform: string) => boolean
}) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
        <div className="space-y-3">
          <AccountRow
            name="Google Drive"
            icon="📁"
            connected={isConnected('google')}
            connecting={connecting === 'google'}
            account={accounts.find((a) => a.platform === 'google')}
            onConnect={() => handleConnect('google')}
            onDisconnect={handleDisconnect}
          />
          <AccountRow
            name="Instagram"
            icon="📸"
            connected={isConnected('instagram')}
            connecting={connecting === 'instagram'}
            account={accounts.find((a) => a.platform === 'instagram')}
            onConnect={() => handleConnect('instagram')}
            onDisconnect={handleDisconnect}
          />
          <AccountRow
            name="YouTube"
            icon="🎬"
            connected={isConnected('youtube')}
            connecting={connecting === 'youtube'}
            account={accounts.find((a) => a.platform === 'youtube')}
            onConnect={() => handleConnect('youtube')}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Notify on successful post</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Notify on failed post</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
          </label>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">General</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Minimize to system tray</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Start on system boot</span>
            <input type="checkbox" className="w-4 h-4 accent-blue-500" />
          </label>
        </div>
      </div>
    </div>
  )
}

function AccountRow({
  name,
  icon,
  connected,
  connecting,
  account,
  onConnect,
  onDisconnect,
}: {
  name: string
  icon: string
  connected: boolean
  connecting: boolean
  account?: { id: string; account_name: string }
  onConnect: () => void
  onDisconnect: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
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
            : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors disabled:opacity-50`}
      >
        {connecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}

export default App
