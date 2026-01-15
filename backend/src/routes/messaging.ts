import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import Contact from '../models/Contact.js'
import { sendSMS, sendMMS, sendWhatsApp, validatePhoneNumber } from '../services/twilioService.js'
import { saveSocialMediaPost } from '../services/databaseService.js'
import path from 'path'

const router = Router()

// @desc    Get all contacts for the authenticated user
// @route   GET /api/messaging/contacts
// @access  Private
router.get('/contacts', requireAuth, async (req: any, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const contacts = await Contact.find({ userId: req.user._id })
      .sort({ name: 1 })

    res.json({
      success: true,
      contacts,
    })
  } catch (error: any) {
    console.error('Get contacts error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contacts',
    })
  }
})

// @desc    Create a new contact
// @route   POST /api/messaging/contacts
// @access  Private
router.post('/contacts', requireAuth, async (req: any, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const { name, phoneNumber, email, notes } = req.body

    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required',
      })
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use format: +1234567890 or 1234567890',
      })
    }

    // Check if contact already exists for this user
    const existingContact = await Contact.findOne({
      userId: req.user._id,
      phoneNumber: phoneNumber.trim(),
    })

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists',
      })
    }

    const contact = new Contact({
      userId: req.user._id,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email?.trim(),
      notes: notes?.trim(),
    })

    await contact.save()

    res.status(201).json({
      success: true,
      contact,
    })
  } catch (error: any) {
    console.error('Create contact error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create contact',
    })
  }
})

// @desc    Update a contact
// @route   PUT /api/messaging/contacts/:id
// @access  Private
router.put('/contacts/:id', requireAuth, async (req: any, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const { name, phoneNumber, email, notes } = req.body

    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      })
    }

    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      })
    }

    if (name) contact.name = name.trim()
    if (phoneNumber) contact.phoneNumber = phoneNumber.trim()
    if (email !== undefined) contact.email = email?.trim()
    if (notes !== undefined) contact.notes = notes?.trim()

    await contact.save()

    res.json({
      success: true,
      contact,
    })
  } catch (error: any) {
    console.error('Update contact error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update contact',
    })
  }
})

// @desc    Delete a contact
// @route   DELETE /api/messaging/contacts/:id
// @access  Private
router.delete('/contacts/:id', requireAuth, async (req: any, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      })
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete contact error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete contact',
    })
  }
})

// @desc    Send SMS message
// @route   POST /api/messaging/send-sms
// @access  Private
router.post('/send-sms', requireAuth, async (req: any, res) => {
  try {
    // Debug logging
    console.log('Send SMS request received')
    console.log('User:', req.user ? 'exists' : 'missing')
    console.log('User ID:', req.user?._id || 'N/A')
    console.log('Request body:', JSON.stringify(req.body, null, 2))

    if (!req.user || !req.user._id) {
      console.error('Authentication failed: req.user is missing or has no _id')
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please log in again.',
      })
    }

    const { to, body } = req.body

    console.log('Extracted data - to:', to, 'body:', body ? `"${body.substring(0, 50)}..."` : 'empty')

    if (!to || !body) {
      console.error('Missing required fields - to:', !!to, 'body:', !!body)
      return res.status(400).json({
        success: false,
        message: 'Phone number and message body are required',
      })
    }

    if (!body.trim()) {
      console.error('Message body is empty or only whitespace')
      return res.status(400).json({
        success: false,
        message: 'Message body cannot be empty',
      })
    }

    console.log('Calling Twilio sendSMS with:', { to, bodyLength: body.length })
    const result = await sendSMS({
      to,
      body,
    })

    console.log('Twilio result:', result)

    if (!result.success) {
      console.error('Twilio SMS failed:', result.error)
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send SMS',
      })
    }

    // Save to database
    await saveSocialMediaPost({
      userId: req.user._id,
      platform: 'sms',
      postType: 'text',
      content: body,
      status: 'published',
      platformPostId: result.messageSid,
      recipientPhoneNumber: to,
      direction: 'outgoing',
    })

    res.json({
      success: true,
      messageSid: result.messageSid,
      message: 'SMS sent successfully',
    })
  } catch (error: any) {
    console.error('Send SMS error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS',
    })
  }
})

// @desc    Send MMS message (with media)
// @route   POST /api/messaging/send-mms
// @access  Private
router.post('/send-mms', requireAuth, async (req: any, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const { to, body, mediaUrl } = req.body

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      })
    }

    if (!mediaUrl || !Array.isArray(mediaUrl) || mediaUrl.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one media URL is required for MMS',
      })
    }

    // Convert relative URLs to absolute URLs
    const absoluteMediaUrls = mediaUrl.map((url: string) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      // If it's a local file path, convert to absolute URL
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000'
      return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`
    })

    const result = await sendMMS({
      to,
      body: body || '',
      mediaUrl: absoluteMediaUrls,
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send MMS',
      })
    }

    // Save to database
    await saveSocialMediaPost({
      userId: req.user._id,
      platform: 'sms',
      postType: 'mixed',
      content: body || '',
      status: 'published',
      mediaAttachments: absoluteMediaUrls.map((url: string) => ({
        type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'video',
        url,
        thumbnailUrl: url,
      })),
      platformPostId: result.messageSid,
      recipientPhoneNumber: to,
      direction: 'outgoing',
    })

    res.json({
      success: true,
      messageSid: result.messageSid,
      message: 'MMS sent successfully',
    })
  } catch (error: any) {
    console.error('Send MMS error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send MMS',
    })
  }
})

// @desc    Send WhatsApp message
// @route   POST /api/messaging/send-whatsapp
// @access  Private
router.post('/send-whatsapp', requireAuth, async (req: any, res) => {
  try {
    // Debug logging
    console.log('Send WhatsApp request received')
    console.log('User:', req.user ? 'exists' : 'missing')
    console.log('User ID:', req.user?._id || 'N/A')
    console.log('Request body:', JSON.stringify(req.body, null, 2))

    if (!req.user || !req.user._id) {
      console.error('Authentication failed: req.user is missing or has no _id')
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please log in again.',
      })
    }

    const { to, body, mediaUrl, contentSid, contentVariables } = req.body

    console.log('Extracted data - to:', to, 'body:', body ? `"${body.substring(0, 50)}..."` : 'empty', 'mediaUrl:', mediaUrl, 'contentSid:', contentSid, 'contentVariables:', contentVariables)

    if (!to) {
      console.error('Missing required field - to:', !!to)
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      })
    }

    // For WhatsApp, body is required if no media and no contentSid (template)
    if (!contentSid && (!body || !body.trim()) && (!mediaUrl || !Array.isArray(mediaUrl) || mediaUrl.length === 0)) {
      console.error('Message body, media, and contentSid are all empty')
      return res.status(400).json({
        success: false,
        message: 'Message body, media, or contentSid (template) is required',
      })
    }

    console.log('Calling Twilio sendWhatsApp with:', { to, bodyLength: body?.length || 0, mediaUrlCount: mediaUrl?.length || 0 })

    // Convert relative URLs to absolute URLs if media is provided
    let absoluteMediaUrls: string[] | undefined
    if (mediaUrl && Array.isArray(mediaUrl) && mediaUrl.length > 0) {
      absoluteMediaUrls = mediaUrl.map((url: string) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url
        }
        // If it's a local file path, convert to absolute URL
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:5000'
        return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`
      })
    }

    const result = await sendWhatsApp({
      to,
      body: body || undefined,
      mediaUrl: absoluteMediaUrls,
      contentSid: contentSid,
      contentVariables: contentVariables,
    })

    console.log('Twilio result:', result)

    if (!result.success) {
      console.error('Twilio WhatsApp failed:', result.error)
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to send WhatsApp message',
      })
    }

    // Save to database
    // For template messages, use contentSid as content identifier
    const messageContent = contentSid
      ? `[Template: ${contentSid}]${contentVariables ? ` Variables: ${contentVariables}` : ''}`
      : body || ''

    await saveSocialMediaPost({
      userId: req.user._id,
      platform: 'whatsapp',
      postType: absoluteMediaUrls && absoluteMediaUrls.length > 0 ? 'mixed' : contentSid ? 'text' : 'text',
      content: messageContent,
      status: 'published',
      mediaAttachments: absoluteMediaUrls ? absoluteMediaUrls.map((url: string) => ({
        type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'video',
        url,
        thumbnailUrl: url,
      })) : undefined,
      platformPostId: result.messageSid,
      recipientPhoneNumber: to,
      direction: 'outgoing',
    })

    res.json({
      success: true,
      messageSid: result.messageSid,
      message: 'WhatsApp message sent successfully',
    })
  } catch (error: any) {
    console.error('Send WhatsApp error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp message',
    })
  }
})

// @desc    Upload media file for MMS
// @route   POST /api/messaging/upload-media
// @access  Private
router.post('/upload-media', requireAuth, async (req: any, res) => {
  try {
    // This endpoint can be used to upload media files
    // For now, we'll use the existing upload route
    // Media files should be uploaded to /api/upload first, then use the returned URL

    res.json({
      success: true,
      message: 'Please use /api/upload to upload media files first',
    })
  } catch (error: any) {
    console.error('Upload media error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload media',
    })
  }
})

// @desc    Get WhatsApp conversation history
// @route   GET /api/messaging/whatsapp/conversations
// @access  Private
router.get('/whatsapp/conversations', requireAuth, async (req: any, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      })
    }

    const { default: SocialMediaPost } = await import('../models/SocialMediaPost.js')
    const { Types } = await import('mongoose')

    // Fetch all WhatsApp messages for this user (both incoming and outgoing)
    // First try to find messages with phone numbers, then fallback to all WhatsApp messages
    let messages = await SocialMediaPost.find({
      userId: new Types.ObjectId(req.user._id),
      platform: 'whatsapp',
      $or: [
        { recipientPhoneNumber: { $exists: true, $nin: [null, ''] } },
        { senderPhoneNumber: { $exists: true, $nin: [null, ''] } },
      ],
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(2000)
      .lean()

    // If no messages found with phone numbers, try finding all WhatsApp messages (for debugging)
    if (messages.length === 0) {
      console.log('[WhatsApp Conversations] No messages with phone numbers found, checking all WhatsApp messages...')
      const allWhatsAppMessages = await SocialMediaPost.find({
        userId: new Types.ObjectId(req.user._id),
        platform: 'whatsapp',
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()

      console.log(`[WhatsApp Conversations] Found ${allWhatsAppMessages.length} total WhatsApp messages (without phone number filter)`)
      if (allWhatsAppMessages.length > 0) {
        console.log('[WhatsApp Conversations] Sample message structure:', {
          _id: allWhatsAppMessages[0]._id,
          hasRecipientPhoneNumber: !!allWhatsAppMessages[0].recipientPhoneNumber,
          hasSenderPhoneNumber: !!allWhatsAppMessages[0].senderPhoneNumber,
          hasDirection: !!allWhatsAppMessages[0].direction,
          recipientPhoneNumber: allWhatsAppMessages[0].recipientPhoneNumber,
          senderPhoneNumber: allWhatsAppMessages[0].senderPhoneNumber,
          direction: allWhatsAppMessages[0].direction,
        })
      }
    }

    console.log(`[WhatsApp Conversations] Found ${messages.length} messages with phone numbers for user ${req.user._id}`)

    // Debug: Log sample messages to understand structure
    if (messages.length > 0) {
      console.log('[WhatsApp Conversations] Sample message:', {
        _id: messages[0]._id,
        direction: messages[0].direction,
        recipientPhoneNumber: messages[0].recipientPhoneNumber,
        senderPhoneNumber: messages[0].senderPhoneNumber,
        platform: messages[0].platform,
        content: messages[0].content?.substring(0, 50),
      })
    }

    // Group messages by phone number (use recipientPhoneNumber for outgoing, senderPhoneNumber for incoming)
    const conversations: Record<string, any[]> = {}

    messages.forEach((message: any) => {
      // Determine the other party's phone number
      let phoneNumber: string | null = null

      if (message.direction === 'incoming' && message.senderPhoneNumber) {
        phoneNumber = message.senderPhoneNumber
      } else if (message.direction === 'outgoing' && message.recipientPhoneNumber) {
        phoneNumber = message.recipientPhoneNumber
      } else if (!message.direction) {
        // Fallback: if no direction is set, assume outgoing and use recipientPhoneNumber
        phoneNumber = message.recipientPhoneNumber || message.senderPhoneNumber
      } else if (message.recipientPhoneNumber) {
        // Fallback: use recipientPhoneNumber if available
        phoneNumber = message.recipientPhoneNumber
      } else if (message.senderPhoneNumber) {
        // Fallback: use senderPhoneNumber if available
        phoneNumber = message.senderPhoneNumber
      }

      if (!phoneNumber || phoneNumber.trim() === '') {
        console.warn('[WhatsApp Conversations] Skipping message without phone number:', {
          messageId: message._id,
          direction: message.direction,
          recipientPhoneNumber: message.recipientPhoneNumber,
          senderPhoneNumber: message.senderPhoneNumber,
        })
        return
      }

      // Normalize phone number (remove whatsapp: prefix if present)
      phoneNumber = phoneNumber.replace(/^whatsapp:/, '').trim()

      if (!conversations[phoneNumber]) {
        conversations[phoneNumber] = []
      }
      conversations[phoneNumber].push({
        _id: message._id.toString(),
        content: message.content || '',
        mediaAttachments: message.mediaAttachments || [],
        publishedAt: message.publishedAt || message.createdAt,
        createdAt: message.createdAt,
        platformPostId: message.platformPostId,
        postType: message.postType,
        direction: message.direction || 'outgoing',
      })
    })

    console.log(`[WhatsApp Conversations] Grouped into ${Object.keys(conversations).length} conversations`)

    // Convert to array format and sort by most recent message
    const conversationList = Object.entries(conversations)
      .map(([phoneNumber, msgs]) => {
        // Sort messages within conversation by date (most recent first)
        const sortedMessages = msgs.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt).getTime()
          const dateB = new Date(b.publishedAt || b.createdAt).getTime()
          return dateB - dateA
        })

        return {
          phoneNumber,
          messages: sortedMessages,
          lastMessageAt: sortedMessages[0]?.publishedAt || sortedMessages[0]?.createdAt,
          messageCount: sortedMessages.length,
        }
      })
      .filter(conv => conv.messageCount > 0) // Filter out empty conversations
      .sort((a, b) => {
        const dateA = new Date(a.lastMessageAt).getTime()
        const dateB = new Date(b.lastMessageAt).getTime()
        return dateB - dateA
      })

    console.log(`[WhatsApp Conversations] Returning ${conversationList.length} conversations`)

    res.json({
      success: true,
      conversations: conversationList,
      totalMessages: messages.length,
    })
  } catch (error: any) {
    console.error('Get WhatsApp conversations error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch WhatsApp conversations',
    })
  }
})

// @desc    Webhook endpoint for incoming WhatsApp messages from Twilio
// @route   POST /api/messaging/whatsapp/webhook
// @access  Public (Twilio webhook)
router.post('/whatsapp/webhook', async (req: any, res) => {
  try {
    const { From, To, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body

    console.log('WhatsApp webhook received:', {
      From,
      To,
      Body: Body ? Body.substring(0, 50) : 'No body',
      MessageSid,
      NumMedia,
    })

    if (!From || !MessageSid) {
      console.warn('Missing required fields in webhook:', { From, MessageSid })
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    // Extract user ID from the "To" number or find user by phone number
    // For now, we'll need to find the user associated with the Twilio WhatsApp number
    // This assumes you have a way to map Twilio numbers to users
    // For simplicity, we'll try to find a user or use a default approach

    const { default: SocialMediaPost } = await import('../models/SocialMediaPost.js')
    const { default: User } = await import('../models/User.js')
    const { Types } = await import('mongoose')
    const { saveSocialMediaPost } = await import('../services/databaseService.js')

    // Find user by checking who has sent messages to this phone number before
    // This associates incoming messages with the user who initiated the conversation
    let userId: any = null

    // Format phone number (remove whatsapp: prefix if present)
    const senderPhoneNumber = From.replace(/^whatsapp:/, '')

    // Try to find a user who has sent messages to this phone number
    const existingMessage = await SocialMediaPost.findOne({
      platform: 'whatsapp',
      recipientPhoneNumber: senderPhoneNumber,
      direction: 'outgoing',
    }).sort({ createdAt: -1 })

    if (existingMessage) {
      userId = existingMessage.userId
    } else {
      // If no existing conversation, try to find user by Twilio number mapping
      // For now, use the first user as fallback (you can improve this with a mapping table)
      const firstUser = await User.findOne().limit(1)
      if (firstUser) {
        userId = firstUser._id
      } else {
        console.warn('No users found to associate incoming WhatsApp message')
        return res.status(200).type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
      }
    }

    // Prepare media attachments if present
    const mediaAttachments: any[] = []
    if (NumMedia && parseInt(NumMedia) > 0) {
      for (let i = 0; i < parseInt(NumMedia); i++) {
        const mediaUrl = req.body[`MediaUrl${i}`]
        const mediaType = req.body[`MediaContentType${i}`]
        if (mediaUrl) {
          mediaAttachments.push({
            type: mediaType?.startsWith('image/') ? 'image' : mediaType?.startsWith('video/') ? 'video' : 'document',
            url: mediaUrl,
            thumbnailUrl: mediaUrl,
          })
        }
      }
    }

    // Save incoming message to database
    await saveSocialMediaPost({
      userId: userId,
      platform: 'whatsapp',
      postType: mediaAttachments.length > 0 ? (mediaAttachments.length > 0 && Body ? 'mixed' : 'image') : 'text',
      content: Body || (mediaAttachments.length > 0 ? `Received ${mediaAttachments.length} media file(s)` : ''),
      status: 'published',
      mediaAttachments: mediaAttachments.length > 0 ? mediaAttachments : undefined,
      platformPostId: MessageSid,
      senderPhoneNumber: senderPhoneNumber,
      direction: 'incoming',
      publishedAt: new Date(),
    })

    console.log('Incoming WhatsApp message saved:', {
      userId: userId.toString(),
      senderPhoneNumber,
      messageSid: MessageSid,
    })

    // Respond to Twilio (required)
    res.status(200).type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error)
    // Still respond to Twilio to avoid retries
    res.status(200).type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
  }
})

export default router

