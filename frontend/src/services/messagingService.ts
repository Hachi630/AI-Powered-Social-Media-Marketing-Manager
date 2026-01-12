const API_URL = import.meta.env.VITE_API_URL || ''

export interface Contact {
  _id: string
  name: string
  phoneNumber: string
  email?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SendMessageRequest {
  to: string
  body?: string
  mediaUrl?: string[]
  contentSid?: string // WhatsApp Content Template ID
  contentVariables?: string // JSON string with template variables (e.g., '{"1":"12/1","2":"3pm"}')
}

export interface SendMessageResponse {
  success: boolean
  messageSid?: string
  message?: string
}

export async function getContacts(): Promise<Contact[]> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/messaging/contacts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch contacts')
  }

  const data = await response.json()
  return data.contacts || []
}

export async function createContact(contact: {
  name: string
  phoneNumber: string
  email?: string
  notes?: string
}): Promise<Contact> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/messaging/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(contact),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create contact')
  }

  const data = await response.json()
  return data.contact
}

export async function updateContact(
  id: string,
  contact: {
    name?: string
    phoneNumber?: string
    email?: string
    notes?: string
  }
): Promise<Contact> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/messaging/contacts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(contact),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update contact')
  }

  const data = await response.json()
  return data.contact
}

export async function deleteContact(id: string): Promise<void> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/messaging/contacts/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete contact')
  }
}

export async function sendSMS(request: SendMessageRequest): Promise<SendMessageResponse> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated. Please log in again.')
  }

  const response = await fetch(`${API_URL}/api/messaging/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to send SMS' }))
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.')
    }
    throw new Error(errorData.message || `Failed to send SMS (${response.status})`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.message || 'Failed to send SMS')
  }

  return data
}

export async function sendMMS(request: SendMessageRequest): Promise<SendMessageResponse> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated. Please log in again.')
  }

  const response = await fetch(`${API_URL}/api/messaging/send-mms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to send MMS' }))
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.')
    }
    throw new Error(errorData.message || `Failed to send MMS (${response.status})`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.message || 'Failed to send MMS')
  }

  return data
}

export async function sendWhatsApp(request: SendMessageRequest): Promise<SendMessageResponse> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated. Please log in again.')
  }

  const response = await fetch(`${API_URL}/api/messaging/send-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to send WhatsApp message' }))
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.')
    }
    throw new Error(errorData.message || `Failed to send WhatsApp message (${response.status})`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.message || 'Failed to send WhatsApp message')
  }

  return data
}

export interface WhatsAppMessage {
  _id: string
  content: string
  mediaAttachments?: Array<{
    type: 'image' | 'video' | 'link' | 'document'
    url: string
    thumbnailUrl?: string
  }>
  publishedAt?: string
  createdAt: string
  platformPostId?: string
  postType: 'text' | 'image' | 'video' | 'link' | 'mixed'
  direction?: 'incoming' | 'outgoing'
}

export interface WhatsAppConversation {
  phoneNumber: string
  messages: WhatsAppMessage[]
  lastMessageAt: string
  messageCount: number
}

export async function getWhatsAppConversations(): Promise<WhatsAppConversation[]> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/messaging/whatsapp/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch WhatsApp conversations' }))
    throw new Error(errorData.message || `Failed to fetch WhatsApp conversations (${response.status})`)
  }

  const data = await response.json()
  console.log('[MessagingService] API response:', {
    success: data.success,
    conversationCount: data.conversations?.length || 0,
    totalMessages: data.totalMessages || 0,
  })
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch WhatsApp conversations')
  }
  
  return data.conversations || []
}