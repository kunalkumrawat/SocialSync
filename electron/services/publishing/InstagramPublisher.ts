import axios from 'axios'
import { getInstagramAuth } from '../auth'
import { getDatabase } from '../database/DatabaseService'
import { Publisher } from '../posting'
import fs from 'fs'
import FormData from 'form-data'

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

export class InstagramPublisher implements Publisher {
  /**
   * Publish a video as an Instagram Reel
   */
  async publish(
    contentId: string,
    filePath: string,
    metadata?: Record<string, unknown>,
    scheduledPublishAt?: string
  ): Promise<{ success: boolean; postId?: string; error?: string; scheduledFor?: string }> {
    try {
      // Get Instagram account details
      const db = getDatabase()
      const account = db.get<{ account_id: string }>(
        "SELECT account_id FROM accounts WHERE platform = 'instagram' LIMIT 1"
      )

      if (!account) {
        return { success: false, error: 'Instagram account not connected' }
      }

      // Get access token
      const instagramAuth = getInstagramAuth()
      const accessToken = await instagramAuth.getValidAccessToken(account.account_id)

      if (!accessToken) {
        return { success: false, error: 'Failed to get Instagram access token' }
      }

      console.log('[InstagramPublisher] Starting upload process...')

      // Step 1: Upload video to a publicly accessible URL
      // For now, we'll use Instagram's resumable upload
      const uploadUrl = await this.uploadVideo(
        account.account_id,
        filePath,
        accessToken
      )

      if (!uploadUrl) {
        return { success: false, error: 'Failed to upload video' }
      }

      // Step 2: Create media container
      console.log('[InstagramPublisher] Creating media container...')
      const containerId = await this.createMediaContainer(
        account.account_id,
        uploadUrl,
        accessToken,
        metadata
      )

      if (!containerId) {
        return { success: false, error: 'Failed to create media container' }
      }

      // Step 3: Poll for container status
      console.log('[InstagramPublisher] Waiting for media processing...')
      const ready = await this.waitForContainerReady(
        containerId,
        account.account_id,
        accessToken
      )

      if (!ready) {
        return {
          success: false,
          error: 'Media container failed to process or timed out',
        }
      }

      // Step 4: Publish the container
      console.log('[InstagramPublisher] Publishing...')
      const postId = await this.publishContainer(
        containerId,
        account.account_id,
        accessToken
      )

      if (!postId) {
        return { success: false, error: 'Failed to publish media' }
      }

      console.log('[InstagramPublisher] ✅ Successfully published:', postId)
      return { success: true, postId }
    } catch (error) {
      console.error('[InstagramPublisher] Error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  /**
   * Upload video file using resumable upload
   */
  private async uploadVideo(
    userId: string,
    filePath: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      const stats = fs.statSync(filePath)
      const fileSize = stats.size

      // Initialize upload session
      const initResponse = await axios.post(
        `${GRAPH_API_BASE}/${userId}/media`,
        {
          media_type: 'VIDEO',
          upload_type: 'resumable_upload',
          file_size: fileSize,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const uploadSessionId = initResponse.data.id

      // Upload file in chunks
      const chunkSize = 5 * 1024 * 1024 // 5MB chunks
      const fileBuffer = fs.readFileSync(filePath)
      let offset = 0

      while (offset < fileSize) {
        const chunk = fileBuffer.slice(offset, Math.min(offset + chunkSize, fileSize))
        const isLastChunk = offset + chunk.length >= fileSize

        const formData = new FormData()
        formData.append('file', chunk, {
          filename: 'video.mp4',
          contentType: 'video/mp4',
        })
        formData.append('offset', offset.toString())
        formData.append('file_size', fileSize.toString())

        await axios.post(
          `${GRAPH_API_BASE}/${uploadSessionId}`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        offset += chunk.length
        console.log(
          `[InstagramPublisher] Uploaded ${Math.round((offset / fileSize) * 100)}%`
        )
      }

      // Get the upload URL
      const statusResponse = await axios.get(
        `${GRAPH_API_BASE}/${uploadSessionId}`,
        {
          params: { access_token: accessToken, fields: 'status,video' },
        }
      )

      return statusResponse.data.video?.url || uploadSessionId
    } catch (error) {
      console.error('[InstagramPublisher] Upload error:', error)
      return null
    }
  }

  /**
   * Create a media container for the video
   */
  private async createMediaContainer(
    userId: string,
    videoUrl: string,
    accessToken: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    try {
      const response = await axios.post(
        `${GRAPH_API_BASE}/${userId}/media`,
        {
          media_type: 'REELS',
          video_url: videoUrl,
          caption: metadata?.caption || '',
          share_to_feed: true,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.data.id
    } catch (error) {
      console.error('[InstagramPublisher] Create container error:', error)
      return null
    }
  }

  /**
   * Wait for the media container to be ready for publishing
   */
  private async waitForContainerReady(
    containerId: string,
    userId: string,
    accessToken: string,
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<boolean> {
    const startTime = Date.now()
    const pollInterval = 5000 // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(
          `${GRAPH_API_BASE}/${containerId}`,
          {
            params: {
              fields: 'status_code,status',
              access_token: accessToken,
            },
          }
        )

        const statusCode = response.data.status_code

        if (statusCode === 'FINISHED') {
          return true
        } else if (statusCode === 'ERROR') {
          console.error(
            '[InstagramPublisher] Container processing failed:',
            response.data.status
          )
          return false
        }

        // Still processing, wait and try again
        await this.sleep(pollInterval)
      } catch (error) {
        console.error('[InstagramPublisher] Status check error:', error)
        return false
      }
    }

    console.error('[InstagramPublisher] Container processing timed out')
    return false
  }

  /**
   * Publish the media container
   */
  private async publishContainer(
    containerId: string,
    userId: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      const response = await axios.post(
        `${GRAPH_API_BASE}/${userId}/media_publish`,
        {
          creation_id: containerId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.data.id
    } catch (error) {
      console.error('[InstagramPublisher] Publish error:', error)
      return null
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
let instance: InstagramPublisher | null = null

export function getInstagramPublisher(): InstagramPublisher {
  if (!instance) {
    instance = new InstagramPublisher()
  }
  return instance
}
