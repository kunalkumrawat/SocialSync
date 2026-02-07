import { _electron as electron } from 'playwright'
import { ElectronApplication, Page } from 'playwright'
import * as path from 'path'
import * as fs from 'fs'

const screenshotDir = path.join(__dirname, '..', 'docs', 'screenshots')

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true })
}

async function captureScreenshots() {
  console.log('🚀 Launching Electron app...')

  const electronApp: ElectronApplication = await electron.launch({
    args: [path.join(__dirname, '..', 'dist-electron', 'main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  })

  const window = await electronApp.firstWindow()
  await window.waitForLoadState('domcontentloaded')

  // Wait for app to fully render
  await window.waitForTimeout(2000)

  console.log('📸 Capturing screenshots...')

  // 1. Dashboard View
  console.log('  → Dashboard view')
  await window.click('button:has-text("Dashboard")')
  await window.waitForTimeout(1000)
  await window.screenshot({
    path: path.join(screenshotDir, '01-dashboard-view.png'),
    fullPage: false
  })

  // 2. Content View
  console.log('  → Content view')
  await window.click('button:has-text("Content")')
  await window.waitForTimeout(1000)
  await window.screenshot({
    path: path.join(screenshotDir, '02-content-view.png'),
    fullPage: false
  })

  // 3. Queue View
  console.log('  → Queue view')
  await window.click('button:has-text("Queue")')
  await window.waitForTimeout(1000)
  await window.screenshot({
    path: path.join(screenshotDir, '03-queue-view.png'),
    fullPage: false
  })

  // 4. Posted View
  console.log('  → Posted view')
  await window.click('button:has-text("Posted")')
  await window.waitForTimeout(1000)
  await window.screenshot({
    path: path.join(screenshotDir, '04-posted-view.png'),
    fullPage: false
  })

  // 5. Schedule View
  console.log('  → Schedule view')
  await window.click('button:has-text("Schedule")')
  await window.waitForTimeout(1000)
  await window.screenshot({
    path: path.join(screenshotDir, '05-schedule-view.png'),
    fullPage: false
  })

  // 6. Settings View
  console.log('  → Settings view')
  await window.click('button:has-text("Settings")')
  await window.waitForTimeout(1000)
  await window.screenshot({
    path: path.join(screenshotDir, '06-settings-view.png'),
    fullPage: false
  })

  // 7. Navigation Close-up (go back to dashboard)
  console.log('  → Navigation close-up')
  await window.click('button:has-text("Dashboard")')
  await window.waitForTimeout(500)
  const navigation = await window.locator('aside nav')
  await navigation.screenshot({
    path: path.join(screenshotDir, '07-navigation-sidebar.png')
  })

  // 8. Dashboard Stats Close-up
  console.log('  → Dashboard stats close-up')
  const statsGrid = await window.locator('.grid.grid-cols-1.md\\:grid-cols-4').first()
  await statsGrid.screenshot({
    path: path.join(screenshotDir, '08-dashboard-stats.png')
  })

  // 9. Platform Cards Close-up
  console.log('  → Platform cards close-up')
  const platformCards = await window.locator('.grid.grid-cols-1.lg\\:grid-cols-2').first()
  await platformCards.screenshot({
    path: path.join(screenshotDir, '09-platform-cards.png')
  })

  // 10. Logo and Header
  console.log('  → Logo and header')
  const logo = await window.locator('aside .p-5').first()
  await logo.screenshot({
    path: path.join(screenshotDir, '10-logo-header.png')
  })

  console.log('✅ All screenshots captured!')
  console.log(`📁 Screenshots saved to: ${screenshotDir}`)

  await electronApp.close()
}

captureScreenshots().catch((error) => {
  console.error('❌ Error capturing screenshots:', error)
  process.exit(1)
})
