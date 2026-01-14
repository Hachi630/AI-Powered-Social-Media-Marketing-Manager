import express, { Request, Response } from 'express'
import { Types } from 'mongoose'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import CalendarItem from '../models/CalendarItem'
import Event from '../models/Event'
import { twitterService } from '../services/twitterService'
import TwitterToken from '../models/TwitterToken'

const router = express.Router()

// Helper function to create an event for a batch of calendar items
// Creates ONE event for all calendar items in the batch with global auto-increment counter
const createEventForCalendarItemsBatch = async (userId: Types.ObjectId, calendarItemIds: Types.ObjectId[]) => {
  try {
    if (!calendarItemIds || calendarItemIds.length === 0) {
      console.log('[Event] No calendar items provided, skipping event creation')
      return
    }

    console.log(`[Event] Attempting to create event for userId: ${userId}, calendarItemIds: ${calendarItemIds.length} items`)
    
    // Fetch calendar items to get their dates
    const calendarItems = await CalendarItem.find({ _id: { $in: calendarItemIds } }).select('date').lean()
    
    if (calendarItems.length === 0) {
      console.error('[Event] No calendar items found for the provided IDs')
      return
    }
    
    // Get the earliest date from all calendar items
    const dates = calendarItems.map(item => new Date(item.date))
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())))
    
    console.log(`[Event] Found ${calendarItems.length} calendar items, earliest date: ${earliestDate.toISOString().split('T')[0]}`)
    
    // Get the current max global event number (across all users)
    const maxEvent = await Event.findOne().sort({ eventNumber: -1 }).lean()
    const nextEventNumber = (maxEvent?.eventNumber || 0) + 1
    
    console.log(`[Event] Current max global event number: ${maxEvent?.eventNumber || 0}, Next event number: ${nextEventNumber}`)

    // Create a single event for all calendar items in this batch
    const newEvent = await Event.create({
      userId,
      calendarItemIds,
      eventNumber: nextEventNumber,
      date: earliestDate, // Copy the earliest date from calendar items
    })

    console.log(`[Event] ✅ Successfully created event #${nextEventNumber} for user ${userId}`)
    console.log(`[Event] Event contains ${calendarItemIds.length} calendar items`)
    console.log(`[Event] Event date: ${earliestDate.toISOString().split('T')[0]}`)
    console.log(`[Event] Event document ID: ${newEvent._id}`)
    
    // Verify the event was saved
    const verifyEvent = await Event.findById(newEvent._id)
    if (verifyEvent) {
      console.log(`[Event] ✅ Verified event exists in database: ${verifyEvent._id}`)
    } else {
      console.error(`[Event] ❌ Event not found in database after creation!`)
    }
  } catch (error: any) {
    console.error('[Event] ❌ Error creating event:', error)
    console.error('[Event] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    })
    // Don't throw - events are supplementary data
  }
}

// @desc    Get calendar items for date range
// @route   GET /api/calendar
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      })
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)

    // Set end date to end of day
    end.setHours(23, 59, 59, 999)

    const items = await CalendarItem.find({
      userId: user._id,
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .populate('campaignId', 'name')
      .sort({ date: 1, time: 1 })

    res.json({
      success: true,
      items: items.map((item) => ({
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        campaignName: (item.campaignId as any)?.name || null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    })
  } catch (error: any) {
    console.error('Get calendar items error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get calendar items',
    })
  }
})

// @desc    Get single calendar item
// @route   GET /api/calendar/:id
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const item = await CalendarItem.findOne({
      _id: req.params.id,
      userId: user._id,
    }).populate('campaignId', 'name')

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    res.json({
      success: true,
      item: {
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        campaignName: (item.campaignId as any)?.name || null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Get calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get calendar item',
    })
  }
})

// @desc    Create calendar item
// @route   POST /api/calendar
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const {
      campaignId,
      platform,
      date,
      time,
      title,
      content,
      imageUrl,
      variants,
      status,
    } = req.body

    // Validate required fields
    if (!platform || !date || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'platform, date, title, and content are required',
      })
    }

    const item = await CalendarItem.create({
      userId: user._id,
      campaignId: campaignId || null,
      platform,
      date: new Date(date),
      time: time || null,
      title,
      content,
      imageUrl: imageUrl || null,
      variants: variants || {},
      status: status || 'draft',
    })

    // Note: Single calendar item creation doesn't create an event
    // Events are only created when using "Send to Calendar" (batch creation)

    res.status(201).json({
      success: true,
      item: {
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Create calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create calendar item',
    })
  }
})

// @desc    Update calendar item
// @route   PUT /api/calendar/:id
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const item = await CalendarItem.findOne({
      _id: req.params.id,
      userId: user._id,
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    const {
      campaignId,
      platform,
      date,
      time,
      title,
      content,
      imageUrl,
      variants,
      status,
    } = req.body

    // Update fields
    if (campaignId !== undefined) item.campaignId = campaignId || null
    if (platform !== undefined) item.platform = platform
    if (date !== undefined) item.date = new Date(date)
    if (time !== undefined) item.time = time || null
    if (title !== undefined) item.title = title
    if (content !== undefined) item.content = content
    if (imageUrl !== undefined) item.imageUrl = imageUrl || null
    if (variants !== undefined) item.variants = variants || {}
    if (status !== undefined) item.status = status

    await item.save()

    // Note: We don't recreate events on update since the counter is based on creation
    // If you want to track updates, you could add logic here

    res.json({
      success: true,
      item: {
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Update calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update calendar item',
    })
  }
})

// @desc    Delete calendar item
// @route   DELETE /api/calendar/:id
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const item = await CalendarItem.findOneAndDelete({
      _id: req.params.id,
      userId: user._id,
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    // Remove calendar item from event if it exists and check if event should be deleted
    const eventsContainingItem = await Event.find({ calendarItemIds: item._id })
    
    for (const event of eventsContainingItem) {
      // Remove the calendar item from the event
      event.calendarItemIds = event.calendarItemIds.filter(
        (id: Types.ObjectId) => id.toString() !== item._id.toString()
      )
      
      // If event has no more calendar items, delete it and renumber
      if (event.calendarItemIds.length === 0) {
        const deletedEventNumber = event.eventNumber
        
        console.log(`[Event] Deleting empty event #${deletedEventNumber} after all calendar items removed`)
        
        // Delete the event
        await Event.findByIdAndDelete(event._id)
        
        // Renumber all events with higher event numbers (reduce by 1)
        await Event.updateMany(
          { eventNumber: { $gt: deletedEventNumber } },
          { $inc: { eventNumber: -1 } }
        )
        
        console.log(`[Event] Renumbered events: All events with number > ${deletedEventNumber} reduced by 1`)
      } else {
        // Save the updated event
        await event.save()
      }
    }

    res.json({
      success: true,
      message: 'Calendar item deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete calendar item',
    })
  }
})

// @desc    Batch create calendar items
// @route   POST /api/calendar/batch
// @access  Private
router.post('/batch', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must not be empty',
      })
    }

    // Validate and create items
    const itemsToCreate = items.map((item: any) => ({
      userId: user._id,
      campaignId: item.campaignId || null,
      platform: item.platform,
      date: new Date(item.date),
      time: item.time || null,
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || null,
      variants: item.variants || {},
      status: item.status || 'draft',
    }))

    const createdItems = await CalendarItem.insertMany(itemsToCreate)

    // Create ONE event for all calendar items in this batch
    const userId = typeof user._id === 'string' ? new Types.ObjectId(user._id) : user._id
    const calendarItemIds = createdItems.map(item => 
      typeof item._id === 'string' ? new Types.ObjectId(item._id) : item._id
    )
    
    // Get next global event number
    const maxEvent = await Event.findOne().sort({ eventNumber: -1 }).lean()
    const nextEventNumber = (maxEvent?.eventNumber || 0) + 1
    
    // Get the earliest date from all created calendar items
    const dates = createdItems.map(item => new Date(item.date))
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())))
    
    // Create one event for the entire batch
    await Event.create({
      userId,
      calendarItemIds,
      eventNumber: nextEventNumber,
      date: earliestDate, // Copy the earliest date from calendar items
    })
    
    console.log(`[Calendar Batch] Created event #${nextEventNumber} with ${calendarItemIds.length} calendar items`)
    console.log(`[Calendar Batch] Event date: ${earliestDate.toISOString().split('T')[0]}`)

    res.status(201).json({
      success: true,
      items: createdItems.map((item) => ({
        id: item._id.toString(),
        userId: item.userId.toString(),
        campaignId: item.campaignId ? item.campaignId.toString() : null,
        platform: item.platform,
        date: item.date.toISOString().split('T')[0],
        time: item.time || null,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl || null,
        variants: item.variants || {},
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      count: createdItems.length,
    })
  } catch (error: any) {
    console.error('Batch create calendar items error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create calendar items',
    })
  }
})

// @desc    Get event count for current user (debug endpoint)
// @route   GET /api/calendar/event-count
// @access  Private
router.get('/event-count', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Get the count of events for this user
    const eventCount = await Event.countDocuments({ userId: user._id })
    
    // Get the max global event number
    const maxEvent = await Event.findOne().sort({ eventNumber: -1 }).lean()
    
    // Get all events for this user
    const allEvents = await Event.find({ userId: user._id }).sort({ eventNumber: 1 }).lean()

    res.json({
      success: true,
      eventCount,
      maxGlobalEventNumber: maxEvent?.eventNumber || 0,
      events: allEvents.map(e => ({
        id: e._id.toString(),
        userId: e.userId.toString(),
        calendarItemIds: e.calendarItemIds.map(id => id.toString()),
        eventNumber: e.eventNumber,
        createdAt: e.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('Get event count error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get event count',
    })
  }
})

// @desc    Test event creation (debug endpoint)
// @route   POST /api/calendar/test-event
// @access  Private
router.post('/test-event', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Create test calendar items (batch)
    const testItems = await CalendarItem.insertMany([
      {
        userId: user._id,
        platform: 'test',
        date: new Date(),
        title: 'Test Event Item 1',
        content: 'Test content 1',
        status: 'draft',
      },
      {
        userId: user._id,
        platform: 'test',
        date: new Date(),
        title: 'Test Event Item 2',
        content: 'Test content 2',
        status: 'draft',
      },
    ])

    console.log(`[Test] Created ${testItems.length} test calendar items`)

    // Create ONE event for all test calendar items
    const calendarItemIds = testItems.map(item => item._id)
    const maxEvent = await Event.findOne().sort({ eventNumber: -1 }).lean()
    const nextEventNumber = (maxEvent?.eventNumber || 0) + 1
    
    // Get the earliest date from all test calendar items
    const dates = testItems.map(item => new Date(item.date))
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())))
    
    const createdEvent = await Event.create({
      userId: user._id,
      calendarItemIds,
      eventNumber: nextEventNumber,
      date: earliestDate, // Copy the earliest date from calendar items
    })

    if (createdEvent) {
      res.json({
        success: true,
        message: 'Test event created successfully',
        calendarItemIds: calendarItemIds.map(id => id.toString()),
        event: {
          id: createdEvent._id.toString(),
          userId: createdEvent.userId.toString(),
          calendarItemIds: createdEvent.calendarItemIds.map(id => id.toString()),
          eventNumber: createdEvent.eventNumber,
          createdAt: createdEvent.createdAt,
        },
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Event creation failed - event not found in database',
      })
    }
  } catch (error: any) {
    console.error('Test event creation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create test event',
      error: error.toString(),
    })
  }
})

export default router

// @desc    Share calendar item to platform
// @route   POST /api/calendar/:id/share
// @access  Private
router.post('/:id/share', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { platform } = req.body

    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' })
    }

    const item = await CalendarItem.findOne({
      _id: req.params.id,
      userId: user._id,
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calendar item not found' })
    }

    // Currently only Twitter is supported for direct posting
    if (platform === 'twitter') {
      // Check if user has connected their Twitter account
      const twitterToken = await TwitterToken.findOne({ userId: user._id });
      
      if (!twitterToken || !twitterToken.accessToken || !twitterToken.accessSecret) {
        return res.status(401).json({
          success: false,
          message: 'Twitter account not connected. Please connect your Twitter account first.',
          requiresAuth: true
        });
      }

      // Check if item has content variant for Twitter
      let content = item.variants?.twitter || item.content;
      
      // Post to Twitter using user's tokens
      const result = await twitterService.postTweet(
        content, 
        item.imageUrl,
        twitterToken.accessToken,
        twitterToken.accessSecret
      );
      
      if (result.success) {
        // Update item status to published if successful
        item.status = 'published';
        await item.save();
        
        return res.json({
          success: true,
          message: 'Successfully posted to Twitter',
          tweetId: result.tweetId
        });
      } else {
        // Return detailed error information
        const errorMessage = result.error?.data?.detail || 
                            result.error?.errors?.[0]?.message || 
                            result.error?.message || 
                            'Failed to post to Twitter';
        const errorCode = result.error?.code;
        
        console.error('Twitter posting failed:', {
          message: errorMessage,
          code: errorCode,
          fullError: result.error
        });
        
        return res.status(500).json({
          success: false,
          message: errorMessage,
          code: errorCode,
          details: result.error?.data || result.error?.errors
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Posting to ${platform} is not yet supported`
      });
    }

  } catch (error: any) {
    console.error('Share calendar item error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to share calendar item',
    })
  }
})
