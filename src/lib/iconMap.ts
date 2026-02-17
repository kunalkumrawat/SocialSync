import {
  LayoutDashboard,    // Dashboard 📊 → Modern analytics icon
  FolderOpen,         // Content 📁 → Browse/explore metaphor
  ListChecks,         // Queue 📋 → Checklist with progress
  CheckCircle2,       // Posted ✅ → Success completion
  CalendarClock,      // Schedule 🕐 → Time + calendar combo
  Settings,           // Settings ⚙️ → Universal settings icon
  Instagram,          // Instagram 📸 → Official platform icon
  Youtube,            // YouTube 🎬 → Official platform icon
  HardDrive,          // Google Drive 📁 → Storage metaphor
  SendHorizontal,     // Pending 📤 → Ready to send
  XCircle,            // Failed ❌ → Error indicator
  AlertTriangle,      // Warning ⚠️ → Caution indicator
  Search,             // Search 🔍 → Discovery
  FileText,           // Activity 📝 → Log/document
  RefreshCw,          // Retry 🔄 → Circular refresh
  Trash2,             // Delete 🗑️ → Modern trash icon
  Lightbulb,          // Tips 💡 → Insights
  Loader2,            // Loading → Spinner
  Info,               // Info → Information
  X,                  // Close ✕ → Close/dismiss icon
} from 'lucide-react'

export const iconMap = {
  // Navigation
  dashboard: LayoutDashboard,
  content: FolderOpen,
  queue: ListChecks,
  posted: CheckCircle2,
  schedule: CalendarClock,
  settings: Settings,

  // Platforms
  instagram: Instagram,
  youtube: Youtube,
  googleDrive: HardDrive,

  // Status
  pending: SendHorizontal,
  failed: XCircle,
  warning: AlertTriangle,
  success: CheckCircle2,

  // Actions
  search: Search,
  activity: FileText,
  retry: RefreshCw,
  refresh: RefreshCw,
  delete: Trash2,
  tips: Lightbulb,
  loading: Loader2,
  info: Info,
  close: X,
} as const

export type IconName = keyof typeof iconMap
