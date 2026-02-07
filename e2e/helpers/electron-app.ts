/**
 * Helper utilities for launching and testing Electron app
 */

import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

export class ElectronAppHelper {
  private app: ElectronApplication | null = null;
  private mainPage: Page | null = null;

  /**
   * Launch the Electron app
   */
  async launch(): Promise<{ app: ElectronApplication; page: Page }> {
    console.log('🚀 Launching Electron app...');

    this.app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Wait for the first window
    this.mainPage = await this.app.firstWindow();

    // Wait for app to be ready
    await this.mainPage.waitForLoadState('domcontentloaded');

    console.log('✅ Electron app launched');

    return { app: this.app, page: this.mainPage };
  }

  /**
   * Close the Electron app
   */
  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
      this.mainPage = null;
      console.log('✅ Electron app closed');
    }
  }

  /**
   * Get the main window page
   */
  getPage(): Page {
    if (!this.mainPage) {
      throw new Error('App not launched. Call launch() first.');
    }
    return this.mainPage;
  }

  /**
   * Wait for specific text to appear
   */
  async waitForText(text: string, timeout = 10000): Promise<boolean> {
    if (!this.mainPage) return false;

    try {
      await this.mainPage.waitForSelector(`text=${text}`, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    if (!this.mainPage) return false;

    const element = await this.mainPage.$(selector);
    return element !== null;
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(name: string): Promise<void> {
    if (!this.mainPage) return;

    await this.mainPage.screenshot({
      path: path.join(__dirname, `../../test-results/${name}.png`),
    });
    console.log(`📸 Screenshot saved: ${name}.png`);
  }

  /**
   * Get console logs from the app
   */
  async getConsoleLogs(): Promise<string[]> {
    if (!this.app) return [];

    const logs: string[] = [];

    this.mainPage?.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    return logs;
  }
}
