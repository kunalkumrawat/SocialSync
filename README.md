# SocialSync

**Intelligent Social Media Automation Tool**

Automatically post your video content to Instagram Reels and YouTube Shorts from Google Drive.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)

---

## ✨ **Features**

### **📁 Content Management**
- Browse and select Google Drive folders
- Automatic video discovery (hourly scans)
- Support for MP4, MOV, WebM formats
- Video validation (duration, file size)
- Thumbnail previews
- Content library with 1000+ video support

### **📅 Smart Scheduling**
- Configure posting times per platform
- Multi-day, multi-time slot support
- Auto-generate queue for next 7 days
- Enable/disable schedules per platform
- Timezone-aware scheduling

### **🤖 Automated Posting**
- Post to Instagram Reels
- Post to YouTube Shorts
- Sequential posting (oldest first)
- Automatic retries (up to 3 attempts)
- Rate limiting to avoid API limits
- 10-second delay between posts

### **📊 Real-Time Dashboard**
- Live statistics (pending, posted, failed)
- Upcoming posts preview
- Activity feed with timestamps
- Platform-specific dashboards
- Auto-refresh every 30 seconds

### **🔔 Notifications**
- Toast notifications for all actions
- Desktop notifications for important events
- Success/error/info/warning types
- Posting progress updates
- Customizable notification preferences

### **⚙️ Settings & Configuration**
- Account management (Google, Instagram, YouTube)
- Notification preferences
- Minimize to system tray
- Start on system boot
- Persistent settings storage

---

## 🚀 **Quick Start**

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd socialsync

# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

### **Build for Production**

```bash
# Build the application
npm run build

# Output: dist/ folder with installer
```

---

## 📋 **Setup Guide**

### **1. Get API Credentials**

#### **Google Drive API**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8585/callback`
6. Add credentials to `electron/config/credentials.json`

#### **Instagram Graph API**
1. Create a [Facebook App](https://developers.facebook.com/)
2. Add Instagram Graph API product
3. Configure OAuth redirect URI: `http://localhost:8585/callback`
4. Get App ID and App Secret
5. Add credentials to configuration

#### **YouTube Data API v3**
1. In Google Cloud Console (same project as Drive)
2. Enable YouTube Data API v3
3. Use same OAuth credentials as Google Drive

### **2. Configure Credentials**

Create `electron/config/credentials.json`:

```json
{
  "google": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID",
    "client_secret": "YOUR_GOOGLE_CLIENT_SECRET"
  },
  "instagram": {
    "app_id": "YOUR_FACEBOOK_APP_ID",
    "app_secret": "YOUR_FACEBOOK_APP_SECRET"
  }
}
```

### **3. First Run**

1. Launch the app
2. Go to **Settings** tab
3. Connect **Google Drive**
4. Connect **Instagram**
5. Connect **YouTube**
6. Go to **Content** tab
7. Select folders with videos
8. Click **Scan for Content**
9. Go to **Schedule** tab
10. Configure posting times
11. Watch the magic happen! ✨

---

## 🎯 **How It Works**

### **Content Discovery**
1. Select Google Drive folders containing videos
2. App scans folders hourly for new content
3. Validates videos (format, duration, size)
4. Adds to content library with thumbnails

### **Scheduling**
1. Configure days and times per platform
2. App generates queue for next 7 days
3. Videos posted in chronological order (oldest first)
4. No duplicate posting

### **Automated Posting**
1. Posting scheduler runs every minute
2. Checks queue for due posts
3. Downloads video from Google Drive
4. Uploads to Instagram/YouTube
5. Updates status and cleans up file
6. Sends notifications

---

## 📱 **Supported Platforms**

| Platform | Type | Duration | Format | Status |
|----------|------|----------|--------|--------|
| Instagram | Reels | 3-90s | MP4, MOV, WebM | ✅ Working |
| YouTube | Shorts | 3-60s | MP4, MOV, WebM | ✅ Working |

---

## 🛠️ **Tech Stack**

- **Frontend:** React 18, TypeScript, TailwindCSS
- **Backend:** Electron 28, Node.js
- **Database:** SQLite (sql.js)
- **APIs:** Instagram Graph API, YouTube Data API v3, Google Drive API
- **Build:** Vite, electron-builder
- **State:** Zustand
- **Scheduling:** node-cron

---

## 📂 **Project Structure**

```
socialsync/
├── electron/                  # Electron main process
│   ├── main.ts               # Main entry point
│   ├── preload.ts            # Preload script
│   └── services/             # Backend services
│       ├── auth/             # OAuth authentication
│       ├── database/         # SQLite database
│       ├── drive/            # Google Drive integration
│       ├── posting/          # Posting scheduler
│       ├── publishing/       # Instagram & YouTube publishers
│       ├── queue/            # Queue management
│       ├── schedule/         # Schedule configuration
│       ├── scheduler/        # Content scanner (hourly)
│       └── settings/         # Settings persistence
├── src/                      # React frontend
│   ├── App.tsx               # Main app component
│   ├── stores/               # State management
│   ├── components/           # UI components
│   └── types/                # TypeScript types
├── dist/                     # Built application
└── package.json              # Dependencies
```

---

## 🔒 **Security**

- OAuth 2.0 for all API authentication
- Tokens stored securely in SQLite
- No hardcoded credentials
- Context isolation enabled
- Node integration disabled
- Automatic token refresh

---

## 🐛 **Troubleshooting**

### **OAuth Not Working**
- Verify redirect URI: `http://localhost:8585/callback`
- Check credentials in `credentials.json`
- Ensure APIs are enabled in cloud console

### **Videos Not Uploading**
- Check video duration (3-60s for Shorts, 3-90s for Reels)
- Verify video format (MP4, MOV, WebM)
- Check file size (max 1GB)
- Review API quota limits

### **Scan Not Finding Videos**
- Ensure folder contains supported formats
- Check file permissions in Google Drive
- Verify videos meet duration requirements

---

## 📄 **License**

MIT License - see LICENSE file for details

---

## 🙏 **Acknowledgments**

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [React](https://react.dev/) and [TailwindCSS](https://tailwindcss.com/)
- Icons from Unicode emoji

---

## 📞 **Support**

For issues, questions, or feature requests:
- Check the [Testing Guide](./TESTING_GUIDE.md)
- Review [Troubleshooting](#troubleshooting) section
- Create an issue on GitHub

---

**Built by [Kunal Kumrawat](https://github.com/kunalkumrawat) with ❤️ using BMad**

*Automate your social media presence. Focus on creating great content.*
