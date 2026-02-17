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
  'video/x-matroska', // .mkv
  'video/avi',
  'video/x-msvideo', // .avi
  'video/mpeg',
  'video/3gpp',
  'video/x-flv',
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

    try {
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
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          'Google Drive API is not enabled. Please enable it in Google Cloud Console:\n' +
          '1. Go to https://console.cloud.google.com/apis/library/drive.googleapis.com\n' +
          '2. Select your project\n' +
          '3. Click "ENABLE"\n' +
          '4. Try again'
        )
      }
      throw error
    }
  }

  /**
   * List ALL files in a folder (for debugging)
   */
  async listAllFiles(folderId: string): Promise<DriveFile[]> {
    const token = await this.getAccessToken()

    const query = `'${folderId}' in parents and trashed=false`

    const response = await axios.get(`${DRIVE_API_BASE}/files`, {
      params: {
        q: query,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime)',
        orderBy: 'name',
        pageSize: 100,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.files
  }

  /**
   * List video files in a folder
   */
  async listVideos(folderId: string): Promise<DriveFile[]> {
    const token = await this.getAccessToken()

    // First, list all files for debugging
    const allFiles = await this.listAllFiles(folderId)
    console.log(`[DriveService] Total files in folder: ${allFiles.length}`)
    if (allFiles.length > 0) {
      console.log(`[DriveService] Sample files:`)
      allFiles.slice(0, 5).forEach(f => {
        console.log(`  - ${f.name} (${f.mimeType})`)
      })
    }

    // Build query for video files
    const mimeTypeQueries = SUPPORTED_MIME_TYPES.map((mt) => `mimeType='${mt}'`).join(' or ')
    const query = `(${mimeTypeQueries}) and '${folderId}' in parents and trashed=false`

    console.log(`[DriveService] Querying for videos with MIME types: ${SUPPORTED_MIME_TYPES.join(', ')}`)

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
  /**
   * Recursively scan a folder and its subfolders for videos
   */
  private async scanFolderRecursive(
    folderId: string,
    folderName: string,
    db: any,
    discovered: { count: number },
    skipped: { count: number },
    depth: number = 0,
    maxDepth: number = 3
  ): Promise<void> {
    if (depth > maxDepth) {
      console.log(`[DriveService] Max depth reached for ${folderName}, skipping deeper subfolders`)
      return
    }

    const indent = '  '.repeat(depth)
    console.log(`${indent}[DriveService] Scanning: ${folderName} (depth ${depth})`)

    // Scan for videos in current folder
    const videos = await this.listVideos(folderId)
    console.log(`${indent}[DriveService] Found ${videos.length} video(s) in ${folderName}`)

    for (const video of videos) {
      console.log(`${indent}  - ${video.name} (${video.mimeType}, ${video.size} bytes)`)

      // Check if already in database
      const existing = db.get<{ id: string }>(
        'SELECT id FROM content_items WHERE drive_file_id = ?',
        [video.id]
      )

      if (existing) {
        console.log(`${indent}  ✓ Already in database`)
        skipped.count++
        continue
      }

      // Validate video meets requirements
      const sizeBytes = parseInt(video.size, 10)
      const maxSizeBytes = 1024 * 1024 * 1024 // 1GB max

      if (sizeBytes > maxSizeBytes) {
        console.log(`${indent}  ✗ Too large (${(sizeBytes / 1024 / 1024).toFixed(1)} MB)`)
        skipped.count++
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
          folderId,
          video.name,
          video.mimeType,
          sizeBytes,
          video.createdTime,
        ]
      )

      console.log(`${indent}  ✓ Added to library`)
      discovered.count++
    }

    // Recursively scan subfolders
    try {
      const subfolders = await this.listFolders(folderId)
      if (subfolders.length > 0) {
        console.log(`${indent}[DriveService] Found ${subfolders.length} subfolder(s), scanning recursively...`)
        for (const subfolder of subfolders) {
          await this.scanFolderRecursive(
            subfolder.id,
            subfolder.name,
            db,
            discovered,
            skipped,
            depth + 1,
            maxDepth
          )
        }
      }
    } catch (error) {
      console.error(`${indent}[DriveService] Error listing subfolders:`, error)
    }
  }

  async scanForContent(): Promise<{ discovered: number; skipped: number }> {
    const db = getDatabase()
    const folders = this.getSelectedFolders()

    console.log(`[DriveService] Starting recursive scan of ${folders.length} folder(s)`)

    const discovered = { count: 0 }
    const skipped = { count: 0 }

    for (const folder of folders) {
      try {
        await this.scanFolderRecursive(
          folder.folderId,
          folder.folderName,
          db,
          discovered,
          skipped
        )
      } catch (error) {
        console.error(`[DriveService] Error scanning folder ${folder.folderName}:`, error)
      }
    }

    console.log(`[DriveService] Scan complete: ${discovered.count} discovered, ${skipped.count} skipped`)
    return { discovered: discovered.count, skipped: skipped.count }
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

    const rows = db.all<any>(query, params)

    // Map snake_case to camelCase
    return rows.map((row) => ({
      id: row.id,
      driveFileId: row.drive_file_id,
      folderId: row.folder_id,
      filename: row.filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
      discoveredAt: row.discovered_at,
      status: row.status,
    }))
  }

  /**
   * Get the next content item to post (sequential - oldest first)
   */
  getNextContent(): ContentItem | null {
    const db = getDatabase()
    const row = db.get<any>(
      "SELECT * FROM content_items WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
    )

    if (!row) return null

    // Map snake_case to camelCase
    return {
      id: row.id,
      driveFileId: row.drive_file_id,
      folderId: row.folder_id,
      filename: row.filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
      discoveredAt: row.discovered_at,
      status: row.status,
    }
  }

  /**
   * Get next available content for a specific platform
   * Excludes content already queued for that platform
   * CRITICAL: Only returns APPROVED content (approval_status = 'approved')
   */
  getNextContentForPlatform(platform: 'instagram' | 'youtube'): ContentItem | null {
    const db = getDatabase()
    const row = db.get<any>(
      `SELECT * FROM content_items
       WHERE status = 'pending'
       AND approval_status = 'approved'
       AND id NOT IN (
         SELECT content_id FROM queue
         WHERE platform = ? AND status IN ('pending', 'processing')
       )
       ORDER BY created_at ASC LIMIT 1`,
      [platform]
    )

    if (!row) {
      console.log(`[DriveService] No approved content available for ${platform}`)
      return null
    }

    // Map snake_case to camelCase
    return {
      id: row.id,
      driveFileId: row.drive_file_id,
      folderId: row.folder_id,
      filename: row.filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
      discoveredAt: row.discovered_at,
      status: row.status,
    }
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
   * Update content item metadata (title, description, tags, category)
   */
  updateContentMetadata(
    contentId: string,
    metadata: {
      title?: string
      description?: string
      tags?: string
      category?: string
      metadata_approved?: boolean
    }
  ): void {
    const db = getDatabase()
    const updates: string[] = []
    const values: any[] = []

    if (metadata.title !== undefined) {
      updates.push('title = ?')
      values.push(metadata.title)
    }
    if (metadata.description !== undefined) {
      updates.push('description = ?')
      values.push(metadata.description)
    }
    if (metadata.tags !== undefined) {
      updates.push('tags = ?')
      values.push(metadata.tags)
    }
    if (metadata.category !== undefined) {
      updates.push('category = ?')
      values.push(metadata.category)
    }
    if (metadata.metadata_approved !== undefined) {
      updates.push('metadata_approved = ?')
      values.push(metadata.approved ? 1 : 0)
    }

    if (updates.length > 0) {
      values.push(contentId)
      db.run(`UPDATE content_items SET ${updates.join(', ')} WHERE id = ?`, values)
      console.log(`[DriveService] Updated metadata for content ${contentId}`)
    }
  }

  /**
   * Approve content for posting (whitelist approach)
   */
  approveContent(contentId: string, approvedBy: string = 'user'): void {
    const db = getDatabase()
    const now = new Date().toISOString()

    db.run(
      `UPDATE content_items
       SET approval_status = 'approved', approved_by = ?, approved_at = ?, rejection_reason = NULL
       WHERE id = ?`,
      [approvedBy, now, contentId]
    )

    // Log approval
    const logId = uuidv4()
    db.run(
      `INSERT INTO approval_log (id, content_id, action, created_at)
       VALUES (?, ?, 'approved', ?)`,
      [logId, contentId, now]
    )

    console.log(`[DriveService] ✅ Approved content ${contentId}`)
  }

  /**
   * Reject content from posting
   */
  rejectContent(contentId: string, reason: string = 'Manual rejection'): void {
    const db = getDatabase()
    const now = new Date().toISOString()

    db.run(
      `UPDATE content_items
       SET approval_status = 'rejected', rejection_reason = ?, approved_by = NULL, approved_at = NULL
       WHERE id = ?`,
      [reason, contentId]
    )

    // Log rejection
    const logId = uuidv4()
    db.run(
      `INSERT INTO approval_log (id, content_id, action, reason, created_at)
       VALUES (?, ?, 'rejected', ?, ?)`,
      [logId, contentId, reason, now]
    )

    console.log(`[DriveService] ❌ Rejected content ${contentId}: ${reason}`)
  }

  /**
   * Bulk approve multiple content items
   */
  bulkApproveContent(contentIds: string[], approvedBy: string = 'user'): void {
    const db = getDatabase()
    const now = new Date().toISOString()

    for (const contentId of contentIds) {
      db.run(
        `UPDATE content_items
         SET approval_status = 'approved', approved_by = ?, approved_at = ?, rejection_reason = NULL
         WHERE id = ?`,
        [approvedBy, now, contentId]
      )

      // Log approval
      const logId = uuidv4()
      db.run(
        `INSERT INTO approval_log (id, content_id, action, created_at)
         VALUES (?, ?, 'approved', ?)`,
        [logId, contentId, now]
      )
    }

    console.log(`[DriveService] ✅ Bulk approved ${contentIds.length} items`)
  }

  /**
   * Bulk reject multiple content items
   */
  bulkRejectContent(contentIds: string[], reason: string = 'Bulk rejection'): void {
    const db = getDatabase()
    const now = new Date().toISOString()

    for (const contentId of contentIds) {
      db.run(
        `UPDATE content_items
         SET approval_status = 'rejected', rejection_reason = ?, approved_by = NULL, approved_at = NULL
         WHERE id = ?`,
        [reason, contentId]
      )

      // Log rejection
      const logId = uuidv4()
      db.run(
        `INSERT INTO approval_log (id, content_id, action, reason, created_at)
         VALUES (?, ?, 'rejected', ?, ?)`,
        [logId, contentId, reason, now]
      )
    }

    console.log(`[DriveService] ❌ Bulk rejected ${contentIds.length} items`)
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
