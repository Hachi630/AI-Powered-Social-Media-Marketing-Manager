import twilio from 'twilio'

// Twilio credentials - must be provided via environment variables for security
// Get your credentials from: https://console.twilio.com/
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
// WhatsApp sender number (Sandbox or approved WhatsApp number)
const whatsappSenderNumber = process.env.TWILIO_WHATSAPP_NUMBER

// Validate required credentials
if (!accountSid || !authToken) {
  console.error('❌ Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables')
  console.error('   Please add them to your backend/.env file')
  throw new Error('Twilio credentials are required. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.')
}

// Log credentials status (without exposing the actual token)
console.log('Twilio Configuration:')
console.log('  Account SID:', accountSid ? `${accountSid.substring(0, 4)}...` : 'NOT SET')
console.log('  Auth Token:', authToken ? `${authToken.substring(0, 4)}...` : 'NOT SET')
console.log('  Phone Number:', twilioPhoneNumber || 'NOT SET')
console.log('  WhatsApp Number:', whatsappSenderNumber || 'NOT SET')

// Initialize Twilio client
let client: twilio.Twilio
try {
  client = twilio(accountSid, authToken)
  console.log('✅ Twilio client initialized successfully')
} catch (error) {
  console.error('❌ Failed to initialize Twilio client:', error)
  throw error
}

export interface SendMessageOptions {
  to: string
  body?: string
  mediaUrl?: string[]
  contentSid?: string // WhatsApp Content Template ID
  contentVariables?: string // JSON string with template variables (e.g., '{"1":"12/1","2":"3pm"}')
}

export interface SendMessageResult {
  success: boolean
  messageSid?: string
  error?: string
}

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    console.log('Twilio sendSMS called with:', {
      to: options.to,
      bodyLength: options.body?.length || 0,
      from: twilioPhoneNumber,
    })

    // Ensure phone number is in E.164 format
    const toNumber = formatPhoneNumber(options.to)
    
    if (!toNumber) {
      console.error('Invalid phone number format:', options.to)
      return {
        success: false,
        error: `Invalid phone number format: ${options.to}. Please use format: +1234567890 or 1234567890`,
      }
    }

    console.log('Formatted phone number:', toNumber)

    if (!options.body || !options.body.trim()) {
      console.error('Empty message body')
      return {
        success: false,
        error: 'Message body cannot be empty',
      }
    }

    console.log('Sending SMS via Twilio...')
    console.log('  From:', twilioPhoneNumber)
    console.log('  To:', toNumber)
    console.log('  Body length:', options.body.length)
    
    // Verify client is initialized
    if (!client) {
      throw new Error('Twilio client not initialized. Check your credentials.')
    }
    
    const message = await client.messages.create({
      body: options.body,
      from: twilioPhoneNumber,
      to: toNumber,
    })

    console.log('Twilio SMS sent successfully:', message.sid)

    return {
      success: true,
      messageSid: message.sid,
    }
  } catch (error: any) {
    console.error('Twilio SMS error:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error status:', error.status)
    
    // Handle specific Twilio errors
    let errorMessage = error.message || 'Failed to send SMS'
    
    if (error.code === 20003) {
      errorMessage = 'Twilio authentication failed. Please check your Twilio credentials.'
    } else if (error.code === 21211) {
      errorMessage = 'Invalid phone number format.'
    } else if (error.code === 21608) {
      errorMessage = 'Unsubscribed recipient. The phone number has opted out of receiving messages.'
    } else if (error.code === 21614) {
      errorMessage = 'Invalid "To" phone number.'
    }
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send MMS message (with media) via Twilio
 */
export async function sendMMS(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    // Ensure phone number is in E.164 format
    const toNumber = formatPhoneNumber(options.to)
    
    if (!toNumber) {
      return {
        success: false,
        error: 'Invalid phone number format',
      }
    }

    if (!options.mediaUrl || options.mediaUrl.length === 0) {
      return {
        success: false,
        error: 'Media URL is required for MMS',
      }
    }

    const message = await client.messages.create({
      body: options.body || '',
      from: twilioPhoneNumber,
      to: toNumber,
      mediaUrl: options.mediaUrl,
    })

    return {
      success: true,
      messageSid: message.sid,
    }
  } catch (error: any) {
    console.error('Twilio MMS error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send MMS',
    }
  }
}

/**
 * Send WhatsApp message via Twilio
 * Supports both regular text/media messages and Content API templates
 * WhatsApp uses the format: whatsapp:+1234567890 for both from and to numbers
 */
export async function sendWhatsApp(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    console.log('Twilio sendWhatsApp called with:', {
      to: options.to,
      bodyLength: options.body?.length || 0,
      contentSid: options.contentSid,
      contentVariables: options.contentVariables,
      mediaUrlCount: options.mediaUrl?.length || 0,
    })

    // Ensure phone number is in E.164 format
    const toNumber = formatPhoneNumber(options.to)
    
    if (!toNumber) {
      console.error('Invalid phone number format:', options.to)
      return {
        success: false,
        error: `Invalid phone number format: ${options.to}. Please use format: +1234567890 or 1234567890`,
      }
    }

    console.log('Formatted phone number:', toNumber)

    // Format phone numbers for WhatsApp (whatsapp:+1234567890)
    // Use the WhatsApp sender number (sandbox or approved number)
    const whatsappFrom = `whatsapp:${whatsappSenderNumber}`
    const whatsappTo = `whatsapp:${toNumber}`

    console.log('Sending WhatsApp via Twilio...')
    console.log('  From:', whatsappFrom)
    console.log('  To:', whatsappTo)
    
    // Verify client is initialized
    if (!client) {
      throw new Error('Twilio client not initialized. Check your credentials.')
    }
    
    const messageOptions: any = {
      from: whatsappFrom,
      to: whatsappTo,
    }

    // Check if using Content API template (contentSid) or regular message
    if (options.contentSid) {
      // Use Content API template
      console.log('Using WhatsApp Content API template')
      console.log('  Content SID:', options.contentSid)
      console.log('  Content Variables:', options.contentVariables)
      
      messageOptions.contentSid = options.contentSid
      
      // Add content variables if provided
      if (options.contentVariables) {
        try {
          // Validate that contentVariables is a valid JSON string
          JSON.parse(options.contentVariables)
          messageOptions.contentVariables = options.contentVariables
        } catch (parseError) {
          console.error('Invalid contentVariables JSON:', parseError)
          return {
            success: false,
            error: 'contentVariables must be a valid JSON string (e.g., \'{"1":"12/1","2":"3pm"}\')',
          }
        }
      }
    } else {
      // Use regular message (body or media)
      if (!options.body || !options.body.trim()) {
        // Allow empty body if media is provided
        if (!options.mediaUrl || options.mediaUrl.length === 0) {
          console.error('Empty message body and no media')
          return {
            success: false,
            error: 'Message body or media is required (or use contentSid for template messages)',
          }
        }
      } else {
        messageOptions.body = options.body
        console.log('  Body length:', options.body.length)
      }

      // Add media if provided
      if (options.mediaUrl && options.mediaUrl.length > 0) {
        messageOptions.mediaUrl = options.mediaUrl
        console.log('  Media URLs:', options.mediaUrl.length)
      }
    }

    const message = await client.messages.create(messageOptions)

    console.log('Twilio WhatsApp sent successfully:', message.sid)

    return {
      success: true,
      messageSid: message.sid,
    }
  } catch (error: any) {
    console.error('Twilio WhatsApp error:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error status:', error.status)
    
    // Handle specific Twilio errors
    let errorMessage = error.message || 'Failed to send WhatsApp message'
    
    if (error.code === 20003) {
      errorMessage = 'Twilio authentication failed. Please check your Twilio credentials.'
    } else if (error.code === 21211) {
      errorMessage = 'Invalid phone number format.'
    } else if (error.code === 21608) {
      errorMessage = 'Unsubscribed recipient. The phone number has opted out of receiving messages.'
    } else if (error.code === 21614) {
      errorMessage = 'Invalid "To" phone number.'
    } else if (error.code === 63007) {
      errorMessage = 'WhatsApp is not enabled for this phone number. Please enable WhatsApp in your Twilio console.'
    } else if (error.code === 21211 || error.message?.includes('Content')) {
      errorMessage = 'Invalid Content SID or Content Variables. Please check your template configuration.'
    }
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Format phone number to E.164 format
 * E.164 format: +[country code][number]
 */
function formatPhoneNumber(phoneNumber: string): string | null {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // If it doesn't start with +, assume US number and add +1
  if (!cleaned.startsWith('+')) {
    // Remove leading 1 if present
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1)
    }
    cleaned = '+1' + cleaned
  }
  
  // Validate length (should be 10-15 digits after +)
  const digitsOnly = cleaned.replace('+', '')
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return null
  }
  
  return cleaned
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const formatted = formatPhoneNumber(phoneNumber)
  return formatted !== null
}

