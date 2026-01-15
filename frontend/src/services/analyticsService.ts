// API base URL - use VITE_API_URL if set (production), otherwise use relative path (development with vite proxy)
const BASE_API_URL = import.meta.env.VITE_API_URL || ''
const API_URL = `${BASE_API_URL}/api/analytics`

export interface AnalyticsData {
  overview: {
    totalUsers: number
    totalBrandProfiles: number
    totalCalendarItems: number
    totalConversations: number
    totalCampaigns: number
    totalPostsGenerated: number
    totalLinkedInPosts: number
    totalAIGeneratedContent: number
    totalMediaFiles: number
  }
  breakdown: {
    postsByPlatform: Record<string, number>
    postsByStatus: Record<string, number>
    aiContentByType: Record<string, number>
  }
  recentActivity: Array<{
    date: string
    count: number
  }>
  lastUpdated: string
}

export async function getAnalytics(token: string): Promise<{ success: boolean; analytics?: AnalyticsData; message?: string }> {
  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch analytics')
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Analytics service error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch analytics',
    }
  }
}

