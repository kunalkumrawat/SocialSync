import { useEffect } from 'react'
import { useAppStore, View } from './stores/appStore'

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
    window.electronAPI?.getAccounts().then((accts) => {
      setAccounts(accts as typeof accounts)
    }).catch(console.error)

    // Listen for scheduler toggle from tray
    window.electronAPI?.onSchedulerToggle((paused) => {
      setSchedulerPaused(paused)
    })
  }, [setAppVersion, setAccounts, setSchedulerPaused])

  const navItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
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

function DashboardView({ stats }: { stats: { pendingPosts: number; postedToday: number; failed: number } }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Pending Posts" value={stats.pendingPosts.toString()} icon="📤" />
        <StatCard title="Posted Today" value={stats.postedToday.toString()} icon="✅" />
        <StatCard title="Failed" value={stats.failed.toString()} icon="❌" color={stats.failed > 0 ? 'red' : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📸</span> Instagram
          </h3>
          <p className="text-gray-400">Connect Instagram to see upcoming posts.</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎬</span> YouTube
          </h3>
          <p className="text-gray-400">Connect YouTube to see upcoming posts.</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-gray-400">No recent activity. Start posting to see your history here.</p>
      </div>
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
  const { instagramQueue, youtubeQueue } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-700 pb-4">
        <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          Instagram ({instagramQueue.length})
        </button>
        <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
          YouTube ({youtubeQueue.length})
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Content Queue</h3>
          <button className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 transition-colors">
            Refresh
          </button>
        </div>

        {instagramQueue.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No items in queue.</p>
            <p className="text-gray-500 text-sm">
              Connect Google Drive and add folders to start queuing content.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {instagramQueue.map((item) => (
              <QueueItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function QueueItemRow({ item }: { item: { id: string; filename?: string; scheduled_for: string; status: string } }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎬</span>
        <div>
          <p className="font-medium">{item.filename || 'Unknown file'}</p>
          <p className="text-sm text-gray-400">
            Scheduled: {new Date(item.scheduled_for).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-1 text-xs rounded ${
            item.status === 'pending'
              ? 'bg-yellow-600'
              : item.status === 'posted'
              ? 'bg-green-600'
              : 'bg-red-600'
          }`}
        >
          {item.status}
        </span>
        <button className="p-1 hover:bg-gray-600 rounded">⏭️</button>
      </div>
    </div>
  )
}

function ScheduleView() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>📸</span> Instagram Schedule
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-blue-500" />
            <span className="text-sm">Enabled</span>
          </label>
        </div>
        <p className="text-gray-400 mb-4">Connect Instagram to configure schedule.</p>
        <ScheduleGrid />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>🎬</span> YouTube Schedule
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-blue-500" />
            <span className="text-sm">Enabled</span>
          </label>
        </div>
        <p className="text-gray-400 mb-4">Connect YouTube to configure schedule.</p>
        <ScheduleGrid />
      </div>
    </div>
  )
}

function ScheduleGrid() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {days.map((day) => (
          <button
            key={day}
            className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors text-sm"
          >
            {day}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="time"
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
          defaultValue="09:00"
        />
        <button className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm">
          Add Time
        </button>
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
  const handleConnect = async (platform: string) => {
    const result = await window.electronAPI?.connectAccount(platform)
    console.log('Connect result:', result)
  }

  const handleDisconnect = async (accountId: string) => {
    await window.electronAPI?.disconnectAccount(accountId)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
        <div className="space-y-3">
          <AccountRow
            name="Google Drive"
            icon="📁"
            connected={isConnected('google')}
            account={accounts.find((a) => a.platform === 'google')}
            onConnect={() => handleConnect('google')}
            onDisconnect={handleDisconnect}
          />
          <AccountRow
            name="Instagram"
            icon="📸"
            connected={isConnected('instagram')}
            account={accounts.find((a) => a.platform === 'instagram')}
            onConnect={() => handleConnect('instagram')}
            onDisconnect={handleDisconnect}
          />
          <AccountRow
            name="YouTube"
            icon="🎬"
            connected={isConnected('youtube')}
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
  account,
  onConnect,
  onDisconnect,
}: {
  name: string
  icon: string
  connected: boolean
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
        </div>
      </div>
      <button
        onClick={() => (connected && account ? onDisconnect(account.id) : onConnect())}
        className={`px-4 py-1.5 rounded text-sm font-medium ${
          connected
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors`}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}

export default App
