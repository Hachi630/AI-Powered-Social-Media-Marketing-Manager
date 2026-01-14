import axios from 'axios'

const AYRSHARE_API_KEY = 'C599C63E-F1BC493D-856D76C3-3009039C'
const AYRSHARE_BASE_URL = 'https://app.ayrshare.com/api'

/**
 * Upload media (image/video) to Ayrshare
 * This returns a publicly accessible URL that can be used in posts
 */
export async function uploadMediaToAyrshare(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Dynamically import form-data
    const FormData = (await import('form-data')).default
    const form = new FormData()

    // Ayrshare expects the file field to be named 'file'
    form.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType,
    })

    console.log('[Ayrshare Media Upload] Uploading:', {
      fileName,
      mimeType,
      size: fileBuffer.length,
    })

    const response = await axios.post(
      `${AYRSHARE_BASE_URL}/media/upload`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
          ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    )

    console.log('[Ayrshare Media Upload] Response:', response.data)

    // Ayrshare returns the URL in different possible fields
    const mediaUrl = response.data?.url ||
      response.data?.mediaUrl ||
      response.data?.data?.url ||
      response.data?.data?.mediaUrl

    if (mediaUrl) {
      return {
        success: true,
        url: mediaUrl,
      }
    }

    return {
      success: false,
      error: 'No URL returned from Ayrshare media upload. Response: ' + JSON.stringify(response.data),
    }
  } catch (error: any) {
    console.error('Ayrshare media upload error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error.message,
    })
    return {
      success: false,
      error: error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Failed to upload media to Ayrshare',
    }
  }
}

/**
 * Post to multiple platforms using Ayrshare API
 */
export interface AyrsharePostRequest {
  post: string
  platforms: string[] // e.g., ['facebook', 'twitter', 'instagram', 'linkedin']
  mediaUrls?: string[]
  scheduleDate?: string // ISO date string for scheduling
}

export interface AyrsharePostResponse {
  success: boolean
  id?: string
  postIds?: Record<string, string> // Platform-specific post IDs
  urls?: Record<string, string> // URLs to live posts
  status?: string
  error?: string
}

export async function postToAyrshare(request: AyrsharePostRequest): Promise<AyrsharePostResponse> {
  try {
    // Normalize platforms to lowercase and validate
    const normalizedPlatforms = request.platforms.map(p => p.toLowerCase())

    // Ayrshare expects platforms as an ARRAY, not a comma-separated string
    const payload: any = {
      post: request.post,
      platforms: normalizedPlatforms, // Send as array
    }

    // Add media URLs if provided
    if (request.mediaUrls && request.mediaUrls.length > 0) {
      // Ayrshare expects mediaUrls as an array
      payload.mediaUrls = request.mediaUrls
    }

    if (request.scheduleDate) {
      payload.scheduleDate = request.scheduleDate
    }

    // Validate platforms array is not empty
    if (!payload.platforms || payload.platforms.length === 0) {
      return {
        success: false,
        error: 'Platforms array cannot be empty',
      }
    }

    // Validate each platform is a valid string
    const validPlatformNames = ['facebook', 'twitter', 'instagram', 'linkedin', 'pinterest', 'youtube', 'tiktok', 'reddit', 'telegram', 'snapchat', 'googlebusiness', 'bluesky']
    const invalidPlatforms = payload.platforms.filter((p: string) => !validPlatformNames.includes(p))
    if (invalidPlatforms.length > 0) {
      return {
        success: false,
        error: `Invalid platform names: ${invalidPlatforms.join(', ')}`,
      }
    }

    console.log('[Ayrshare] Posting with payload:', {
      post: payload.post?.substring(0, 50) + '...',
      platforms: payload.platforms,
      platformsType: Array.isArray(payload.platforms) ? 'array' : typeof payload.platforms,
      mediaUrlsCount: payload.mediaUrls?.length || 0,
    })

    const response = await axios.post(
      `${AYRSHARE_BASE_URL}/post`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Ayrshare] Post response:', response.data)

    return {
      success: true,
      id: response.data.id,
      postIds: response.data.postIds,
      urls: response.data.urls,
      status: response.data.status,
    }
  } catch (error: any) {
    console.error('Ayrshare post error:', error?.response?.data || error.message)
    const errorMessage = error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to post via Ayrshare'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

interface AyrsharePost {
  id: string
  postId: string
  platform: string
  postedDate: string
  scheduledDate?: string
  mediaUrls?: string[]
  text?: string
  status?: 'scheduled' | 'published' | 'failed'
  url?: string
  analytics?: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
    impressions?: number
  }
}

interface AyrshareAnalytics {
  postId: string
  platform: string
  postedDate: string
  likes?: number
  comments?: number
  shares?: number
  views?: number
  impressions?: number
}

/**
 * Get analytics for a specific post from Ayrshare
 */
export async function getPostAnalytics(postId: string): Promise<AyrshareAnalytics | null> {
  try {
    const response = await axios.get(
      `${AYRSHARE_BASE_URL}/analytics/post`,
      {
        headers: {
          'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: {
          postId,
        },
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Ayrshare post analytics error:', error?.response?.data || error.message)
    return null
  }
}

/**
 * Get all posts from Ayrshare history
 */
export async function getAllPosts(limit: number = 100): Promise<AyrsharePost[]> {
  try {
    const response = await axios.get(
      `${AYRSHARE_BASE_URL}/history`,
      {
        headers: {
          'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: {
          limit,
        },
      }
    )
    // Ayrshare history returns posts with metadata
    const posts = response.data?.posts || []
    return posts.map((post: any) => {
      // Normalize platform names from Ayrshare API
      let platform = post.platform?.toLowerCase() || ''
      if (platform === 'x' || platform === 'twitter/x') {
        platform = 'twitter'
      }
      // Ensure platform names match our expected format
      if (platform && !['facebook', 'instagram', 'twitter', 'linkedin'].includes(platform)) {
        // Try to map common variations
        if (platform.includes('facebook') || platform === 'fb') {
          platform = 'facebook'
        } else if (platform.includes('instagram') || platform === 'ig') {
          platform = 'instagram'
        } else if (platform.includes('linkedin') || platform === 'li') {
          platform = 'linkedin'
        }
      }

      return {
        id: post.id || post.postId,
        postId: post.postId || post.id,
        platform: platform,
        postedDate: post.postedDate || post.scheduledDate || post.date,
        scheduledDate: post.scheduledDate,
        mediaUrls: post.mediaUrls || [],
        text: post.text || post.caption || '',
        status: post.status || 'published',
        url: post.url,
        analytics: post.analytics || {},
      }
    })
  } catch (error: any) {
    console.error('Ayrshare get posts error:', error?.response?.data || error.message)
    return []
  }
}

/**
 * Calculate posting frequency by day of week
 */
export function calculatePostingFrequencyByDay(posts: AyrsharePost[]): Array<{ day: string; count: number; percentage: number }> {
  const dayCounts: Record<string, number> = {
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
    'Sunday': 0,
  }

  posts.forEach((post) => {
    if (!post.postedDate) return
    const date = new Date(post.postedDate)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    if (dayCounts.hasOwnProperty(dayName)) {
      dayCounts[dayName]++
    }
  })

  const total = posts.length
  return Object.entries(dayCounts)
    .map(([day, count]) => ({
      day,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate posting frequency by hour of day
 */
export function calculatePostingFrequencyByHour(posts: AyrsharePost[]): Array<{ hour: number; count: number; percentage: number }> {
  const hourCounts: Record<number, number> = {}

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0
  }

  posts.forEach((post) => {
    if (!post.postedDate) return
    const date = new Date(post.postedDate)
    const hour = date.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  const total = posts.length
  return Object.entries(hourCounts)
    .map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate platform usage patterns
 */
export function calculatePlatformUsagePatterns(posts: AyrsharePost[]): Record<string, {
  totalPosts: number
  percentage: number
  postsByDay: Record<string, number>
  postsByHour: Record<number, number>
  statusBreakdown: Record<string, number>
}> {
  const platformData: Record<string, {
    posts: AyrsharePost[]
    postsByDay: Record<string, number>
    postsByHour: Record<number, number>
    statusBreakdown: Record<string, number>
  }> = {}

  posts.forEach((post) => {
    let platform = post.platform?.toLowerCase() || ''
    if (platform === 'x' || platform === 'twitter/x') {
      platform = 'twitter'
    }

    if (!platform) return

    if (!platformData[platform]) {
      platformData[platform] = {
        posts: [],
        postsByDay: {},
        postsByHour: {},
        statusBreakdown: {},
      }
    }

    platformData[platform].posts.push(post)

    // Count by day
    if (post.postedDate) {
      const date = new Date(post.postedDate)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
      platformData[platform].postsByDay[dayName] = (platformData[platform].postsByDay[dayName] || 0) + 1

      // Count by hour
      const hour = date.getHours()
      platformData[platform].postsByHour[hour] = (platformData[platform].postsByHour[hour] || 0) + 1
    }

    // Count by status
    const status = post.status || 'published'
    platformData[platform].statusBreakdown[status] = (platformData[platform].statusBreakdown[status] || 0) + 1
  })

  const total = posts.length
  const result: Record<string, any> = {}

  Object.entries(platformData).forEach(([platform, data]) => {
    result[platform] = {
      totalPosts: data.posts.length,
      percentage: total > 0 ? Math.round((data.posts.length / total) * 100) : 0,
      postsByDay: data.postsByDay,
      postsByHour: data.postsByHour,
      statusBreakdown: data.statusBreakdown,
    }
  })

  return result
}

/**
 * Sync posts from Ayrshare API to database
 * This ensures all posts published via Ayrshare are stored locally
 */
export async function syncAyrsharePostsToDatabase(userId: string): Promise<{
  synced: number
  skipped: number
  errors: number
}> {
  const { default: SocialMediaPost } = await import('../models/SocialMediaPost.js')
  const { Types } = await import('mongoose')

  let synced = 0
  let skipped = 0
  let errors = 0

  try {
    // Fetch all posts from Ayrshare
    const ayrsharePosts = await getAllPosts(500)
    console.log(`[Ayrshare Sync] Found ${ayrsharePosts.length} posts from Ayrshare API`)

    for (const ayrsharePost of ayrsharePosts) {
      try {
        // Skip if no postId (can't identify the post)
        if (!ayrsharePost.postId) {
          skipped++
          continue
        }

        // Normalize platform name
        let platform = ayrsharePost.platform?.toLowerCase() || ''
        if (platform === 'x' || platform === 'twitter/x') {
          platform = 'twitter'
        }

        // Map to database platform enum
        const dbPlatform = platform === 'facebook' ? 'facebook' :
          platform === 'instagram' ? 'instagram' :
            platform === 'twitter' ? 'twitter' :
              platform === 'linkedin' ? 'linkedin' : null

        if (!dbPlatform) {
          console.log(`[Ayrshare Sync] Skipping unsupported platform: ${platform}`)
          skipped++
          continue
        }

        // Check if post already exists in database
        const existingPost = await SocialMediaPost.findOne({
          $or: [
            { platformPostId: ayrsharePost.postId },
            { platformPostId: ayrsharePost.id },
          ],
          userId: new Types.ObjectId(userId),
        })

        if (existingPost) {
          // Update existing post with latest data
          existingPost.content = ayrsharePost.text || existingPost.content
          existingPost.status = ayrsharePost.status === 'published' ? 'published' :
            ayrsharePost.status === 'scheduled' ? 'scheduled' :
              existingPost.status

          if (ayrsharePost.postedDate) {
            existingPost.publishedAt = new Date(ayrsharePost.postedDate)
          }

          // Update engagement metrics if available
          if (ayrsharePost.analytics) {
            existingPost.likes = ayrsharePost.analytics.likes || existingPost.likes || 0
            existingPost.comments = ayrsharePost.analytics.comments || existingPost.comments || 0
            existingPost.shares = ayrsharePost.analytics.shares || existingPost.shares || 0
            existingPost.views = ayrsharePost.analytics.views || existingPost.views || 0
            existingPost.impressions = ayrsharePost.analytics.impressions || existingPost.impressions || 0
          }

          await existingPost.save()
          synced++
        } else {
          // Create new post in database
          const postDate = ayrsharePost.postedDate ? new Date(ayrsharePost.postedDate) : new Date()

          const newPost = new SocialMediaPost({
            userId: new Types.ObjectId(userId),
            platform: dbPlatform,
            postType: ayrsharePost.mediaUrls && ayrsharePost.mediaUrls.length > 0 ? 'image' : 'text',
            content: ayrsharePost.text || '',
            mediaAttachments: ayrsharePost.mediaUrls?.map((url: string) => ({
              type: 'image',
              url: url,
            })) || [],
            platformPostId: ayrsharePost.postId,
            status: ayrsharePost.status === 'published' ? 'published' :
              ayrsharePost.status === 'scheduled' ? 'scheduled' : 'published',
            publishedAt: postDate,
            likes: ayrsharePost.analytics?.likes || 0,
            comments: ayrsharePost.analytics?.comments || 0,
            shares: ayrsharePost.analytics?.shares || 0,
            views: ayrsharePost.analytics?.views || 0,
            impressions: ayrsharePost.analytics?.impressions || 0,
          })

          await newPost.save()
          synced++
          console.log(`[Ayrshare Sync] Created new post: ${dbPlatform} - ${ayrsharePost.postId}`)
        }
      } catch (error: any) {
        console.error(`[Ayrshare Sync] Error syncing post ${ayrsharePost.postId}:`, error.message)
        errors++
      }
    }

    console.log(`[Ayrshare Sync] Complete: ${synced} synced, ${skipped} skipped, ${errors} errors`)
    return { synced, skipped, errors }
  } catch (error: any) {
    console.error('[Ayrshare Sync] Fatal error:', error)
    throw error
  }
}

/**
 * Calculate best posting times based on frequency (not performance)
 */
export function calculateBestPostingTimesByFrequency(posts: AyrsharePost[]): {
  bestDays: Array<{ day: string; count: number; percentage: number }>
  bestHours: Array<{ hour: number; count: number; percentage: number }>
  bestDayHourCombinations: Array<{ day: string; hour: number; count: number }>
} {
  const dayHourMap = new Map<string, number>()
  const dayCounts: Record<string, number> = {}
  const hourCounts: Record<number, number> = {}

  posts.forEach((post) => {
    if (!post.postedDate) return

    const date = new Date(post.postedDate)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const hour = date.getHours()
    const key = `${dayName}-${hour}`

    // Count day-hour combinations
    dayHourMap.set(key, (dayHourMap.get(key) || 0) + 1)

    // Count days
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1

    // Count hours
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  const bestDays = Object.entries(dayCounts)
    .map(([day, count]) => ({
      day,
      count,
      percentage: posts.length > 0 ? Math.round((count / posts.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  const bestHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      percentage: posts.length > 0 ? Math.round((count / posts.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 24)

  const bestDayHourCombinations = Array.from(dayHourMap.entries())
    .map(([key, count]) => {
      const [day, hour] = key.split('-')
      return {
        day,
        hour: parseInt(hour),
        count,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return {
    bestDays,
    bestHours,
    bestDayHourCombinations,
  }
}

/**
 * Get analytics for multiple posts from Ayrshare
 */
export async function getMultiplePostAnalytics(postIds: string[]): Promise<Record<string, AyrshareAnalytics>> {
  const results: Record<string, AyrshareAnalytics> = {}

  // Ayrshare API might have rate limits, so we'll fetch in batches
  const batchSize = 10
  for (let i = 0; i < postIds.length; i += batchSize) {
    const batch = postIds.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (postId) => {
        try {
          const analytics = await getPostAnalytics(postId)
          if (analytics) {
            results[postId] = analytics
          }
        } catch (error) {
          console.error(`Failed to get analytics for post ${postId}:`, error)
        }
      })
    )

    // Small delay to avoid rate limiting
    if (i + batchSize < postIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}

/**
 * Update engagement metrics for posts using Ayrshare API
 */
export async function updatePostEngagementMetrics(
  posts: Array<{ postId: string; platformPostId?: string }>
): Promise<Record<string, {
  likes: number
  comments: number
  shares: number
  views: number
  impressions: number
}>> {
  const metrics: Record<string, any> = {}

  // Get post IDs to fetch analytics for
  const postIds = posts
    .map(p => p.platformPostId || p.postId)
    .filter(id => id && id !== 'undefined')

  if (postIds.length === 0) {
    return metrics
  }

  console.log(`[Ayrshare] Fetching analytics for ${postIds.length} posts`)

  // Fetch analytics from Ayrshare
  const analyticsData = await getMultiplePostAnalytics(postIds)

  // Also get all posts from history which includes analytics
  const allPosts = await getAllPosts(200)

  // Create a map of postId to analytics
  const postAnalyticsMap = new Map<string, AyrsharePost>()
  allPosts.forEach(post => {
    if (post.postId) {
      postAnalyticsMap.set(post.postId, post)
    }
  })

  // Combine analytics from both sources
  posts.forEach((post) => {
    const postId = post.platformPostId || post.postId
    if (!postId) return

    // Try to get from analytics endpoint first
    const analytics = analyticsData[postId]
    if (analytics) {
      metrics[postId] = {
        likes: analytics.likes || 0,
        comments: analytics.comments || 0,
        shares: analytics.shares || 0,
        views: analytics.views || 0,
        impressions: analytics.impressions || 0,
      }
      return
    }

    // Fallback to history data
    const historyPost = postAnalyticsMap.get(postId)
    if (historyPost?.analytics) {
      metrics[postId] = {
        likes: historyPost.analytics.likes || 0,
        comments: historyPost.analytics.comments || 0,
        shares: historyPost.analytics.shares || 0,
        views: historyPost.analytics.views || 0,
        impressions: historyPost.analytics.impressions || 0,
      }
    }
  })

  console.log(`[Ayrshare] Retrieved metrics for ${Object.keys(metrics).length} posts`)
  return metrics
}

/**
 * Get social analytics for all platforms
 */
export async function getSocialAnalytics(): Promise<any> {
  try {
    const response = await axios.get(
      `${AYRSHARE_BASE_URL}/analytics/social`,
      {
        headers: {
          'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Ayrshare social analytics error:', error?.response?.data || error.message)
    return null
  }
}

/**
 * Calculate top posting times based on frequency
 */
export function calculateTopPostingTimes(posts: AyrsharePost[]): Array<{ hour: number; day: string; count: number; engagement: number }> {
  const timeMap = new Map<string, { count: number; engagement: number }>()

  posts.forEach((post) => {
    if (!post.postedDate) return

    const date = new Date(post.postedDate)
    const hour = date.getHours()
    const day = date.toLocaleDateString('en-US', { weekday: 'long' })
    const key = `${day}-${hour}`

    const engagement = (post.analytics?.likes || 0) +
      (post.analytics?.comments || 0) * 2 +
      (post.analytics?.shares || 0) * 3 +
      (post.analytics?.views || 0) * 0.1

    const existing = timeMap.get(key) || { count: 0, engagement: 0 }
    timeMap.set(key, {
      count: existing.count + 1,
      engagement: existing.engagement + engagement,
    })
  })

  return Array.from(timeMap.entries())
    .map(([key, data]) => {
      const [day, hour] = key.split('-')
      return {
        hour: parseInt(hour),
        day,
        count: data.count,
        engagement: data.engagement,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20) // Top 20 posting times
}

/**
 * Generate platform-wise heatmap data
 */
export function generatePlatformHeatmaps(posts: AyrsharePost[]): Record<string, Array<{ hour: number; day: string; value: number }>> {
  const platformMap: Record<string, Map<string, number>> = {}

  const platforms = ['facebook', 'instagram', 'twitter', 'linkedin']
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Initialize all platforms with empty maps
  platforms.forEach((platform) => {
    platformMap[platform] = new Map()
  })

  // Process posts and aggregate engagement by platform, day, and hour
  posts.forEach((post) => {
    if (!post.postedDate) return

    let platform = post.platform?.toLowerCase()

    // Normalize platform names
    if (platform === 'x' || platform === 'twitter/x') {
      platform = 'twitter'
    }

    if (!platform || !platformMap[platform]) return

    const date = new Date(post.postedDate)
    const hour = date.getHours()
    // Normalize day names to match frontend format (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const day = dayNames[date.getDay()]
    const key = `${day}-${hour}`

    const engagement = (post.analytics?.likes || 0) +
      (post.analytics?.comments || 0) * 2 +
      (post.analytics?.shares || 0) * 3 +
      (post.analytics?.views || 0) * 0.1

    // If no engagement data but post exists, give it a minimum value of 1 for visibility
    const engagementValue = engagement > 0 ? engagement : 1

    const existing = platformMap[platform].get(key) || 0
    platformMap[platform].set(key, existing + engagementValue)
  })

  const result: Record<string, Array<{ hour: number; day: string; value: number }>> = {}

  // Generate complete heatmap data for all platforms (all days and hours)
  platforms.forEach((platform) => {
    result[platform] = []

    // Generate all combinations of days and hours
    days.forEach((day) => {
      hours.forEach((hour) => {
        const key = `${day}-${hour}`
        const value = platformMap[platform].get(key) || 0
        result[platform].push({
          hour,
          day,
          value,
        })
      })
    })
  })

  return result
}

/**
 * Calculate posting consistency insights
 */
export function calculatePostingConsistency(posts: AyrsharePost[]): {
  consistencyScore: number
  averageDaysBetween: number
  longestGap: number
  shortestGap: number
  recommendations: string[]
} {
  if (posts.length < 2) {
    return {
      consistencyScore: 0,
      averageDaysBetween: 0,
      longestGap: 0,
      shortestGap: 0,
      recommendations: ['Post more frequently to establish a consistent presence'],
    }
  }

  const sortedPosts = [...posts]
    .filter((p) => p.postedDate)
    .sort((a, b) => new Date(a.postedDate!).getTime() - new Date(b.postedDate!).getTime())

  const gaps: number[] = []
  for (let i = 1; i < sortedPosts.length; i++) {
    const gap = (new Date(sortedPosts[i].postedDate!).getTime() -
      new Date(sortedPosts[i - 1].postedDate!).getTime()) / (1000 * 60 * 60 * 24)
    gaps.push(gap)
  }

  const averageDaysBetween = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  const longestGap = Math.max(...gaps)
  const shortestGap = Math.min(...gaps)

  // Calculate consistency score (0-100)
  // Lower variance = higher consistency
  const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - averageDaysBetween, 2), 0) / gaps.length
  const standardDeviation = Math.sqrt(variance)
  const consistencyScore = Math.max(0, 100 - (standardDeviation / averageDaysBetween) * 100)

  const recommendations: string[] = []

  if (consistencyScore < 50) {
    recommendations.push('Your posting schedule is inconsistent. Try to post at regular intervals.')
  }
  if (longestGap > 7) {
    recommendations.push(`You had a gap of ${Math.round(longestGap)} days between posts. Consider posting more frequently.`)
  }
  if (averageDaysBetween > 3) {
    recommendations.push(`You're posting every ${averageDaysBetween.toFixed(1)} days on average. Consider increasing frequency to 2-3 times per week.`)
  }
  if (consistencyScore > 80) {
    recommendations.push('Great job maintaining a consistent posting schedule!')
  }

  return {
    consistencyScore: Math.round(consistencyScore),
    averageDaysBetween: Math.round(averageDaysBetween * 10) / 10,
    longestGap: Math.round(longestGap),
    shortestGap: Math.round(shortestGap),
    recommendations,
  }
}

/**
 * Calculate overall engagement metrics
 */
export function calculateEngagementMetrics(posts: AyrsharePost[]): {
  totalLikes: number
  totalComments: number
  totalShares: number
  totalViews: number
  totalImpressions: number
  averageEngagement: number
  engagementRate: number
  topPerformingPost: AyrsharePost | null
} {
  let totalLikes = 0
  let totalComments = 0
  let totalShares = 0
  let totalViews = 0
  let totalImpressions = 0
  let maxEngagement = 0
  let topPost: AyrsharePost | null = null

  posts.forEach((post) => {
    const likes = post.analytics?.likes || 0
    const comments = post.analytics?.comments || 0
    const shares = post.analytics?.shares || 0
    const views = post.analytics?.views || 0
    const impressions = post.analytics?.impressions || 0

    totalLikes += likes
    totalComments += comments
    totalShares += shares
    totalViews += views
    totalImpressions += impressions

    const engagement = likes + comments * 2 + shares * 3 + views * 0.1
    if (engagement > maxEngagement) {
      maxEngagement = engagement
      topPost = post
    }
  })

  const totalPosts = posts.length
  const averageEngagement = totalPosts > 0
    ? (totalLikes + totalComments * 2 + totalShares * 3 + totalViews * 0.1) / totalPosts
    : 0
  const engagementRate = totalImpressions > 0
    ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100
    : 0

  return {
    totalLikes,
    totalComments,
    totalShares,
    totalViews,
    totalImpressions,
    averageEngagement: Math.round(averageEngagement * 10) / 10,
    engagementRate: Math.round(engagementRate * 100) / 100,
    topPerformingPost: topPost,
  }
}

/**
 * Calculate platform performance comparison
 */
export function calculatePlatformPerformance(posts: AyrsharePost[]): Record<string, {
  totalPosts: number
  totalEngagement: number
  averageEngagement: number
  engagementRate: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalViews: number
}> {
  const platformStats: Record<string, {
    posts: AyrsharePost[]
    totalLikes: number
    totalComments: number
    totalShares: number
    totalViews: number
    totalImpressions: number
  }> = {}

  posts.forEach((post) => {
    let platform = post.platform?.toLowerCase() || ''
    if (platform === 'x' || platform === 'twitter/x') {
      platform = 'twitter'
    }

    if (!platform) return

    if (!platformStats[platform]) {
      platformStats[platform] = {
        posts: [],
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        totalImpressions: 0,
      }
    }

    platformStats[platform].posts.push(post)
    platformStats[platform].totalLikes += post.analytics?.likes || 0
    platformStats[platform].totalComments += post.analytics?.comments || 0
    platformStats[platform].totalShares += post.analytics?.shares || 0
    platformStats[platform].totalViews += post.analytics?.views || 0
    platformStats[platform].totalImpressions += post.analytics?.impressions || 0
  })

  const result: Record<string, any> = {}

  Object.entries(platformStats).forEach(([platform, stats]) => {
    const totalEngagement = stats.totalLikes +
      stats.totalComments * 2 +
      stats.totalShares * 3 +
      stats.totalViews * 0.1
    const averageEngagement = stats.posts.length > 0
      ? totalEngagement / stats.posts.length
      : 0
    const engagementRate = stats.totalImpressions > 0
      ? ((stats.totalLikes + stats.totalComments + stats.totalShares) / stats.totalImpressions) * 100
      : 0

    result[platform] = {
      totalPosts: stats.posts.length,
      totalEngagement: Math.round(totalEngagement * 10) / 10,
      averageEngagement: Math.round(averageEngagement * 10) / 10,
      engagementRate: Math.round(engagementRate * 100) / 100,
      totalLikes: stats.totalLikes,
      totalComments: stats.totalComments,
      totalShares: stats.totalShares,
      totalViews: stats.totalViews,
    }
  })

  return result
}

/**
 * Calculate content type performance
 */
export function calculateContentTypePerformance(posts: AyrsharePost[]): Record<string, {
  count: number
  averageEngagement: number
  totalEngagement: number
}> {
  const typeStats: Record<string, {
    posts: AyrsharePost[]
    totalEngagement: number
  }> = {}

  posts.forEach((post) => {
    const hasImage = post.mediaUrls && post.mediaUrls.length > 0 &&
      post.mediaUrls.some(url => /\.(jpg|jpeg|png|gif|webp)/i.test(url))
    const hasVideo = post.mediaUrls && post.mediaUrls.length > 0 &&
      post.mediaUrls.some(url => /\.(mp4|mov|avi|webm)/i.test(url))

    let contentType = 'text'
    if (hasVideo) {
      contentType = 'video'
    } else if (hasImage) {
      contentType = 'image'
    }

    if (!typeStats[contentType]) {
      typeStats[contentType] = {
        posts: [],
        totalEngagement: 0,
      }
    }

    typeStats[contentType].posts.push(post)
    const engagement = (post.analytics?.likes || 0) +
      (post.analytics?.comments || 0) * 2 +
      (post.analytics?.shares || 0) * 3 +
      (post.analytics?.views || 0) * 0.1
    typeStats[contentType].totalEngagement += engagement
  })

  const result: Record<string, any> = {}

  Object.entries(typeStats).forEach(([type, stats]) => {
    result[type] = {
      count: stats.posts.length,
      averageEngagement: stats.posts.length > 0
        ? Math.round((stats.totalEngagement / stats.posts.length) * 10) / 10
        : 0,
      totalEngagement: Math.round(stats.totalEngagement * 10) / 10,
    }
  })

  return result
}

/**
 * Calculate engagement trends over time
 */
export function calculateEngagementTrends(posts: AyrsharePost[]): Array<{
  date: string
  posts: number
  engagement: number
  averageEngagement: number
}> {
  const dateMap = new Map<string, {
    posts: number
    engagement: number
  }>()

  posts.forEach((post) => {
    if (!post.postedDate) return

    const date = new Date(post.postedDate)
    const dateStr = date.toISOString().split('T')[0]

    const existing = dateMap.get(dateStr) || { posts: 0, engagement: 0 }
    const engagement = (post.analytics?.likes || 0) +
      (post.analytics?.comments || 0) * 2 +
      (post.analytics?.shares || 0) * 3 +
      (post.analytics?.views || 0) * 0.1

    dateMap.set(dateStr, {
      posts: existing.posts + 1,
      engagement: existing.engagement + engagement,
    })
  })

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      posts: data.posts,
      engagement: Math.round(data.engagement * 10) / 10,
      averageEngagement: data.posts > 0
        ? Math.round((data.engagement / data.posts) * 10) / 10
        : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get industry recommendations based on best practices
 */
export function getIndustryRecommendations(
  postingTimes: Array<{ hour: number; day: string; count: number }>,
  consistency: { consistencyScore: number; averageDaysBetween: number },
  platformHeatmaps: Record<string, any>
): string[] {
  const recommendations: string[] = []

  // Analyze posting times
  const weekdayPosts = postingTimes.filter((pt) =>
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(pt.day)
  )
  const weekendPosts = postingTimes.filter((pt) =>
    ['Saturday', 'Sunday'].includes(pt.day)
  )

  if (weekendPosts.length === 0 && weekdayPosts.length > 0) {
    recommendations.push('Consider posting on weekends - many audiences are more active during leisure time.')
  }

  // Analyze peak hours
  const peakHours = postingTimes
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((pt) => pt.hour)

  const morningHours = peakHours.filter((h) => h >= 6 && h < 12)
  const afternoonHours = peakHours.filter((h) => h >= 12 && h < 17)
  const eveningHours = peakHours.filter((h) => h >= 17 && h < 22)

  if (morningHours.length > afternoonHours.length && morningHours.length > eveningHours.length) {
    recommendations.push('Your audience is most active in the morning. Continue posting during 6 AM - 12 PM.')
  } else if (afternoonHours.length > eveningHours.length) {
    recommendations.push('Afternoon posting (12 PM - 5 PM) works well for your audience.')
  } else if (eveningHours.length > 0) {
    recommendations.push('Evening posting (5 PM - 10 PM) shows good engagement. Maintain this schedule.')
  }

  // Platform-specific recommendations
  const platforms = Object.keys(platformHeatmaps)
  if (platforms.length > 0) {
    recommendations.push(`You're active on ${platforms.length} platform(s). Consider diversifying content across platforms.`)
  }

  // Consistency recommendations
  if (consistency.consistencyScore < 70) {
    recommendations.push('Aim for 3-5 posts per week for optimal engagement and algorithm favorability.')
  }

  // Industry best practices
  recommendations.push('Best practice: Post when your audience is most active. Use analytics to identify peak engagement times.')
  recommendations.push('Tip: Maintain a consistent posting schedule to build audience expectations and improve reach.')

  return recommendations
}

