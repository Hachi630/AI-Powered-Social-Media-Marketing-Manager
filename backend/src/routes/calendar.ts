import express, { Request, Response } from 'express'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import CalendarItem from '../models/CalendarItem'

const router = express.Router()

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
      variants: variants || {},
      status: status || 'draft',
    })

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
    if (variants !== undefined) item.variants = variants || {}
    if (status !== undefined) item.status = status

    await item.save()

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
      variants: item.variants || {},
      status: item.status || 'draft',
    }))

    const createdItems = await CalendarItem.insertMany(itemsToCreate)

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

export default router

