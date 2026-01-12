import PredictionBestTime from '../models/PredictionBestTime'

/**
 * Best Time Analytics Service
 * 
 * This service reads data from the MongoDB 'melo' database,
 * 'prediction_best_time' collection for global benchmark analytics.
 * 
 * Database: melo
 * Collection: prediction_best_time
 */

/**
 * Format hour to readable time (e.g., 10 -> "10am", 14 -> "2pm")
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

/**
 * Format hour range (e.g., [10, 11] -> "10-11am")
 */
function formatHourRange(hours: number[]): string {
  if (hours.length === 0) return ''
  if (hours.length === 1) return formatHour(hours[0])
  
  const sorted = [...hours].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let end = sorted[0]
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      if (start === end) {
        ranges.push(formatHour(start))
      } else {
        ranges.push(`${formatHour(start)}-${formatHour(end)}`)
      }
      start = sorted[i]
      end = sorted[i]
    }
  }
  
  if (start === end) {
    ranges.push(formatHour(start))
  } else {
    ranges.push(`${formatHour(start)}-${formatHour(end)}`)
  }
  
  return ranges.join(', ')
}

/**
 * Get available years and months from the dataset
 */
export async function getAvailableTimePeriods() {
  try {
    const result = await PredictionBestTime.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' }
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ])
    
    const years = [...new Set(result.map((r: any) => r._id.year))].sort((a, b) => b - a)
    const monthsByYear: Record<number, number[]> = {}
    
    result.forEach((r: any) => {
      const year = r._id.year
      const month = r._id.month
      if (!monthsByYear[year]) {
        monthsByYear[year] = []
      }
      if (!monthsByYear[year].includes(month)) {
        monthsByYear[year].push(month)
      }
    })
    
    // Sort months for each year
    Object.keys(monthsByYear).forEach(year => {
      monthsByYear[parseInt(year)].sort((a, b) => b - a)
    })
    
    return { years, monthsByYear }
  } catch (error: any) {
    console.error('[Available Time Periods] Error:', error)
    return { years: [], monthsByYear: {} }
  }
}

/**
 * Get best hours to post per platform
 * Reads from melo.prediction_best_time collection
 * Returns both detailed hour data and formatted recommendations
 */
export async function getBestHoursPerPlatform(platform?: string, year?: number, month?: number) {
  try {
    // First check if there's any data in the collection
    const totalCount = await PredictionBestTime.countDocuments({})
    console.log(`[Best Hours] Total documents in prediction_best_time: ${totalCount}`)
    
    if (totalCount === 0) {
      console.warn('[Best Hours] No data found in prediction_best_time collection')
      return {}
    }
    
    const matchStage: any = {}
    if (platform) {
      matchStage.platform = platform
    }
    
    // Add year and month filtering
    if (year || month) {
      const dateFilter: any = {}
      if (year) {
        dateFilter.$gte = new Date(year, month ? month - 1 : 0, 1)
        dateFilter.$lt = new Date(year, month ? month : 12, 1)
      } else if (month) {
        // If only month is provided, filter by current year
        const currentYear = new Date().getFullYear()
        dateFilter.$gte = new Date(currentYear, month - 1, 1)
        dateFilter.$lt = new Date(currentYear, month, 1)
      }
      matchStage.timestamp = dateFilter
    }
    
    const matchCount = await PredictionBestTime.countDocuments(matchStage)
    console.log(`[Best Hours] Matching documents${platform ? ` for platform ${platform}` : ''}: ${matchCount}`)

    const result = await PredictionBestTime.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { platform: '$platform', hour: '$hour' },
        avgLikes: { $avg: '$likes' },
        avgRetweets: { $avg: '$retweets' },
        avgEngagement: { $avg: '$engagementScore' },
        postCount: { $sum: 1 },
        totalEngagement: { $sum: '$engagementScore' },
      },
    },
    {
      $sort: { totalEngagement: -1 },
    },
    {
      $group: {
        _id: '$_id.platform',
        hours: {
          $push: {
            hour: '$_id.hour',
            avgLikes: '$avgLikes',
            avgRetweets: '$avgRetweets',
            avgEngagement: '$avgEngagement',
            postCount: '$postCount',
            totalEngagement: '$totalEngagement',
          },
        },
      },
    },
  ])

  const formatted: Record<string, any> = {}
  
  result.forEach((platformData) => {
    const platform = platformData._id
    const sortedHours = platformData.hours
      .sort((a: any, b: any) => b.totalEngagement - a.totalEngagement)
    
    // Get top hours (above average engagement)
    const avgEngagement = sortedHours.reduce((sum: number, h: any) => sum + h.avgEngagement, 0) / sortedHours.length
    const topHoursData = sortedHours
      .filter((h: any) => h.avgEngagement >= avgEngagement * 0.8) // Top 80% or better
      .slice(0, 8) // Top 8 hours max
    
    // Extract hour numbers for recommendation (sorted numerically for range formatting)
    const topHours = topHoursData.map((h: any) => h.hour).sort((a: number, b: number) => a - b)
    
    // Top hours sorted by engagement (for display)
    const topHoursByEngagement = topHoursData
      .sort((a: any, b: any) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5) // Top 5 for display
      .map((h: any) => ({
        hour: h.hour,
        avgEngagement: Math.round(h.avgEngagement * 100) / 100,
      }))
    
    formatted[platform] = {
      hours: sortedHours.slice(0, 10).map((h: any) => ({
        hour: h.hour,
        metrics: {
          avgLikes: Math.round(h.avgLikes * 100) / 100,
          avgRetweets: Math.round(h.avgRetweets * 100) / 100,
          avgEngagement: Math.round(h.avgEngagement * 100) / 100,
          postCount: h.postCount,
          totalEngagement: h.totalEngagement,
        },
      })),
      // Add formatted recommendation string
      recommendation: formatHourRange(topHours),
      topHours: topHours, // Numerically sorted for recommendation
      topHoursByEngagement: topHoursByEngagement, // Sorted by engagement for display
    }
  })

    console.log(`[Best Hours] Returning data for ${Object.keys(formatted).length} platforms`)
    return formatted
  } catch (error: any) {
    console.error('[Best Hours] Error:', error)
    return {}
  }
}

/**
 * Format day abbreviation (e.g., "Tuesday" -> "Tue")
 */
function formatDayAbbr(day: string): string {
  const abbr: Record<string, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  }
  return abbr[day] || day.substring(0, 3)
}

/**
 * Format day range (e.g., ["Tuesday", "Wednesday"] -> "Tue-Wed")
 */
function formatDayRange(days: string[]): string {
  if (days.length === 0) return ''
  if (days.length === 1) return formatDayAbbr(days[0])
  
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const sorted = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
  
  // If consecutive days, format as range
  const ranges: string[] = []
  let start = sorted[0]
  let end = sorted[0]
  
  for (let i = 1; i < sorted.length; i++) {
    const currentIdx = dayOrder.indexOf(sorted[i])
    const prevIdx = dayOrder.indexOf(end)
    
    if (currentIdx === prevIdx + 1) {
      end = sorted[i]
    } else {
      if (start === end) {
        ranges.push(formatDayAbbr(start))
      } else {
        ranges.push(`${formatDayAbbr(start)}-${formatDayAbbr(end)}`)
      }
      start = sorted[i]
      end = sorted[i]
    }
  }
  
  if (start === end) {
    ranges.push(formatDayAbbr(start))
  } else {
    ranges.push(`${formatDayAbbr(start)}-${formatDayAbbr(end)}`)
  }
  
  return ranges.join(', ')
}

/**
 * Get best days to post per platform
 * Returns both detailed day data and formatted recommendations
 */
export async function getBestDaysPerPlatform(platform?: string, year?: number, month?: number) {
  const matchStage: any = {}
  if (platform) {
    matchStage.platform = platform
  }
  
  // Add year and month filtering
  if (year || month) {
    const dateFilter: any = {}
    if (year) {
      dateFilter.$gte = new Date(year, month ? month - 1 : 0, 1)
      dateFilter.$lt = new Date(year, month ? month : 12, 1)
    } else if (month) {
      // If only month is provided, filter by current year
      const currentYear = new Date().getFullYear()
      dateFilter.$gte = new Date(currentYear, month - 1, 1)
      dateFilter.$lt = new Date(currentYear, month, 1)
    }
    matchStage.timestamp = dateFilter
  }

  const result = await PredictionBestTime.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { platform: '$platform', day: '$day' },
        avgLikes: { $avg: '$likes' },
        avgRetweets: { $avg: '$retweets' },
        avgEngagement: { $avg: '$engagementScore' },
        postCount: { $sum: 1 },
        totalEngagement: { $sum: '$engagementScore' },
      },
    },
    {
      $sort: { totalEngagement: -1 },
    },
    {
      $group: {
        _id: '$_id.platform',
        days: {
          $push: {
            day: '$_id.day',
            avgLikes: '$avgLikes',
            avgRetweets: '$avgRetweets',
            avgEngagement: '$avgEngagement',
            postCount: '$postCount',
            totalEngagement: '$totalEngagement',
          },
        },
      },
    },
  ])

  const formatted: Record<string, any> = {}
  
  result.forEach((platformData) => {
    const platform = platformData._id
    const sortedDays = platformData.days
      .sort((a: any, b: any) => (b as any).totalEngagement - (a as any).totalEngagement)
    
    // Get top days (above average engagement)
    const avgEngagement = sortedDays.reduce((sum: number, d: any) => sum + d.avgEngagement, 0) / sortedDays.length
    const topDays = sortedDays
      .filter((d: any) => d.avgEngagement >= avgEngagement * 0.85) // Top 85% or better
      .map((d: any) => d.day)
    
    formatted[platform] = {
      days: sortedDays.map((d: any) => ({
        day: d.day,
        metrics: {
          avgLikes: Math.round(d.avgLikes * 100) / 100,
          avgRetweets: Math.round(d.avgRetweets * 100) / 100,
          avgEngagement: Math.round(d.avgEngagement * 100) / 100,
          postCount: d.postCount,
          totalEngagement: d.totalEngagement,
        },
      })),
      // Add formatted recommendation string
      recommendation: formatDayRange(topDays),
      topDays: topDays,
    }
  })

  return formatted
}

/**
 * Get day × hour heatmap data
 */
export async function getDayHourHeatmap(platform?: string, metric: 'likes' | 'retweets' | 'engagement' = 'engagement', year?: number, month?: number) {
  const matchStage: any = {}
  if (platform) {
    matchStage.platform = platform
  }
  
  // Add year and month filtering
  if (year || month) {
    const dateFilter: any = {}
    if (year) {
      dateFilter.$gte = new Date(year, month ? month - 1 : 0, 1)
      dateFilter.$lt = new Date(year, month ? month : 12, 1)
    } else if (month) {
      // If only month is provided, filter by current year
      const currentYear = new Date().getFullYear()
      dateFilter.$gte = new Date(currentYear, month - 1, 1)
      dateFilter.$lt = new Date(currentYear, month, 1)
    }
    matchStage.timestamp = dateFilter
  }

  const metricField = metric === 'engagement' ? 'engagementScore' : metric

  const result = await PredictionBestTime.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          platform: '$platform',
          day: '$day',
          hour: '$hour',
        },
        totalLikes: { $sum: '$likes' },
        totalRetweets: { $sum: '$retweets' },
        totalEngagement: { $sum: '$engagementScore' },
        avgLikes: { $avg: '$likes' },
        avgRetweets: { $avg: '$retweets' },
        avgEngagement: { $avg: '$engagementScore' },
        postCount: { $sum: 1 },
      },
    },
  ])

  // Format for heatmap visualization
  const heatmapData: Record<string, any[]> = {}
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  result.forEach((item) => {
    const platform = item._id.platform
    if (!heatmapData[platform]) {
      heatmapData[platform] = []
    }

    const value = metric === 'engagement' 
      ? item.totalEngagement 
      : metric === 'likes' 
      ? item.totalLikes 
      : item.totalRetweets

    const avgValue = metric === 'engagement'
      ? item.avgEngagement
      : metric === 'likes'
      ? item.avgLikes
      : item.avgRetweets

    heatmapData[platform].push({
      day: item._id.day,
      hour: item._id.hour,
      value: Math.round(value),
      avgValue: Math.round(avgValue * 100) / 100,
      postCount: item.postCount,
      totalLikes: item.totalLikes,
      totalRetweets: item.totalRetweets,
      totalEngagement: item.totalEngagement,
    })
  })

  // Fill in missing combinations with 0
  Object.keys(heatmapData).forEach((platform) => {
    const existing = new Set(
      heatmapData[platform].map((d) => `${d.day}-${d.hour}`)
    )
    
    days.forEach((day) => {
      hours.forEach((hour) => {
        const key = `${day}-${hour}`
        if (!existing.has(key)) {
          heatmapData[platform].push({
            day,
            hour,
            value: 0,
            avgValue: 0,
            postCount: 0,
            totalLikes: 0,
            totalRetweets: 0,
            totalEngagement: 0,
          })
        }
      })
    })
  })

  return heatmapData
}

/**
 * Get engagement metrics aggregated
 * Returns metrics grouped by platform or country with comprehensive statistics
 */
export async function getEngagementMetrics(platform?: string, country?: string) {
  const matchStage: any = {}
  if (platform) {
    matchStage.platform = platform
  }
  if (country) {
    matchStage.country = country
  }

  // Determine grouping: if platform specified, group by country; if country specified, group by platform; otherwise group by platform
  const groupBy = platform ? (country ? null : '$country') : (country ? '$platform' : '$platform')

  const result = await PredictionBestTime.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupBy || null,
        totalPosts: { $sum: 1 },
        totalLikes: { $sum: '$likes' },
        totalRetweets: { $sum: '$retweets' },
        totalEngagement: { $sum: '$engagementScore' },
        avgLikesPerPost: { $avg: '$likes' },
        avgRetweetsPerPost: { $avg: '$retweets' },
        avgEngagementPerPost: { $avg: '$engagementScore' },
        maxLikes: { $max: '$likes' },
        maxRetweets: { $max: '$retweets' },
        maxEngagement: { $max: '$engagementScore' },
        minLikes: { $min: '$likes' },
        minRetweets: { $min: '$retweets' },
        minEngagement: { $min: '$engagementScore' },
      },
    },
    {
      $sort: { totalEngagement: -1 },
    },
  ])

  // Calculate overall averages for comparison
  const totalPosts = result.reduce((sum, item) => sum + item.totalPosts, 0)
  const totalEngagement = result.reduce((sum, item) => sum + item.totalEngagement, 0)
  const overallAvgEngagement = totalPosts > 0 ? totalEngagement / totalPosts : 0

  return result.map((item) => {
    const avgEngagement = item.avgEngagementPerPost || 0
    const performanceRatio = overallAvgEngagement > 0 ? (avgEngagement / overallAvgEngagement) : 1
    const performanceLabel = performanceRatio >= 1.2 ? 'High' : performanceRatio >= 0.8 ? 'Average' : 'Low'
    
    return {
      group: item._id || 'all',
      totalPosts: item.totalPosts,
      totalLikes: item.totalLikes,
      totalRetweets: item.totalRetweets,
      totalEngagement: item.totalEngagement,
      avgLikesPerPost: Math.round(item.avgLikesPerPost * 100) / 100,
      avgRetweetsPerPost: Math.round(item.avgRetweetsPerPost * 100) / 100,
      avgEngagementPerPost: Math.round(avgEngagement * 100) / 100,
      maxLikes: item.maxLikes,
      maxRetweets: item.maxRetweets,
      maxEngagement: item.maxEngagement,
      minLikes: item.minLikes,
      minRetweets: item.minRetweets,
      minEngagement: item.minEngagement,
      performanceRatio: Math.round(performanceRatio * 100) / 100,
      performanceLabel,
      engagementRate: item.totalPosts > 0 ? Math.round((item.totalEngagement / item.totalPosts) * 100) / 100 : 0,
    }
  })
}

/**
 * Get top posts by engagement
 * Returns top performing posts with formatted data
 */
export async function getTopPosts(limit: number = 10, sortBy: 'likes' | 'retweets' | 'engagement' = 'engagement') {
  const sortField = sortBy === 'engagement' ? 'engagementScore' : sortBy

  const posts = await PredictionBestTime.find({})
    .sort({ [sortField]: -1 })
    .limit(limit)
    .select('timestamp platform likes retweets engagementScore sentiment text hashtags country hour day')
    .lean()

  // Calculate percentiles for context
  const allEngagementScores = await PredictionBestTime.find({})
    .select('engagementScore')
    .lean()
    .then(posts => posts.map(p => p.engagementScore).sort((a, b) => b - a))
  
  const p50 = allEngagementScores[Math.floor(allEngagementScores.length * 0.5)] || 0
  const p75 = allEngagementScores[Math.floor(allEngagementScores.length * 0.25)] || 0
  const p90 = allEngagementScores[Math.floor(allEngagementScores.length * 0.1)] || 0

  return posts.map((post, index) => {
    const score = post.engagementScore || 0
    let percentile = 'Average'
    if (score >= p90) percentile = 'Top 10%'
    else if (score >= p75) percentile = 'Top 25%'
    else if (score >= p50) percentile = 'Top 50%'
    
    return {
      rank: index + 1,
      timestamp: post.timestamp,
      platform: post.platform,
      likes: post.likes,
      retweets: post.retweets,
      engagementScore: post.engagementScore,
      sentiment: post.sentiment,
      text: post.text?.substring(0, 300) + (post.text && post.text.length > 300 ? '...' : ''),
      hashtags: post.hashtags || [],
      country: post.country,
      hour: post.hour,
      day: post.day,
      percentile,
      engagementRate: post.likes > 0 ? Math.round((post.retweets / post.likes) * 100) / 100 : 0,
    }
  })
}

/**
 * Get sentiment-aware posting insights
 * Returns best posting times for different sentiment types per platform
 */
export async function getSentimentInsights(platform?: string) {
  const matchStage: any = {}
  if (platform) {
    matchStage.platform = platform
  }

  const result = await PredictionBestTime.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          platform: '$platform',
          sentiment: '$sentiment',
          hour: '$hour',
        },
        avgEngagement: { $avg: '$engagementScore' },
        totalEngagement: { $sum: '$engagementScore' },
        postCount: { $sum: 1 },
        avgLikes: { $avg: '$likes' },
        avgRetweets: { $avg: '$retweets' },
      },
    },
    {
      $sort: { avgEngagement: -1 },
    },
  ])

  const insights: Record<string, any> = {}
  
  result.forEach((item) => {
    const key = `${item._id.platform}_${item._id.sentiment}`
    if (!insights[key]) {
      insights[key] = {
        platform: item._id.platform,
        sentiment: item._id.sentiment,
        bestHours: [],
        totalPosts: 0,
        avgEngagement: 0,
      }
    }
    
    insights[key].totalPosts += item.postCount
    
    // Get top 5 hours by average engagement
    if (insights[key].bestHours.length < 5) {
      insights[key].bestHours.push({
        hour: item._id.hour,
        avgEngagement: Math.round(item.avgEngagement * 100) / 100,
        totalEngagement: item.totalEngagement,
        postCount: item.postCount,
        avgLikes: Math.round(item.avgLikes * 100) / 100,
        avgRetweets: Math.round(item.avgRetweets * 100) / 100,
      })
    }
  })

  // Calculate overall averages and recommendations
  return Object.values(insights).map((insight: any) => {
    const avgEngagement = insight.bestHours.reduce((sum: number, h: any) => sum + h.avgEngagement, 0) / insight.bestHours.length
    const topHours = insight.bestHours.slice(0, 3).map((h: any) => h.hour).sort((a: number, b: number) => a - b)
    
    return {
      ...insight,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      recommendation: formatHourRange(topHours),
    }
  })
}

/**
 * Get platform comparison insights
 * Returns comprehensive comparison metrics across all platforms
 */
export async function getPlatformComparison() {
  const result = await PredictionBestTime.aggregate([
    {
      $group: {
        _id: '$platform',
        totalPosts: { $sum: 1 },
        totalLikes: { $sum: '$likes' },
        totalRetweets: { $sum: '$retweets' },
        totalEngagement: { $sum: '$engagementScore' },
        avgLikesPerPost: { $avg: '$likes' },
        avgRetweetsPerPost: { $avg: '$retweets' },
        avgEngagementPerPost: { $avg: '$engagementScore' },
        maxEngagement: { $max: '$engagementScore' },
        minEngagement: { $min: '$engagementScore' },
      },
    },
    {
      $sort: { avgEngagementPerPost: -1 },
    },
  ])

  // Calculate best hours per platform
  const bestHoursData = await PredictionBestTime.aggregate([
    {
      $group: {
        _id: { platform: '$platform', hour: '$hour' },
        avgEngagement: { $avg: '$engagementScore' },
      },
    },
    {
      $sort: { avgEngagement: -1 },
    },
    {
      $group: {
        _id: '$_id.platform',
        bestHours: { $push: { hour: '$_id.hour', avgEngagement: '$avgEngagement' } },
      },
    },
  ])

  const bestHoursMap: Record<string, number[]> = {}
  bestHoursData.forEach((item: any) => {
    bestHoursMap[item._id] = item.bestHours
      .slice(0, 3)
      .map((h: any) => h.hour)
      .sort((a: number, b: number) => a - b)
  })

  // Calculate overall averages for comparison
  const totalPosts = result.reduce((sum, item) => sum + item.totalPosts, 0)
  const totalEngagement = result.reduce((sum, item) => sum + item.totalEngagement, 0)
  const overallAvgEngagement = totalPosts > 0 ? totalEngagement / totalPosts : 0

  return result.map((item, index) => {
    const avgEngagement = item.avgEngagementPerPost || 0
    const performanceRatio = overallAvgEngagement > 0 ? (avgEngagement / overallAvgEngagement) : 1
    const rank = index + 1
    
    return {
      platform: item._id,
      rank,
      totalPosts: item.totalPosts,
      totalLikes: item.totalLikes,
      totalRetweets: item.totalRetweets,
      totalEngagement: item.totalEngagement,
      avgLikesPerPost: Math.round(item.avgLikesPerPost * 100) / 100,
      avgRetweetsPerPost: Math.round(item.avgRetweetsPerPost * 100) / 100,
      avgEngagementPerPost: Math.round(avgEngagement * 100) / 100,
      maxEngagement: item.maxEngagement,
      minEngagement: item.minEngagement,
      bestHours: bestHoursMap[item._id] || [],
      bestHoursFormatted: formatHourRange(bestHoursMap[item._id] || []),
      performanceRatio: Math.round(performanceRatio * 100) / 100,
      engagementRate: item.totalPosts > 0 ? Math.round((item.totalEngagement / item.totalPosts) * 100) / 100 : 0,
    }
  })
}

/**
 * Get hashtag trend timing
 * Returns trending hashtags with peak posting times and engagement metrics
 */
export async function getHashtagTrends(limit: number = 20) {
  // Extract and count hashtags
  const hashtagCounts = await PredictionBestTime.aggregate([
    { $unwind: { path: '$hashtags', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: { hashtag: '$hashtags', hour: '$hour', day: '$day' },
        count: { $sum: 1 },
        totalEngagement: { $sum: '$engagementScore' },
        avgEngagement: { $avg: '$engagementScore' },
        totalLikes: { $sum: '$likes' },
        totalRetweets: { $sum: '$retweets' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit * 24 * 7 }, // Get top hashtags across all hours and days
  ])

  // Group by hashtag
  const hashtagMap: Record<string, any> = {}
  
  hashtagCounts.forEach((item) => {
    const hashtag = item._id.hashtag
    if (!hashtagMap[hashtag]) {
      hashtagMap[hashtag] = {
        hashtag,
        totalCount: 0,
        totalEngagement: 0,
        totalLikes: 0,
        totalRetweets: 0,
        hours: [],
        days: [],
      }
    }
    
    hashtagMap[hashtag].totalCount += item.count
    hashtagMap[hashtag].totalEngagement += item.totalEngagement
    hashtagMap[hashtag].totalLikes += item.totalLikes
    hashtagMap[hashtag].totalRetweets += item.totalRetweets
    
    hashtagMap[hashtag].hours.push({
      hour: item._id.hour,
      count: item.count,
      avgEngagement: Math.round(item.avgEngagement * 100) / 100,
      totalEngagement: item.totalEngagement,
    })
    
    hashtagMap[hashtag].days.push({
      day: item._id.day,
      count: item.count,
    })
  })

  // Sort by total engagement (more meaningful than just count) and get top N
  const topHashtags = Object.values(hashtagMap)
    .sort((a: any, b: any) => (b as any).totalEngagement - (a as any).totalEngagement)
    .slice(0, limit)
    .map((h: any) => {
      // Get top hours by engagement (not just count)
      const topHours = h.hours
        .sort((a: any, b: any) => b.avgEngagement - a.avgEngagement)
        .slice(0, 5)
      
      // Get peak day
      const dayCounts: Record<string, number> = {}
      h.days.forEach((d: any) => {
        dayCounts[d.day] = (dayCounts[d.day] || 0) + d.count
      })
      const peakDay = Object.entries(dayCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown'
      
      const avgEngagement = h.totalCount > 0 ? h.totalEngagement / h.totalCount : 0
      const peakHours = topHours.map((th: any) => th.hour).sort((a: number, b: number) => a - b)
      
      return {
        hashtag: h.hashtag,
        totalCount: h.totalCount,
        totalEngagement: h.totalEngagement,
        totalLikes: h.totalLikes,
        totalRetweets: h.totalRetweets,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        peakDay,
        peakHours: peakHours,
        peakHoursFormatted: formatHourRange(peakHours),
        hours: topHours,
      }
    })

  return topHashtags
}

/**
 * Get country-based insights
 * Returns best posting times adjusted for different countries and platforms
 */
export async function getCountryInsights(country?: string) {
  const matchStage: any = {}
  if (country) {
    matchStage.country = country
  } else {
    matchStage.country = { $exists: true, $ne: null }
  }

  const result = await PredictionBestTime.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          country: '$country',
          platform: '$platform',
          hour: '$hour',
        },
        avgEngagement: { $avg: '$engagementScore' },
        totalEngagement: { $sum: '$engagementScore' },
        postCount: { $sum: 1 },
        avgLikes: { $avg: '$likes' },
        avgRetweets: { $avg: '$retweets' },
      },
    },
    {
      $sort: { avgEngagement: -1 },
    },
    {
      $group: {
        _id: { country: '$_id.country', platform: '$_id.platform' },
        bestHours: {
          $push: {
            hour: '$_id.hour',
            avgEngagement: '$avgEngagement',
            totalEngagement: '$totalEngagement',
            postCount: '$postCount',
            avgLikes: '$avgLikes',
            avgRetweets: '$avgRetweets',
          },
        },
        totalPosts: { $sum: '$postCount' },
        totalEngagement: { $sum: '$totalEngagement' },
      },
    },
  ])

  const formatted: Record<string, any> = {}
  
  result.forEach((item) => {
    const key = `${item._id.country}_${item._id.platform}`
    const sortedHours = item.bestHours
      .sort((a: any, b: any) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5)
    
    const topHours = sortedHours.map((h: any) => h.hour).sort((a: number, b: number) => a - b)
    const avgEngagement = item.totalPosts > 0 ? item.totalEngagement / item.totalPosts : 0
    
    formatted[key] = {
      country: item._id.country,
      platform: item._id.platform,
      totalPosts: item.totalPosts,
      totalEngagement: item.totalEngagement,
      avgEngagementPerPost: Math.round(avgEngagement * 100) / 100,
      bestHours: sortedHours.map((h: any) => ({
        hour: h.hour,
        avgEngagement: Math.round(h.avgEngagement * 100) / 100,
        totalEngagement: h.totalEngagement,
        postCount: h.postCount,
        avgLikes: Math.round(h.avgLikes * 100) / 100,
        avgRetweets: Math.round(h.avgRetweets * 100) / 100,
      })),
      topHours,
      recommendation: formatHourRange(topHours),
    }
  })

  return Object.values(formatted).sort((a: any, b: any) => b.totalEngagement - a.totalEngagement)
}




