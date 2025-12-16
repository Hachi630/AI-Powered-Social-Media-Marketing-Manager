import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import Contact from '../models/Contact'
import { sendSMS, sendMMS, sendWhatsApp, validatePhoneNumber } from '../services/twilioService'
import { saveSocialMediaPost } from '../services/databaseService'
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

export default router

