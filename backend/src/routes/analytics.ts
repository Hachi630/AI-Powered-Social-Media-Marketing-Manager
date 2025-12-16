import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import User from '../models/User'
import CalendarItem from '../models/CalendarItem'
import Conversation from '../models/Conversation'
import Campaign from '../models/Campaign'
import Event from '../models/Event'
import SocialMediaPost from '../models/SocialMediaPost'
import AIGeneratedContent from '../models/AIGeneratedContent'
import MediaFile from '../models/MediaFile'

const router = Router()

// @desc    Get analytics data
// @route   GET /api/analytics
// @access  Private
router.get('/', requireAuth, async (req: any, res) => {
  try {
    // Get all counts in parallel for better performance
    const [
      totalUsers,
      totalBrandProfiles,
      totalCalendarItems,
      totalConversations,
      totalCampaigns,
      totalPostsGenerated,
      totalLinkedInPosts,
      totalAIGeneratedContent,
      totalMediaFiles,
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Total brand profiles (users with brandName)
      User.countDocuments({ brandName: { $exists: true, $ne: null } }),
      
      // Total calendar items
      CalendarItem.countDocuments(),
      
      // Total conversations
      Conversation.countDocuments(),
      
      // Total campaigns
      Campaign.countDocuments(),
      
      // Total posts generated (all social media posts)
      SocialMediaPost.countDocuments(),
      
      // Total LinkedIn posts deployed (all LinkedIn posts, regardless of status)
      SocialMediaPost.countDocuments({ 
        platform: 'linkedin'
      }),
      
      // Total AI-generated content
      AIGeneratedContent.countDocuments(),
      
      // Total media files
      MediaFile.countDocuments(),
    ])

    // Get total events from Event model (each "Send to Calendar" batch creates 1 event with global counter)
    const totalEvents = await Event.countDocuments()
    console.log(`[Analytics] Total events (global counter): ${totalEvents}`)

    // Get additional statistics and time-series data
    const [
      postsByPlatform,
      postsByStatus,
      aiContentByType,
      recentActivity,
      usersTimeSeries,
      campaignsTimeSeries,
      calendarItemsTimeSeries,
      conversationsTimeSeries,
      postsTimeSeries,
      linkedInPostsTimeSeries,
      aiContentTimeSeries,
      mediaFilesTimeSeries,
    ] = await Promise.all([
      // Posts by platform
      SocialMediaPost.aggregate([
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Posts by status
      SocialMediaPost.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // AI content by type
      AIGeneratedContent.aggregate([
        {
          $group: {
            _id: '$contentType',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent activity (last 7 days)
      SocialMediaPost.aggregate([
        {
          $match: {
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
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Users time-series (last 30 days)
      User.aggregate([
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
      
      // Campaigns time-series (last 30 days)
      Campaign.aggregate([
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
      
      // Calendar items time-series (last 30 days)
      CalendarItem.aggregate([
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
      
      // Conversations time-series (last 30 days)
      Conversation.aggregate([
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
      
      // Posts time-series (last 30 days)
      SocialMediaPost.aggregate([
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
      
      // LinkedIn posts time-series (last 30 days) - all LinkedIn posts
      SocialMediaPost.aggregate([
        {
          $match: {
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
      
      // AI content time-series (last 30 days)
      AIGeneratedContent.aggregate([
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
      
      // Media files time-series (last 30 days)
      MediaFile.aggregate([
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

    // Get events time series (group by date when event was created) - last 30 days
    // Use server's local timezone for date grouping to match user's local date
    const serverTimezoneOffset = -new Date().getTimezoneOffset() / 60 // Offset in hours (e.g., +10 for Australia)
    const timezoneString = serverTimezoneOffset >= 0 
      ? `+${String(serverTimezoneOffset).padStart(2, '0')}:00`
      : `${String(serverTimezoneOffset).padStart(3, '0')}:00`
    
    const eventsTimeSeries = await Event.aggregate([
      {
        $match: {
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
    console.log(`[Analytics] Events time series data:`, eventsTimeSeries.map(e => ({ date: e._id, count: e.count })))
    console.log(`[Analytics] Upcoming week calendar items:`, upcomingWeekEvents.map(e => ({ date: e._id, count: e.count })))

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

    // Format the response
    const analytics = {
      overview: {
        totalUsers,
        totalBrandProfiles,
        totalCalendarItems,
        totalConversations,
        totalCampaigns,
        totalEvents,
        totalPostsGenerated,
        totalLinkedInPosts,
        totalAIGeneratedContent,
        totalMediaFiles,
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
        aiContentByType: aiContentByType.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
      },
      recentActivity: recentActivity.map((item: any) => ({
        date: item._id,
        count: item.count
      })),
      timeSeries: {
        users: usersTimeSeries.map((item: any) => ({
          date: item._id,
          count: item.count
        })),
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics',
    })
  }
})

export default router

