import { Request, Response, NextFunction } from 'express'

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validation constants
 */
const MAX_MESSAGE_LENGTH = 10000 // Maximum characters per message
const MAX_PROMPT_LENGTH = 2000 // Maximum characters for image prompts
const MAX_CONVERSATION_MESSAGES = 100 // Maximum messages in a conversation

/**
 * Validate chat message input
 */
export const validateChatMessage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { message, conversationId } = req.body

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    })
  }

  if (typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Message must be a string',
    })
  }

  const trimmedMessage = message.trim()
  if (trimmedMessage.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be empty',
    })
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters`,
      maxLength: MAX_MESSAGE_LENGTH,
      actualLength: trimmedMessage.length,
    })
  }

  if (conversationId && typeof conversationId === 'string') {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
      })
    }
  }

  req.body.message = trimmedMessage
  next()
}

/**
 * Validate image generation prompt
 */
export const validateImagePrompt = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prompt, conversationId } = req.body

  if (!prompt) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is required',
    })
  }

  if (typeof prompt !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Prompt must be a string',
    })
  }

  const trimmedPrompt = prompt.trim()
  if (trimmedPrompt.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Prompt cannot be empty',
    })
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters`,
      maxLength: MAX_PROMPT_LENGTH,
      actualLength: trimmedPrompt.length,
    })
  }

  if (conversationId && typeof conversationId === 'string') {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
      })
    }
  }

  req.body.prompt = trimmedPrompt
  next()
}

/**
 * Validate conversation message count
 */
export const validateConversationLength = async (
  conversationId: string,
  userId: string
): Promise<{ valid: boolean; message?: string }> => {
  try {
    const { default: Conversation } = await import('../models/Conversation.js')
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    })

    if (!conversation) {
      return { valid: false, message: 'Conversation not found' }
    }

    if (conversation.messages.length >= MAX_CONVERSATION_MESSAGES) {
      return {
        valid: false,
        message: `Conversation has reached maximum message limit (${MAX_CONVERSATION_MESSAGES})`,
      }
    }

    return { valid: true }
  } catch (error: any) {
    console.error('[Validation] Error checking conversation length:', error)
    return { valid: false, message: 'Failed to validate conversation' }
  }
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

const RATE_LIMITS = {
  chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  imageGeneration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
}

const getClientId = (req: Request): string => {
  if ((req as any).user?._id) {
    return `user_${(req as any).user._id.toString()}`
  }
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export const createRateLimiter = (
  limitType: keyof typeof RATE_LIMITS = 'general'
) => {
  const limit = RATE_LIMITS[limitType]

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req)
    const key = `${limitType}_${clientId}`
    const now = Date.now()

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + limit.windowMs,
      }
    }

    store[key].count++

    if (store[key].count > limit.maxRequests) {
      const resetTime = new Date(store[key].resetTime).toISOString()
      console.warn('[Rate Limiter] Rate limit exceeded', {
        clientId,
        limitType,
        count: store[key].count,
        maxRequests: limit.maxRequests,
        resetTime,
      })

      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${limit.maxRequests} requests per ${limit.windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
        resetTime,
      })
    }

    res.setHeader('X-RateLimit-Limit', limit.maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.maxRequests - store[key].count).toString())
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString())

    next()
  }
}

export const chatRateLimiter = createRateLimiter('chat')
export const imageRateLimiter = createRateLimiter('imageGeneration')
export const generalRateLimiter = createRateLimiter('general')

