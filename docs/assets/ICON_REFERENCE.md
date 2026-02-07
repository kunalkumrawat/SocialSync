# SocialSync Icon Reference

## Icon System: Lucide React

**Library:** Lucide React (https://lucide.dev)
**Version:** Latest
**Design Language:** 24px grid, consistent stroke weight
**License:** ISC (permissive, commercial use allowed)

---

## Icon Specifications

### Default Properties
```
Size: 20px
Stroke Width: 1.75
Color: Inherits from parent or semantic colors
Format: SVG (vector, infinitely scalable)
```

### Size Scale
```
Badge:      16px  (small indicators, inline badges)
Inline:     20px  (default, actions, inline with text)
Navigation: 22px  (sidebar navigation items)
Header:     24px  (section headers, platform indicators)
Large:      32px  (video thumbnails, prominent indicators)
Stat:       48px  (dashboard statistics cards)
Hero:       64px  (empty states, hero sections)
```

### Stroke Width Variations
```
Default:    1.75  (most UI elements)
Light:      1.5   (large icons 48px+)
Bold:       2.0   (emphasis, alerts, notifications)
```

---

## Icons Used in SocialSync

### Navigation Icons (22px, stroke 1.75)

#### LayoutDashboard
- **Name:** `LayoutDashboard`
- **Usage:** Dashboard navigation item
- **Replaces:** 📊 emoji
- **Context:** Main analytics and overview section
- **Color:** Inherits, white on active

#### FolderOpen
- **Name:** `FolderOpen`
- **Usage:** Content library navigation, folder browsing
- **Replaces:** 📁 emoji
- **Context:** Content management, file browsing
- **Color:** Inherits, white on active

#### ListChecks
- **Name:** `ListChecks`
- **Usage:** Queue navigation item
- **Replaces:** 📋 emoji
- **Context:** Scheduled posts management
- **Color:** Inherits, white on active

#### CheckCircle2
- **Name:** `CheckCircle2`
- **Usage:** Posted navigation item, success indicators
- **Replaces:** ✅ emoji
- **Context:** Successfully posted content
- **Color:** Semantic success green or inherits

#### CalendarClock
- **Name:** `CalendarClock`
- **Usage:** Schedule navigation item
- **Replaces:** 🕐 emoji
- **Context:** Posting schedule configuration
- **Color:** Inherits, white on active

#### Settings
- **Name:** `Settings`
- **Usage:** Settings navigation item
- **Replaces:** ⚙️ emoji
- **Context:** Application configuration
- **Color:** Inherits, white on active

---

### Platform Icons (20-24px, stroke 1.75)

#### Instagram
- **Name:** `Instagram`
- **Usage:** Instagram platform indicator
- **Replaces:** 📸 emoji
- **Context:** Instagram posts, accounts, filters
- **Color:** Platform Instagram Pink (#E4405F)
- **Notes:** Official Instagram icon, maintain brand color

#### Youtube
- **Name:** `Youtube`
- **Usage:** YouTube platform indicator
- **Replaces:** 🎬 emoji
- **Context:** YouTube posts, accounts, filters, video placeholders
- **Color:** Platform YouTube Red (#FF0000)
- **Notes:** Official YouTube icon, maintain brand color

#### HardDrive
- **Name:** `HardDrive`
- **Usage:** Google Drive connection and storage
- **Replaces:** 📁 emoji (in Google context)
- **Context:** Google Drive integration, file storage
- **Color:** Platform Google Blue (#4285F4) or gray-400
- **Notes:** Represents cloud storage metaphor

---

### Status Icons (20px, stroke 1.75-2.0)

#### CheckCircle2 (Success)
- **Name:** `CheckCircle2`
- **Usage:** Success states, posted status
- **Replaces:** ✅ emoji
- **Context:** Successful actions, completed tasks
- **Color:** Semantic Success (#22c55e)
- **Size Variations:** 16-20px for status badges

#### XCircle (Error)
- **Name:** `XCircle`
- **Usage:** Error states, failed posts
- **Replaces:** ❌ emoji
- **Context:** Failed actions, errors
- **Color:** Semantic Error (#ef4444)
- **Size Variations:** 16-20px for status badges

#### AlertTriangle (Warning)
- **Name:** `AlertTriangle`
- **Usage:** Warning states, attention needed
- **Replaces:** ⚠️ emoji
- **Context:** Pending items, scheduler paused
- **Color:** Semantic Warning (#eab308)
- **Size Variations:** 16-20px for warnings

#### SendHorizontal (Pending)
- **Name:** `SendHorizontal`
- **Usage:** Pending posts, ready to send
- **Replaces:** 📤 emoji
- **Context:** Queued items waiting for posting
- **Color:** Semantic Warning (#eab308) or gray
- **Notes:** Indicates "ready to go" state

---

### Action Icons (20px, stroke 1.75)

#### Search
- **Name:** `Search`
- **Usage:** Search actions, scan events
- **Replaces:** 🔍 emoji
- **Context:** Content scanning, discovery
- **Color:** STAGE Ribbon (#e10d37) or gray-400

#### FileText
- **Name:** `FileText`
- **Usage:** Activity log, document actions
- **Replaces:** 📝 emoji
- **Context:** Activity feed, general events
- **Color:** STAGE Ribbon (#e10d37) or gray-400

#### RefreshCw
- **Name:** `RefreshCw`
- **Usage:** Retry actions, reload
- **Replaces:** 🔄 emoji
- **Context:** Retry failed posts, refresh data
- **Color:** Semantic Info (#3b82f6) or gray-400

#### Trash2
- **Name:** `Trash2`
- **Usage:** Delete actions
- **Replaces:** 🗑️ emoji
- **Context:** Remove queue items, delete content
- **Color:** Semantic Error (#ef4444) on hover

#### Lightbulb
- **Name:** `Lightbulb`
- **Usage:** Tips, insights, suggestions
- **Replaces:** 💡 emoji
- **Context:** Help content, suggestions
- **Color:** Semantic Warning (#eab308) or gray-400

#### Loader2
- **Name:** `Loader2`
- **Usage:** Loading states
- **Context:** Processing, loading data
- **Color:** STAGE Ribbon or gray-400
- **Notes:** Add rotation animation (animate-spin)

#### Info
- **Name:** `Info`
- **Usage:** Informational messages
- **Replaces:** ℹ️ emoji
- **Context:** Info toasts, help text
- **Color:** Semantic Info (#3b82f6)

#### X
- **Name:** `X`
- **Usage:** Close buttons, dismiss actions
- **Replaces:** ✕ text character
- **Context:** Toast close, modal dismiss
- **Color:** White or gray-400
- **Size:** 16px typically

---

## Icon Color Application Rules

### Semantic Color Usage

**Success (Green #22c55e):**
- Posted status badges
- Success toast notifications
- Checkmark indicators
- Completed actions

**Error (Red #ef4444):**
- Failed status badges
- Error toast notifications
- Delete actions (hover)
- X icons in error context

**Warning (Yellow #eab308):**
- Pending status badges
- Warning toast notifications
- Attention indicators
- Alert triangles

**Info (Blue #3b82f6):**
- Processing status
- Info toast notifications
- Informational icons
- Refresh/reload actions

### Platform Color Usage

**Instagram Pink (#E4405F):**
- Instagram icon in all contexts
- Instagram platform indicators
- Instagram tabs and filters

**YouTube Red (#FF0000):**
- YouTube icon in all contexts
- YouTube platform indicators
- YouTube tabs and filters
- Video placeholder icons

**Google Blue (#4285F4):**
- Google Drive icon
- Google-related features
- Storage indicators

### Brand Color Usage

**STAGE Ribbon (#e10d37):**
- General action icons
- Activity feed icons
- Settings account rows
- Non-semantic icon accents

**Gray-400 (#9ca3af):**
- Disabled icons
- Secondary icons
- Empty state icons
- Inactive states

---

## Icon Component Implementation

### React Component Usage
```tsx
import { iconMap } from '@/lib/iconMap'

// Basic usage
<iconMap.dashboard size={22} strokeWidth={1.75} />

// With color
<iconMap.success size={20} className="text-semantic-success-500" />

// With animation
<iconMap.loading size={20} className="animate-spin text-stage-ribbon" />

// Platform icon with brand color
<iconMap.instagram size={24} className="text-platform-instagram" />
```

### Size Guidelines by Context

**Navigation (22px):**
```tsx
<iconMap.dashboard size={22} strokeWidth={1.75} />
```

**Stat Cards (48px, light stroke):**
```tsx
<iconMap.content size={48} strokeWidth={1.5} />
```

**Platform Headers (24px):**
```tsx
<iconMap.instagram size={24} className="text-platform-instagram" />
```

**Toast Notifications (20px, bold stroke):**
```tsx
<iconMap.success size={20} strokeWidth={2} />
```

**Inline with Text (20px):**
```tsx
<iconMap.youtube size={20} className="inline mr-2" />
```

---

## Figma Implementation

### Setting Up Icons in Figma

1. **Install Iconify Plugin:**
   - Open Figma
   - Go to Plugins > Browse Plugins
   - Search "Iconify"
   - Install and open

2. **Import Lucide Icons:**
   - In Iconify plugin, search "Lucide"
   - Find the icons by name (e.g., "LayoutDashboard")
   - Insert as component instances

3. **Create Icon Components:**
   - Create a frame called "Icons"
   - Insert each icon at 20px (default size)
   - Convert to component (Ctrl/Cmd + Alt + K)
   - Name: "Icon/Navigation/Dashboard"

4. **Set Up Icon Properties:**
   - Add color property (colors from style guide)
   - Add size variant (16, 20, 22, 24, 32, 48, 64)
   - Add stroke variant (1.5, 1.75, 2.0)

5. **Organize by Category:**
   ```
   Icons/
     Navigation/
       - Dashboard
       - Content
       - Queue
       - Posted
       - Schedule
       - Settings
     Platform/
       - Instagram
       - Youtube
       - Google Drive
     Status/
       - Success
       - Error
       - Warning
       - Pending
     Actions/
       - Search
       - Activity
       - Refresh
       - Delete
       - Tips
       - Loading
       - Info
       - Close
   ```

### Icon Documentation Page in Figma

**Create a page showing:**
- Icon grid (all icons at 20px)
- Size comparison (same icon at all sizes)
- Color variations (semantic colors)
- Usage examples (with screenshots)
- Do's and Don'ts

---

## Accessibility Guidelines

### Best Practices

**Always:**
- Provide text labels with icons in navigation
- Use semantic colors for status icons
- Maintain minimum 16px size for interactive icons
- Ensure sufficient contrast (3:1 minimum)
- Add aria-labels for icon-only buttons

**Never:**
- Use icons without context (unless universally recognized)
- Use color as the only indicator (combine with shape/icon)
- Make icons smaller than 16px for interactive elements
- Use low-contrast icon colors on dark backgrounds

---

## Icon Maintenance

### Adding New Icons

1. **Check Lucide Library:**
   - Visit https://lucide.dev
   - Search for appropriate icon
   - Note exact name

2. **Add to iconMap.ts:**
   ```typescript
   import { NewIcon } from 'lucide-react'

   export const iconMap = {
     // ... existing icons
     newIcon: NewIcon,
   }
   ```

3. **Document Usage:**
   - Add to this reference
   - Include size, color, context
   - Add to Figma icon library

### Replacing Icons

Only replace icons if:
- Better metaphor found
- Lucide updates with improved version
- User feedback indicates confusion
- Accessibility issues identified

Always maintain consistency across platform.

---

## Quick Reference Table

| Icon | Name | Size | Color | Usage |
|------|------|------|-------|-------|
| LayoutDashboard | Dashboard | 22px | White/inherit | Navigation |
| FolderOpen | Content | 20-22px | White/inherit | Files/Navigation |
| ListChecks | Queue | 22px | White/inherit | Navigation |
| CheckCircle2 | Success | 16-20px | Success green | Status |
| CalendarClock | Schedule | 22px | White/inherit | Navigation |
| Settings | Settings | 22px | White/inherit | Navigation |
| Instagram | Instagram | 20-32px | Platform pink | Platform ID |
| Youtube | YouTube | 20-48px | Platform red | Platform ID |
| HardDrive | Google Drive | 24-64px | Platform blue | Storage |
| XCircle | Error | 16-20px | Error red | Status |
| AlertTriangle | Warning | 16-20px | Warning yellow | Status |
| SendHorizontal | Pending | 20px | Warning yellow | Status |
| Search | Search | 20px | Ribbon/gray | Actions |
| FileText | Activity | 20px | Ribbon/gray | Actions |
| RefreshCw | Refresh | 20px | Info blue | Actions |
| Trash2 | Delete | 20px | Error red | Actions |
| Loader2 | Loading | 20px | Ribbon/gray | Status |
| Info | Info | 20px | Info blue | Status |
| X | Close | 16px | White/gray | Actions |

---

**Last Updated:** February 8, 2026
**Version:** 1.0
**Icon Library:** Lucide React (https://lucide.dev)
