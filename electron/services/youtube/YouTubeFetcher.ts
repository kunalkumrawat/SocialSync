import axios from 'axios'
import { getYouTubeAuth } from '../auth'
import { getDatabase } from '../database/DatabaseService'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeChannelInfo {
  channelId: string
  channelTitle: string
  channelHandle: string | null
  channelUrl: string
  thumbnailUrl: string
}

/**
 * Fetch all YouTube channels the authenticated user has access to
 */
export async function fetchUserYouTubeChannels(): Promise<{
  success: boolean
  channels?: YouTubeChannelInfo[]
  error?: string
}> {
  try {
    // Get YouTube account
    const db = getDatabase()
    const account = db.get<{ account_id: string }>(
      "SELECT account_id FROM accounts WHERE platform = 'youtube' LIMIT 1"
    )

    if (!account) {
      return { success: false, error: 'No YouTube account connected. Please connect YouTube first.' }
    }

    // Get access token
    const youtubeAuth = getYouTubeAuth()
    const accessToken = await youtubeAuth.getValidAccessToken(account.account_id)

    if (!accessToken) {
      return { success: false, error: 'Failed to get YouTube access token. Please reconnect YouTube.' }
    }

    console.log('[YouTubeFetcher] Fetching channels from YouTube API...')

    // Fetch channels the user manages
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'snippet,contentDetails',
        mine: 'true', // Get all channels where the user is the owner/manager
        maxResults: 50,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.data.items || response.data.items.length === 0) {
      return {
        success: false,
        error: 'No YouTube channels found for this account. Make sure you have created at least one YouTube channel.'
      }
    }

    const channels: YouTubeChannelInfo[] = response.data.items.map((item: any) => {
      // Extract custom URL or handle if available
      const customUrl = item.snippet.customUrl || null
      const handle = customUrl ? `@${customUrl}` : null

      return {
        channelId: item.id,
        channelTitle: item.snippet.title,
        channelHandle: handle,
        channelUrl: `https://www.youtube.com/channel/${item.id}`,
        thumbnailUrl: item.snippet.thumbnails?.default?.url || '',
      }
    })

    console.log(`[YouTubeFetcher] Found ${channels.length} YouTube channel(s):`)
    channels.forEach((ch) => {
      console.log(`  - ${ch.channelTitle} (${ch.channelId})`)
    })

    return { success: true, channels }
  } catch (error) {
    console.error('[YouTubeFetcher] Error fetching channels:', error)

    if (axios.isAxiosError(error) && error.response) {
      const message = error.response.data?.error?.message || error.message
      return { success: false, error: `YouTube API error: ${message}` }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching channels'
    }
  }
}
