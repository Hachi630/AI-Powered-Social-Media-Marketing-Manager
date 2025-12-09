// API base URL - using Vite proxy (no CORS issues)
const API_URL = '/api/calendar'

export interface CalendarItemVariants {
  tiktok?: string
  instagram_post?: string
  instagram_story?: string
  instagram_reels?: string
  facebook?: string
  twitter?: string
}

export interface CalendarItem {
  id: string
  userId: string
  campaignId: string | null
  campaignName?: string | null
  platform: string
  date: string // YYYY-MM-DD
  time: string | null // HH:mm
  title: string
  content: string
  imageUrl?: string | null
  variants?: CalendarItemVariants
  status: 'draft' | 'scheduled' | 'published'
  createdAt: string
  updatedAt: string
}

export interface CalendarItemsResponse {
  success: boolean
  items?: CalendarItem[]
  message?: string
}

export interface CalendarItemResponse {
  success: boolean
  item?: CalendarItem
  message?: string
}

export interface BatchCreateResponse {
  success: boolean
  items?: CalendarItem[]
  count?: number
  message?: string
}

export const calendarService = {
  /**
   * Get calendar items for a date range
   */
  async getCalendarItems(
    startDate: string,
    endDate: string
  ): Promise<CalendarItemsResponse> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(
        `${API_URL}?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to get calendar items' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Get a single calendar item by ID
   */
  async getCalendarItem(id: string): Promise<CalendarItemResponse> {
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
        return { success: false, message: data.message || 'Failed to get calendar item' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Create a new calendar item
   */
  async createCalendarItem(
    item: Omit<CalendarItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<CalendarItemResponse> {
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
        body: JSON.stringify(item),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to create calendar item' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Update a calendar item
   */
  async updateCalendarItem(
    id: string,
    item: Partial<Omit<CalendarItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CalendarItemResponse> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to update calendar item' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Delete a calendar item
   */
  async deleteCalendarItem(id: string): Promise<{ success: boolean; message?: string }> {
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
        return { success: false, message: data.message || 'Failed to delete calendar item' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Batch create calendar items
   */
  async createCalendarItemsBatch(
    items: Omit<CalendarItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<BatchCreateResponse> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to create calendar items' }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Share a calendar item to a platform (legacy method for backward compatibility)
   */
  async shareCalendarItem(id: string, platform: string): Promise<{ success: boolean; message?: string }> {
    // Use the new shareToPlatform method internally
    const result = await this.shareToPlatform(id, platform)
    return {
      success: result.success,
      message: result.message,
    }
  },

  /**
   * Share calendar item to social media platform
   */
  async shareToPlatform(
    calendarItemId: string,
    platform: string,
    options?: { imageUrl?: string }
  ): Promise<{ success: boolean; message?: string; postId?: string; permalink?: string; requiresAuth?: boolean }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      // Get calendar item first to get content
      const itemResponse = await this.getCalendarItem(calendarItemId)
      if (!itemResponse.success || !itemResponse.item) {
        return { success: false, message: 'Calendar item not found' }
      }

      const item = itemResponse.item
      const content = `${item.title}\n\n${item.content}`

      // Map platform names to API endpoints
      const platformMap: Record<string, string> = {
        instagram: 'instagram',
        facebook: 'facebook',
        xiaohongshu: 'xiaohongshu',
        twitter: 'twitter',
        linkedin: 'linkedin',
      }

      const apiPlatform = platformMap[platform.toLowerCase()]
      if (!apiPlatform) {
        return { success: false, message: `Unsupported platform: ${platform}` }
      }

      // Call share API
      const response = await fetch(`/api/social/${apiPlatform}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          calendarItemId,
          content,
          imageUrl: options?.imageUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Failed to share to ${platform}`,
          requiresAuth: data.requiresAuth || false,
        }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Get Instagram connection status
   */
  async getInstagramStatus(): Promise<{ success: boolean; connected: boolean; username?: string; requiresAuth?: boolean }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, connected: false }
    }

    try {
      const response = await fetch('/api/social/instagram/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, connected: false }
    }
  },

  /**
   * Initiate Instagram OAuth flow
   */
  async initiateInstagramAuth(): Promise<{ success: boolean; authUrl?: string; message?: string }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch('/api/social/instagram/auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Get Facebook Pages list for selection
   */
  async getFacebookPages(tokenKey: string): Promise<{
    success: boolean
    pages?: Array<{
      id: string
      name: string
      category: string
      hasInstagramAccount: boolean
      instagramUsername?: string
    }>
    tokenKey?: string
    message?: string
  }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`/api/social/pages?token_key=${tokenKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  /**
   * Connect selected Facebook Page
   */
  async connectFacebookPage(pageId: string, tokenKey: string): Promise<{
    success: boolean
    message?: string
    redirectUrl?: string
    instagram?: {
      userId: string
      username: string
      accountType: string
    }
    facebook?: {
      pageId: string
      pageName?: string
    }
  }> {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch('/api/social/connect-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pageId, tokenKey }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },
}

