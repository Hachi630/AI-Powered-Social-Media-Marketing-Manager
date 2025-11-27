import express, { Request, Response } from 'express'
import { protect } from '../middleware/auth'
import { AuthRequest } from '../types'
import { geminiService, ChatMessage } from '../services/geminiService'
import Conversation from '../models/Conversation'
import { generateImage } from '../services/imageGenerationService'
import { saveImage } from '../utils/imageStorage'
import {
  validateChatMessage,
  validateImagePrompt,
  validateConversationLength,
  chatRateLimiter,
  imageRateLimiter,
} from '../middleware/middleware'

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
router.post('/', protect, chatRateLimiter, validateChatMessage, async (req: AuthRequest, res: Response) => {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log('[Chat Route] New chat request', {
      requestId,
      userId: req.user?._id?.toString(),
      hasConversationId: !!req.body.conversationId,
      messageLength: req.body.message?.length || 0,
    })

    const user = req.user

    if (!user) {
      console.error('[Chat Route] User not found', { requestId })
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { message, conversationId } = req.body

    let conversation = null

    // If conversationId exists, load the conversation and validate length
    if (conversationId) {
      try {
        conversation = await Conversation.findOne({
          _id: conversationId,
          userId: user._id,
        })

        if (!conversation) {
          console.warn('[Chat Route] Conversation not found', {
            requestId,
            conversationId,
            userId: user._id.toString(),
          })
          return res.status(404).json({ success: false, message: 'Conversation not found' })
        }

        // Validate conversation length
        const lengthValidation = await validateConversationLength(
          conversationId,
          user._id.toString()
        )
        if (!lengthValidation.valid) {
          return res.status(400).json({
            success: false,
            message: lengthValidation.message,
          })
        }

        console.log('[Chat Route] Loaded conversation', {
          requestId,
          conversationId,
          messageCount: conversation.messages.length,
        })
      } catch (dbError: any) {
        console.error('[Chat Route] Database error loading conversation', {
          requestId,
          conversationId,
          error: dbError.message,
        })
        return res.status(500).json({
          success: false,
          message: 'Failed to load conversation',
        })
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

    console.log('[Chat Route] User context loaded', {
      requestId,
      hasBrandName: !!userContext.brandName,
      hasIndustry: !!userContext.industry,
      hasToneOfVoice: !!userContext.toneOfVoice,
    })

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
      console.log('[Chat Route] Added conversation history', {
        requestId,
        historyMessageCount: conversation.messages.length,
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message.trim(),
    })

    // Call Gemini service
    let aiResponse: string
    try {
      console.log('[Chat Route] Calling Gemini service', {
        requestId,
        totalMessages: messages.length,
      })
      
      aiResponse = await geminiService.generateContent({
        messages,
        userContext,
      })

      console.log('[Chat Route] Gemini service response received', {
        requestId,
        responseLength: aiResponse.length,
      })
    } catch (geminiError: any) {
      console.error('[Chat Route] Gemini service error', {
        requestId,
        error: geminiError.message,
        errorCode: geminiError.code,
        stack: geminiError.stack,
      })
      
      // Return more specific error messages
      const statusCode = geminiError.code === 'ENOTFOUND' || geminiError.code === 'ECONNREFUSED' 
        ? 503 
        : geminiError.code === 401 || geminiError.code === 403
        ? 401
        : 500

      return res.status(statusCode).json({
        success: false,
        message: geminiError.message || 'Failed to generate AI response',
        errorCode: geminiError.code,
      })
    }

    // Create or update conversation
    try {
      if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
          userId: user._id,
          title: generateTitle(message.trim()),
          messages: [
            {
              role: 'user',
              content: message.trim(),
              timestamp: new Date(),
            },
            {
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date(),
            },
          ],
        })
        console.log('[Chat Route] Created new conversation', {
          requestId,
          conversationId: conversation._id.toString(),
        })
      } else {
        // Update existing conversation
        conversation.messages.push({
          role: 'user',
          content: message.trim(),
          timestamp: new Date(),
        })
        conversation.messages.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
        })
        await conversation.save()
        console.log('[Chat Route] Updated conversation', {
          requestId,
          conversationId: conversation._id.toString(),
          totalMessages: conversation.messages.length,
        })
      }
    } catch (dbError: any) {
      console.error('[Chat Route] Database error saving conversation', {
        requestId,
        error: dbError.message,
        stack: dbError.stack,
      })
      
      // Even if DB save fails, return the response (user got their answer)
      // But log the error for monitoring
      return res.status(200).json({
        success: true,
        response: aiResponse,
        conversationId: conversation?._id?.toString() || null,
        warning: 'Response generated but failed to save to database',
      })
    }

    const duration = Date.now() - startTime
    console.log('[Chat Route] Request completed successfully', {
      requestId,
      duration: `${duration}ms`,
      conversationId: conversation._id.toString(),
    })

    res.json({
      success: true,
      response: aiResponse,
      conversationId: conversation._id.toString(),
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('[Chat Route] Unexpected error', {
      requestId,
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      duration: `${duration}ms`,
    })
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate response',
      requestId, // Include request ID for debugging
    })
  }
})

// @desc    Generate image
// @route   POST /api/chat/generate-image
// @access  Private
router.post('/generate-image', protect, imageRateLimiter, validateImagePrompt, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { prompt, conversationId } = req.body

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

export default router


