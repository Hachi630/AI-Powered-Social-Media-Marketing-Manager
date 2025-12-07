import express, { Request, Response } from 'express'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import { geminiService, ChatMessage } from '../services/geminiService'
import Conversation from '../models/Conversation'
import { generateImage } from '../services/imageGenerationService'
import { saveImage } from '../utils/imageStorage'
import { generateContentPlan } from '../services/contentPlanService'
import CalendarItem from '../models/CalendarItem'

const router = express.Router()

// Helper function to generate conversation title from message
const generateTitle = (message: string): string => {
  if (!message || !message.trim()) {
    return 'New Chat'
  }
  const trimmed = message.trim()
  if (trimmed.length <= 50) {
    return trimmed
  }
  return trimmed.substring(0, 50) + '...'
}

// @desc    Send chat message
// @route   POST /api/chat
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { message, conversationId, images, files } = req.body

    // Validate message, images or files
    if (
      (!message || !message.trim()) &&
      (!images || !Array.isArray(images) || images.length === 0) &&
      (!files || !Array.isArray(files) || files.length === 0)
    ) {
      return res.status(400).json({ success: false, message: 'Message, images or files are required' })
    }

    let conversation = null

    // If conversationId exists, load the conversation
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: user._id,
      })

      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' })
      }
    }

    // Get user context from Brand Profile
    const userContext = {
      brandName: user.brandName,
      industry: user.industry,
      toneOfVoice: user.toneOfVoice,
      knowledgeProducts: user.knowledgeProducts,
      targetAudience: user.targetAudience,
    }

    // Build messages array for Gemini API
    const messages: ChatMessage[] = []

    // If conversation exists, add existing messages to context
    if (conversation && conversation.messages.length > 0) {
      conversation.messages.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      })
    }

    // Add current user message
    const userMessageContent = message
      ? message.trim()
      : images && images.length > 0
        ? `Uploaded ${images.length} image(s)`
        : files && files.length > 0
          ? `Uploaded ${files.length} file(s)`
          : ''
    messages.push({
      role: 'user',
      content: userMessageContent,
    })

    // Call Gemini service
    const aiResponse = await geminiService.generateContent({
      messages,
      userContext,
    })

    // Create or update conversation
    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        userId: user._id,
        title: generateTitle(userMessageContent),
        messages: [
          {
            role: 'user',
            content: userMessageContent,
            images: images && Array.isArray(images) ? images : undefined,
            files:
              files && Array.isArray(files)
                ? files.map((f: any) => ({
                    url: f.url,
                    name: f.name,
                    type: f.type,
                    size: f.size,
                  }))
                : undefined,
            timestamp: new Date(),
          },
          {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
          },
        ],
      })
    } else {
      // Update existing conversation
      conversation.messages.push({
        role: 'user',
        content: userMessageContent,
        images: images && Array.isArray(images) ? images : undefined,
        files:
          files && Array.isArray(files)
            ? files.map((f: any) => ({
                url: f.url,
                name: f.name,
                type: f.type,
                size: f.size,
              }))
            : undefined,
        timestamp: new Date(),
      })
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      })
      await conversation.save()
    }

    res.json({
      success: true,
      response: aiResponse,
      conversationId: conversation._id.toString(),
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate response',
    })
  }
})

// @desc    Generate image
// @route   POST /api/chat/generate-image
// @access  Private
router.post('/generate-image', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { prompt, conversationId } = req.body

    // Validate prompt
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' })
    }

    // Generate image
    const imageDataUrl = await generateImage(prompt.trim())

    // Extract mime type and base64 data from data URL
    const [header, base64Data] = imageDataUrl.split(',')
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png'

    // Save image to file system
    const imageUrl = await saveImage(base64Data, mimeType)

    let conversation = null

    // If conversationId exists, add image message to conversation
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: user._id,
      })

      if (conversation) {
        conversation.messages.push({
          role: 'assistant',
          content: `Generated image: ${prompt.trim()}`,
          images: [imageUrl],
          timestamp: new Date(),
        })
        await conversation.save()
      }
    } else {
      // Create new conversation for image
      conversation = await Conversation.create({
        userId: user._id,
        title: generateTitle(`Image: ${prompt.trim()}`),
        messages: [
          {
            role: 'assistant',
            content: `Generated image: ${prompt.trim()}`,
            images: [imageUrl],
            timestamp: new Date(),
          },
        ],
      })
    }

    res.json({
      success: true,
      imageUrl,
      images: [imageUrl],
      conversationId: conversation?._id.toString(),
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate image',
    })
  }
})

// @desc    Get all conversations for current user
// @route   GET /api/chat
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const conversations = await Conversation.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .select('title updatedAt createdAt')
      .lean()

    res.json({
      success: true,
      conversations: conversations.map((conv) => ({
        id: conv._id.toString(),
        title: conv.title,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('Get conversations error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get conversations',
    })
  }
})

// @desc    Get single conversation by ID
// @route   GET /api/chat/:conversationId
// @access  Private
router.get('/:conversationId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { conversationId } = req.params

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: user._id,
    })

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    res.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        messages: conversation.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          images: msg.images,
          files: msg.files,
          timestamp: msg.timestamp,
        })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Get conversation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get conversation',
    })
  }
})

// @desc    Delete conversation
// @route   DELETE /api/chat/:conversationId
// @access  Private
router.delete('/:conversationId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { conversationId } = req.params

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      userId: user._id,
    })

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete conversation error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete conversation',
    })
  }
})

// @desc    Generate content plan
// @route   POST /api/chat/generate-plan
// @access  Private
router.post('/generate-plan', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { goal, startDate, endDate, platforms } = req.body

    // Validate required fields
    if (!goal || !startDate || !endDate || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({
        success: false,
        message: 'goal, startDate, endDate, and platforms array are required',
      })
    }

    // Get user context from Brand Profile
    const userContext = {
      brandName: user.brandName,
      industry: user.industry,
      toneOfVoice: user.toneOfVoice,
      knowledgeProducts: user.knowledgeProducts,
      targetAudience: user.targetAudience,
    }

    // Generate content plan
    const plan = await generateContentPlan({
      userContext,
      goal,
      startDate,
      endDate,
      platforms,
    })

    res.json({
      success: true,
      plan,
    })
  } catch (error: any) {
    console.error('Generate content plan error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate content plan',
    })
  }
})

// @desc    Send content plan to calendar
// @route   POST /api/chat/send-to-calendar
// @access  Private
router.post('/send-to-calendar', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { items, campaignId } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must not be empty',
      })
    }

    // Validate and create calendar items
    const itemsToCreate = items.map((item: any) => ({
      userId: user._id,
      campaignId: campaignId || null,
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
    console.error('Send to calendar error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send items to calendar',
    })
  }
})

export default router


