import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import User from '../models/User.js'
import CalendarItem from '../models/CalendarItem.js'
import Conversation from '../models/Conversation.js'
import Campaign from '../models/Campaign.js'
import Event from '../models/Event.js'
import SocialMediaPost from '../models/SocialMediaPost.js'
import AIGeneratedContent from '../models/AIGeneratedContent.js'
import MediaFile from '../models/MediaFile.js'
import {
  getAllPosts,
  calculateTopPostingTimes,
  generatePlatformHeatmaps,
  calculatePostingConsistency,
  getIndustryRecommendations,
  calculateEngagementMetrics,
  calculatePlatformPerformance,
  calculateContentTypePerformance,
  calculateEngagementTrends,
  updatePostEngagementMetrics,
  calculatePostingFrequencyByDay,
  calculatePostingFrequencyByHour,
  calculatePlatformUsagePatterns,
  calculateBestPostingTimesByFrequency,
  syncAyrsharePostsToDatabase,
} from '../services/ayrshareService.js'
import {
  getBestHoursPerPlatform,
  getBestDaysPerPlatform,
  getDayHourHeatmap,
  getEngagementMetrics,
  getTopPosts,
  getSentimentInsights,
  getPlatformComparison,
  getHashtagTrends,
  getCountryInsights,
  getAvailableTimePeriods,
} from '../services/bestTimeAnalyticsService.js'

const router = Router()

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Get user-specific counts in parallel for better performance
    const [
      totalCalendarItems,
      totalConversations,
      totalCampaigns,
      totalPostsGenerated,
      totalLinkedInPosts,
      totalAIGeneratedContent,
      totalMediaFiles,
    ] = await Promise.all([
      // Total calendar items for this user
      CalendarItem.countDocuments({ userId }),
      
      // Total conversations for this user
      Conversation.countDocuments({ userId }),
      
      // Total campaigns for this user
      Campaign.countDocuments({ userId }),
      
      // Total posts generated for this user
      SocialMediaPost.countDocuments({ userId }),
      
      // Total LinkedIn posts deployed for this user
      SocialMediaPost.countDocuments({ 
        userId,
        platform: 'linkedin'
      }),
      
      // Total AI-generated content for this user
      AIGeneratedContent.countDocuments({ userId }),
      
      // Total media files for this user
      MediaFile.countDocuments({ userId }),
    ])

    // Get total events for this user (each "Send to Calendar" batch creates 1 event with global counter)
    const totalEvents = await Event.countDocuments({ userId })
    console.log(`[Analytics] Total events (global counter): ${totalEvents}`)

    // Get additional statistics and time-series data
    const [
      postsByPlatform,
      postsByStatus,
      aiContentByType,
      recentActivity,
      campaignsTimeSeries,
      calendarItemsTimeSeries,
      conversationsTimeSeries,
      postsTimeSeries,
      linkedInPostsTimeSeries,
      aiContentTimeSeries,
      mediaFilesTimeSeries,
    ] = await Promise.all([
      // Posts by platform for this user
      SocialMediaPost.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Posts by status for this user
      SocialMediaPost.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // AI content by type for this user
      AIGeneratedContent.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: '$contentType',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent activity (last 7 days) - detailed breakdown by activity type
      Promise.all([
        // Social media posts for this user
        SocialMediaPost.aggregate([
          {
            $match: {
              userId: userId,
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              posts: { $sum: 1 }
            }
          }
        ]),
        // Conversations for this user
        Conversation.aggregate([
          {
            $match: {
              userId: userId,
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              conversations: { $sum: 1 }
            }
          }
        ]),
        // Calendar items for this user
        CalendarItem.aggregate([
          {
            $match: {
              userId: userId,
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              calendarItems: { $sum: 1 }
            }
          }
        ]),
        // Events for this user
        Event.aggregate([
          {
            $match: {
              userId: userId,
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              events: { $sum: 1 }
            }
          }
        ]),
        // AI content for this user
        AIGeneratedContent.aggregate([
          {
            $match: {
              userId: userId,
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              aiContent: { $sum: 1 }
            }
          }
        ]),
      ]).then(([postsData, conversationsData, calendarItemsData, eventsData, aiContentData]) => {
        // Combine all activity types by date
        const activityMap = new Map()
        
        // Initialize all dates for the last 7 days
        const today = new Date()
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)
          const dateStr = date.toISOString().split('T')[0]
          activityMap.set(dateStr, {
            date: dateStr,
            posts: 0,
            conversations: 0,
            calendarItems: 0,
            events: 0,
            aiContent: 0,
            total: 0
          })
        }
        
        // Add posts data
        postsData.forEach((item: any) => {
          if (activityMap.has(item._id)) {
            activityMap.get(item._id).posts = item.posts || 0
          }
        })
        
        // Add conversations data
        conversationsData.forEach((item: any) => {
          if (activityMap.has(item._id)) {
            activityMap.get(item._id).conversations = item.conversations || 0
          }
        })
        
        // Add calendar items data
        calendarItemsData.forEach((item: any) => {
          if (activityMap.has(item._id)) {
            activityMap.get(item._id).calendarItems = item.calendarItems || 0
          }
        })
        
        // Add events data
        eventsData.forEach((item: any) => {
          if (activityMap.has(item._id)) {
            activityMap.get(item._id).events = item.events || 0
          }
        })
        
        // Add AI content data
        aiContentData.forEach((item: any) => {
          if (activityMap.has(item._id)) {
            activityMap.get(item._id).aiContent = item.aiContent || 0
          }
        })
        
        // Calculate totals
        activityMap.forEach((value) => {
          value.total = value.posts + value.conversations + value.calendarItems + value.events + value.aiContent
        })
        
        return Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      }),
      
      // Campaigns time-series for this user (last 30 days)
      Campaign.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // Calendar items time-series for this user (last 30 days)
      CalendarItem.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // Conversations time-series for this user (last 30 days)
      Conversation.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // Posts time-series for this user (last 30 days)
      SocialMediaPost.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // LinkedIn posts time-series for this user (last 30 days)
      SocialMediaPost.aggregate([
        {
          $match: {
            userId: userId,
            platform: 'linkedin'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // AI content time-series for this user (last 30 days)
      AIGeneratedContent.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // Media files time-series for this user (last 30 days)
      MediaFile.aggregate([
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
    ])

    // Get events time series for this user (group by date when event was created) - last 30 days
    // Use server's local timezone for date grouping to match user's local date
    const serverTimezoneOffset = -new Date().getTimezoneOffset() / 60 // Offset in hours (e.g., +10 for Australia)
    const timezoneString = serverTimezoneOffset >= 0 
      ? `+${String(serverTimezoneOffset).padStart(2, '0')}:00`
      : `${String(serverTimezoneOffset).padStart(3, '0')}:00`
    
    const eventsTimeSeries = await Event.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$createdAt',
              timezone: timezoneString // Use server's local timezone instead of UTC
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // Get upcoming week calendar items (grouped by date) - next 7 days from CalendarItems table
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const upcomingWeekEvents = await CalendarItem.aggregate([
      {
        $match: {
          date: {
            $gte: today,
            $lt: nextWeek
          },
          userId: req.user._id // Only get calendar items for the current user
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$date',
              timezone: timezoneString
            }
          },
          count: { $sum: 1 },
          items: { 
            $push: { 
              id: { $toString: '$_id' },
              title: '$title',
              platform: '$platform',
              time: '$time'
            } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    console.log(`[Analytics] Events time series: ${eventsTimeSeries.length} entries`)
    console.log(`[Analytics] Server timezone offset: ${timezoneString}`)
    console.log(`[Analytics] Events time series data:`, eventsTimeSeries.map((e: any) => ({ date: e._id, count: e.count })))
    console.log(`[Analytics] Upcoming week calendar items:`, upcomingWeekEvents.map((e: any) => ({ date: e._id, count: e.count })))

    // Debug logging
    console.log('Analytics Data:', {
      totalLinkedInPosts,
      totalAIGeneratedContent,
      totalCampaigns,
      totalEvents,
      linkedInPostsTimeSeries: linkedInPostsTimeSeries.length,
      aiContentTimeSeries: aiContentTimeSeries.length,
      eventsTimeSeries: eventsTimeSeries.length,
      postsByPlatform: postsByPlatform,
    })

    // Get comprehensive analytics metrics
    const [
      publishedPosts,
      scheduledPosts,
      draftPosts,
      failedPosts,
      calendarItemsByStatus,
      calendarItemsByPlatform,
      campaignsByStatus,
      aiContentUsage,
      totalEngagement,
      engagementByPlatform,
      postsByPostType,
      recentPostsStats,
      campaignPostsStats,
      contentVelocity,
      schedulingEfficiency,
      publishingRate,
      aiEfficiency,
      topPerformingPosts,
      // Calendar Items Analytics - Content Planning Metrics
      calendarItemsWithMedia,
      calendarItemsAll,
      calendarItemsByContentType,
      // Calendar Items Analytics - Scheduling Metrics
      calendarItemsByDayOfWeek,
      calendarItemsByHour,
      calendarItemsDateRange,
      calendarItemsCampaignStats,
      // Advanced Analytics
      contentVelocityFunnel,
      aiEfficiencyStats,
      crossPlatformStrategyData,
      mediaUtilizationStats,
      contentDNASources,
      goldenWindowData,
      // Strategic Analytics
      consistencyIndexData,
      leadTimeSources,
      viralCoefficientData,
      mediaMixData,
      contentPurposeSources,
      eventImpactSources,
      // Operations Metrics
      mostActivePlatformData,
      contentConsistencyData,
      aiWordsGeneratedSources, // Changed from aiWordsGeneratedData
      next7DaysSources,
      humanVsAIData,
    ] = await Promise.all([
      // Published posts count
      SocialMediaPost.countDocuments({ userId, status: 'published' }),
      // Scheduled posts count
      SocialMediaPost.countDocuments({ userId, status: 'scheduled' }),
      // Draft posts count
      SocialMediaPost.countDocuments({ userId, status: 'draft' }),
      // Failed posts count
      SocialMediaPost.countDocuments({ userId, status: 'failed' }),
      // Calendar items by status
      CalendarItem.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Calendar items by platform
      CalendarItem.aggregate([
        { $match: { userId } },
        { $group: { _id: '$platform', count: { $sum: 1 } } }
      ]),
      // Campaigns by status
      Campaign.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // AI content used in posts
      SocialMediaPost.countDocuments({ userId, aiGenerated: true }),
      // Total engagement metrics
      SocialMediaPost.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: { $ifNull: ['$likes', 0] } },
            totalComments: { $sum: { $ifNull: ['$comments', 0] } },
            totalShares: { $sum: { $ifNull: ['$shares', 0] } },
            totalViews: { $sum: { $ifNull: ['$views', 0] } },
            totalImpressions: { $sum: { $ifNull: ['$impressions', 0] } },
            avgLikes: { $avg: { $ifNull: ['$likes', 0] } },
            avgComments: { $avg: { $ifNull: ['$comments', 0] } },
            avgShares: { $avg: { $ifNull: ['$shares', 0] } },
            avgViews: { $avg: { $ifNull: ['$views', 0] } },
            publishedCount: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          }
        }
      ]),
      // Engagement by platform
      SocialMediaPost.aggregate([
        { $match: { userId, status: 'published' } },
        {
          $group: {
            _id: '$platform',
            totalLikes: { $sum: { $ifNull: ['$likes', 0] } },
            totalComments: { $sum: { $ifNull: ['$comments', 0] } },
            totalShares: { $sum: { $ifNull: ['$shares', 0] } },
            totalViews: { $sum: { $ifNull: ['$views', 0] } },
            postCount: { $sum: 1 },
            avgEngagement: { $avg: { $add: [
              { $ifNull: ['$likes', 0] },
              { $ifNull: ['$comments', 0] },
              { $ifNull: ['$shares', 0] },
              { $divide: [{ $ifNull: ['$views', 0] }, 10] }
            ]}}
          }
        }
      ]),
      // Posts by post type
      SocialMediaPost.aggregate([
        { $match: { userId } },
        { $group: { _id: '$postType', count: { $sum: 1 } } }
      ]),
      // Recent posts statistics (last 30 days)
      SocialMediaPost.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
            scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          }
        }
      ]),
      // Campaign posts statistics
      CalendarItem.aggregate([
        { $match: { userId, campaignId: { $ne: null } } },
        {
          $group: {
            _id: '$campaignId',
            postCount: { $sum: 1 },
            platforms: { $addToSet: '$platform' }
          }
        },
        {
          $group: {
            _id: null,
            totalCampaignPosts: { $sum: '$postCount' },
            campaignsWithPosts: { $sum: 1 }
          }
        }
      ]),
      // Content velocity (posts created per day in last 7 days)
      SocialMediaPost.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            avgPerDay: { $avg: '$count' },
            totalDays: { $sum: 1 }
          }
        }
      ]),
      // Scheduling efficiency (calendar items scheduled vs total posts)
      Promise.all([
        CalendarItem.countDocuments({ userId, status: 'scheduled' }),
        CalendarItem.countDocuments({ userId }),
        SocialMediaPost.countDocuments({ userId }),
      ]).then(([scheduled, totalCalendar, totalPosts]) => ({
        scheduledItems: scheduled,
        totalCalendarItems: totalCalendar,
        totalPosts,
        schedulingRate: totalPosts > 0 ? (totalCalendar / totalPosts) * 100 : 0,
        scheduledRate: totalCalendar > 0 ? (scheduled / totalCalendar) * 100 : 0,
      })),
      // Publishing rate
      Promise.all([
        SocialMediaPost.countDocuments({ userId, status: 'published' }),
        SocialMediaPost.countDocuments({ userId }),
      ]).then(([published, total]) => ({
        published,
        total,
        rate: total > 0 ? (published / total) * 100 : 0,
      })),
      // AI efficiency (AI content used vs total AI content generated)
      Promise.all([
        SocialMediaPost.countDocuments({ userId, aiGenerated: true }),
        AIGeneratedContent.countDocuments({ userId }),
      ]).then(([used, generated]) => ({
        used,
        generated,
        efficiency: generated > 0 ? (used / generated) * 100 : 0,
      })),
      // Top performing posts (by engagement)
      SocialMediaPost.aggregate([
        { $match: { userId, status: 'published' } },
        {
          $addFields: {
            engagementScore: {
              $add: [
                { $ifNull: ['$likes', 0] },
                { $ifNull: ['$comments', 0] },
                { $ifNull: ['$shares', 0] },
                { $divide: [{ $ifNull: ['$views', 0] }, 10] }
              ]
            }
          }
        },
        { $sort: { engagementScore: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 1,
            platform: 1,
            content: { $substr: ['$content', 0, 100] },
            likes: { $ifNull: ['$likes', 0] },
            comments: { $ifNull: ['$comments', 0] },
            shares: { $ifNull: ['$shares', 0] },
            views: { $ifNull: ['$views', 0] },
            engagementScore: 1,
            publishedAt: 1,
            createdAt: 1,
          }
        }
      ]),
      // Calendar Items Analytics - Content Planning Metrics
      // Visual Asset Ratio (items with imageUrl vs text-only)
      Promise.all([
        CalendarItem.countDocuments({ userId, imageUrl: { $ne: null, $exists: true } }),
        CalendarItem.countDocuments({ userId }),
      ]).then(([withMedia, total]) => ({
        withMedia,
        total,
        ratio: total > 0 ? (withMedia / total) * 100 : 0,
      })),
      // All calendar items for hashtag extraction
      CalendarItem.find({ userId }).select('content imageUrl platform variants status date time campaignId').lean(),
      // Content type breakdown (by platform)
      CalendarItem.aggregate([
        { $match: { userId } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Calendar Items Analytics - Scheduling Metrics
      // Daily Activity Heatmap (by day of week)
      CalendarItem.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $dayOfWeek: '$date' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Hourly Distribution (from time field)
      CalendarItem.aggregate([
        { 
          $match: { 
            userId, 
            time: { $exists: true, $ne: null } 
          } 
        },
        {
          $addFields: {
            hour: {
              $toInt: { $arrayElemAt: [{ $split: ['$time', ':'] }, 0] }
            }
          }
        },
        {
          $group: {
            _id: '$hour',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Date range (content longevity/timeline)
      CalendarItem.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            minDate: { $min: '$date' },
            maxDate: { $max: '$date' },
          }
        },
        {
          $addFields: {
            totalDays: {
              $divide: [
                { $subtract: ['$maxDate', '$minDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      ]),
      // Campaign Participation
      Promise.all([
        CalendarItem.countDocuments({ userId, campaignId: { $ne: null } }),
        CalendarItem.countDocuments({ userId }),
      ]).then(([withCampaign, total]) => ({
        withCampaign,
        total,
        percentage: total > 0 ? (withCampaign / total) * 100 : 0,
      })),
      // Advanced Analytics - Content Velocity Funnel
      Promise.all([
        Conversation.countDocuments({ userId }),
        CalendarItem.countDocuments({ userId, status: 'draft' }),
        SocialMediaPost.countDocuments({ userId, status: 'published' }),
      ]).then(([ideation, planning, live]) => ({
        ideation,
        planning,
        live,
        conversionRate: ideation > 0 ? ((live / ideation) * 100) : 0,
        bottleneck: planning > live * 2 ? 'approval' : null,
      })),
      // Advanced Analytics - AI Efficiency & ROI
      AIGeneratedContent.aggregate([
        { $match: { userId, processingTime: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            totalProcessingTime: { $sum: '$processingTime' },
            avgProcessingTime: { $avg: '$processingTime' },
            count: { $sum: 1 },
          }
        }
      ]),
      // Advanced Analytics - Cross-Platform Strategy Mix
      Promise.all([
        CalendarItem.aggregate([
          { $match: { userId } },
          { $group: { _id: '$platform', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        SocialMediaPost.aggregate([
          { $match: { userId, status: 'published' } },
          { $group: { _id: '$platform', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
      ]),
      // Advanced Analytics - Media Asset Utilization
      Promise.all([
        MediaFile.countDocuments({ userId }),
        SocialMediaPost.countDocuments({ 
          userId, 
          mediaAttachments: { $exists: true, $ne: [] } 
        }),
      ]).then(([totalAssets, usedAssets]) => ({
        totalAssets,
        usedAssets,
        unusedAssets: totalAssets - usedAssets,
        utilizationRate: totalAssets > 0 ? (usedAssets / totalAssets) * 100 : 0,
      })),
      // Advanced Analytics - Content DNA (hashtags from both sources)
      Promise.all([
        CalendarItem.find({ userId }).select('content').lean(),
        SocialMediaPost.find({ userId }).select('content').lean(),
      ]),
      // Advanced Analytics - Golden Window Heatmap
      SocialMediaPost.aggregate([
        { 
          $match: { 
            userId, 
            publishedAt: { $exists: true, $ne: null },
            impressions: { $exists: true }
          } 
        },
        {
          $addFields: {
            dayOfWeek: { $dayOfWeek: '$publishedAt' },
            hour: { $hour: '$publishedAt' },
          }
        },
        {
          $group: {
            _id: { day: '$dayOfWeek', hour: '$hour' },
            count: { $sum: 1 },
            totalImpressions: { $sum: { $ifNull: ['$impressions', 0] } },
            avgImpressions: { $avg: { $ifNull: ['$impressions', 0] } },
          }
        },
        { $sort: { '_id.day': 1, '_id.hour': 1 } }
      ]),
      // Strategic Analytics - Consistency Index (Monthly Heatmap)
      SocialMediaPost.aggregate([
        {
          $match: {
            userId,
            status: 'published',
            publishedAt: { $exists: true, $ne: null }
          }
        },
        {
          $addFields: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            day: { $dayOfMonth: '$publishedAt' }
          }
        },
        {
          $group: {
            _id: { year: '$year', month: '$month', day: '$day' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      // Strategic Analytics - Lead Time Analysis
      Promise.all([
        Conversation.find({ userId }).select('_id createdAt messages').lean(),
        SocialMediaPost.find({ userId, status: 'published', publishedAt: { $exists: true } })
          .select('content publishedAt').lean(),
      ]),
      // Strategic Analytics - Viral Coefficient
      SocialMediaPost.aggregate([
        {
          $match: {
            userId,
            status: 'published',
            likes: { $exists: true, $gte: 0 },
            shares: { $exists: true, $gte: 0 }
          }
        },
        {
          $project: {
            likes: { $ifNull: ['$likes', 0] },
            shares: { $ifNull: ['$shares', 0] },
            impressions: { $ifNull: ['$impressions', 0] },
            viralCoefficient: {
              $cond: [
                { $gt: [{ $ifNull: ['$likes', 0] }, 0] },
                { $divide: [{ $ifNull: ['$shares', 0] }, { $ifNull: ['$likes', 0] }] },
                0
              ]
            }
          }
        }
      ]),
      // Strategic Analytics - Media Mix Diversity
      MediaFile.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$fileType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      // Strategic Analytics - Content Purpose Breakdown
      CalendarItem.find({ userId }).select('content').lean(),
      // Strategic Analytics - Event Impact Analysis
      Promise.all([
        Event.find({ userId }).select('date calendarItemIds').lean(),
        SocialMediaPost.aggregate([
          {
            $match: {
              userId,
              status: 'published',
              publishedAt: { $exists: true, $ne: null },
              impressions: { $exists: true }
            }
          },
          {
            $project: {
              publishedAt: 1,
              impressions: { $ifNull: ['$impressions', 0] }
            }
          }
        ]),
      ]),
      // Operations Metrics - Most Active Platform
      SocialMediaPost.aggregate([
        { $match: { userId, status: 'published' } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      // Operations Metrics - Content Consistency (days in a row with posts in last 7 days)
      SocialMediaPost.aggregate([
        {
          $match: {
            userId,
            status: 'published',
            publishedAt: { 
              $exists: true, 
              $ne: null,
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        },
        {
          $addFields: {
            dateOnly: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } }
          }
        },
        {
          $group: {
            _id: '$dateOnly',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]),
      // Operations Metrics - Total AI Words Generated (from output field)
      AIGeneratedContent.find({ userId }).select('output').lean(),
      // Operations Metrics - Next 7 Days Scheduled Posts
      Promise.all([
        CalendarItem.find({
          userId,
          status: { $in: ['scheduled', 'draft'] },
          date: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
          .sort({ date: 1, time: 1 })
          .limit(10)
          .lean(),
        SocialMediaPost.find({
          userId,
          status: 'scheduled',
          scheduledAt: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
          .sort({ scheduledAt: 1 })
          .limit(10)
          .lean(),
      ]),
      // Operations Metrics - Human vs AI Cost Comparison
      AIGeneratedContent.aggregate([
        { $match: { userId, processingTime: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            totalProcessingTime: { $sum: '$processingTime' },
            count: { $sum: 1 }
          }
        }
      ]),
    ])
    
    const engagementData = totalEngagement[0] || {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalViews: 0,
      totalImpressions: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      avgViews: 0,
      publishedCount: 0,
    }
    
    const totalEngagementScore = engagementData.totalLikes + engagementData.totalComments + 
                                 engagementData.totalShares + (engagementData.totalViews / 10)
    
    const avgEngagementPerPost = engagementData.publishedCount > 0 
      ? totalEngagementScore / engagementData.publishedCount 
      : 0
    
    const recentStats = recentPostsStats[0] || { count: 0, published: 0, scheduled: 0, draft: 0 }
    const campaignStats = campaignPostsStats[0] || { totalCampaignPosts: 0, campaignsWithPosts: 0 }
    const velocityStats = contentVelocity[0] || { avgPerDay: 0, totalDays: 0 }
    
    // Calculate content health score (0-100)
    const contentHealthScore = (() => {
      let score = 0
      const maxScore = 100
      
      // Publishing rate (30 points)
      const publishRate = publishingRate.rate
      score += Math.min(30, (publishRate / 100) * 30)
      
      // Scheduling efficiency (25 points)
      const scheduleEff = schedulingEfficiency.scheduledRate
      score += Math.min(25, (scheduleEff / 100) * 25)
      
      // Content velocity (20 points) - at least 1 post per day is good
      const velocity = velocityStats.avgPerDay || 0
      score += Math.min(20, (velocity / 2) * 20)
      
      // Engagement (15 points) - if there's engagement data
      if (avgEngagementPerPost > 0) {
        score += Math.min(15, (avgEngagementPerPost / 100) * 15)
      } else {
        score += 5 // Base score if no engagement data yet
      }
      
      // Campaign activity (10 points)
      const activeCampaigns = campaignsByStatus.find((c: any) => c._id === 'active')?.count || 0
      score += Math.min(10, activeCampaigns * 2)
      
      return Math.round(score)
    })()

    // Format the comprehensive response
    const analytics = {
      overview: {
        // Core counts
        totalCalendarItems,
        totalConversations,
        totalCampaigns,
        totalEvents,
        totalPostsGenerated,
        totalLinkedInPosts,
        totalAIGeneratedContent,
        totalMediaFiles,
        
        // Post status breakdown
        publishedPosts,
        scheduledPosts,
        draftPosts,
        failedPosts,
        
        // Engagement metrics
        totalEngagement: Math.round(totalEngagementScore),
        avgEngagementPerPost: Math.round(avgEngagementPerPost * 100) / 100,
        totalLikes: engagementData.totalLikes,
        totalComments: engagementData.totalComments,
        totalShares: engagementData.totalShares,
        totalViews: engagementData.totalViews,
        totalImpressions: engagementData.totalImpressions,
        avgLikes: Math.round(engagementData.avgLikes * 100) / 100,
        avgComments: Math.round(engagementData.avgComments * 100) / 100,
        avgShares: Math.round(engagementData.avgShares * 100) / 100,
        avgViews: Math.round(engagementData.avgViews * 100) / 100,
        
        // AI metrics
        aiContentUsedInPosts: aiContentUsage,
        aiEfficiency: Math.round(aiEfficiency.efficiency * 100) / 100,
        aiContentGenerated: aiEfficiency.generated,
        
        // Productivity metrics
        contentVelocity: Math.round(velocityStats.avgPerDay * 100) / 100,
        schedulingRate: Math.round(schedulingEfficiency.schedulingRate * 100) / 100,
        scheduledItemsRate: Math.round(schedulingEfficiency.scheduledRate * 100) / 100,
        publishingRate: Math.round(publishingRate.rate * 100) / 100,
        
        // Content health
        contentHealthScore,
        
        // Recent activity (last 30 days)
        recentPostsCreated: recentStats.count,
        recentPostsPublished: recentStats.published,
        recentPostsScheduled: recentStats.scheduled,
        recentPostsDraft: recentStats.draft,
        
        // Campaign metrics
        campaignPosts: campaignStats.totalCampaignPosts,
        campaignsWithPosts: campaignStats.campaignsWithPosts,
        
        // Core KPI Metrics (4 Main Metrics)
        totalPosts: {
          total: totalPostsGenerated,
          published: publishedPosts,
          publishedText: `${publishedPosts} published`
        },
        scheduledItems: (() => {
          const scheduledCount = calendarItemsByStatus.find((s: any) => s._id === 'scheduled')?.count || 0
          const scheduledPct = totalCalendarItems > 0 
            ? ((scheduledCount / totalCalendarItems) * 100).toFixed(1) 
            : '0.0'
          return {
            total: totalCalendarItems,
            scheduled: scheduledCount,
            scheduledPct: `${scheduledPct}% scheduled`
          }
        })(),
        aiContentUtilization: (() => {
          const usedInPosts = aiContentUsage || 0
          const usagePct = totalAIGeneratedContent > 0
            ? ((usedInPosts / totalAIGeneratedContent) * 100).toFixed(1)
            : '0.0'
          return {
            total: totalAIGeneratedContent,
            used: usedInPosts,
            usagePct: `${usagePct}% used in posts`
          }
        })(),
        
        // Operations Metrics (for databases without engagement data)
        mostActivePlatform: (() => {
          const platform = mostActivePlatformData?.[0]
          return platform ? { platform: platform._id, count: platform.count } : null
        })(),
        contentConsistency: (() => {
          const dateCounts = (contentConsistencyData || []).map((d: any) => ({
            date: d._id, // This is already a date string like "2024-01-07"
            count: d.count
          }))
          
          if (dateCounts.length === 0) return { daysInRow: 0, totalActiveDays: 0 }
          
          // Convert date strings to Date objects and sort chronologically (oldest first)
          const sortedDates = dateCounts
            .map((d: any) => {
              // Parse the date string (format: YYYY-MM-DD)
              const [year, month, day] = d.date.split('-').map(Number)
              return new Date(year, month - 1, day)
            })
            .sort((a: any, b: any) => a.getTime() - b.getTime())
          
          // Calculate current streak (from most recent date backwards)
          let currentStreak = 1
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          // Find the most recent posting date
          const mostRecentDate = sortedDates[sortedDates.length - 1]
          const mostRecentDateOnly = new Date(mostRecentDate)
          mostRecentDateOnly.setHours(0, 0, 0, 0)
          
          // Check if most recent date is today or yesterday (within 1 day)
          const daysSinceLastPost = Math.floor((today.getTime() - mostRecentDateOnly.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysSinceLastPost <= 1) {
            // Calculate streak backwards from most recent date
            for (let i = sortedDates.length - 2; i >= 0; i--) {
              const nextDate = sortedDates[i + 1]
              const currentDate = sortedDates[i]
              
              // Calculate difference in days
              const diffTime = nextDate.getTime() - currentDate.getTime()
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
              
              if (diffDays === 1) {
                // Consecutive day
                currentStreak++
              } else {
                // Gap found, stop counting
                break
              }
            }
          } else {
            // Last post was more than 1 day ago, so current streak is 0
            currentStreak = 0
          }
          
          // Calculate longest streak overall (for reference)
          let longestStreak = 1
          let tempStreak = 1
          
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = sortedDates[i - 1]
            const currDate = sortedDates[i]
            
            const diffTime = currDate.getTime() - prevDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            
            if (diffDays === 1) {
              tempStreak++
              longestStreak = Math.max(longestStreak, tempStreak)
            } else {
              tempStreak = 1
            }
          }
          
          return { 
            daysInRow: currentStreak, 
            totalActiveDays: dateCounts.length,
            longestStreak: longestStreak
          }
        })(),
        totalAIWords: (() => {
          // Calculate from AIGeneratedContent.output field (not content)
          const aiContents = aiWordsGeneratedSources || []
          let totalWords = 0
          
          aiContents.forEach((item: any) => {
            if (item?.output) {
              try {
                // Handle JSON format if output is a JSON string
                let text = item.output
                if (typeof text === 'string' && (text.startsWith('[') || text.startsWith('{'))) {
                  try {
                    const parsed = JSON.parse(text)
                    if (Array.isArray(parsed)) {
                      text = parsed.map((p: any) => typeof p === 'string' ? p : p.content || p.text || '').join(' ')
                    } else if (typeof parsed === 'object') {
                      text = parsed.content || parsed.text || parsed.output || text
                    }
                  } catch {
                    // If JSON parse fails, use original text
                  }
                }
                
                // Count words (split by whitespace)
                const words = String(text).trim().split(/\s+/).filter((w: string) => w.length > 0)
                totalWords += words.length
              } catch (err) {
                // Skip if error parsing
              }
            }
          })
          
          return totalWords
        })(),
        totalAIWordsGenerated: (() => {
          // Keep for backward compatibility
          const aiContents = aiWordsGeneratedSources || []
          let totalWords = 0
          
          aiContents.forEach((item: any) => {
            if (item?.output) {
              try {
                let text = item.output
                if (typeof text === 'string' && (text.startsWith('[') || text.startsWith('{'))) {
                  try {
                    const parsed = JSON.parse(text)
                    if (Array.isArray(parsed)) {
                      text = parsed.map((p: any) => typeof p === 'string' ? p : p.content || p.text || '').join(' ')
                    } else if (typeof parsed === 'object') {
                      text = parsed.content || parsed.text || parsed.output || text
                    }
                  } catch {
                    // If JSON parse fails, use original text
                  }
                }
                
                const words = String(text).trim().split(/\s+/).filter((w: string) => w.length > 0)
                totalWords += words.length
              } catch (err) {
                // Skip if error parsing
              }
            }
          })
          
          return { 
            words: totalWords, 
            contentCount: aiContents.length 
          }
        })(),
        humanVsAICost: (() => {
          const data = humanVsAIData?.[0]
          if (!data) return null
          const HUMAN_TIME_PER_POST_MS = 30 * 60 * 1000 // 30 minutes in milliseconds
          const humanTimeTotal = data.count * HUMAN_TIME_PER_POST_MS
          const aiTimeTotal = data.totalProcessingTime || 0
          const timeSaved = humanTimeTotal - aiTimeTotal
          const timeSavedHours = Math.round((timeSaved / (1000 * 60 * 60)) * 100) / 100
          return {
            humanTimeHours: Math.round((humanTimeTotal / (1000 * 60 * 60)) * 100) / 100,
            aiTimeHours: Math.round((aiTimeTotal / (1000 * 60 * 60)) * 100) / 100,
            timeSavedHours,
            postsGenerated: data.count || 0
          }
        })(),
        next7Days: (() => {
          const [calendarItems, scheduledPosts] = next7DaysSources || [[], []]
          const items = [
            ...(calendarItems || []).map((item: any) => ({
              type: 'calendar',
              id: item._id,
              title: item.title,
              platform: item.platform,
              date: item.date,
              time: item.time,
              status: item.status
            })),
            ...(scheduledPosts || []).map((post: any) => ({
              type: 'post',
              id: post._id,
              title: post.content?.substring(0, 50) || 'Scheduled Post',
              platform: post.platform,
              date: post.scheduledAt,
              time: null,
              status: 'scheduled'
            }))
          ]
          return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 7)
        })(),
      },
      breakdown: {
        postsByPlatform: postsByPlatform.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        postsByStatus: postsByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        postsByPostType: postsByPostType.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        aiContentByType: aiContentByType.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        calendarItemsByStatus: calendarItemsByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        calendarItemsByPlatform: calendarItemsByPlatform.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        campaignsByStatus: campaignsByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        engagementByPlatform: engagementByPlatform.reduce((acc: any, item: any) => {
          acc[item._id] = {
            totalLikes: item.totalLikes,
            totalComments: item.totalComments,
            totalShares: item.totalShares,
            totalViews: item.totalViews,
            postCount: item.postCount,
            avgEngagement: Math.round(item.avgEngagement * 100) / 100,
          }
          return acc
        }, {}),
      },
      insights: {
        topPerformingPosts: topPerformingPosts.map((post: any) => ({
          id: post._id,
          platform: post.platform,
          content: post.content,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          views: post.views,
          engagementScore: Math.round(post.engagementScore * 100) / 100,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
        })),
        bestPlatform: engagementByPlatform.length > 0 
          ? engagementByPlatform.reduce((best: any, current: any) => 
              current.avgEngagement > (best?.avgEngagement || 0) ? current : best
            )._id
          : null,
        mostProductiveDay: recentActivity.length > 0
          ? recentActivity.reduce((best: any, current: any) => 
              current.total > (best?.total || 0) ? current : best
            ).date
          : null,
      },
      recentActivity: recentActivity.map((item: any) => ({
        date: item.date,
        posts: item.posts || 0,
        conversations: item.conversations || 0,
        calendarItems: item.calendarItems || 0,
        events: item.events || 0,
        aiContent: item.aiContent || 0,
        total: item.total || 0
      })),
      timeSeries: {
        campaigns: campaignsTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
        events: eventsTimeSeries.length > 0 
          ? eventsTimeSeries.map((item: any) => ({
              date: item._id,
              count: item.count
            }))
          : [],
        calendarItems: calendarItemsTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
        conversations: conversationsTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
        posts: postsTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
        linkedInPosts: linkedInPostsTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
        aiContent: aiContentTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
        mediaFiles: mediaFilesTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
      },
      calendarItemsAnalytics: (() => {
        // Extract hashtags from content
        const hashtagMap = new Map<string, number>()
        calendarItemsAll.forEach((item: any) => {
          const content = item.content || ''
          const hashtagRegex = /#(\w+)/g
          let match
          while ((match = hashtagRegex.exec(content)) !== null) {
            const hashtag = match[1]
            hashtagMap.set(hashtag, (hashtagMap.get(hashtag) || 0) + 1)
          }
        })
        const topHashtags = Array.from(hashtagMap.entries())
          .map(([hashtag, count]) => ({ hashtag: `#${hashtag}`, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // Calculate Platform Diversity Score (0-100)
        // Higher score = more evenly distributed across platforms
        const platformCounts = calendarItemsByContentType.map((p: any) => p.count)
        const totalPlatformItems = platformCounts.reduce((sum: number, count: number) => sum + count, 0)
        let platformDiversityScore = 0
        if (totalPlatformItems > 0 && platformCounts.length > 1) {
          // Calculate coefficient of variation (lower = more diverse)
          const mean = totalPlatformItems / platformCounts.length
          const variance = platformCounts.reduce((sum: number, count: number) => {
            return sum + Math.pow(count - mean, 2)
          }, 0) / platformCounts.length
          const stdDev = Math.sqrt(variance)
          const cv = mean > 0 ? stdDev / mean : 0
          // Convert to score (0-100, where 100 = perfectly distributed)
          platformDiversityScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)))
        } else if (platformCounts.length === 1) {
          platformDiversityScore = 0 // Only one platform = no diversity
        }

        // Process day of week data (MongoDB dayOfWeek: 1=Sunday, 2=Monday, ..., 7=Saturday)
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dailyActivity = calendarItemsByDayOfWeek.map((item: any) => ({
          day: dayNames[item._id - 1] || `Day ${item._id}`,
          dayIndex: item._id,
          count: item.count
        }))
        const peakDay = dailyActivity.length > 0
          ? dailyActivity.reduce((best: any, current: any) => 
              current.count > (best?.count || 0) ? current : best
            )
          : null
        const quietDay = dailyActivity.length > 0
          ? dailyActivity.reduce((worst: any, current: any) => 
              current.count < (worst?.count || Infinity) ? current : worst
            )
          : null

        // Process hourly distribution
        const hourlyDistribution = calendarItemsByHour.map((item: any) => ({
          hour: item._id,
          count: item.count
        })).sort((a: any, b: any) => a.hour - b.hour)
        const peakHours = hourlyDistribution
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 3)
          .map((h: any) => `${h.hour}:00`)

        // Process date range
        const dateRange = calendarItemsDateRange[0] || null
        const contentLongevity = dateRange ? {
          startDate: dateRange.minDate,
          endDate: dateRange.maxDate,
          totalDays: Math.ceil(dateRange.totalDays || 0),
          dateRange: dateRange.minDate && dateRange.maxDate
            ? `${new Date(dateRange.minDate).toLocaleDateString()} - ${new Date(dateRange.maxDate).toLocaleDateString()}`
            : 'N/A'
        } : null

        return {
          // Content Planning Metrics
          contentPlanning: {
            totalContentVolume: calendarItemsWithMedia.total,
            visualAssetRatio: Math.round(calendarItemsWithMedia.ratio * 100) / 100,
            visualAssetsCount: calendarItemsWithMedia.withMedia,
            textOnlyCount: calendarItemsWithMedia.total - calendarItemsWithMedia.withMedia,
            topHashtags,
            contentTypeBreakdown: calendarItemsByContentType.map((item: any) => ({
              platform: item._id,
              count: item.count,
              percentage: calendarItemsWithMedia.total > 0 
                ? Math.round((item.count / calendarItemsWithMedia.total) * 100 * 100) / 100 
                : 0
            })),
          },
          // Platform Metrics
          platformMetrics: {
            platformDistribution: calendarItemsByContentType.map((item: any) => ({
              platform: item._id,
              count: item.count,
              percentage: calendarItemsWithMedia.total > 0 
                ? Math.round((item.count / calendarItemsWithMedia.total) * 100 * 100) / 100 
                : 0
            })),
            platformDiversityScore,
          },
          // Operational & Scheduling Metrics
          schedulingMetrics: {
            statusOverview: calendarItemsByStatus.reduce((acc: any, item: any) => {
              acc[item._id] = {
                count: item.count,
                percentage: calendarItemsWithMedia.total > 0 
                  ? Math.round((item.count / calendarItemsWithMedia.total) * 100 * 100) / 100 
                  : 0
              }
              return acc
            }, {}),
            dailyActivityHeatmap: dailyActivity,
            peakDay: peakDay ? {
              day: peakDay.day,
              count: peakDay.count
            } : null,
            quietDay: quietDay ? {
              day: quietDay.day,
              count: quietDay.count
            } : null,
            hourlyDistribution,
            peakHours,
          },
          // Strategic Overview
          strategicOverview: {
            campaignParticipation: {
              withCampaign: calendarItemsCampaignStats.withCampaign,
              withoutCampaign: calendarItemsCampaignStats.total - calendarItemsCampaignStats.withCampaign,
              percentage: Math.round(calendarItemsCampaignStats.percentage * 100) / 100,
            },
            contentLongevity,
          },
        }
      })(),
      advancedAnalytics: (() => {
        // Process Content Velocity Funnel
        const funnel = contentVelocityFunnel || { ideation: 0, planning: 0, live: 0, conversionRate: 0, bottleneck: null }
        const contentVelocity = {
          ...funnel,
          conversionRate: Math.round(funnel.conversionRate * 100) / 100,
          insight: funnel.bottleneck === 'approval' 
            ? 'You have a bottleneck in your approval process. Consider streamlining your workflow.'
            : null,
        }

        // Process AI Efficiency & ROI
        const HUMAN_TIME_SECONDS = 1800 // 30 minutes
        const aiEfficiencyData = aiEfficiencyStats[0] || null
        const aiEfficiency = aiEfficiencyData ? {
          totalProcessingTime: aiEfficiencyData.totalProcessingTime,
          avgProcessingTime: Math.round(aiEfficiencyData.avgProcessingTime),
          totalAIPosts: aiEfficiencyData.count,
          humanTimeTotal: aiEfficiencyData.count * HUMAN_TIME_SECONDS * 1000, // Convert to ms
          timeSaved: (aiEfficiencyData.count * HUMAN_TIME_SECONDS * 1000) - aiEfficiencyData.totalProcessingTime,
          timeSavedHours: Math.round(((aiEfficiencyData.count * HUMAN_TIME_SECONDS * 1000) - aiEfficiencyData.totalProcessingTime) / (1000 * 60 * 60) * 100) / 100,
          efficiencyRatio: aiEfficiencyData.totalProcessingTime > 0 
            ? Math.round(((aiEfficiencyData.count * HUMAN_TIME_SECONDS * 1000) / aiEfficiencyData.totalProcessingTime) * 100) / 100
            : 0,
        } : null

        // Process Cross-Platform Strategy Mix
        const [plannedPlatforms, publishedPlatforms] = crossPlatformStrategyData || [[], []]
        const platformMap = new Map()
        plannedPlatforms.forEach((p: any) => {
          platformMap.set(p._id, { platform: p._id, planned: p.count, published: 0, gap: p.count })
        })
        publishedPlatforms.forEach((p: any) => {
          const existing = platformMap.get(p._id) || { platform: p._id, planned: 0, published: 0, gap: 0 }
          existing.published = p.count
          existing.gap = existing.planned - p.count
          platformMap.set(p._id, existing)
        })

        const crossPlatformStrategy = Array.from(platformMap.values()).map((p: any) => ({
          ...p,
          completionRate: p.planned > 0 ? Math.round((p.published / p.planned) * 100 * 100) / 100 : 0,
          insight: p.gap > p.published ? `We are falling behind on our ${p.platform} strategy.` : null,
        }))

        // Process Media Asset Utilization
        const mediaUtilization = mediaUtilizationStats ? {
          totalAssets: mediaUtilizationStats.totalAssets,
          usedAssets: mediaUtilizationStats.usedAssets,
          unusedAssets: mediaUtilizationStats.unusedAssets,
          utilizationRate: Math.round(mediaUtilizationStats.utilizationRate * 100) / 100,
          untappedPotential: mediaUtilizationStats.unusedAssets,
          insight: mediaUtilizationStats.unusedAssets > 0 
            ? `You have ${mediaUtilizationStats.unusedAssets} assets ready to go that aren't working for you yet.`
            : null,
        } : null

        // Process Content DNA (hashtags from both CalendarItems and SocialMediaPosts)
        const [calendarItemsContent, socialMediaPostsContent] = contentDNASources || [[], []]
        const contentDNAHashtagMap = new Map<string, number>()
        const allContent = [...calendarItemsContent, ...socialMediaPostsContent]
        allContent.forEach((item: any) => {
          const content = item.content || ''
          const hashtagRegex = /#(\w+)/g
          let match
          while ((match = hashtagRegex.exec(content)) !== null) {
            const hashtag = match[1].toLowerCase()
            contentDNAHashtagMap.set(hashtag, (contentDNAHashtagMap.get(hashtag) || 0) + 1)
          }
        })
        
        const contentDNA = Array.from(contentDNAHashtagMap.entries())
          .map(([hashtag, count]) => ({ hashtag: `#${hashtag}`, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)

        // Process Golden Window Heatmap
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const goldenWindowHeatmap = (goldenWindowData || []).map((item: any) => ({
          day: dayNames[item._id.day - 1] || `Day ${item._id.day}`,
          dayIndex: item._id.day,
          hour: item._id.hour,
          count: item.count,
          totalImpressions: item.totalImpressions || 0,
          avgImpressions: Math.round((item.avgImpressions || 0) * 100) / 100,
        }))

        // Find peak times
        const peakTimes = goldenWindowHeatmap
          .sort((a: any, b: any) => (b.avgImpressions || 0) - (a.avgImpressions || 0))
          .slice(0, 5)
          .map((item: any) => `${item.day} ${item.hour}:00`)

        // Process Strategic Analytics - Consistency Index
        let consistencyIndex = null
        try {
          const currentDate = new Date()
          const currentYear = currentDate.getFullYear()
          const currentMonth = currentDate.getMonth() + 1
          const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
          
          const activeDaysSet = new Set<string>()
          const consistencyHeatmap: any[] = []
          const indexDataArray: any[] = consistencyIndexData || []
          indexDataArray.forEach((item: any) => {
            if (item?._id?.year === currentYear && item?._id?.month === currentMonth) {
              const dayKey = `${item._id.year}-${item._id.month}-${item._id.day}`
              activeDaysSet.add(dayKey)
              consistencyHeatmap.push({
                year: item._id.year,
                month: item._id.month,
                day: item._id.day,
                count: item.count || 0
              })
            }
          })
          
          const consistencyScore = daysInMonth > 0 
            ? Math.round((activeDaysSet.size / daysInMonth) * 100) 
            : 0
          const inactiveDays = daysInMonth - activeDaysSet.size
          
          consistencyIndex = {
            score: consistencyScore,
            activeDays: activeDaysSet.size,
            totalDays: daysInMonth,
            inactiveDays,
            heatmap: consistencyHeatmap,
            insight: inactiveDays > 7 ? `You were invisible for ${inactiveDays} days this month. Consider filling the gaps in your calendar.` : null
          }
        } catch (err) {
          console.error('Error processing consistency index:', err)
          consistencyIndex = {
            score: 0,
            activeDays: 0,
            totalDays: 30,
            inactiveDays: 30,
            heatmap: [],
            insight: null
          }
        }

        // Process Strategic Analytics - Lead Time Analysis
        let leadTimeAnalysis = null
        try {
          const [conversations, publishedPosts] = (leadTimeSources || [[], []]) as [any[], any[]]
          const leadTimes: number[] = []

          const conversationsArray: any[] = conversations || []
          conversationsArray.forEach((conv: any) => {
            try {
              const convCreatedAt = conv?.createdAt ? new Date(conv.createdAt).getTime() : null
              if (!convCreatedAt || isNaN(convCreatedAt)) return
              
              const convContent = String(conv?.messages?.[0]?.content || '').toLowerCase()

              // Find matching published post by content similarity
              const publishedPostsArray: any[] = publishedPosts || []
              publishedPostsArray.forEach((post: any) => {
                try {
                  const postContent = post?.content?.toLowerCase() || ''
                  const postPublishedAt = post?.publishedAt ? new Date(post.publishedAt).getTime() : null
                  if (!postPublishedAt || isNaN(postPublishedAt)) return
                  
                  // Simple similarity check: if post content contains key words from conversation
                  const convWords = convContent.split(/\s+/).filter((w: string) => w.length > 4)
                  const hasMatch = convWords.length > 0 && convWords.some((word: string) => 
                    postContent.includes(word)
                  )
                  
                  if (hasMatch && postPublishedAt > convCreatedAt) {
                    const leadTimeHours = (postPublishedAt - convCreatedAt) / (1000 * 60 * 60)
                    if (leadTimeHours > 0 && leadTimeHours < 720) { // Less than 30 days
                      leadTimes.push(leadTimeHours)
                    }
                  }
                } catch (err) {
                  // Skip this post if there's an error
                }
              })
            } catch (err) {
              // Skip this conversation if there's an error
            }
          })
          
          const avgLeadTimeHours = leadTimes.length > 0
            ? Math.round((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) * 100) / 100
            : null
          const leadTimeTrend = leadTimes.length >= 2
            ? leadTimes.slice(-10).map((_, idx) => ({
                index: idx,
                hours: leadTimes[leadTimes.length - 10 + idx] || 0
              }))
            : []
          
          leadTimeAnalysis = {
            avgLeadTimeHours,
            leadTimeTrend,
            totalMatchedPairs: leadTimes.length,
            insight: avgLeadTimeHours && avgLeadTimeHours > 72 
              ? `Average lead time is ${Math.round(avgLeadTimeHours / 24)} days. Consider streamlining your workflow.`
              : avgLeadTimeHours && avgLeadTimeHours < 24
              ? `Great! Your team is getting faster - average lead time is ${Math.round(avgLeadTimeHours)} hours.`
              : null
          }
        } catch (err) {
          console.error('Error processing lead time analysis:', err)
          leadTimeAnalysis = {
            avgLeadTimeHours: null,
            leadTimeTrend: [],
            totalMatchedPairs: 0,
            insight: null
          }
        }

        // Process Strategic Analytics - Viral Coefficient
        let viralCoefficient = null
        try {
          const viralPosts = (viralCoefficientData || []).map((post: any) => ({
            likes: post?.likes || 0,
            shares: post?.shares || 0,
            impressions: post?.impressions || 0,
            viralCoefficient: post?.viralCoefficient || 0
          }))
          
          const avgViralCoefficient = viralPosts.length > 0
            ? Math.round((viralPosts.reduce((sum: number, p: any) => sum + (p.viralCoefficient || 0), 0) / viralPosts.length) * 1000) / 1000
            : 0
          const topViralPosts = viralPosts
            .sort((a: any, b: any) => (b.viralCoefficient || 0) - (a.viralCoefficient || 0))
            .slice(0, 10)
          
          viralCoefficient = {
            avgCoefficient: avgViralCoefficient,
            topViralPosts,
            totalPosts: viralPosts.length,
            insight: avgViralCoefficient > 0.1 
              ? `Your content has high viral potential! Average shares-to-likes ratio is ${avgViralCoefficient.toFixed(2)}.`
              : null
          }
        } catch (err) {
          console.error('Error processing viral coefficient:', err)
          viralCoefficient = {
            avgCoefficient: 0,
            topViralPosts: [],
            totalPosts: 0,
            insight: null
          }
        }

        // Process Strategic Analytics - Media Mix Diversity
        let mediaMixDiversity = null
        try {
          const mediaMix = (mediaMixData || []).map((item: any) => ({
            type: item?._id || 'unknown',
            count: item?.count || 0
          }))
          const totalMediaFiles = mediaMix.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
          const mediaMixBreakdown = mediaMix.map((item: any) => ({
            ...item,
            percentage: totalMediaFiles > 0 ? Math.round((item.count / totalMediaFiles) * 100) : 0
          }))
          const imagePercentage = mediaMixBreakdown.find((m: any) => m.type === 'image')?.percentage || 0
          const isImageHeavy = imagePercentage > 80
          
          mediaMixDiversity = {
            breakdown: mediaMixBreakdown,
            totalFiles: totalMediaFiles,
            insight: isImageHeavy 
              ? `Your media mix is ${imagePercentage}% images. Video content generates 3x more engagement; consider uploading more Reels/TikToks.`
              : null
          }
        } catch (err) {
          console.error('Error processing media mix diversity:', err)
          mediaMixDiversity = {
            breakdown: [],
            totalFiles: 0,
            insight: null
          }
        }

        // Process Strategic Analytics - Content Purpose Breakdown
        let contentPurposeBreakdown = null
        try {
          const promotionalKeywords = ['buy', 'sale', 'order', 'purchase', 'discount', 'deal', 'offer', 'promo', 'limited', 'now']
          const educationalKeywords = ['how to', 'tips', 'recipe', 'enjoy', 'learn', 'guide', 'tutorial', 'help', 'benefit', 'why']
          
          let promotionalCount = 0
          let educationalCount = 0
          let neutralCount = 0
          
          (contentPurposeSources || []).forEach((item: any) => {
            try {
              const content = (item?.content || '').toLowerCase()
              const hasPromotional = promotionalKeywords.some(keyword => content.includes(keyword))
              const hasEducational = educationalKeywords.some(keyword => content.includes(keyword))
              
              if (hasPromotional && !hasEducational) {
                promotionalCount++
              } else if (hasEducational && !hasPromotional) {
                educationalCount++
              } else if (hasPromotional && hasEducational) {
                // If both, count as promotional (sales-focused)
                promotionalCount++
              } else {
                neutralCount++
              }
            } catch (err) {
              // Skip this item if there's an error
            }
          })
          
          const totalContentItems = promotionalCount + educationalCount + neutralCount
          const breakdown = [
            { type: 'Promotional', count: promotionalCount, percentage: totalContentItems > 0 ? Math.round((promotionalCount / totalContentItems) * 100) : 0 },
            { type: 'Educational', count: educationalCount, percentage: totalContentItems > 0 ? Math.round((educationalCount / totalContentItems) * 100) : 0 },
            { type: 'Neutral', count: neutralCount, percentage: totalContentItems > 0 ? Math.round((neutralCount / totalContentItems) * 100) : 0 }
          ]
          const promotionalPercentage = breakdown.find(c => c.type === 'Promotional')?.percentage || 0
          const isTooPromotional = totalContentItems > 0 && promotionalPercentage > 80
          
          contentPurposeBreakdown = {
            breakdown,
            totalItems: totalContentItems,
            insight: isTooPromotional 
              ? `Your content is ${promotionalPercentage}% promotional. Add more value-based posts to prevent audience burnout.`
              : null
          }
        } catch (err) {
          console.error('Error processing content purpose breakdown:', err)
          contentPurposeBreakdown = {
            breakdown: [],
            totalItems: 0,
            insight: null
          }
        }

        // Process Strategic Analytics - Event Impact Analysis
        let eventImpactAnalysis = null
        try {
          const [events, postsWithImpressions] = (eventImpactSources || [[], []]) as [any[], any[]]
          const eventWindows: any[] = []
          const nonEventImpressions: number[] = []

          const eventsArray: any[] = events || []
          eventsArray.forEach((event: any) => {
            try {
              if (!event?.date) return
              const eventDate = new Date(event.date)
              if (isNaN(eventDate.getTime())) return
              
              const windowStart = new Date(eventDate)
              windowStart.setDate(windowStart.getDate() - 1) // Day before
              const windowEnd = new Date(eventDate)
              windowEnd.setDate(windowEnd.getDate() + 2) // 2 days after

              const postsArray: any[] = postsWithImpressions || []
              const eventWindowPosts = postsArray.filter((post: any) => {
                try {
                  if (!post?.publishedAt) return false
                  const postDate = new Date(post.publishedAt)
                  return !isNaN(postDate.getTime()) && postDate >= windowStart && postDate <= windowEnd
                } catch {
                  return false
                }
              })
              
              const eventImpressions = eventWindowPosts.reduce((sum: number, post: any) => sum + (post?.impressions || 0), 0)
              const avgEventImpressions = eventWindowPosts.length > 0 ? eventImpressions / eventWindowPosts.length : 0
              
              eventWindows.push({
                eventDate: event.date,
                eventNumber: event?.eventNumber || 0,
                windowStart: windowStart.toISOString(),
                windowEnd: windowEnd.toISOString(),
                postCount: eventWindowPosts.length,
                totalImpressions: eventImpressions,
                avgImpressions: Math.round(avgEventImpressions)
              })
            } catch (err) {
              // Skip this event if there's an error
            }
          })
          
          // Calculate baseline (non-event days)
          const allEventDates = new Set<string>()
          (events || []).forEach((e: any) => {
            try {
              if (e?.date) {
                const d = new Date(e.date)
                if (!isNaN(d.getTime())) {
                  allEventDates.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
                }
              }
            } catch {
              // Skip if error
            }
          })

          const postsWithImpressionsArray: any[] = postsWithImpressions || []
          postsWithImpressionsArray.forEach((post: any) => {
            try {
              if (!post?.publishedAt) return
              const postDate = new Date(post.publishedAt)
              if (isNaN(postDate.getTime())) return
              const postDateKey = `${postDate.getFullYear()}-${postDate.getMonth() + 1}-${postDate.getDate()}`
              if (!allEventDates.has(postDateKey)) {
                nonEventImpressions.push(post?.impressions || 0)
              }
            } catch {
              // Skip if error
            }
          })
          
          const avgNonEventImpressions = nonEventImpressions.length > 0
            ? Math.round(nonEventImpressions.reduce((a: number, b: number) => a + b, 0) / nonEventImpressions.length)
            : 0
          const avgEventImpressions = eventWindows.length > 0
            ? Math.round(eventWindows.reduce((sum: number, e: any) => sum + (e.avgImpressions || 0), 0) / eventWindows.length)
            : 0
          const eventImpactRatio = avgNonEventImpressions > 0
            ? Math.round((avgEventImpressions / avgNonEventImpressions) * 100) / 100
            : 0
          
          eventImpactAnalysis = {
            eventWindows,
            avgEventImpressions,
            avgNonEventImpressions,
            impactRatio: eventImpactRatio,
            totalEvents: (events || []).length,
            insight: eventImpactRatio > 1.5 
              ? `Events are driving ${Math.round((eventImpactRatio - 1) * 100)}% more impressions than regular days.`
              : eventImpactRatio < 1 && (events || []).length > 0
              ? `Events are underperforming. Consider reviewing your event marketing strategy.`
              : null
          }
        } catch (err) {
          console.error('Error processing event impact analysis:', err)
          eventImpactAnalysis = {
            eventWindows: [],
            avgEventImpressions: 0,
            avgNonEventImpressions: 0,
            impactRatio: 0,
            totalEvents: 0,
            insight: null
          }
        }

        return {
          contentVelocityFunnel: contentVelocity,
          aiEfficiency,
          crossPlatformStrategy,
          mediaUtilization,
          contentDNA,
          goldenWindowHeatmap,
          peakTimes,
          // Strategic Analytics
          consistencyIndex,
          leadTimeAnalysis,
          viralCoefficient,
          mediaMixDiversity,
          contentPurposeBreakdown,
          eventImpactAnalysis
        }
      })(),
      upcomingWeekEvents: upcomingWeekEvents.map((item: any) => ({
        date: item._id,
        count: item.count,
        items: item.items || []
      })),
      lastUpdated: new Date(),
    }

    res.json({
      success: true,
      analytics,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
})

// @desc    Get Ayrshare analytics - Top posting times
// @route   GET /api/analytics/ayrshare/posting-times
// @access  Private
router.get('/ayrshare/posting-times', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Get posts from database
    const dbPosts = await SocialMediaPost.find({
      userId,
      status: 'published',
      publishedAt: { $exists: true },
    }).sort({ publishedAt: -1 }).limit(500)
    
    // Fetch fresh engagement metrics from Ayrshare
    const postsForUpdate = dbPosts.map((post: any) => ({
      postId: post._id.toString(),
      platformPostId: post.platformPostId,
    }))
    const freshMetrics = await updatePostEngagementMetrics(postsForUpdate)
    
    // Convert to Ayrshare format with platform normalization and fresh metrics
    const ayrsharePosts = dbPosts.map((post: any) => {
      let platform = post.platform?.toLowerCase() || ''
      // Normalize platform names
      if (platform === 'x' || platform === 'twitter/x') {
        platform = 'twitter'
      }
      
      const postId = post.platformPostId || post._id.toString()
      const freshData = freshMetrics[postId]
      
      return {
        id: post._id.toString(),
        postId: postId,
        platform: platform,
        postedDate: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
        analytics: freshData || {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views || 0,
          impressions: post.impressions || 0,
        },
      }
    })
    
    // Try to get additional posts from Ayrshare API
    const ayrshareApiPosts = await getAllPosts(100)
    
    // Combine and deduplicate
    const allPosts = [...ayrsharePosts]
    ayrshareApiPosts.forEach((apiPost: any) => {
      if (!allPosts.find((p: any) => p.postId === apiPost.postId)) {
        allPosts.push(apiPost)
      }
    })
    
    const topPostingTimes = calculateTopPostingTimes(allPosts)
    
    res.json({
      success: true,
      postingTimes: topPostingTimes,
    })
  } catch (error: any) {
    console.error('Ayrshare posting times error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch posting times',
    })
  }
})

// @desc    Update engagement metrics for posts from Ayrshare
// @route   POST /api/analytics/ayrshare/update-metrics
// @access  Private
router.post('/ayrshare/update-metrics', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Get posts from database
    const dbPosts = await SocialMediaPost.find({
      userId,
      status: 'published',
      publishedAt: { $exists: true },
    }).sort({ publishedAt: -1 }).limit(500)
    
    // Prepare posts for metrics update
    const postsForUpdate = dbPosts.map(post => ({
      postId: post._id.toString(),
      platformPostId: post.platformPostId,
    }))
    
    // Fetch fresh engagement metrics from Ayrshare
    const metrics = await updatePostEngagementMetrics(postsForUpdate)
    
    // Update posts in database with fresh metrics
    const updatePromises = Object.entries(metrics).map(async ([postId, metricsData]: [string, any]) => {
      const post = dbPosts.find((p: any) =>
        (p.platformPostId && p.platformPostId === postId) ||
        p._id.toString() === postId
      )

      if (post && metricsData) {
        await SocialMediaPost.findByIdAndUpdate(post._id, {
          likes: metricsData.likes,
          comments: metricsData.comments,
          shares: metricsData.shares,
          views: metricsData.views,
          impressions: metricsData.impressions,
        })
      }
    })
    
    await Promise.all(updatePromises)
    
    res.json({
      success: true,
      message: `Updated metrics for ${Object.keys(metrics).length} posts`,
      updatedCount: Object.keys(metrics).length,
    })
  } catch (error: any) {
    console.error('Ayrshare update metrics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update engagement metrics',
    })
  }
})

// @desc    Get Ayrshare analytics - Platform heatmaps
// @route   GET /api/analytics/ayrshare/heatmaps
// @access  Private
router.get('/ayrshare/heatmaps', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Auto-sync posts from Ayrshare before generating heatmaps
    try {
      await syncAyrsharePostsToDatabase(userId.toString())
      console.log('[Heatmaps] Posts synced from Ayrshare')
    } catch (syncError: any) {
      console.warn('[Heatmaps] Sync failed, continuing with existing data:', syncError.message)
    }
    
    // Get posts from database (now includes synced Ayrshare posts)
    const dbPosts = await SocialMediaPost.find({
      userId,
      status: 'published',
      publishedAt: { $exists: true },
    }).sort({ publishedAt: -1 }).limit(500)
    
    // Fetch fresh engagement metrics from Ayrshare
    const postsForUpdate = dbPosts.map((post: any) => ({
      postId: post._id.toString(),
      platformPostId: post.platformPostId,
    }))
    const freshMetrics = await updatePostEngagementMetrics(postsForUpdate)
    
    // Convert to Ayrshare format with platform normalization and fresh metrics
    const ayrsharePosts = dbPosts.map((post: any) => {
      let platform = post.platform?.toLowerCase() || ''
      // Normalize platform names
      if (platform === 'x' || platform === 'twitter/x') {
        platform = 'twitter'
      }
      
      const postId = post.platformPostId || post._id.toString()
      const freshData = freshMetrics[postId]
      
      return {
        id: post._id.toString(),
        postId: postId,
        platform: platform,
        postedDate: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
        analytics: freshData || {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views || 0,
          impressions: post.impressions || 0,
        },
      }
    })
    
    // Debug: Log platform distribution
    const platformCounts = ayrsharePosts.reduce((acc: Record<string, number>, post: any) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1
      return acc
    }, {})
    console.log('[Ayrshare Heatmaps] Platform distribution from DB:', platformCounts)
    console.log('[Ayrshare Heatmaps] Total posts from DB:', ayrsharePosts.length)
    console.log('[Ayrshare Heatmaps] Sample posts:', ayrsharePosts.slice(0, 3).map((p: any) => ({
      platform: p.platform,
      postedDate: p.postedDate,
      hasAnalytics: !!p.analytics
    })))
    
    // Try to get additional posts from Ayrshare API
    const ayrshareApiPosts = await getAllPosts(200)
    console.log('[Ayrshare Heatmaps] Posts from Ayrshare API:', ayrshareApiPosts.length)
    
    // Debug: Log platform distribution from Ayrshare API
    const apiPlatformCounts = ayrshareApiPosts.reduce((acc: Record<string, number>, post: any) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1
      return acc
    }, {})
    console.log('[Ayrshare Heatmaps] Platform distribution from Ayrshare API:', apiPlatformCounts)
    console.log('[Ayrshare Heatmaps] Sample Ayrshare API posts:', ayrshareApiPosts.slice(0, 5).map((p: any) => ({
      platform: p.platform,
      postedDate: p.postedDate,
      postId: p.postId,
    })))
    
    // Combine and deduplicate
    const allPosts = [...ayrsharePosts]
    ayrshareApiPosts.forEach((apiPost: any) => {
      if (!allPosts.find((p: any) => p.postId === apiPost.postId)) {
        allPosts.push(apiPost)
      }
    })
    
    // Debug: Log final platform distribution
    const finalPlatformCounts = allPosts.reduce((acc: Record<string, number>, post: any) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1
      return acc
    }, {})
    console.log('[Ayrshare Heatmaps] Final platform distribution:', finalPlatformCounts)
    console.log('[Ayrshare Heatmaps] Total posts after combining:', allPosts.length)

    const heatmaps = generatePlatformHeatmaps(allPosts)

    // Debug: Log heatmap data
    Object.entries(heatmaps).forEach(([platform, data]: [string, any]) => {
      const nonZeroData = data.filter((d: any) => d.value > 0)
      console.log(`[Ayrshare Heatmaps] ${platform}: ${data.length} total cells, ${nonZeroData.length} with data`)
      if (nonZeroData.length > 0) {
        console.log(`[Ayrshare Heatmaps] ${platform} sample data:`, nonZeroData.slice(0, 3))
      } else {
        console.log(`[Ayrshare Heatmaps] WARNING: ${platform} has no data!`)
      }
    })
    
    res.json({
      success: true,
      heatmaps,
    })
  } catch (error: any) {
    console.error('Ayrshare heatmaps error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch heatmaps',
    })
  }
})

// @desc    Get Ayrshare analytics - Posting consistency
// @route   GET /api/analytics/ayrshare/consistency
// @access  Private
router.get('/ayrshare/consistency', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Get posts from database
    const dbPosts = await SocialMediaPost.find({
      userId,
      status: 'published',
      publishedAt: { $exists: true },
    }).sort({ publishedAt: -1 }).limit(500)
    
    // Convert to Ayrshare format with platform normalization
    const ayrsharePosts = dbPosts.map((post: any) => {
      let platform = post.platform?.toLowerCase() || ''
      // Normalize platform names
      if (platform === 'x' || platform === 'twitter/x') {
        platform = 'twitter'
      }

      return {
        id: post._id.toString(),
        postId: post.platformPostId || post._id.toString(),
        platform: platform,
        postedDate: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
        analytics: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views || 0,
          impressions: post.impressions || 0,
        },
      }
    })
    
    // Try to get additional posts from Ayrshare API
    const ayrshareApiPosts = await getAllPosts(100)
    
    // Combine and deduplicate
    const allPosts = [...ayrsharePosts]
    ayrshareApiPosts.forEach((apiPost: any) => {
      if (!allPosts.find((p: any) => p.postId === apiPost.postId)) {
        allPosts.push(apiPost)
      }
    })
    
    const consistency = calculatePostingConsistency(allPosts)
    
    res.json({
      success: true,
      consistency,
    })
  } catch (error: any) {
    console.error('Ayrshare consistency error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch consistency data',
    })
  }
})

// @desc    Get Ayrshare analytics - Industry recommendations
// @route   GET /api/analytics/ayrshare/recommendations
// @access  Private
router.get('/ayrshare/recommendations', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Get posts from database
    const dbPosts = await SocialMediaPost.find({
      userId,
      status: 'published',
      publishedAt: { $exists: true },
    }).sort({ publishedAt: -1 }).limit(500)
    
    // Fetch fresh engagement metrics from Ayrshare
    const postsForUpdate = dbPosts.map((post: any) => ({
      postId: post._id.toString(),
      platformPostId: post.platformPostId,
    }))
    const freshMetrics = await updatePostEngagementMetrics(postsForUpdate)
    
    // Convert to Ayrshare format with platform normalization and fresh metrics
    const ayrsharePosts = dbPosts.map((post: any) => {
      let platform = post.platform?.toLowerCase() || ''
      // Normalize platform names
      if (platform === 'x' || platform === 'twitter/x') {
        platform = 'twitter'
      }
      
      const postId = post.platformPostId || post._id.toString()
      const freshData = freshMetrics[postId]
      
      return {
        id: post._id.toString(),
        postId: postId,
        platform: platform,
        postedDate: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
        analytics: freshData || {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views || 0,
          impressions: post.impressions || 0,
        },
      }
    })
    
    // Try to get additional posts from Ayrshare API
    const ayrshareApiPosts = await getAllPosts(100)
    
    // Combine and deduplicate
    const allPosts = [...ayrsharePosts]
    ayrshareApiPosts.forEach((apiPost: any) => {
      if (!allPosts.find((p: any) => p.postId === apiPost.postId)) {
        allPosts.push(apiPost)
      }
    })
    
    const postingTimes = calculateTopPostingTimes(allPosts)
    const consistency = calculatePostingConsistency(allPosts)
    const heatmaps = generatePlatformHeatmaps(allPosts)
    
    const recommendations = getIndustryRecommendations(
      postingTimes,
      consistency,
      heatmaps
    )
    
    res.json({
      success: true,
      recommendations,
    })
  } catch (error: any) {
    console.error('Ayrshare recommendations error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recommendations',
    })
  }
})

// @desc    Get all Ayrshare analytics in one call
// @route   GET /api/analytics/ayrshare/all
// @access  Private
router.get('/ayrshare/all', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Get posts from database
    const dbPosts = await SocialMediaPost.find({
      userId,
      status: 'published',
      publishedAt: { $exists: true },
    }).sort({ publishedAt: -1 }).limit(500)
    
    // Fetch fresh engagement metrics from Ayrshare
    const postsForUpdate = dbPosts.map((post: any) => ({
      postId: post._id.toString(),
      platformPostId: post.platformPostId,
    }))
    const freshMetrics = await updatePostEngagementMetrics(postsForUpdate)
    
    // Convert to Ayrshare format with platform normalization and fresh metrics
    const ayrsharePosts = dbPosts.map((post: any) => {
      let platform = post.platform?.toLowerCase() || ''
      // Normalize platform names
      if (platform === 'x' || platform === 'twitter/x') {
        platform = 'twitter'
      }
      
      const postId = post.platformPostId || post._id.toString()
      const freshData = freshMetrics[postId]
      
      return {
        id: post._id.toString(),
        postId: postId,
        platform: platform,
        postedDate: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
        analytics: freshData || {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views || 0,
          impressions: post.impressions || 0,
        },
      }
    })
    
    // Try to get additional posts from Ayrshare API
    const ayrshareApiPosts = await getAllPosts(100)
    
    // Combine and deduplicate
    const allPosts = [...ayrsharePosts]
    ayrshareApiPosts.forEach((apiPost: any) => {
      if (!allPosts.find((p: any) => p.postId === apiPost.postId)) {
        allPosts.push(apiPost)
      }
    })
    
    // Debug: Log platform distribution
    const platformCounts = allPosts.reduce((acc: Record<string, number>, post: any) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1
      return acc
    }, {})
    console.log('[Ayrshare All Analytics] Platform distribution:', platformCounts)
    console.log('[Ayrshare All Analytics] Fresh metrics fetched for:', Object.keys(freshMetrics).length, 'posts')

    const postingTimes = calculateTopPostingTimes(allPosts)
    const heatmaps = generatePlatformHeatmaps(allPosts)
    const consistency = calculatePostingConsistency(allPosts)
    const recommendations = getIndustryRecommendations(
      postingTimes,
      consistency,
      heatmaps
    )
    const engagementMetrics = calculateEngagementMetrics(allPosts)
    const platformPerformance = calculatePlatformPerformance(allPosts)
    const contentTypePerformance = calculateContentTypePerformance(allPosts)
    const engagementTrends = calculateEngagementTrends(allPosts)

    // Frequency-based insights from Ayrshare history (Basic plan compatible)
    const frequencyByDay = calculatePostingFrequencyByDay(allPosts)
    const frequencyByHour = calculatePostingFrequencyByHour(allPosts)
    const platformUsagePatterns = calculatePlatformUsagePatterns(allPosts)
    const bestPostingTimesByFrequency = calculateBestPostingTimesByFrequency(allPosts)

    // Debug: Log heatmap data structure
    console.log('[Ayrshare All Analytics] Heatmap platforms:', Object.keys(heatmaps))
    Object.entries(heatmaps).forEach(([platform, data]: [string, any]) => {
      console.log(`[Ayrshare All Analytics] ${platform}: ${data.length} data points`)
    })
    console.log('[Ayrshare All Analytics] Engagement metrics:', engagementMetrics)
    console.log('[Ayrshare All Analytics] Platform performance:', Object.keys(platformPerformance))
    console.log('[Ayrshare All Analytics] Frequency insights - Posts by day:', frequencyByDay.length)
    
    res.json({
      success: true,
      data: {
        postingTimes,
        heatmaps,
        consistency,
        recommendations,
        engagementMetrics,
        platformPerformance,
        contentTypePerformance,
        engagementTrends,
        // Frequency-based insights (from history only)
        frequencyInsights: {
          postingFrequencyByDay: frequencyByDay,
          postingFrequencyByHour: frequencyByHour,
          platformUsagePatterns: platformUsagePatterns,
          bestPostingTimesByFrequency: bestPostingTimesByFrequency,
        },
      },
    })
  } catch (error: any) {
    console.error('Ayrshare all analytics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Ayrshare analytics',
    })
  }
})

// @desc    Get frequency-based insights from Ayrshare history (Basic plan compatible)
// @route   GET /api/analytics/ayrshare/frequency-insights
// @access  Private
router.get('/ayrshare/frequency-insights', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id
    
    // Auto-sync posts from Ayrshare before calculating insights
    try {
      await syncAyrsharePostsToDatabase(userId.toString())
      console.log('[Frequency Insights] Posts synced from Ayrshare')
    } catch (syncError: any) {
      console.warn('[Frequency Insights] Sync failed, continuing with existing data:', syncError.message)
    }
    
    // Get posts from database (now includes synced Ayrshare posts)
    const dbPosts = await SocialMediaPost.find({
      userId,
      status: { $in: ['published', 'scheduled'] },
      $or: [
        { publishedAt: { $exists: true } },
        { scheduledAt: { $exists: true } },
      ],
    }).sort({ publishedAt: -1, scheduledAt: -1 }).limit(500)
    
    // Get posts from Ayrshare history
    const ayrshareApiPosts = await getAllPosts(200)
    
    // Convert database posts to Ayrshare format
    const dbPostsFormatted = dbPosts.map((post: any) => {
      let platform = post.platform?.toLowerCase() || ''
      if (platform === 'x' || platform === 'twitter/x') {
        platform = 'twitter'
      }

      return {
        id: post._id.toString(),
        postId: post.platformPostId || post._id.toString(),
        platform: platform,
        postedDate: post.publishedAt?.toISOString() || post.scheduledAt?.toISOString() || post.createdAt.toISOString(),
        scheduledDate: post.scheduledAt?.toISOString(),
        text: post.content || '',
        status: post.status || 'published',
        mediaUrls: post.mediaAttachments?.map((m: any) => m.url) || [],
      }
    })

    // Combine and deduplicate
    const allPosts = [...dbPostsFormatted]
    ayrshareApiPosts.forEach((apiPost: any) => {
      if (!allPosts.find((p: any) => p.postId === apiPost.postId)) {
        allPosts.push(apiPost)
      }
    })
    
    // Calculate frequency-based insights
    const frequencyByDay = calculatePostingFrequencyByDay(allPosts)
    const frequencyByHour = calculatePostingFrequencyByHour(allPosts)
    const platformUsagePatterns = calculatePlatformUsagePatterns(allPosts)
    const bestPostingTimesByFrequency = calculateBestPostingTimesByFrequency(allPosts)
    const consistency = calculatePostingConsistency(allPosts)
    
    res.json({
      success: true,
      data: {
        postingFrequencyByDay: frequencyByDay,
        postingFrequencyByHour: frequencyByHour,
        platformUsagePatterns: platformUsagePatterns,
        bestPostingTimesByFrequency: bestPostingTimesByFrequency,
        consistency: consistency,
        totalPosts: allPosts.length,
        note: 'These insights are based on posting frequency from history data, not performance metrics.',
      },
    })
  } catch (error: any) {
    console.error('Ayrshare frequency insights error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch frequency insights',
    })
  }
})

// @desc    Sync Ayrshare posts to database
// @route   POST /api/analytics/ayrshare/sync-posts
// @access  Private
router.post('/ayrshare/sync-posts', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user._id.toString()
    
    console.log(`[Ayrshare Sync] Starting sync for user: ${userId}`)
    
    const result = await syncAyrsharePostsToDatabase(userId)
    
    res.json({
      success: true,
      message: 'Posts synced successfully',
      result: {
        synced: result.synced,
        skipped: result.skipped,
        errors: result.errors,
      },
    })
  } catch (error: any) {
    console.error('Ayrshare sync error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync posts',
    })
  }
})

// ============================================
// Best Time Analytics Routes (prediction_best_time dataset)
// 
// These routes read data from:
// - Database: melo
// - Collection: prediction_best_time
// 
// All analytics are computed from the global benchmark dataset
// stored in the MongoDB melo database connection.
// ============================================

// @desc    Get available years and months
// @route   GET /api/analytics/best-time/time-periods
// @access  Private
router.get('/best-time/time-periods', requireAuth, async (req: any, res) => {
  try {
    const result = await getAvailableTimePeriods()
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Time periods error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get time periods',
    })
  }
})

// @desc    Get best hours to post per platform
// @route   GET /api/analytics/best-time/hours
// @access  Private
router.get('/best-time/hours', requireAuth, async (req: any, res) => {
  try {
    const { platform, year, month } = req.query
    const yearNum = year ? parseInt(year) : undefined
    const monthNum = month ? parseInt(month) : undefined
    const result = await getBestHoursPerPlatform(platform, yearNum, monthNum)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Best hours error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get best hours',
    })
  }
})

// @desc    Get best days to post per platform
// @route   GET /api/analytics/best-time/days
// @access  Private
router.get('/best-time/days', requireAuth, async (req: any, res) => {
  try {
    const { platform, year, month } = req.query
    const yearNum = year ? parseInt(year) : undefined
    const monthNum = month ? parseInt(month) : undefined
    const result = await getBestDaysPerPlatform(platform, yearNum, monthNum)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Best days error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get best days',
    })
  }
})

// @desc    Get day × hour heatmap
// @route   GET /api/analytics/best-time/heatmap
// @access  Private
router.get('/best-time/heatmap', requireAuth, async (req: any, res) => {
  try {
    const { platform, metric, year, month } = req.query
    const yearNum = year ? parseInt(year) : undefined
    const monthNum = month ? parseInt(month) : undefined
    const result = await getDayHourHeatmap(
      platform,
      metric === 'likes' ? 'likes' : metric === 'retweets' ? 'retweets' : 'engagement',
      yearNum,
      monthNum
    )
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Heatmap error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get heatmap',
    })
  }
})

// @desc    Get engagement metrics
// @route   GET /api/analytics/best-time/engagement
// @access  Private
router.get('/best-time/engagement', requireAuth, async (req: any, res) => {
  try {
    const { platform, country } = req.query
    const result = await getEngagementMetrics(platform, country)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Engagement metrics error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get engagement metrics',
    })
  }
})

// @desc    Get top posts
// @route   GET /api/analytics/best-time/top-posts
// @access  Private
router.get('/best-time/top-posts', requireAuth, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const sortBy = req.query.sortBy || 'engagement'
    const result = await getTopPosts(limit, sortBy as 'likes' | 'retweets' | 'engagement')
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Top posts error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get top posts',
    })
  }
})

// @desc    Get sentiment-aware insights
// @route   GET /api/analytics/best-time/sentiment
// @access  Private
router.get('/best-time/sentiment', requireAuth, async (req: any, res) => {
  try {
    const { platform } = req.query
    const result = await getSentimentInsights(platform)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Sentiment insights error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sentiment insights',
    })
  }
})

// @desc    Get platform comparison
// @route   GET /api/analytics/best-time/platform-comparison
// @access  Private
router.get('/best-time/platform-comparison', requireAuth, async (req: any, res) => {
  try {
    const result = await getPlatformComparison()
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Platform comparison error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get platform comparison',
    })
  }
})

// @desc    Get hashtag trends
// @route   GET /api/analytics/best-time/hashtags
// @access  Private
router.get('/best-time/hashtags', requireAuth, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20
    const result = await getHashtagTrends(limit)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Hashtag trends error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hashtag trends',
    })
  }
})

// @desc    Get country-based insights
// @route   GET /api/analytics/best-time/countries
// @access  Private
router.get('/best-time/countries', requireAuth, async (req: any, res) => {
  try {
    const { country } = req.query
    const result = await getCountryInsights(country)
    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Country insights error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get country insights',
    })
  }
})

// @desc    Get all best time analytics in one call
// @route   GET /api/analytics/best-time/all
// @access  Private
router.get('/best-time/all', requireAuth, async (req: any, res) => {
  try {
    const { platform, year, month } = req.query
    const yearNum = year ? parseInt(year) : undefined
    const monthNum = month ? parseInt(month) : undefined
    
    console.log(`[Best Time Analytics] Fetching all analytics${platform ? ` for platform: ${platform}` : ''}${yearNum ? ` year: ${yearNum}` : ''}${monthNum ? ` month: ${monthNum}` : ''}`)
    
    const [
      bestHours,
      bestDays,
      heatmap,
      engagement,
      topPosts,
      sentiment,
      platformComparison,
      hashtags,
      countries,
    ] = await Promise.all([
      getBestHoursPerPlatform(platform, yearNum, monthNum),
      getBestDaysPerPlatform(platform, yearNum, monthNum),
      getDayHourHeatmap(platform, 'engagement', yearNum, monthNum),
      getEngagementMetrics(platform),
      getTopPosts(10, 'engagement'),
      getSentimentInsights(platform),
      getPlatformComparison(),
      getHashtagTrends(20),
      getCountryInsights(),
    ])
    
    // Log data summary for debugging
    const dataSummary = {
      bestHours: bestHours ? Object.keys(bestHours).length : 0,
      bestDays: bestDays ? Object.keys(bestDays).length : 0,
      heatmap: heatmap ? Object.keys(heatmap).length : 0,
      engagement: engagement ? engagement.length : 0,
      topPosts: topPosts ? topPosts.length : 0,
      sentiment: sentiment ? sentiment.length : 0,
      platformComparison: platformComparison ? platformComparison.length : 0,
      hashtags: hashtags ? hashtags.length : 0,
      countries: countries ? countries.length : 0,
    }
    
    console.log('[Best Time Analytics] Data summary:', dataSummary)
    
    const responseData = {
      bestHours: bestHours || {},
      bestDays: bestDays || {},
      heatmap: heatmap || {},
      engagement: engagement || [],
      topPosts: topPosts || [],
      sentiment: sentiment || [],
      platformComparison: platformComparison || [],
      hashtags: hashtags || [],
      countries: countries || [],
    }
    
    res.json({
      success: true,
      data: responseData,
      summary: dataSummary, // Include summary for debugging
    })
  } catch (error: any) {
    console.error('[Best Time Analytics] Error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get analytics',
    })
  }
})

export default router

