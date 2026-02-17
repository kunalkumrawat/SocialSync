/**
 * Fetch YouTube Channel IDs from Channel Handles
 *
 * This script uses the YouTube Data API v3 to convert channel handles
 * (like @stage_promos) into actual YouTube channel IDs (like UC...)
 *
 * Setup:
 * 1. Get your YouTube Data API key from: https://console.cloud.google.com/apis/credentials
 * 2. Replace YOUR_YOUTUBE_API_KEY below with your actual API key
 * 3. Run: node scripts/fetch-channel-ids.js
 */

const https = require('https')

// ⚠️ REPLACE THIS WITH YOUR YOUTUBE DATA API KEY
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY'

// Your 6 YouTube channel handles
const channelHandles = [
  '@stage_promos',
  '@stage_shortss',
  '@STAGE_Reelss',
  '@STAGE_Dramas',
  '@STAGE_Cinema',
  '@kunalkumrawat09'
]

/**
 * Fetch channel ID from channel handle using YouTube Data API v3
 */
function fetchChannelId(handle) {
  return new Promise((resolve, reject) => {
    // Remove @ symbol if present
    const cleanHandle = handle.replace('@', '')

    // YouTube API endpoint to search for channels by handle
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${YOUTUBE_API_KEY}&maxResults=1`

    https.get(url, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const response = JSON.parse(data)

          if (response.error) {
            reject(new Error(`API Error: ${response.error.message}`))
            return
          }

          if (response.items && response.items.length > 0) {
            const channelId = response.items[0].snippet.channelId
            const channelTitle = response.items[0].snippet.title
            resolve({ handle, channelId, channelTitle })
          } else {
            reject(new Error(`Channel not found: ${handle}`))
          }
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Main function to fetch all channel IDs
 */
async function main() {
  console.log('🔍 Fetching YouTube Channel IDs...\n')

  if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
    console.error('❌ ERROR: Please replace YOUR_YOUTUBE_API_KEY with your actual YouTube Data API key')
    console.log('\n📝 To get an API key:')
    console.log('   1. Go to: https://console.cloud.google.com/apis/credentials')
    console.log('   2. Create a new API key or use existing one')
    console.log('   3. Enable YouTube Data API v3')
    console.log('   4. Copy the API key and replace it in this script\n')
    process.exit(1)
  }

  const results = []

  for (const handle of channelHandles) {
    try {
      console.log(`Fetching: ${handle}...`)
      const result = await fetchChannelId(handle)
      results.push(result)
      console.log(`✅ ${result.channelTitle} → ${result.channelId}\n`)

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`❌ ${handle} → ${error.message}\n`)
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY - Copy this into your code:')
  console.log('='.repeat(80) + '\n')

  console.log('const channels = [')
  results.forEach((result) => {
    console.log(`  { handle: '${result.handle}', id: '${result.channelId}', name: '${result.channelTitle}' },`)
  })
  console.log(']')

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully fetched ${results.length}/${channelHandles.length} channel IDs`)
  console.log('='.repeat(80) + '\n')
}

// Run the script
main().catch(console.error)
