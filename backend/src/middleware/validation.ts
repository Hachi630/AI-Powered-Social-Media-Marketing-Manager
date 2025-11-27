import { Request, Response, NextFunction } from 'express'

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

  // Check if message exists
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    })
  }

  // Check if message is a string
  if (typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Message must be a string',
    })
  }

  // Trim and check if empty
  const trimmedMessage = message.trim()
  if (trimmedMessage.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be empty',
    })
  }

  // Check message length
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters`,
      maxLength: MAX_MESSAGE_LENGTH,
      actualLength: trimmedMessage.length,
    })
  }

  // Validate conversationId format if provided (MongoDB ObjectId format)
  if (conversationId && typeof conversationId === 'string') {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
      })
    }
  }

  // Sanitize: Replace the message with trimmed version
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

  // Check if prompt exists
  if (!prompt) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is required',
    })
  }

  // Check if prompt is a string
  if (typeof prompt !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Prompt must be a string',
    })
  }

  // Trim and check if empty
  const trimmedPrompt = prompt.trim()
  if (trimmedPrompt.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Prompt cannot be empty',
    })
  }

  // Check prompt length
  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters`,
      maxLength: MAX_PROMPT_LENGTH,
      actualLength: trimmedPrompt.length,
    })
  }

  // Validate conversationId format if provided
  if (conversationId && typeof conversationId === 'string') {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
      })
    }
  }

  // Sanitize: Replace the prompt with trimmed version
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

