import { Router } from 'express'
import dayjs from 'dayjs'
import { requireAuth } from '../middleware/auth.js'
import RecurringSchedule, {
  IRecurrencePattern,
  JobHuntTone,
  RecurringScheduleStatus,
} from '../models/RecurringSchedule.js'
import CalendarItem from '../models/CalendarItem.js'
import {
  generateJobHuntPostWithImage,
  generateJobHuntPostContent,
} from '../services/jobHuntPromptService.js'
import { checkAndPublishScheduledItems } from '../services/schedulerService.js'

const router = Router()

interface SchedulePayload {
  name?: string
  status?: RecurringScheduleStatus
  subDomains?: string[]
  tone?: JobHuntTone
  hotTopics?: string[]
  recurrencePattern?: IRecurrencePattern
  includeImage?: boolean
  imageStyle?: string
  endDate?: string | null
}

/**
 * Compute the initial nextRunAt for a brand-new schedule.
 * Picks the next matching day-of-week+timeOfDay from now.
 */
function computeInitialNextRunAt(pattern: IRecurrencePattern): Date {
  const [hh, mm] = pattern.timeOfDay.split(':').map(Number)
  const now = dayjs()

  if (pattern.type === 'daily') {
    const todayAtTime = now.hour(hh).minute(mm).second(0).millisecond(0)
    return todayAtTime.isAfter(now) ? todayAtTime.toDate() : todayAtTime.add(1, 'day').toDate()
  }

  // weekly
  const days = (pattern.daysOfWeek || []).slice().sort((a, b) => a - b)
  if (days.length === 0) {
    throw new Error('Weekly schedule requires at least one day of week')
  }
  let candidate = now
  for (let i = 0; i < 14; i++) {
    const atTime = candidate.hour(hh).minute(mm).second(0).millisecond(0)
    if (days.includes(candidate.day()) && atTime.isAfter(now)) {
      return atTime.toDate()
    }
    candidate = candidate.add(1, 'day')
  }
  throw new Error('Could not compute next run time')
}

function validatePayload(payload: SchedulePayload, requireAll: boolean): string | null {
  if (requireAll) {
    if (!payload.name?.trim()) return 'name is required'
    if (!payload.recurrencePattern) return 'recurrencePattern is required'
    if (!payload.tone) return 'tone is required'
  }
  if (payload.recurrencePattern) {
    const { type, daysOfWeek, timeOfDay } = payload.recurrencePattern
    if (type !== 'daily' && type !== 'weekly') return 'recurrencePattern.type must be daily or weekly'
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(timeOfDay || '')) {
      return 'recurrencePattern.timeOfDay must be HH:mm'
    }
    if (type === 'weekly' && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
      return 'weekly recurrencePattern requires daysOfWeek'
    }
  }
  if (payload.tone && !['technical', 'storytelling', 'achievement'].includes(payload.tone)) {
    return 'tone must be technical, storytelling, or achievement'
  }
  return null
}

// POST /api/job-hunt/schedules — create a new recurring schedule
router.post('/schedules', requireAuth, async (req: any, res) => {
  try {
    const payload: SchedulePayload = req.body || {}
    const err = validatePayload(payload, true)
    if (err) return res.status(400).json({ success: false, message: err })

    const nextRunAt = computeInitialNextRunAt(payload.recurrencePattern!)

    const schedule = await RecurringSchedule.create({
      userId: req.user._id,
      name: payload.name!.trim(),
      status: 'active',
      subDomains: payload.subDomains || [],
      tone: payload.tone,
      hotTopics: payload.hotTopics || [],
      recurrencePattern: payload.recurrencePattern,
      includeImage: payload.includeImage !== false,
      imageStyle: payload.imageStyle?.trim() || 'clean tech illustration',
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      nextRunAt,
    })

    res.json({ success: true, schedule })
  } catch (error: any) {
    console.error('[jobHunt] create schedule failed:', error)
    res.status(500).json({ success: false, message: error.message || 'Failed to create schedule' })
  }
})

// GET /api/job-hunt/schedules — list user's recurring schedules
router.get('/schedules', requireAuth, async (req: any, res) => {
  try {
    const schedules = await RecurringSchedule.find({ userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, schedules })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PATCH /api/job-hunt/schedules/:id — edit (incl. pause/resume)
router.patch('/schedules/:id', requireAuth, async (req: any, res) => {
  try {
    const payload: SchedulePayload = req.body || {}
    const err = validatePayload(payload, false)
    if (err) return res.status(400).json({ success: false, message: err })

    const schedule = await RecurringSchedule.findOne({ _id: req.params.id, userId: req.user._id })
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' })

    if (payload.name !== undefined) schedule.name = payload.name.trim()
    if (payload.status) schedule.status = payload.status
    if (payload.subDomains) schedule.subDomains = payload.subDomains
    if (payload.tone) schedule.tone = payload.tone
    if (payload.hotTopics) schedule.hotTopics = payload.hotTopics
    if (payload.includeImage !== undefined) schedule.includeImage = payload.includeImage
    if (payload.imageStyle !== undefined) schedule.imageStyle = payload.imageStyle
    if (payload.endDate !== undefined) schedule.endDate = payload.endDate ? new Date(payload.endDate) : null
    if (payload.recurrencePattern) {
      schedule.recurrencePattern = payload.recurrencePattern
      // Re-compute nextRunAt when pattern changes
      schedule.nextRunAt = computeInitialNextRunAt(payload.recurrencePattern)
    }

    await schedule.save()
    res.json({ success: true, schedule })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// DELETE /api/job-hunt/schedules/:id
router.delete('/schedules/:id', requireAuth, async (req: any, res) => {
  try {
    const result = await RecurringSchedule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!result) return res.status(404).json({ success: false, message: 'Schedule not found' })
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/job-hunt/preview — generate one sample post without persisting
router.post('/preview', requireAuth, async (req: any, res) => {
  try {
    const payload: SchedulePayload = req.body || {}
    const err = validatePayload(payload, false)
    if (err) return res.status(400).json({ success: false, message: err })

    if (payload.includeImage === false) {
      const post = await generateJobHuntPostContent({
        subDomains: payload.subDomains || [],
        tone: payload.tone || 'technical',
        hotTopics: payload.hotTopics || [],
        imageStyle: payload.imageStyle || 'clean tech illustration',
      } as any)
      return res.json({
        success: true,
        post: { title: post.title, content: post.content, imageUrl: null },
      })
    }

    const post = await generateJobHuntPostWithImage({
      subDomains: payload.subDomains || [],
      tone: payload.tone || 'technical',
      hotTopics: payload.hotTopics || [],
      imageStyle: payload.imageStyle || 'clean tech illustration',
      includeImage: true,
      userId: req.user._id,
    } as any)

    res.json({ success: true, post })
  } catch (error: any) {
    console.error('[jobHunt] preview failed:', error)
    res.status(500).json({ success: false, message: error.message || 'Preview failed' })
  }
})

// GET /api/job-hunt/schedules/:id/items — list CalendarItems generated by this schedule
router.get('/schedules/:id/items', requireAuth, async (req: any, res) => {
  try {
    const schedule = await RecurringSchedule.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' })

    const items = await CalendarItem.find({
      recurringScheduleId: schedule._id,
    })
      .sort({ date: -1, time: -1 })
      .limit(20)
      .lean()

    res.json({ success: true, items })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/job-hunt/schedules/:id/run-now — immediately generate one post + publish on the next cron tick
router.post('/schedules/:id/run-now', requireAuth, async (req: any, res) => {
  try {
    const schedule = await RecurringSchedule.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' })

    const post = await generateJobHuntPostWithImage({
      subDomains: schedule.subDomains,
      tone: schedule.tone,
      hotTopics: schedule.hotTopics,
      imageStyle: schedule.imageStyle,
      includeImage: schedule.includeImage,
      userId: schedule.userId,
    } as any)

    const now = dayjs()
    const item = await CalendarItem.create({
      userId: schedule.userId,
      recurringScheduleId: schedule._id,
      platform: 'linkedin',
      date: now.startOf('day').toDate(),
      time: now.format('HH:mm'),
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl || null,
      variants: { linkedin: post.content },
      status: 'scheduled',
    })

    // Kick the publisher right now so the user sees the result fast
    checkAndPublishScheduledItems().catch((err) =>
      console.error('[jobHunt] run-now publish failed:', err)
    )

    res.json({ success: true, item })
  } catch (error: any) {
    console.error('[jobHunt] run-now failed:', error)
    res.status(500).json({ success: false, message: error.message || 'Run now failed' })
  }
})

export default router
