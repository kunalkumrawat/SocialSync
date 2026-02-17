import { useEffect, useState } from 'react'
import { useAppStore, View, ContentItem } from './stores/appStore'
import { ToastContainer, useToast } from './components/Toast'
import { Tooltip } from './components/ui/Tooltip'
import { iconMap } from './lib/iconMap'
import type { LucideIcon } from 'lucide-react'

interface QueueItem {
  id: string
  content_id: string
  platform: 'instagram' | 'youtube'
  filename?: string
  mime_type?: string
  drive_file_id?: string
  scheduled_for: string
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'skipped'
  attempts: number
  last_error: string | null
  channel_id?: string | null
}

function App() {
  const {
    currentView,
    setCurrentView,
    appVersion: _appVersion,
    setAppVersion,
    schedulerPaused: _schedulerPaused,
    setSchedulerPaused,
    accounts,
    setAccounts,
    stats: _stats,
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
    { id: 'channels', label: 'Channels', icon: iconMap.youtube },
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
                <span className="text-sm font-black text-[#c60c0c] font-poppins tracking-wide">STAGE</span>
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
          {currentView === 'dashboard' && <DashboardView toast={toast} />}
          {currentView === 'channels' && <ChannelsView toast={toast} />}
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

// Channel Card Component
function ChannelCard({
  channel,
  isConnected,
  onSelect,
  onDelete,
}: {
  channel: any
  isConnected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10 hover:scale-105 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => onSelect(channel.id)}
        >
          <iconMap.youtube size={32} className="text-[#FF0000]" />
          <div>
            <h3 className="text-lg font-bold text-white">{channel.channel_name || channel.channel_handle}</h3>
            <p className="text-sm text-gray-400">{channel.channel_handle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">
              ● Connected
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded-full text-xs">
              ● Not Connected
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(channel.id)
            }}
            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
            title="Delete workspace"
          >
            <iconMap.delete size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Posted Today:</span>
          <span className="text-white font-semibold">{channel.posts_today}/{channel.daily_quota}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Remaining:</span>
          <span className="text-green-400 font-semibold">{channel.daily_quota - channel.posts_today}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Status:</span>
          <span className={`font-semibold ${channel.enabled ? 'text-green-400' : 'text-gray-500'}`}>
            {channel.enabled ? '● Active' : '○ Disabled'}
          </span>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect(channel.id)
        }}
        className="w-full px-4 py-2 bg-gradient-to-r from-[#7a0600] to-[#c60c0c] text-white rounded-lg font-semibold hover:scale-105 transition-all shadow-lg"
      >
        Open Workspace →
      </button>
    </div>
  )
}

// Channels View - Shows all YouTube channel workspaces
function ChannelsView({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { selectedChannelId, setSelectedChannelId, accounts } = useAppStore()
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadChannels = async () => {
    setLoading(true)
    const channelsList = await window.electronAPI?.getYouTubeChannels?.()
    if (channelsList) {
      setChannels(channelsList)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadChannels()

    // Listen for channel updates
    window.electronAPI?.onYouTubeChannelsUpdated?.(() => {
      loadChannels()
    })
  }, [])

  // If a channel is selected, show the workspace
  if (selectedChannelId) {
    return <ChannelWorkspace channelId={selectedChannelId} toast={toast} onBack={() => setSelectedChannelId(null)} />
  }

  // Otherwise, show all channels
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">YouTube Channels</h2>
        <button
          onClick={async () => {
            const result = await window.electronAPI?.syncYouTubeChannels?.()
            if (result?.success) {
              toast.success(`Found ${result.channelsFound} channel(s)!`)
              loadChannels()
            } else {
              toast.error(result?.error || 'Failed to sync channels')
            }
          }}
          className="px-6 py-3 bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#CC0000] hover:to-[#990000] text-white rounded-xl font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-red-500/30"
        >
          <iconMap.retry size={20} strokeWidth={2} />
          Sync from YouTube
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <iconMap.loading size={48} className="animate-spin mx-auto mb-4 text-stage-ribbon" />
          <p>Loading channels...</p>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-20">
          <iconMap.youtube size={64} className="mx-auto mb-6 text-gray-600" />
          <h3 className="text-2xl font-bold mb-4">No Channels Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Click "Sync from YouTube" to fetch all your YouTube channels and create dedicated workspaces for each.
          </p>
        </div>
      ) : (
        <>
          {/* Connected Channels */}
          {channels.filter(ch => !!accounts.find(acc => acc.platform === 'youtube' && acc.account_id === ch.channel_id)).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                Connected Channels ({channels.filter(ch => !!accounts.find(acc => acc.platform === 'youtube' && acc.account_id === ch.channel_id)).length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels
                  .filter(ch => !!accounts.find(acc => acc.platform === 'youtube' && acc.account_id === ch.channel_id))
                  .map((channel) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isConnected={true}
                      onSelect={setSelectedChannelId}
                      onDelete={async (id) => {
                        if (confirm(`Delete ${channel.channel_name || channel.channel_handle}?\n\nThis will remove the workspace completely. This cannot be undone.`)) {
                          try {
                            await window.electronAPI?.removeYouTubeChannel?.(id)
                            toast.success('Channel deleted')
                            loadChannels()
                          } catch (error) {
                            toast.error('Failed to delete channel')
                          }
                        }
                      }}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Not Connected Channels */}
          {channels.filter(ch => !accounts.find(acc => acc.platform === 'youtube' && acc.account_id === ch.channel_id)).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                Not Connected ({channels.filter(ch => !accounts.find(acc => acc.platform === 'youtube' && acc.account_id === ch.channel_id)).length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels
                  .filter(ch => !accounts.find(acc => acc.platform === 'youtube' && acc.account_id === ch.channel_id))
                  .map((channel) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isConnected={false}
                      onSelect={setSelectedChannelId}
                      onDelete={async (id) => {
                        if (confirm(`Delete ${channel.channel_name || channel.channel_handle}?\n\nThis will remove the workspace completely. This cannot be undone.`)) {
                          try {
                            await window.electronAPI?.removeYouTubeChannel?.(id)
                            toast.success('Channel deleted')
                            loadChannels()
                          } catch (error) {
                            toast.error('Failed to delete channel')
                          }
                        }
                      }}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Channel Workspace - Dedicated space for one YouTube channel
function ChannelWorkspace({
  channelId,
  toast,
  onBack,
}: {
  channelId: string
  toast: ReturnType<typeof useToast>
  onBack: () => void
}) {
  const { accounts } = useAppStore()
  const [channel, setChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [postedItems, setPostedItems] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    posting_interval_minutes: 30,
    daily_quota: 6,
    auto_post_enabled: true,
  })

  const loadChannelData = async () => {
    setLoading(true)

    // Load channel info
    const channels = await window.electronAPI?.getYouTubeChannels?.()
    if (channels) {
      const found = (channels as any[]).find((ch) => ch.id === channelId)
      setChannel(found)

      if (found) {
        setSettingsForm({
          posting_interval_minutes: found.posting_interval_minutes || 30,
          daily_quota: found.daily_quota || 6,
          auto_post_enabled: found.auto_post_enabled !== false,
        })
      }
    }

    // Load content for this channel
    const content = await window.electronAPI?.getContentForChannel?.(channelId)
    if (content && Array.isArray(content)) {
      setContentItems(content as ContentItem[])
    }

    // Load queue for this channel
    const queue = await window.electronAPI?.getQueueForChannel?.(channelId)
    if (queue && Array.isArray(queue)) {
      setQueueItems(queue as QueueItem[])
    }

    // Load posted items for this channel
    const posted = await window.electronAPI?.getPostedForChannel?.(channelId)
    if (posted && Array.isArray(posted)) {
      setPostedItems(posted)
    }

    // Load folders for linking
    const foldersList = await window.electronAPI?.getFolders?.()
    if (foldersList && Array.isArray(foldersList)) {
      setFolders(foldersList)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadChannelData()
  }, [channelId])

  const handleConnectYouTube = async () => {
    setIsConnecting(true)
    try {
      const result = await window.electronAPI?.connectAccount?.('youtube')
      if (result && !(result as any).error) {
        // Link the authenticated account to this channel
        const accountData = result as any
        const linkResult = await window.electronAPI?.linkAccountToChannel?.(channelId, accountData.account_id)

        if (linkResult?.success) {
          toast.success('YouTube account connected successfully!')
        } else {
          toast.warning('Connected but failed to link to channel')
        }

        // Refresh channel data
        setTimeout(() => {
          loadChannelData()
          setIsConnecting(false)
        }, 1000)
      } else {
        toast.error((result as any).error || 'Failed to connect YouTube')
        setIsConnecting(false)
      }
    } catch (error) {
      toast.error('Failed to connect YouTube')
      setIsConnecting(false)
    }
  }

  const handleDisconnectYouTube = async () => {
    if (!channel?.account_id) return

    const youtubeAccount = accounts.find(
      (acc) => acc.platform === 'youtube' && acc.account_id === channel.account_id
    )

    if (!youtubeAccount) return

    if (confirm('Disconnect YouTube account from this channel? You will need to reconnect to post videos.')) {
      try {
        await window.electronAPI?.disconnectAccount?.(youtubeAccount.id)
        toast.info('YouTube account disconnected')
        loadChannelData()
      } catch (error) {
        toast.error('Failed to disconnect')
      }
    }
  }

  const handleLinkFolder = async (folderId: string) => {
    try {
      await window.electronAPI?.linkFolderToChannel?.(channelId, folderId)
      toast.success('Folder linked! Scanning for content...')

      // Auto-scan the linked folder
      try {
        const scanResult = await window.electronAPI?.scanContent?.()
        if (scanResult && !(scanResult as any).error) {
          toast.success(`Found ${(scanResult as any).discovered || 0} new videos!`)
        }
      } catch (scanError) {
        console.error('Auto-scan failed:', scanError)
      }

      loadChannelData()
    } catch (error) {
      toast.error('Failed to link folder')
    }
  }

  const handleUpdateSettings = async () => {
    try {
      await window.electronAPI?.updateChannelSettings?.(channelId, settingsForm)
      toast.success('Settings updated successfully')
      setShowSettings(false)
      loadChannelData()
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const handleApproveContent = async (contentId: string) => {
    try {
      await window.electronAPI?.approveContent?.(contentId)
      toast.success('Content approved')
      loadChannelData()
    } catch (error) {
      toast.error('Failed to approve content')
    }
  }

  const handlePostNow = async (queueId: string) => {
    try {
      await window.electronAPI?.postImmediately?.(queueId)
      toast.success('Posting now...')
      setTimeout(loadChannelData, 2000)
    } catch (error) {
      toast.error('Failed to post')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <iconMap.loading size={48} className="animate-spin mx-auto mb-4 text-stage-ribbon" />
        <p>Loading channel workspace...</p>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Channel not found</p>
        <button onClick={onBack} className="px-4 py-2 bg-stage-red text-white rounded-lg">
          ← Back to Channels
        </button>
      </div>
    )
  }

  const linkedFolder = folders.find((f) => f.id === channel.drive_folder_id)

  // Check if channel has a connected YouTube account
  const youtubeAccount = accounts.find(
    (acc) => acc.platform === 'youtube' && acc.account_id === channel.channel_id
  )
  const isYouTubeConnected = !!youtubeAccount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-stage-gray-600 rounded-lg transition-colors"
            title="Back to Channels"
          >
            <iconMap.content size={24} className="rotate-180 text-gray-400" />
          </button>
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <iconMap.youtube size={36} className="text-[#FF0000]" />
              {channel.channel_name || channel.channel_handle}
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-gray-400">{channel.channel_handle}</p>
              {isYouTubeConnected ? (
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  Not Connected
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isYouTubeConnected ? (
            <button
              onClick={handleConnectYouTube}
              disabled={isConnecting}
              className="px-6 py-3 bg-gradient-to-r from-[#7a0600] to-[#c60c0c] text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <iconMap.loading size={20} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <iconMap.youtube size={20} />
                  Connect YouTube
                </>
              )}
            </button>
          ) : null}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-stage-gray-600 hover:bg-stage-gray-500 rounded-lg flex items-center gap-2 transition-colors"
          >
            <iconMap.settings size={20} />
            Settings
          </button>
        </div>
      </div>

      {/* Connection Warning */}
      {!isYouTubeConnected && (
        <div className="bg-gradient-to-r from-red-600/20 to-red-700/10 border-2 border-red-600/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <iconMap.warning size={32} strokeWidth={2} className="text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2 text-lg">
                YouTube Account Not Connected
              </h4>
              <p className="text-gray-300 mb-4">
                This channel needs to be authenticated with YouTube to post videos. Click the <strong>"Connect YouTube"</strong> button above to sign in with your Google account and authorize posting.
              </p>
              <p className="text-sm text-gray-400">
                You'll be redirected to Google's authorization page to grant access to upload videos to this channel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600/20 to-green-700/10 rounded-xl p-6 border border-green-600/30">
          <p className="text-sm text-gray-400 uppercase mb-2">Posted Today</p>
          <p className="text-4xl font-black text-green-400">{channel.posts_today}/{channel.daily_quota}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/10 rounded-xl p-6 border border-yellow-600/30">
          <p className="text-sm text-gray-400 uppercase mb-2">Pending Queue</p>
          <p className="text-4xl font-black text-yellow-400">{queueItems.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 rounded-xl p-6 border border-blue-600/30">
          <p className="text-sm text-gray-400 uppercase mb-2">All Time Posts</p>
          <p className="text-4xl font-black text-blue-400">{postedItems.length}</p>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <iconMap.settings size={24} />
            Channel Settings
          </h3>

          <div className="space-y-6">
            {/* YouTube Connection */}
            <div>
              <label className="block text-sm font-semibold mb-2">YouTube Connection</label>
              {isYouTubeConnected ? (
                <div className="flex items-center justify-between bg-green-600/10 border border-green-600/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <iconMap.youtube size={24} className="text-green-400" />
                    <div>
                      <p className="font-medium text-green-400">Connected</p>
                      <p className="text-sm text-gray-400">{youtubeAccount?.account_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnectYouTube}
                    className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectYouTube}
                  disabled={isConnecting}
                  className="w-full py-3 bg-gradient-to-r from-[#7a0600] to-[#c60c0c] text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <iconMap.loading size={20} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <iconMap.youtube size={20} />
                      Connect YouTube Account
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Folder Linking */}
            <div>
              <label className="block text-sm font-semibold mb-2">Google Drive Folder</label>
              {linkedFolder ? (
                <div className="flex items-center justify-between bg-stage-gray-600 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <iconMap.googleDrive size={24} className="text-[#4285F4]" />
                    <span>{linkedFolder.folder_name}</span>
                  </div>
                  <button
                    onClick={() => handleLinkFolder('')}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Unlink
                  </button>
                </div>
              ) : (
                <select
                  onChange={(e) => handleLinkFolder(e.target.value)}
                  className="w-full bg-stage-gray-600 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-stage-ribbon"
                >
                  <option value="">Select a folder...</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.folder_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Posting Interval */}
            <div>
              <label className="block text-sm font-semibold mb-2">Posting Interval (minutes)</label>
              <input
                type="number"
                value={settingsForm.posting_interval_minutes}
                onChange={(e) => setSettingsForm({ ...settingsForm, posting_interval_minutes: parseInt(e.target.value) })}
                className="w-full bg-stage-gray-600 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-stage-ribbon"
                min="1"
              />
            </div>

            {/* Daily Quota */}
            <div>
              <label className="block text-sm font-semibold mb-2">Daily Quota</label>
              <input
                type="number"
                value={settingsForm.daily_quota}
                onChange={(e) => setSettingsForm({ ...settingsForm, daily_quota: parseInt(e.target.value) })}
                className="w-full bg-stage-gray-600 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-stage-ribbon"
                min="1"
              />
            </div>

            {/* Auto-post Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Auto-posting Enabled</label>
              <button
                onClick={() => setSettingsForm({ ...settingsForm, auto_post_enabled: !settingsForm.auto_post_enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settingsForm.auto_post_enabled ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settingsForm.auto_post_enabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleUpdateSettings}
              className="w-full py-3 bg-gradient-to-r from-[#7a0600] to-[#c60c0c] text-white rounded-lg font-semibold hover:scale-105 transition-transform"
            >
              Save Settings
            </button>

            {/* Danger Zone */}
            <div className="pt-6 mt-6 border-t border-red-600/30">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <iconMap.warning size={18} />
                Danger Zone
              </h4>
              <button
                onClick={async () => {
                  if (confirm(`Delete "${channel.channel_name || channel.channel_handle}" workspace?\n\nThis will permanently remove:\n• All workspace settings\n• Queue items for this channel\n• Posted history\n\nThis cannot be undone!`)) {
                    try {
                      await window.electronAPI?.removeYouTubeChannel?.(channelId)
                      toast.success('Workspace deleted')
                      onBack()
                    } catch (error) {
                      toast.error('Failed to delete workspace')
                    }
                  }
                }}
                className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 border border-red-600/30"
              >
                <iconMap.delete size={20} />
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Library */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <iconMap.content size={24} />
            Content Library
            <span className="text-sm font-normal text-gray-400">({contentItems.length} videos)</span>
          </h3>
          <button
            onClick={loadChannelData}
            className="px-4 py-2 bg-stage-gray-600 hover:bg-stage-gray-500 rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <iconMap.refresh size={16} />
            Refresh
          </button>
        </div>

        {!linkedFolder ? (
          <div className="text-center py-12 text-gray-400">
            <iconMap.googleDrive size={48} className="mx-auto mb-4" />
            <p>No folder linked. Link a Google Drive folder in settings to see content.</p>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <iconMap.content size={48} className="mx-auto mb-4" />
            <p>No content found. Scan the linked folder to discover videos.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contentItems.filter(item => item.approval_status === 'pending_review').slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-stage-gray-600 p-4 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.filename}</p>
                  <p className="text-sm text-gray-400">
                    {item.mime_type} • {((item.size_bytes || 0) / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={() => handleApproveContent(item.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posting Queue */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <iconMap.queue size={24} />
          Posting Queue
          <span className="text-sm font-normal text-gray-400">({queueItems.length} pending)</span>
        </h3>

        {queueItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <iconMap.queue size={48} className="mx-auto mb-4" />
            <p>No posts in queue. Approve content to add to queue.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queueItems.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-stage-gray-600 p-4 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.filename}</p>
                  <p className="text-sm text-gray-400">
                    Scheduled: {new Date(item.scheduled_for).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handlePostNow(item.id)}
                  className="px-4 py-2 bg-stage-red hover:bg-stage-ribbon rounded-lg text-sm transition-colors"
                >
                  Post Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posted Videos */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <iconMap.posted size={24} />
          Posted Videos
          <span className="text-sm font-normal text-gray-400">({postedItems.length} total)</span>
        </h3>

        {postedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <iconMap.posted size={48} className="mx-auto mb-4" />
            <p>No videos posted yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {postedItems.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-stage-gray-600 p-4 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.filename}</p>
                  <p className="text-sm text-gray-400">
                    Posted: {new Date(item.posted_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                    ✓ Posted
                  </span>
                  {item.platform === 'youtube' && item.platform_post_id && (
                    <button
                      onClick={() => {
                        const url = `https://www.youtube.com/watch?v=${item.platform_post_id}&autoplay=1`
                        window.open(url, '_blank')
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-xs flex items-center gap-1.5"
                      title="Open video on YouTube with autoplay"
                    >
                      <iconMap.youtube size={12} />
                      <span>View</span>
                      <span>↗</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardView({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { accounts } = useAppStore()
  const [queueStats, setQueueStats] = useState({ pending: 0, posted: 0, failed: 0 })
  const [contentCount, setContentCount] = useState(0)
  const [instagramQueue, setInstagramQueue] = useState<QueueItem[]>([])
  const [youtubeQueue, setYoutubeQueue] = useState<QueueItem[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [postingStatus, setPostingStatus] = useState({ isPaused: false, dueCount: 0 })
  const [scheduleStatus, setScheduleStatus] = useState<{
    scheduledUntil: string | null
    totalScheduled: number
    byChannel: { channelName: string; count: number }[]
  } | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)

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

    // Load recent activity (filter out failed posts)
    const activity = await window.electronAPI?.getActivityLog(10)
    if (activity && Array.isArray(activity)) {
      const successfulActivity = (activity as Activity[]).filter(
        (a) => !a.event_type.includes('failed')
      )
      setRecentActivity(successfulActivity)
    }

    // Load posting status
    const status = await window.electronAPI?.getPostingStatus()
    if (status) {
      setPostingStatus(status)
    }

    // Load schedule status
    const schedStatus = await window.electronAPI?.getScheduleStatus?.()
    if (schedStatus) {
      setScheduleStatus(schedStatus)
    }
  }

  const handleBulkSchedule = async (days: number = 30) => {
    setIsScheduling(true)
    try {
      const result = await window.electronAPI?.bulkScheduleVideos?.(days)
      if (result?.success) {
        toast.success(`✅ Scheduled ${result.totalScheduled} videos until ${new Date(result.scheduledUntil || '').toLocaleDateString()}!`)
        loadDashboard()
      } else {
        toast.error(result?.error || 'Failed to schedule videos')
      }
    } catch (error) {
      toast.error('Failed to schedule videos')
    } finally {
      setIsScheduling(false)
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
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button
          onClick={() => {
            loadDashboard()
            toast.success('Dashboard refreshed')
          }}
          className="px-4 py-2 bg-stage-red hover:bg-stage-maroon text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-stage-red/30"
          title="Refresh dashboard"
        >
          <iconMap.retry size={16} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Welcome & Workflow Guide */}
      <div className="bg-gradient-to-r from-stage-maroon/20 to-stage-red/10 border-2 border-stage-ribbon/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <iconMap.tips size={28} strokeWidth={2} className="text-stage-ribbon flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-2">Welcome to SocialSync</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Your automated social media executive. Here's how the workflow works:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-stage-gray-700/50 rounded-lg p-3 border border-stage-red/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-stage-ribbon text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">1</span>
                  <h4 className="text-white font-semibold text-sm">Content Library</h4>
                </div>
                <p className="text-gray-400 text-xs">Videos discovered in Google Drive. Approve videos with STAGE logo.</p>
              </div>
              <div className="bg-stage-gray-700/50 rounded-lg p-3 border border-stage-red/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-stage-ribbon text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">2</span>
                  <h4 className="text-white font-semibold text-sm">Queue (Auto-Posted)</h4>
                </div>
                <p className="text-gray-400 text-xs">Approved videos post automatically every 30 minutes.</p>
              </div>
              <div className="bg-stage-gray-700/50 rounded-lg p-3 border border-stage-red/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-stage-ribbon text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">3</span>
                  <h4 className="text-white font-semibold text-sm">Posted</h4>
                </div>
                <p className="text-gray-400 text-xs">Successfully published to social media.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Scheduling Horizon */}
      <div className="bg-gradient-to-r from-[#FF0000]/20 to-[#CC0000]/10 border-2 border-[#FF0000]/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-[#FF0000]/20 rounded-xl">
              <iconMap.youtube size={36} className="text-[#FF0000]" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-xl mb-1">YouTube Scheduling</h3>
              {scheduleStatus && scheduleStatus.scheduledUntil ? (
                <>
                  <p className="text-2xl font-black text-green-400">
                    Scheduled until {new Date(scheduleStatus.scheduledUntil).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {scheduleStatus.totalScheduled} videos queued • Videos will publish automatically even when laptop is off
                  </p>
                  {scheduleStatus.byChannel.length > 0 && (
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {scheduleStatus.byChannel.map((ch) => (
                        <span key={ch.channelName} className="px-2 py-1 bg-stage-gray-600 rounded text-xs">
                          {ch.channelName}: {ch.count} videos
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-yellow-400">No videos scheduled</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Schedule Videos" to upload videos with future publish dates to YouTube
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => handleBulkSchedule(30)}
            disabled={isScheduling}
            className="px-6 py-4 bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#CC0000] hover:to-[#990000] text-white rounded-xl font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isScheduling ? (
              <>
                <iconMap.loading size={24} className="animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <iconMap.schedule size={24} />
                Schedule Next 30 Days
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Content Library"
          value={contentCount.toString()}
          icon={iconMap.content}
          helpText="Total videos discovered in your connected Google Drive folders. These videos are available but not yet scheduled for posting. Go to Content tab to browse and schedule them."
        />
        <StatCard
          title="Pending Posts"
          value={queueStats.pending.toString()}
          icon={iconMap.pending}
          color={postingStatus.dueCount > 0 ? 'yellow' : undefined}
          helpText="Videos scheduled to post at specific times. These are queued and waiting to be published to Instagram or YouTube. Go to Queue tab to manage scheduled posts."
        />
        <StatCard
          title="Posted"
          value={queueStats.posted.toString()}
          icon={iconMap.success}
          color="green"
          helpText="Videos successfully published to your social media platforms. These posts are now live on Instagram and/or YouTube. Go to Posted tab to see details."
        />
        <StatCard
          title="Failed"
          value={queueStats.failed.toString()}
          icon={iconMap.failed}
          color={queueStats.failed > 0 ? 'red' : undefined}
          helpText="Videos that encountered errors during posting. Common issues include authentication problems or platform API errors. Go to Queue tab to retry failed posts."
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
  metadata?: string | null
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

  // Parse metadata to get YouTube video URL
  let youtubeUrl: string | null = null
  let isYouTubePost = false

  if (activity.event_type === 'post_success' && activity.platform === 'youtube' && activity.metadata) {
    try {
      const metadata = JSON.parse(activity.metadata)
      if (metadata?.metadata?.postId) {
        // Add autoplay parameter for immediate video playback
        youtubeUrl = `https://www.youtube.com/watch?v=${metadata.metadata.postId}&autoplay=1`
        isYouTubePost = true
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (youtubeUrl) {
      window.electronAPI?.openExternal?.(youtubeUrl)
    }
  }

  const IconComponent = getIcon(activity.event_type)

  return (
    <div className="flex items-start gap-3 p-3 bg-stage-gray-600 rounded-lg">
      <IconComponent size={20} strokeWidth={1.75} className="text-stage-ribbon mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm">{activity.message}</p>
            {isYouTubePost && (
              <iconMap.youtube size={14} className="text-[#FF0000]" />
            )}
          </div>
          {isYouTubePost && (
            <button
              onClick={handleViewClick}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center gap-1.5"
              title="Open video on YouTube with autoplay"
            >
              <iconMap.youtube size={12} />
              <span>View on YouTube</span>
              <span>↗</span>
            </button>
          )}
        </div>
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
  helpText,
}: {
  title: string
  value: string
  icon: LucideIcon
  color?: 'red' | 'green' | 'yellow'
  helpText?: string
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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-gray-300 text-sm font-bold uppercase tracking-wide">{title}</p>
            {helpText && <Tooltip content={helpText} size={16} />}
          </div>
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

function _QueueView({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'youtube'>('instagram')
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [youtubeChannels, setYoutubeChannels] = useState<Array<{
    id: string
    channel_name: string | null
    channel_handle: string | null
  }>>([])

  // Load YouTube channels
  useEffect(() => {
    const loadChannels = async () => {
      const channels = await window.electronAPI?.getYouTubeChannels?.()
      if (channels) {
        setYoutubeChannels(channels as any[])
      }
    }
    loadChannels()
  }, [])

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
    setSelectedItems(new Set()) // Clear selection when switching platforms

    // Listen for queue updates
    window.electronAPI?.onQueueUpdated(() => {
      loadQueue(selectedPlatform)
    })
  }, [selectedPlatform])

  // Fetch thumbnails for queue items
  useEffect(() => {
    const fetchThumbnails = async () => {
      for (const item of queueItems) {
        if (item.drive_file_id && !thumbnails[item.drive_file_id]) {
          const fileId = item.drive_file_id
          const thumb = await window.electronAPI?.getThumbnail(fileId)
          if (thumb && fileId) {
            setThumbnails(prev => ({ ...prev, [fileId]: thumb }))
          }
        }
      }
    }

    if (queueItems.length > 0) {
      fetchThumbnails()
    }
  }, [queueItems])

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

  const handlePostNow = async (itemId: string, filename: string) => {
    if (confirm(`Post "${filename}" immediately?`)) {
      try {
        await window.electronAPI?.postNow(itemId)
        toast.success('Posting now...')
      } catch (error) {
        toast.error('Failed to post now')
      }
    }
  }

  const handlePostFirst11 = async () => {
    const pendingItems = queueItems.filter(item => item.status === 'pending').slice(0, 11)

    if (pendingItems.length === 0) {
      toast.error('No pending items to post')
      return
    }

    if (confirm(`Post ${pendingItems.length} video(s) immediately for testing?`)) {
      toast.info(`Posting ${pendingItems.length} videos...`)

      for (const item of pendingItems) {
        try {
          await window.electronAPI?.postNow(item.id)
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Failed to post ${item.filename}:`, error)
        }
      }

      toast.success(`Initiated posting for ${pendingItems.length} videos!`)
    }
  }

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === queueItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(queueItems.map(item => item.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    if (confirm(`Are you sure you want to remove ${selectedItems.size} item(s) from the queue?`)) {
      let successCount = 0
      let failCount = 0

      for (const itemId of selectedItems) {
        try {
          await window.electronAPI?.deleteQueueItem(itemId)
          successCount++
        } catch (error) {
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} post(s) removed from queue`)
      }
      if (failCount > 0) {
        toast.error(`Failed to remove ${failCount} post(s)`)
      }

      setSelectedItems(new Set())
      loadQueue(selectedPlatform)
    }
  }

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetItemId) return

    const draggedIndex = queueItems.findIndex(item => item.id === draggedItem)
    const targetIndex = queueItems.findIndex(item => item.id === targetItemId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newItems = [...queueItems]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, removed)

    setQueueItems(newItems)
  }

  const handleDragEnd = async () => {
    if (draggedItem) {
      // Update scheduled times based on new order
      const now = new Date()
      const updatedItems = queueItems.map((item, index) => {
        const newTime = new Date(now.getTime() + (index * 60 * 60 * 1000)) // 1 hour apart
        return { ...item, scheduled_for: newTime.toISOString() }
      })

      // Update each item's schedule time in backend
      try {
        for (const item of updatedItems) {
          await window.electronAPI?.rescheduleQueueItem(item.id, item.scheduled_for)
        }
        toast.success('Queue reordered successfully')
        loadQueue(selectedPlatform) // Reload to get updated times
      } catch (error) {
        toast.error('Failed to reorder queue')
        loadQueue(selectedPlatform) // Reload original order on error
      }
    }
    setDraggedItem(null)
  }

  return (
    <div className="space-y-6">
      {/* Help Banner */}
      <div className="bg-gradient-to-r from-semantic-info-500/10 to-semantic-info-600/5 border-2 border-semantic-info-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <iconMap.info size={24} strokeWidth={2} className="text-semantic-info-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              How Queue Works
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              The Queue shows approved videos waiting to post automatically every 30 minutes. Videos move through these stages:
            </p>
            <ul className="text-gray-400 text-sm space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-semantic-info-500 font-bold">1.</span>
                <span><strong className="text-white">Content Library</strong>: Videos discovered in Google Drive (pending approval)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-semantic-info-500 font-bold">2.</span>
                <span><strong className="text-white">Approve</strong>: Mark videos with STAGE logo as approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-semantic-info-500 font-bold">3.</span>
                <span><strong className="text-white">Queue (Auto-Post)</strong>: Approved videos post every 30 minutes automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-semantic-info-500 font-bold">4.</span>
                <span><strong className="text-white">Posted</strong>: Successfully published to social media</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

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
          <div className="flex items-center gap-2">
            {selectedPlatform === 'youtube' && queueItems.filter(i => i.status === 'pending').length > 0 && (
              <button
                onClick={handlePostFirst11}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-green-600/30"
                title="Post first 11 videos immediately to test"
              >
                🚀 Post First 11 (Test)
              </button>
            )}
            {selectedItems.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-semantic-error-500 hover:bg-semantic-error-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-semantic-error-500/30"
              >
                <iconMap.delete size={16} strokeWidth={2} />
                Delete Selected ({selectedItems.size})
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-stage-red hover:bg-stage-maroon text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-stage-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh queue"
            >
              <iconMap.retry size={16} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {queueItems.length > 0 && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === queueItems.length && queueItems.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-stage-red cursor-pointer"
              />
              <span className="text-sm text-gray-400">
                {selectedItems.size > 0
                  ? `${selectedItems.size} selected`
                  : 'Select all'}
              </span>
            </label>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading queue...</div>
        ) : queueItems.length === 0 ? (
          <div className="text-center py-12">
            <iconMap.queue size={64} strokeWidth={1.5} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-300 mb-2 text-lg font-semibold">No items in queue</p>
            <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
              Your queue is empty. Videos from Content Library will automatically be added to the queue based on your configured schedule times.
            </p>
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={() => window.location.hash = '#schedule'}
                className="px-4 py-2 bg-gradient-to-r from-[#7a0600] to-[#c60c0c] text-white rounded-lg font-semibold hover:scale-105 transition-transform"
              >
                Configure Schedule Times
              </button>
              <button
                onClick={() => window.location.hash = '#content'}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Browse Content Library
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3 flex items-center gap-2">
              <iconMap.info size={16} className="text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-300">
                💡 <strong>Drag and drop</strong> items to reorder the queue. The posting schedule will automatically update.
              </p>
            </div>
            {queueItems.map((item) => (
              <QueueItemRow
                key={item.id}
                item={item}
                platform={selectedPlatform}
                isSelected={selectedItems.has(item.id)}
                thumbnail={item.drive_file_id ? thumbnails[item.drive_file_id] : undefined}
                channelName={
                  item.channel_id && selectedPlatform === 'youtube'
                    ? youtubeChannels.find(ch => ch.id === item.channel_id)?.channel_name ||
                      youtubeChannels.find(ch => ch.id === item.channel_id)?.channel_handle ||
                      null
                    : null
                }
                onToggleSelect={toggleSelectItem}
                onSkip={handleSkip}
                onRetry={handleRetry}
                onDelete={handleDelete}
                onPostNow={handlePostNow}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
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
  isSelected,
  thumbnail,
  channelName,
  onToggleSelect,
  onSkip,
  onRetry,
  onDelete,
  onPostNow,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  item: QueueItem
  platform: 'instagram' | 'youtube'
  isSelected: boolean
  thumbnail?: string
  channelName?: string | null
  onToggleSelect: (id: string) => void
  onSkip: (id: string) => void
  onRetry: (id: string) => void
  onDelete: (id: string) => void
  onPostNow: (id: string, filename: string) => void
  onDragStart: (id: string) => void
  onDragOver: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}) {
  const isPast = new Date(item.scheduled_for) < new Date()
  const isUpcoming = new Date(item.scheduled_for) > new Date()

  const PlatformIcon = platform === 'instagram' ? iconMap.instagram : iconMap.youtube
  const platformColor = platform === 'instagram' ? 'text-platform-instagram' : 'text-platform-youtube'

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDragEnd={onDragEnd}
      className={`flex items-center justify-between p-3 bg-stage-gray-600 rounded-lg transition-all cursor-move hover:bg-stage-gray-500 ${
        isSelected ? 'ring-2 ring-stage-ribbon bg-stage-gray-600/80' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 accent-stage-red cursor-pointer"
        />

        {/* Video Thumbnail */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={item.filename}
            className="w-24 h-16 object-cover rounded border-2 border-gray-700"
          />
        ) : (
          <div className="w-24 h-16 bg-stage-gray-700 rounded border-2 border-gray-700 flex items-center justify-center">
            <iconMap.content size={24} className="text-gray-500" />
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          <PlatformIcon size={24} strokeWidth={1.75} className={platformColor} />
          {channelName && (
            <span className="text-xs text-gray-400 text-center max-w-[80px] truncate" title={channelName}>
              {channelName}
            </span>
          )}
        </div>
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
        {item.status === 'posted' && item.platform_post_id && platform === 'youtube' && (
          <button
            onClick={() => {
              const url = `https://www.youtube.com/watch?v=${item.platform_post_id}&autoplay=1`
              window.open(url, '_blank')
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-xs flex items-center gap-1.5"
            title="Open video on YouTube with autoplay"
          >
            <iconMap.youtube size={12} />
            <span>View on YouTube</span>
            <span>↗</span>
          </button>
        )}
        {item.status === 'pending' && (
          <>
            <div className="relative group">
              <button
                onClick={() => onPostNow(item.id, item.filename || 'Unknown')}
                className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-semibold transition-all text-xs"
              >
                Post Now
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stage-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Post immediately
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => onSkip(item.id)}
                className="p-2 hover:bg-gray-600 rounded transition-colors"
              >
                <iconMap.success size={16} strokeWidth={2} className="text-gray-400 hover:text-white" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stage-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Skip this post
              </div>
            </div>
          </>
        )}
        {item.status === 'failed' && (
          <div className="relative group">
            <button
              onClick={() => onRetry(item.id)}
              className="p-2 hover:bg-gray-600 rounded transition-colors"
            >
              <iconMap.retry size={16} strokeWidth={2} className="text-blue-400 hover:text-blue-300" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stage-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Retry posting
            </div>
          </div>
        )}
        <div className="relative group">
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 hover:bg-gray-600 rounded transition-colors"
          >
            <iconMap.delete size={16} strokeWidth={2} className="text-red-400 hover:text-red-300" />
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stage-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Remove from queue
          </div>
        </div>
      </div>
    </div>
  )
}

function _ContentView({ isConnected, toast }: { isConnected: (platform: string) => boolean; toast: ReturnType<typeof useToast> }) {
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all')
  const [_editingItem, _setEditingItem] = useState<ContentItem | null>(null)

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

  const handleApprove = async (contentId: string) => {
    try {
      const result = await window.electronAPI?.approveContent(contentId)
      if (result?.success) {
        toast.success('Content approved')
        // Refresh content list
        const content = await window.electronAPI?.getContent({ limit: 100 })
        if (content && Array.isArray(content)) {
          setContentItems(content as typeof contentItems)
        }
      } else {
        toast.error(result?.error || 'Failed to approve content')
      }
    } catch (error) {
      toast.error('Failed to approve content')
    }
  }

  const handleReject = async (contentId: string, reason?: string) => {
    try {
      const result = await window.electronAPI?.rejectContent(contentId, reason || 'Rejected by user')
      if (result?.success) {
        toast.info('Content rejected')
        // Refresh content list
        const content = await window.electronAPI?.getContent({ limit: 100 })
        if (content && Array.isArray(content)) {
          setContentItems(content as typeof contentItems)
        }
      } else {
        toast.error(result?.error || 'Failed to reject content')
      }
    } catch (error) {
      toast.error('Failed to reject content')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) {
      toast.warning('No items selected')
      return
    }
    try {
      const result = await window.electronAPI?.bulkApproveContent(Array.from(selectedItems))
      if (result?.success) {
        toast.success(`Approved ${selectedItems.size} items`)
        setSelectedItems(new Set())
        // Refresh content list
        const content = await window.electronAPI?.getContent({ limit: 100 })
        if (content && Array.isArray(content)) {
          setContentItems(content as typeof contentItems)
        }
      } else {
        toast.error(result?.error || 'Failed to bulk approve')
      }
    } catch (error) {
      toast.error('Failed to bulk approve')
    }
  }

  const handleBulkReject = async () => {
    if (selectedItems.size === 0) {
      toast.warning('No items selected')
      return
    }
    if (confirm(`Are you sure you want to reject ${selectedItems.size} items?`)) {
      try {
        const result = await window.electronAPI?.bulkRejectContent(Array.from(selectedItems), 'Bulk rejection')
        if (result?.success) {
          toast.info(`Rejected ${selectedItems.size} items`)
          setSelectedItems(new Set())
          // Refresh content list
          const content = await window.electronAPI?.getContent({ limit: 100 })
          if (content && Array.isArray(content)) {
            setContentItems(content as typeof contentItems)
          }
        } else {
          toast.error(result?.error || 'Failed to bulk reject')
        }
      } catch (error) {
        toast.error('Failed to bulk reject')
      }
    }
  }

  const handleMarkLogo = async (contentId: string, hasLogo: boolean) => {
    try {
      await window.electronAPI?.markContentLogoStatus(contentId, hasLogo)
      toast.success(hasLogo ? 'Marked as has STAGE logo' : 'Marked as no logo')
      // Refresh content list
      const content = await window.electronAPI?.getContent({ limit: 100 })
      if (content && Array.isArray(content)) {
        setContentItems(content as typeof contentItems)
      }
    } catch (error) {
      toast.error('Failed to update logo status')
    }
  }

  const handleBulkMarkLogo = async (hasLogo: boolean) => {
    if (selectedItems.size === 0) {
      toast.warning('No items selected')
      return
    }
    try {
      await window.electronAPI?.bulkMarkLogoStatus(Array.from(selectedItems), hasLogo)
      toast.success(`Marked ${selectedItems.size} items as ${hasLogo ? 'has logo' : 'no logo'}`)
      setSelectedItems(new Set())
      // Refresh content list
      const content = await window.electronAPI?.getContent({ limit: 100 })
      if (content && Array.isArray(content)) {
        setContentItems(content as typeof contentItems)
      }
    } catch (error) {
      toast.error('Failed to bulk update logo status')
    }
  }

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    }
  }

  const filteredItems = contentItems.filter(item => {
    if (filterStatus === 'all') return true
    return item.approval_status === filterStatus
  })

  const handleRefreshContent = async () => {
    try {
      const content = await window.electronAPI?.getContent({ limit: 100 })
      if (content && Array.isArray(content)) {
        setContentItems(content as typeof contentItems)
        toast.success('Content refreshed')
      }
    } catch (error) {
      toast.error('Failed to refresh content')
    }
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
      {/* Help Banner */}
      <div className="bg-gradient-to-r from-semantic-info-500/10 to-semantic-info-600/5 border-2 border-semantic-info-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <iconMap.info size={24} strokeWidth={2} className="text-semantic-info-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2">
              About Content Library
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              This is your <strong className="text-white">Content Library</strong> - all videos discovered in your selected Google Drive folders. These videos are <strong className="text-white">pending approval</strong> before posting.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">Approve videos</strong> with STAGE logo, and they'll automatically post every <strong className="text-white">30 minutes</strong> to Instagram & YouTube. No manual scheduling needed!
            </p>
          </div>
        </div>
      </div>

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              Content Library ({filteredItems.length} of {contentItems.length} items)
            </h3>
            <button
              onClick={handleRefreshContent}
              className="p-2 bg-stage-red hover:bg-stage-maroon text-white rounded-lg transition-all hover:scale-105 shadow-lg shadow-stage-red/30"
              title="Refresh content library"
            >
              <iconMap.retry size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{selectedItems.size} selected</span>
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1.5 bg-semantic-success-500 hover:bg-semantic-success-600 rounded-lg text-sm font-medium transition-colors"
              >
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                className="px-3 py-1.5 bg-semantic-error-500 hover:bg-semantic-error-600 rounded-lg text-sm font-medium transition-colors"
              >
                Reject Selected
              </button>
              <button
                onClick={() => handleBulkMarkLogo(true)}
                className="px-3 py-1.5 bg-stage-red hover:bg-stage-maroon rounded-lg text-sm font-medium transition-colors"
              >
                Mark Has Logo
              </button>
              <button
                onClick={() => handleBulkMarkLogo(false)}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Mark No Logo
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1.5 bg-stage-gray-600 hover:bg-stage-gray-500 rounded-lg text-sm transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-600 pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-stage-red text-white'
                : 'text-gray-400 hover:text-white hover:bg-stage-gray-600'
            }`}
          >
            All ({contentItems.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending_review')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              filterStatus === 'pending_review'
                ? 'bg-semantic-warning-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-stage-gray-600'
            }`}
          >
            Pending Review ({contentItems.filter(i => i.approval_status === 'pending_review').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-semantic-success-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-stage-gray-600'
            }`}
          >
            Approved ({contentItems.filter(i => i.approval_status === 'approved').length})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-semantic-error-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-stage-gray-600'
            }`}
          >
            Rejected ({contentItems.filter(i => i.approval_status === 'rejected').length})
          </button>

          {/* Select All Checkbox */}
          {filteredItems.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="ml-auto px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-stage-gray-600 rounded-lg transition-colors"
            >
              {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {contentItems.length === 0 ? (
          <p className="text-gray-400">
            No content discovered yet. Select folders and click "Scan for Content".
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="text-gray-400">
            No items match the selected filter.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-auto">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.has(item.id)
              const approvalStatus = item.approval_status || 'pending_review'
              const logoStatus = item.logo_detected === 1 ? 'verified' : item.logo_detected === 0 ? 'no_logo' : 'unchecked'

              return (
                <div
                  key={item.id}
                  className={`bg-stage-gray-600 rounded-lg overflow-hidden relative ${
                    isSelected ? 'ring-2 ring-stage-ribbon' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-5 h-5 cursor-pointer rounded border-gray-400 text-stage-ribbon focus:ring-stage-ribbon"
                    />
                  </div>

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

                    {/* Status Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {/* Approval Status Badge */}
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          approvalStatus === 'approved'
                            ? 'bg-semantic-success-500 text-white'
                            : approvalStatus === 'rejected'
                            ? 'bg-semantic-error-500 text-white'
                            : 'bg-semantic-warning-500 text-white'
                        }`}
                      >
                        {approvalStatus === 'approved' ? '✓ Approved' : approvalStatus === 'rejected' ? '✗ Rejected' : '⏳ Review'}
                      </span>

                      {/* Logo Status Badge */}
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          logoStatus === 'verified'
                            ? 'bg-stage-ribbon text-white'
                            : logoStatus === 'no_logo'
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {logoStatus === 'verified' ? '🎭 STAGE' : logoStatus === 'no_logo' ? '✗ No Logo' : '? Logo'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-medium text-sm truncate" title={item.title || item.filename}>
                      {item.title || item.filename}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatFileSize(item.size_bytes)}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-1 mt-2">
                      {approvalStatus !== 'approved' && (
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="flex-1 px-2 py-1 bg-semantic-success-500 hover:bg-semantic-success-600 rounded text-xs font-medium transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {approvalStatus !== 'rejected' && approvalStatus !== 'approved' && (
                        <button
                          onClick={() => handleReject(item.id)}
                          className="flex-1 px-2 py-1 bg-semantic-error-500 hover:bg-semantic-error-600 rounded text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {logoStatus !== 'verified' && (
                        <button
                          onClick={() => handleMarkLogo(item.id, true)}
                          className="flex-1 px-2 py-1 bg-stage-red hover:bg-stage-maroon rounded text-xs font-medium transition-colors"
                          title="Mark as has STAGE logo"
                        >
                          Has Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function _ScheduleView({ toast }: { toast: ReturnType<typeof useToast> }) {
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
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Posting Schedule</h2>
        <button
          onClick={() => {
            loadSchedules()
            toast.success('Schedules refreshed')
          }}
          className="px-4 py-2 bg-stage-red hover:bg-stage-maroon text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-stage-red/30"
          title="Refresh schedules"
        >
          <iconMap.retry size={16} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Help Banner */}
      <div className="bg-gradient-to-r from-semantic-info-500/10 to-semantic-info-600/5 border-2 border-semantic-info-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <iconMap.info size={24} strokeWidth={2} className="text-semantic-info-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2">
              Configure Posting Schedule
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              Set up automated posting times for each platform. Videos from your Content Library will be automatically queued based on these schedules.
            </p>
            <ul className="text-gray-400 text-sm space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-semantic-info-500">•</span>
                <span>Select which days of the week to post</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-semantic-info-500">•</span>
                <span>Add multiple posting times per day (e.g., 9:00 AM, 2:00 PM, 6:00 PM)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-semantic-info-500">•</span>
                <span>Enable/disable scheduling for each platform independently</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

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
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (schedule) {
      setSelectedDays(schedule.days_of_week)
      setTimes(schedule.times)
      setEnabled(schedule.enabled)
      // If schedule exists with data, start in view mode
      if (schedule.days_of_week.length > 0 && schedule.times.length > 0) {
        setIsEditing(false)
      } else {
        // If no schedule data, start in edit mode
        setIsEditing(true)
      }
    } else {
      // No schedule at all, start in edit mode
      setIsEditing(true)
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
        setIsEditing(false) // Switch to view mode after successful save
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
    <div className={`bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 shadow-xl shadow-stage-maroon/10 transition-all ${
      !isEditing && selectedDays.length > 0 && times.length > 0
        ? 'border-semantic-success-500/50 shadow-semantic-success-500/20'
        : 'border-stage-red/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <IconComponent size={20} strokeWidth={1.75} className={iconColor} />
            {label} Schedule
          </h3>
          {!isEditing && selectedDays.length > 0 && times.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-semantic-success-500/20 border border-semantic-success-500/50 rounded-full text-xs font-semibold text-semantic-success-500">
              <iconMap.success size={14} strokeWidth={2} />
              Schedule Saved
            </span>
          )}
        </div>
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
                onClick={() => isEditing && toggleDay(index)}
                disabled={!isEditing}
                className={`px-3 py-2 rounded transition-colors text-sm ${
                  selectedDays.includes(index)
                    ? 'bg-stage-red text-white'
                    : 'bg-stage-gray-600 text-gray-300'
                } ${isEditing ? 'hover:bg-gray-600 cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time selection */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Post at times:</label>
          {isEditing && (
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
          )}
          <div className="flex gap-2 flex-wrap">
            {times.map((time) => (
              <span
                key={time}
                className="px-3 py-1.5 bg-stage-gray-600 rounded text-sm flex items-center gap-2"
              >
                {time}
                {isEditing && (
                  <button
                    onClick={() => removeTime(time)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving || selectedDays.length === 0 || times.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-semantic-success-600 to-semantic-success-500 text-white rounded-lg font-semibold hover:scale-105 transition-all shadow-lg shadow-semantic-success-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <iconMap.loading size={16} strokeWidth={2} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Schedule'
                )}
              </button>
              {!saving && schedule && selectedDays.length > 0 && times.length > 0 && (
                <button
                  onClick={() => {
                    // Revert to saved state
                    if (schedule) {
                      setSelectedDays(schedule.days_of_week)
                      setTimes(schedule.times)
                      setEnabled(schedule.enabled)
                    }
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-stage-gray-600 text-white rounded-lg font-semibold hover:bg-stage-gray-500 transition-colors"
            >
              Edit Schedule
            </button>
          )}
        </div>

        {/* Validation messages */}
        {isEditing && (
          <>
            {selectedDays.length === 0 && (
              <p className="text-sm text-semantic-warning-500 flex items-center gap-2">
                <iconMap.warning size={16} strokeWidth={2} />
                Select at least one day
              </p>
            )}
            {times.length === 0 && (
              <p className="text-sm text-semantic-warning-500 flex items-center gap-2">
                <iconMap.warning size={16} strokeWidth={2} />
                Add at least one time slot
              </p>
            )}
          </>
        )}
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
  const { appVersion, setSchedulerPaused } = useAppStore()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    notifySuccess: true,
    notifyFailed: true,
    minimizeToTray: true,
    startOnBoot: false,
  })

  // YouTube Channels state
  const [youtubeChannels, setYoutubeChannels] = useState<Array<{
    id: string
    channel_id: string
    channel_handle: string | null
    channel_name: string | null
    channel_url: string | null
    account_id: string
    daily_quota: number
    posts_today: number
    enabled: boolean
    created_at: string
    last_reset_at: string
  }>>([])
  const [channelStats, setChannelStats] = useState({
    totalChannels: 0,
    enabledChannels: 0,
    totalQuota: 0,
    usedQuota: 0,
    availableQuota: 0,
  })

  const [smartPosting, setSmartPosting] = useState({
    enabled: false,
    logos: [null, null, null] as (string | null)[],
    sensitivity: 80,
    noLogoAction: 'hold' as 'skip' | 'hold' | 'notify',
  })

  // Load YouTube channels function
  const loadYouTubeChannels = async () => {
    try {
      const channels = await window.electronAPI?.getYouTubeChannels?.()
      if (channels) {
        setYoutubeChannels(channels as any[])
      }

      const stats = await window.electronAPI?.getYouTubeChannelStats?.()
      if (stats) {
        setChannelStats(stats)
      }
    } catch (error) {
      console.error('Failed to load YouTube channels:', error)
    }
  }

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

    // Load smart posting settings
    window.electronAPI?.getSmartPostingSettings?.().then((spSettings: any) => {
      if (spSettings) {
        setSmartPosting({
          enabled: spSettings.enabled || false,
          logos: spSettings.logoReferencePath ? [spSettings.logoReferencePath, null, null] : [null, null, null],
          sensitivity: Math.round((spSettings.sensitivity || 0.7) * 100),
          noLogoAction: spSettings.noLogoAction || 'hold',
        })
      }
    }).catch(() => {
      // Smart posting not available yet, use defaults
    })

    // Load YouTube channels
    loadYouTubeChannels()

    // Listen for channel updates
    window.electronAPI?.onYouTubeChannelsUpdated?.(() => {
      loadYouTubeChannels()
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

  const handleSmartPostingToggle = async () => {
    const newEnabled = !smartPosting.enabled

    // Check if logo is uploaded when enabling
    if (newEnabled && !smartPosting.logos[0]) {
      toast.error('Please upload a STAGE logo reference first')
      return
    }

    try {
      await window.electronAPI?.updateSmartPostingSettings?.({ enabled: newEnabled })
      setSmartPosting({ ...smartPosting, enabled: newEnabled })
      toast.success(`Smart Posting ${newEnabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      toast.error('Failed to update Smart Posting settings')
      console.error('Smart posting toggle error:', error)
    }
  }

  const handleUploadLogo = async (slot: number) => {
    try {
      const result: any = await window.electronAPI?.uploadSmartPostingLogo?.()

      if (result.success && result.path) {
        const newLogos = [...smartPosting.logos]
        newLogos[slot] = result.path
        setSmartPosting({ ...smartPosting, logos: newLogos })
        toast.success('STAGE logo uploaded successfully')
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to upload logo')
      console.error('Logo upload error:', error)
    }
  }

  const handleRemoveLogo = (slot: number) => {
    const newLogos = [...smartPosting.logos]
    if (newLogos[slot]) {
      URL.revokeObjectURL(newLogos[slot]!)
    }
    newLogos[slot] = null
    setSmartPosting({ ...smartPosting, logos: newLogos })
    toast.info(`Logo ${slot + 1} removed`)
  }

  const handleSensitivityChange = async (value: number) => {
    try {
      await window.electronAPI?.updateSmartPostingSettings?.({ sensitivity: value / 100 })
      setSmartPosting({ ...smartPosting, sensitivity: value })
    } catch (error) {
      toast.error('Failed to update sensitivity')
      console.error('Sensitivity update error:', error)
    }
  }

  const handleNoLogoActionChange = async (action: 'skip' | 'hold' | 'notify') => {
    try {
      await window.electronAPI?.updateSmartPostingSettings?.({ noLogoAction: action })
      setSmartPosting({ ...smartPosting, noLogoAction: action })
      toast.success('Smart Posting settings updated')
    } catch (error) {
      toast.error('Failed to update settings')
      console.error('No logo action update error:', error)
    }
  }

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

  const handleSyncYouTubeChannels = async () => {
    try {
      const result = await window.electronAPI?.syncYouTubeChannels?.()

      if (result?.success) {
        toast.success(`Found ${result.channelsFound} channel(s) from YouTube!`)
        await loadYouTubeChannels()
      } else {
        toast.error(result?.error || 'Failed to sync channels')
      }
    } catch (error) {
      toast.error('Failed to sync channels from YouTube')
      console.error('Sync channels error:', error)
    }
  }

  const handleToggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      await window.electronAPI?.toggleYouTubeChannel?.(channelId, enabled)
      toast.success(`Channel ${enabled ? 'enabled' : 'disabled'}`)
      await loadYouTubeChannels()
    } catch (error) {
      toast.error('Failed to toggle channel')
    }
  }

  const handleRefreshSettings = async () => {
    try {
      // Reload settings
      const loadedSettings: any = await window.electronAPI?.getSettings()
      if (loadedSettings) {
        setSettings({
          notifySuccess: loadedSettings.notifySuccess !== false,
          notifyFailed: loadedSettings.notifyFailed !== false,
          minimizeToTray: loadedSettings.minimizeToTray !== false,
          startOnBoot: loadedSettings.startOnBoot === true,
        })
      }

      // Reload smart posting settings
      const spSettings: any = await window.electronAPI?.getSmartPostingSettings?.()
      if (spSettings) {
        setSmartPosting({
          enabled: spSettings.enabled || false,
          logos: spSettings.logoReferencePath ? [spSettings.logoReferencePath, null, null] : [null, null, null],
          sensitivity: Math.round((spSettings.sensitivity || 0.7) * 100),
          noLogoAction: spSettings.noLogoAction || 'hold',
        })
      }

      // Reload posting status
      const status = await window.electronAPI?.getPostingStatus()
      if (status) {
        setPostingStatus(status)
      }

      // Reload YouTube channels
      await loadYouTubeChannels()

      toast.success('Settings refreshed')
    } catch (error) {
      toast.error('Failed to refresh settings')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
        <button
          onClick={handleRefreshSettings}
          className="px-4 py-2 bg-stage-red hover:bg-stage-maroon text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-stage-red/30"
          title="Refresh settings"
        >
          <iconMap.retry size={16} strokeWidth={2} />
          Refresh
        </button>
      </div>

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

      {/* YouTube Channels (Multi-Channel Support) */}
      {isConnected('youtube') && (
        <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">YouTube Channels</h3>
            <button
              onClick={handleSyncYouTubeChannels}
              className="px-4 py-2 bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#CC0000] hover:to-[#990000] text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-red-500/30"
              title="Fetch all channels from your YouTube account"
            >
              <iconMap.retry size={16} strokeWidth={2} />
              Sync from YouTube
            </button>
          </div>

          {youtubeChannels.length > 0 && (
            <div className="text-sm text-gray-400 mb-4">
              {channelStats.enabledChannels}/{channelStats.totalChannels} active • {channelStats.availableQuota}/{channelStats.totalQuota} posts available today
            </div>
          )}

          <div className="space-y-3">
            {youtubeChannels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between p-4 bg-stage-gray-600 rounded-lg border border-stage-gray-500 hover:border-stage-red/50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <iconMap.youtube size={24} className="text-[#FF0000]" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{channel.channel_name || channel.channel_handle}</p>
                    <p className="text-sm text-gray-400">{channel.channel_handle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {channel.posts_today}/{channel.daily_quota} posts today
                    </p>
                    <p className="text-xs text-gray-400">
                      {channel.daily_quota - channel.posts_today} remaining
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggleChannel(channel.id, !channel.enabled)}
                  className={`ml-4 relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
                    channel.enabled ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
                  }`}
                  title={channel.enabled ? 'Disable channel' : 'Enable channel'}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      channel.enabled ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            ))}

            {youtubeChannels.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <iconMap.youtube size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-semibold text-white mb-2">No YouTube channels connected</p>
                <p className="text-sm mb-4">Click "Sync from YouTube" to fetch all your channels</p>
                <button
                  onClick={handleSyncYouTubeChannels}
                  className="px-6 py-3 bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#CC0000] hover:to-[#990000] text-white rounded-lg font-semibold transition-all inline-flex items-center gap-2 hover:scale-105 shadow-lg shadow-red-500/30"
                >
                  <iconMap.youtube size={20} strokeWidth={2} />
                  Sync Channels from YouTube
                </button>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {youtubeChannels.length > 0 && (
            <div className="mt-4 p-4 bg-stage-gray-900 rounded-lg border border-stage-red/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-stage-ribbon">{channelStats.totalQuota}</p>
                  <p className="text-xs text-gray-400">Total Quota/Day</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{channelStats.usedQuota}</p>
                  <p className="text-xs text-gray-400">Used Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{channelStats.availableQuota}</p>
                  <p className="text-xs text-gray-400">Available</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-white">Notify on successful post</span>
            <button
              onClick={() => handleSettingChange('notifySuccess', !settings.notifySuccess)}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
                settings.notifySuccess ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  settings.notifySuccess ? 'translate-x-9' : 'translate-x-1'
                }`}
              ></span>
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-white">Notify on failed post</span>
            <button
              onClick={() => handleSettingChange('notifyFailed', !settings.notifyFailed)}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
                settings.notifyFailed ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  settings.notifyFailed ? 'translate-x-9' : 'translate-x-1'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <h3 className="text-lg font-semibold mb-4">General</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-white">Minimize to system tray</span>
            <button
              onClick={() => handleSettingChange('minimizeToTray', !settings.minimizeToTray)}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
                settings.minimizeToTray ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  settings.minimizeToTray ? 'translate-x-9' : 'translate-x-1'
                }`}
              ></span>
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-white">Start on system boot</span>
            <button
              onClick={() => handleSettingChange('startOnBoot', !settings.startOnBoot)}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
                settings.startOnBoot ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  settings.startOnBoot ? 'translate-x-9' : 'translate-x-1'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* Smart Posting (Logo Detection) */}
      <div className="bg-gradient-to-br from-stage-gray-700 to-stage-gray-800 rounded-2xl p-6 border-2 border-stage-red/30 shadow-xl shadow-stage-maroon/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Smart Posting
              <span className="px-2 py-0.5 bg-stage-ribbon/20 border border-stage-ribbon/50 rounded text-xs font-bold text-stage-ribbon">
                AI
              </span>
            </h3>
            <p className="text-sm text-gray-400 mt-1">Only post videos with STAGE logo detected</p>
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between py-3 mb-4 border-b border-gray-700">
          <div>
            <p className="text-white font-medium">Enable Smart Posting</p>
            <p className="text-sm text-gray-400">Automatically detect STAGE logo in videos</p>
          </div>
          <button
            onClick={handleSmartPostingToggle}
            className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
              smartPosting.enabled ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                smartPosting.enabled ? 'translate-x-9' : 'translate-x-1'
              }`}
            ></span>
          </button>
        </div>

        {smartPosting.enabled && (
          <div className="space-y-4">
            {/* Logo Upload - 3 Variations */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">STAGE Logo References (Up to 3 variations)</label>
              <p className="text-xs text-gray-500 mb-3">
                Upload multiple logo variations for better detection (e.g., horizontal, vertical, icon-only)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {smartPosting.logos.map((logo, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-700 rounded-lg p-3 bg-stage-gray-600/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-300">Logo {index + 1}</span>
                      {logo && (
                        <button
                          onClick={() => handleRemoveLogo(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Remove logo"
                        >
                          <iconMap.delete size={14} strokeWidth={2} />
                        </button>
                      )}
                    </div>

                    {logo ? (
                      <div className="space-y-2">
                        <div className="h-24 w-full border-2 border-stage-ribbon rounded-lg bg-stage-gray-600 p-2 overflow-hidden flex items-center justify-center">
                          <img
                            src={logo}
                            alt={`STAGE Logo ${index + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <button
                          onClick={() => handleUploadLogo(index)}
                          className="w-full px-3 py-1.5 bg-stage-gray-600 hover:bg-stage-gray-500 text-white rounded text-xs font-medium transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUploadLogo(index)}
                        className="w-full h-24 border-2 border-dashed border-gray-600 rounded-lg bg-stage-gray-700 hover:border-stage-ribbon hover:bg-stage-gray-600 transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <iconMap.content size={24} strokeWidth={1.5} className="text-gray-500 group-hover:text-stage-ribbon transition-colors" />
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                          Upload Logo
                        </span>
                      </button>
                    )}

                    {logo && (
                      <div className="flex items-center gap-1 mt-2">
                        <iconMap.success size={12} className="text-green-500" />
                        <span className="text-xs text-green-500">Uploaded</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <iconMap.info size={16} strokeWidth={2} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-300 font-medium mb-1">Tip: Upload different logo variations</p>
                    <ul className="text-xs text-blue-200/80 space-y-1">
                      <li>• Logo 1: Horizontal version (most common)</li>
                      <li>• Logo 2: Vertical/stacked version</li>
                      <li>• Logo 3: Icon-only or alternative color</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Detection Sensitivity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Detection Sensitivity</label>
                <span className="text-sm font-semibold text-white">{smartPosting.sensitivity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={smartPosting.sensitivity}
                onChange={(e) => handleSensitivityChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-stage-red"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Loose (50%)</span>
                <span>Balanced (75%)</span>
                <span>Strict (100%)</span>
              </div>
            </div>

            {/* Action for non-logo videos */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">When logo not detected:</label>
              <select
                value={smartPosting.noLogoAction}
                onChange={(e) => handleNoLogoActionChange(e.target.value as 'skip' | 'hold' | 'notify')}
                className="w-full bg-stage-gray-600 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-stage-ribbon focus:outline-none"
              >
                <option value="skip">Skip posting automatically</option>
                <option value="hold">Hold for manual review</option>
                <option value="notify">Post but notify me</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {smartPosting.noLogoAction === 'skip' && 'Videos without logo will not be added to queue'}
                {smartPosting.noLogoAction === 'hold' && 'Videos without logo will be held for your review'}
                {smartPosting.noLogoAction === 'notify' && 'Videos will post anyway, but you\'ll receive a notification'}
              </p>
            </div>

            {/* Rejected Videos Link */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-start gap-3">
                <iconMap.info size={20} strokeWidth={2} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-2">Review Rejected Videos</p>
                  <p className="text-xs text-gray-400 mb-3">
                    Videos without STAGE logo will be moved to a separate folder in your Google Drive for review.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        window.open('https://drive.google.com/drive/my-drive', '_blank')
                        toast.info('Opening Google Drive. Look for "SocialSync - Rejected Videos" folder.')
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-fit"
                    >
                      <iconMap.googleDrive size={16} strokeWidth={2} />
                      Open Google Drive
                    </button>
                    <p className="text-xs text-gray-500">
                      💡 Tip: Create a folder named "SocialSync - Rejected Videos" in your Drive to store videos without the logo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <p className="text-xs font-black text-[#c60c0c] font-poppins tracking-wide">STAGE</p>
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
  // Get platform-specific icon color
  const getPlatformColor = () => {
    if (name === 'Instagram') return 'text-platform-instagram'
    if (name === 'YouTube') return 'text-platform-youtube'
    if (name === 'Google Drive') return 'text-platform-google'
    return 'text-stage-ribbon'
  }

  const handleToggle = () => {
    if (connecting) return
    if (connected && account) {
      onDisconnect(account.id)
    } else {
      onConnect()
    }
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-700 last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <IconComponent size={24} strokeWidth={1.75} className={getPlatformColor()} />
        <div>
          <p className="font-medium text-white">{name}</p>
          {connected && account && (
            <p className="text-sm text-gray-400">{account.account_name}</p>
          )}
          {connecting && (
            <p className="text-sm text-blue-400">Connecting...</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${connected ? 'text-green-500' : 'text-gray-500'}`}>
          {connected ? 'Connected' : 'Not Connected'}
        </span>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={connecting}
          className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 ${
            connecting ? 'opacity-50 cursor-wait' : ''
          } ${
            connected ? 'bg-green-500 shadow-lg shadow-green-500/40' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              connected ? 'translate-x-9' : 'translate-x-1'
            }`}
          ></span>
        </button>
      </div>
    </div>
  )
}

function _PostedView({ toast }: { toast: ReturnType<typeof useToast> }) {
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
      // Add autoplay parameter for YouTube videos
      const urlWithAutoplay = url.includes('youtube.com')
        ? (url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`)
        : url
      window.open(urlWithAutoplay, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Help Banner */}
      <div className="bg-gradient-to-r from-semantic-success-500/10 to-semantic-success-600/5 border-2 border-semantic-success-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <iconMap.success size={24} strokeWidth={2} className="text-semantic-success-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-2">
              Successfully Posted Videos
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              These videos have been successfully published to your social media platforms. They are now live on Instagram and/or YouTube. You can click on any video to view it on the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Posted Videos</h2>
        <button
          onClick={loadPostedVideos}
          disabled={loading}
          className="px-4 py-2 bg-stage-red hover:bg-stage-maroon text-white rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg shadow-stage-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh posted videos"
        >
          <iconMap.retry size={16} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
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
