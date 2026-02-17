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
   * @param scheduledPublishAt - Optional ISO 8601 timestamp for scheduled publishing (e.g., "2026-02-15T10:30:00Z")
   */
  async publish(
    contentId: string,
    filePath: string,
    metadata?: Record<string, unknown>,
    scheduledPublishAt?: string
  ): Promise<{ success: boolean; postId?: string; error?: string; scheduledFor?: string }> {
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

      if (scheduledPublishAt) {
        console.log(`[YouTubePublisher] Uploading as SCHEDULED for: ${scheduledPublishAt}`)
      } else {
        console.log('[YouTubePublisher] Uploading as IMMEDIATE publish...')
      }

      // Upload video (will throw error if fails)
      const videoId = await this.uploadVideo(filePath, accessToken, metadata, scheduledPublishAt)

      if (scheduledPublishAt) {
        console.log(`[YouTubePublisher] ✅ Scheduled for ${scheduledPublishAt}:`, videoId)
        return { success: true, postId: videoId, scheduledFor: scheduledPublishAt }
      } else {
        console.log('[YouTubePublisher] ✅ Successfully published:', videoId)
        return { success: true, postId: videoId }
      }
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
    metadata?: Record<string, unknown>,
    scheduledPublishAt?: string
  ): Promise<string | null> {
    try {
      const filename = filePath.split('/').pop() || 'video.mp4'
      const formattedTitle = this.formatTitle(filename)

      // Use metadata from database (passed through metadata object)
      // If no metadata.title provided, use formatted filename as fallback
      const title = (metadata?.title as string) || formattedTitle
      const description = (metadata?.description as string) || ''
      const tags = (metadata?.tags as string) || ''

      console.log(`[YouTubePublisher] Title: "${title}", Description: "${description?.substring(0, 50)}...", Tags: "${tags}"`)

      // Add tags to description if provided
      const fullDescription = tags ? `${description}\n\n${tags}` : description

      // Step 1: Initialize resumable upload
      const videoMetadata: any = {
        snippet: {
          title: title.length > 100 ? title.substring(0, 97) + '...' : title, // YouTube title max 100 chars
          description: `${fullDescription}\n\n#Shorts`,
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: scheduledPublishAt ? 'private' : 'public',
          selfDeclaredMadeForKids: false,
        },
      }

      // Add publishAt for scheduled videos
      if (scheduledPublishAt) {
        videoMetadata.status.publishAt = scheduledPublishAt
        console.log(`[YouTubePublisher] Setting publishAt: ${scheduledPublishAt}`)
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

        // Extract the actual error message from YouTube API
        const youtubeError = error.response?.data?.error
        if (youtubeError?.message) {
          throw new Error(youtubeError.message)
        }
      }

      throw error instanceof Error ? error : new Error('Failed to upload video to YouTube')
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
