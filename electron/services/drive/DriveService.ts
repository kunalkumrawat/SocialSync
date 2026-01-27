import axios from 'axios'
import { getGoogleAuth } from '../auth'
import { getDatabase } from '../database/DatabaseService'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

// Supported video formats for Instagram Reels and YouTube Shorts
const SUPPORTED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
  'video/x-m4v',
]

// Duration limits (in seconds)
const MIN_DURATION = 3 // Instagram minimum
const MAX_DURATION_INSTAGRAM = 90 // Instagram Reels max
const MAX_DURATION_YOUTUBE = 60 // YouTube Shorts max

export interface DriveFolder {
  id: string
  name: string
  parentId?: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  createdTime: string
  modifiedTime: string
  thumbnailLink?: string
  webContentLink?: string
}

export interface ContentItem {
  id: string
  driveFileId: string
  folderId: string
  filename: string
  mimeType: string
  sizeBytes: number
  durationSeconds?: number
  createdAt: string
  discoveredAt: string
  status: 'pending' | 'queued' | 'posted' | 'failed' | 'skipped'
}

export class DriveService {
  private accountId: string | null = null

  /**
   * Set the Google account to use for Drive operations
   */
  setAccount(accountId: string): void {
    this.accountId = accountId
  }

  /**
   * Get valid access token for Drive API calls
   */
  private async getAccessToken(): Promise<string> {
    if (!this.accountId) {
      throw new Error('No Google account configured. Please connect Google Drive first.')
    }

    const googleAuth = getGoogleAuth()
    const token = await googleAuth.getValidAccessToken(this.accountId)

    if (!token) {
      throw new Error('Failed to get access token. Please reconnect Google Drive.')
    }

    return token
  }

  /**
   * List folders in a directory (or root if no parentId)
   */
  async listFolders(parentId?: string): Promise<DriveFolder[]> {
    const token = await this.getAccessToken()

    let query = "mimeType='application/vnd.google-apps.folder' and trashed=false"
    if (parentId) {
      query += ` and '${parentId}' in parents`
    } else {
      query += " and 'root' in parents"
    }

    const response = await axios.get(`${DRIVE_API_BASE}/files`, {
      params: {
        q: query,
        fields: 'files(id,name,parents)',
        orderBy: 'name',
        pageSize: 100,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.files.map((file: { id: string; name: string; parents?: string[] }) => ({
      id: file.id,
      name: file.name,
      parentId: file.parents?.[0],
    }))
  }

  /**
   * List video files in a folder
   */
  async listVideos(folderId: string): Promise<DriveFile[]> {
    const token = await this.getAccessToken()

    // Build query for video files
    const mimeTypeQueries = SUPPORTED_MIME_TYPES.map((mt) => `mimeType='${mt}'`).join(' or ')
    const query = `(${mimeTypeQueries}) and '${folderId}' in parents and trashed=false`

    const response = await axios.get(`${DRIVE_API_BASE}/files`, {
      params: {
        q: query,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webContentLink)',
        orderBy: 'createdTime',
        pageSize: 100,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.files
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    const token = await this.getAccessToken()

    const response = await axios.get(`${DRIVE_API_BASE}/files/${fileId}`, {
      params: {
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,webContentLink,videoMediaMetadata',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  }

  /**
   * Download a file to a temporary location
   * Returns the path to the downloaded file
   */
  async downloadFile(fileId: string, filename: string): Promise<string> {
    const token = await this.getAccessToken()

    const tempDir = path.join(app.getPath('temp'), 'socialsync')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const filePath = path.join(tempDir, `${fileId}_${filename}`)

    // If file already exists (from a previous failed attempt), delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    const response = await axios.get(`${DRIVE_API_BASE}/files/${fileId}`, {
      params: { alt: 'media' },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'stream',
    })

    const writer = fs.createWriteStream(filePath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath))
      writer.on('error', reject)
    })
  }

  /**
   * Clean up a downloaded file
   */
  cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error('[DriveService] Failed to cleanup file:', error)
    }
  }

  /**
   * Save a folder selection to the database
   */
  async selectFolder(folderId: string, folderName: string): Promise<void> {
    if (!this.accountId) {
      throw new Error('No Google account configured')
    }

    const db = getDatabase()
    const id = uuidv4()

    // Check if folder already selected
    const existing = db.get<{ id: string }>(
      'SELECT id FROM drive_folders WHERE folder_id = ?',
      [folderId]
    )

    if (!existing) {
      db.run(
        'INSERT INTO drive_folders (id, folder_id, folder_name, account_id) VALUES (?, ?, ?, ?)',
        [id, folderId, folderName, this.accountId]
      )
    }
  }

  /**
   * Remove a folder selection
   */
  async unselectFolder(folderId: string): Promise<void> {
    const db = getDatabase()
    db.run('DELETE FROM drive_folders WHERE folder_id = ?', [folderId])
    // Also remove any content items from this folder
    db.run('DELETE FROM content_items WHERE folder_id = ?', [folderId])
  }

  /**
   * Get all selected folders
   */
  getSelectedFolders(): Array<{ id: string; folderId: string; folderName: string }> {
    const db = getDatabase()
    return db.all('SELECT id, folder_id as folderId, folder_name as folderName FROM drive_folders')
  }

  /**
   * Scan selected folders for new video content
   */
  async scanForContent(): Promise<{ discovered: number; skipped: number }> {
    const db = getDatabase()
    const folders = this.getSelectedFolders()

    let discovered = 0
    let skipped = 0

    for (const folder of folders) {
      try {
        const videos = await this.listVideos(folder.folderId)

        for (const video of videos) {
          // Check if already in database
          const existing = db.get<{ id: string }>(
            'SELECT id FROM content_items WHERE drive_file_id = ?',
            [video.id]
          )

          if (existing) {
            skipped++
            continue
          }

          // Validate video meets requirements
          const sizeBytes = parseInt(video.size, 10)
          const maxSizeBytes = 1024 * 1024 * 1024 // 1GB max

          if (sizeBytes > maxSizeBytes) {
            console.log(`[DriveService] Skipping ${video.name}: too large (${sizeBytes} bytes)`)
            skipped++
            continue
          }

          // Add to database
          const id = uuidv4()
          db.run(
            `INSERT INTO content_items
             (id, drive_file_id, folder_id, filename, mime_type, size_bytes, created_at, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
              id,
              video.id,
              folder.folderId,
              video.name,
              video.mimeType,
              sizeBytes,
              video.createdTime,
            ]
          )

          discovered++
        }
      } catch (error) {
        console.error(`[DriveService] Error scanning folder ${folder.folderName}:`, error)
      }
    }

    console.log(`[DriveService] Scan complete: ${discovered} discovered, ${skipped} skipped`)
    return { discovered, skipped }
  }

  /**
   * Get all content items with optional filtering
   */
  getContentItems(options?: {
    status?: string
    folderId?: string
    limit?: number
  }): ContentItem[] {
    const db = getDatabase()

    let query = 'SELECT * FROM content_items WHERE 1=1'
    const params: unknown[] = []

    if (options?.status) {
      query += ' AND status = ?'
      params.push(options.status)
    }

    if (options?.folderId) {
      query += ' AND folder_id = ?'
      params.push(options.folderId)
    }

    query += ' ORDER BY created_at ASC'

    if (options?.limit) {
      query += ' LIMIT ?'
      params.push(options.limit)
    }

    return db.all(query, params)
  }

  /**
   * Get the next content item to post (sequential - oldest first)
   */
  getNextContent(): ContentItem | null {
    const db = getDatabase()
    return db.get(
      "SELECT * FROM content_items WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
    )
  }

  /**
   * Update content item status
   */
  updateContentStatus(
    contentId: string,
    status: 'pending' | 'queued' | 'posted' | 'failed' | 'skipped'
  ): void {
    const db = getDatabase()
    db.run('UPDATE content_items SET status = ? WHERE id = ?', [status, contentId])
  }

  /**
   * Get thumbnail URL for a video file
   * Returns a URL that can be used to display a thumbnail
   */
  async getThumbnail(fileId: string): Promise<string | null> {
    try {
      const token = await this.getAccessToken()

      // Get file metadata with thumbnail link
      const response = await axios.get(`${DRIVE_API_BASE}/files/${fileId}`, {
        params: {
          fields: 'thumbnailLink',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Google Drive returns a thumbnail link that needs the access token
      // We modify the URL to get a larger thumbnail
      let thumbnailLink = response.data.thumbnailLink
      if (thumbnailLink) {
        // Replace default size with larger version
        thumbnailLink = thumbnailLink.replace('=s220', '=s400')
        return thumbnailLink
      }

      return null
    } catch (error) {
      console.error('[DriveService] Failed to get thumbnail:', error)
      return null
    }
  }

  /**
   * Check if a video meets platform requirements
   */
  validateForPlatform(
    content: ContentItem,
    platform: 'instagram' | 'youtube'
  ): { valid: boolean; reason?: string } {
    // Check mime type
    if (!SUPPORTED_MIME_TYPES.includes(content.mimeType)) {
      return { valid: false, reason: `Unsupported format: ${content.mimeType}` }
    }

    // Check duration if available
    if (content.durationSeconds) {
      if (content.durationSeconds < MIN_DURATION) {
        return { valid: false, reason: `Video too short (${content.durationSeconds}s, min ${MIN_DURATION}s)` }
      }

      const maxDuration = platform === 'instagram' ? MAX_DURATION_INSTAGRAM : MAX_DURATION_YOUTUBE
      if (content.durationSeconds > maxDuration) {
        return {
          valid: false,
          reason: `Video too long for ${platform} (${content.durationSeconds}s, max ${maxDuration}s)`,
        }
      }
    }

    return { valid: true }
  }
}

// Singleton instance
let instance: DriveService | null = null

export function getDriveService(): DriveService {
  if (!instance) {
    instance = new DriveService()
  }
  return instance
}
