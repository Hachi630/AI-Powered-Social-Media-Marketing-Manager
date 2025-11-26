// API base URL
const API_URL = 'http://localhost:5000/api/chat'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date | string
}

export interface ChatResponse {
  success: boolean
  response?: string
  conversationId?: string
  message?: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ConversationListItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export const chatService = {
  /**
   * Send a message to the chat API
   */
  async sendMessage(
    message: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to send message' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<{ success: boolean; conversations?: ConversationListItem[]; message?: string }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to get conversations' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: string): Promise<{ success: boolean; conversation?: Conversation; message?: string }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to get conversation' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<{ success: boolean; message?: string }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to delete conversation' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },
}


