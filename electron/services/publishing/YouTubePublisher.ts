import axios from 'axios'
import { getYouTubeAuth } from '../auth'
import { getDatabase } from '../database/DatabaseService'
import { Publisher } from '../posting'
import fs from 'fs'
import FormData from 'form-data'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YOUTUBE_UPLOAD_BASE = 'https://www.googleapis.com/upload/youtube/v3'

export class YouTubePublisher implements Publisher {
  /**
   * Publish a video as a YouTube Short
   */
  async publish(
    contentId: string,
    filePath: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Get YouTube account details
      const db = getDatabase()
      const account = db.get<{ account_id: string }>(
        "SELECT account_id FROM accounts WHERE platform = 'youtube' LIMIT 1"
      )

      if (!account) {
        return { success: false, error: 'YouTube account not connected' }
      }

      // Get access token
      const youtubeAuth = getYouTubeAuth()
      const accessToken = await youtubeAuth.getValidAccessToken(account.account_id)

      if (!accessToken) {
        return { success: false, error: 'Failed to get YouTube access token' }
      }

      console.log('[YouTubePublisher] Starting upload...')

      // Upload video
      const videoId = await this.uploadVideo(filePath, accessToken, metadata)

      if (!videoId) {
        return { success: false, error: 'Failed to upload video' }
      }

      console.log('[YouTubePublisher] ✅ Successfully published:', videoId)
      return { success: true, postId: videoId }
    } catch (error) {
      console.error('[YouTubePublisher] Error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Format filename into a clean, readable title
   */
  private formatTitle(filename: string): string {
    // Remove file extension
    let title = filename.replace(/\.(mp4|mov|webm|mkv|avi|m4v|mpeg|3gpp|flv)$/i, '')

    // Replace underscores and hyphens with spaces
    title = title.replace(/[_-]/g, ' ')

    // Capitalize each word
    title = title
      .split(' ')
      .map(word => {
        // Skip empty strings from multiple spaces
        if (!word) return ''
        // Capitalize first letter, lowercase the rest
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .filter(word => word) // Remove empty strings
      .join(' ')

    return title
  }

  /**
   * Upload video to YouTube
   */
  private async uploadVideo(
    filePath: string,
    accessToken: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    try {
      const filename = filePath.split('/').pop() || 'video.mp4'
      const formattedTitle = this.formatTitle(filename)
      const title = metadata?.title || formattedTitle
      const description = metadata?.description || ''

      console.log(`[YouTubePublisher] Formatted title: "${formattedTitle}" from filename: "${filename}"`)

      // Step 1: Initialize resumable upload
      const videoMetadata = {
        snippet: {
          title: `${title} #Shorts`,
          description: `${description}\n\n#Shorts`,
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      }

      const initResponse = await axios.post(
        `${YOUTUBE_UPLOAD_BASE}/videos`,
        videoMetadata,
        {
          params: {
            part: 'snippet,status',
            uploadType: 'resumable',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': 'video/*',
          },
        }
      )

      const uploadUrl = initResponse.headers['location']
      if (!uploadUrl) {
        throw new Error('No upload URL received from YouTube')
      }

      // Step 2: Upload the video file
      const fileBuffer = fs.readFileSync(filePath)
      const fileSize = fileBuffer.length

      console.log('[YouTubePublisher] Uploading video file...')
      const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Type': 'video/*',
          'Content-Length': fileSize,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || fileSize)
          )
          console.log(`[YouTubePublisher] Upload progress: ${percentCompleted}%`)
        },
      })

      const videoId = uploadResponse.data.id

      if (!videoId) {
        throw new Error('No video ID received from YouTube')
      }

      return videoId
    } catch (error) {
      console.error('[YouTubePublisher] Upload error:', error)
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data)
      }
      return null
    }
  }

  /**
   * Get video details
   */
  async getVideoDetails(videoId: string, accessToken: string): Promise<unknown | null> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'snippet,status,contentDetails',
          id: videoId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return response.data.items?.[0] || null
    } catch (error) {
      console.error('[YouTubePublisher] Get video details error:', error)
      return null
    }
  }

  /**
   * Delete a video (for cleanup/testing)
   */
  async deleteVideo(videoId: string, accessToken: string): Promise<boolean> {
    try {
      await axios.delete(`${YOUTUBE_API_BASE}/videos`, {
        params: { id: videoId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return true
    } catch (error) {
      console.error('[YouTubePublisher] Delete error:', error)
      return false
    }
  }
}

// Singleton instance
let instance: YouTubePublisher | null = null

export function getYouTubePublisher(): YouTubePublisher {
  if (!instance) {
    instance = new YouTubePublisher()
  }
  return instance
}
