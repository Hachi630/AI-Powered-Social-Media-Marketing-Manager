import { useEffect, useState, useCallback } from 'react'
import { Layout, Card, Row, Col, Spin, Typography, Tag, Space, Button, Drawer, Grid, Select, Statistic, Empty } from 'antd'
import {
  CalendarOutlined,
  MessageOutlined,
  FundProjectionScreenOutlined,
  FileTextOutlined,
  LinkedinOutlined,
  RobotOutlined,
  ReloadOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  GlobalOutlined,
  PictureOutlined,
  BulbOutlined,
  TranslationOutlined,
  HeatMapOutlined,
  TrophyOutlined,
  HeartOutlined,
  TagOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import AnalyticsSidebar, { type AnalyticsSection } from '../components/AnalyticsSidebar'
import styles from '../components/Dashboard.module.css'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts'
import Header from '../components/Header'
import { User } from '../services/authService'
import { isDemoMode } from '../demo/demoMode'
import { demoAnalytics } from '../demo/demoServices'

const { Content, Sider } = Layout
const { Title, Text } = Typography
const { useBreakpoint } = Grid

interface AnalyticsProps {
  isLoggedIn?: boolean
  onLoginSuccess?: (user: User) => void
  onLogout?: () => void
  user?: User | null
}

interface AnalyticsData {
  overview: {
    // Core counts
    totalCalendarItems: number
    totalConversations: number
    totalCampaigns: number
    totalEvents: number
    totalPostsGenerated: number
    totalLinkedInPosts: number
    totalAIGeneratedContent: number
    totalMediaFiles: number

    // Post status breakdown
    publishedPosts?: number
    scheduledPosts?: number
    draftPosts?: number
    failedPosts?: number

    // Engagement metrics
    totalEngagement?: number
    avgEngagementPerPost?: number
    totalLikes?: number
    totalComments?: number
    totalShares?: number
    totalViews?: number
    totalImpressions?: number
    avgLikes?: number
    avgComments?: number
    avgShares?: number
    avgViews?: number

    // AI metrics
    aiContentUsedInPosts?: number
    aiEfficiency?: number
    aiContentGenerated?: number

    // Productivity metrics
    contentVelocity?: number
    schedulingRate?: number
    scheduledItemsRate?: number
    publishingRate?: number

    // Content health
    contentHealthScore?: number

    // Recent activity
    recentPostsCreated?: number
    recentPostsPublished?: number
    recentPostsScheduled?: number
    recentPostsDraft?: number

    // Campaign metrics
    campaignPosts?: number
    campaignsWithPosts?: number

    // Core KPI Metrics (4 Main Metrics)
    totalPosts?: {
      total: number
      published: number
      publishedText: string
    }
    scheduledItems?: {
      total: number
      scheduled: number
      scheduledPct: string
    }
    aiContentUtilization?: {
      total: number
      used: number
      usagePct: string
    }
    totalAIWords?: number

    // Operations Metrics (for databases without engagement data)
    mostActivePlatform?: {
      platform: string
      count: number
    } | null
    contentConsistency?: {
      daysInRow: number
      totalActiveDays: number
    }
    totalAIWordsGenerated?: {
      words: number
      contentCount: number
    }
    humanVsAICost?: {
      humanTimeHours: number
      aiTimeHours: number
      timeSavedHours: number
      postsGenerated: number
    } | null
    next7Days?: Array<{
      type: 'calendar' | 'post'
      id: string
      title: string
      platform: string
      date: string | Date
      time?: string | null
      status: string
    }>
  }
  breakdown: {
    postsByPlatform: Record<string, number>
    postsByStatus: Record<string, number>
    postsByPostType?: Record<string, number>
    aiContentByType: Record<string, number>
    calendarItemsByStatus?: Record<string, number>
    calendarItemsByPlatform?: Record<string, number>
    campaignsByStatus?: Record<string, number>
    engagementByPlatform?: Record<string, {
      totalLikes: number
      totalComments: number
      totalShares: number
      totalViews: number
      postCount: number
      avgEngagement: number
    }>
  }
  insights?: {
    topPerformingPosts?: Array<{
      id: string
      platform: string
      content: string
      likes: number
      comments: number
      shares: number
      views: number
      engagementScore: number
      publishedAt?: Date
      createdAt: Date
    }>
    bestPlatform?: string
    mostProductiveDay?: string
  }
  recentActivity: Array<{
    date: string
    posts: number
    conversations: number
    calendarItems: number
    events: number
    aiContent: number
    total: number
  }>
  timeSeries: {
    campaigns: Array<{ date: string; count: number }>
    events: Array<{ date: string; count: number }>
    calendarItems: Array<{ date: string; count: number }>
    conversations: Array<{ date: string; count: number }>
    posts: Array<{ date: string; count: number }>
    linkedInPosts: Array<{ date: string; count: number }>
    aiContent: Array<{ date: string; count: number }>
    mediaFiles: Array<{ date: string; count: number }>
  }
  upcomingWeekEvents: Array<{ date: string; count: number; items: Array<{ id: string; title: string; platform: string; time?: string }> }>
  advancedAnalytics?: {
    contentVelocityFunnel: {
      ideation: number
      planning: number
      live: number
      conversionRate: number
      bottleneck: string | null
      insight: string | null
    }
    aiEfficiency: {
      totalProcessingTime: number
      avgProcessingTime: number
      totalAIPosts: number
      humanTimeTotal: number
      timeSaved: number
      timeSavedHours: number
      efficiencyRatio: number
    } | null
    crossPlatformStrategy: Array<{
      platform: string
      planned: number
      published: number
      gap: number
      completionRate: number
      insight: string | null
    }>
    mediaUtilization: {
      totalAssets: number
      usedAssets: number
      unusedAssets: number
      utilizationRate: number
      untappedPotential: number
      insight: string | null
    } | null
    contentDNA: Array<{ hashtag: string; count: number }>
    goldenWindowHeatmap: Array<{
      day: string
      dayIndex: number
      hour: number
      count: number
      totalImpressions: number
      avgImpressions: number
    }>
    peakTimes: string[]
    // Strategic Analytics
    consistencyIndex?: {
      score: number
      activeDays: number
      totalDays: number
      inactiveDays: number
      heatmap: Array<{ year: number; month: number; day: number; count: number }>
      insight: string | null
    }
    leadTimeAnalysis?: {
      avgLeadTimeHours: number | null
      leadTimeTrend: Array<{ index: number; hours: number }>
      totalMatchedPairs: number
      insight: string | null
    }
    viralCoefficient?: {
      avgCoefficient: number
      topViralPosts: Array<{ likes: number; shares: number; impressions: number; viralCoefficient: number }>
      totalPosts: number
      insight: string | null
    }
    mediaMixDiversity?: {
      breakdown: Array<{ type: string; count: number; percentage: number }>
      totalFiles: number
      insight: string | null
    }
    contentPurposeBreakdown?: {
      breakdown: Array<{ type: string; count: number; percentage: number }>
      totalItems: number
      insight: string | null
    }
    eventImpactAnalysis?: {
      eventWindows: Array<{
        eventDate: string
        eventNumber: number
        windowStart: string
        windowEnd: string
        postCount: number
        totalImpressions: number
        avgImpressions: number
      }>
      avgEventImpressions: number
      avgNonEventImpressions: number
      impactRatio: number
      totalEvents: number
      insight: string | null
    }
  }
  calendarItemsAnalytics?: {
    contentPlanning: {
      totalContentVolume: number
      visualAssetRatio: number
      visualAssetsCount: number
      textOnlyCount: number
      topHashtags: Array<{ hashtag: string; count: number }>
      contentTypeBreakdown: Array<{ platform: string; count: number; percentage: number }>
    }
    platformMetrics: {
      platformDistribution: Array<{ platform: string; count: number; percentage: number }>
      platformDiversityScore: number
    }
    schedulingMetrics: {
      statusOverview: Record<string, { count: number; percentage: number }>
      dailyActivityHeatmap: Array<{ day: string; dayIndex: number; count: number }>
      peakDay: { day: string; count: number } | null
      quietDay: { day: string; count: number } | null
      hourlyDistribution: Array<{ hour: number; count: number }>
      peakHours: string[]
    }
    strategicOverview: {
      campaignParticipation: {
        withCampaign: number
        withoutCampaign: number
        percentage: number
      }
      contentLongevity: {
        startDate: string
        endDate: string
        totalDays: number
        dateRange: string
      } | null
    }
  }
  lastUpdated: string
}

export default function Analytics({
  isLoggedIn = false,
  onLoginSuccess,
  onLogout,
  user,
}: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const screens = useBreakpoint()
  const isMobile = !screens.lg
  const isTablet = screens.md && !screens.lg
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(Boolean(isMobile || isTablet))
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<AnalyticsSection>('overview-stats')

  // Best Time Analytics state
  const [bestTimeData, setBestTimeData] = useState<{
    bestHours?: Record<string, any>
    bestDays?: Record<string, any>
    heatmap?: Record<string, any[]>
    engagement?: Array<{ group: string;[key: string]: any }>
    topPosts?: Array<any>
    sentiment?: Array<any>
    platformComparison?: Array<any>
    hashtags?: Array<any>
    countries?: Array<any>
  } | null>(null)
  const [bestTimeLoading, setBestTimeLoading] = useState(false)
  const [selectedBestTimePlatform, setSelectedBestTimePlatform] = useState<string>('all')
  const [selectedHeatmapMetric, setSelectedHeatmapMetric] = useState<'likes' | 'retweets' | 'engagement'>('engagement')
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableMonths, setAvailableMonths] = useState<number[]>([])

  // Update collapsed state when screen size changes
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarCollapsed(true)
    } else {
      setSidebarCollapsed(false)
    }
  }, [isMobile, isTablet])

  const fetchAnalytics = useCallback(async () => {
    try {
      if (isDemoMode()) {
        const data = await demoAnalytics()
        if (data.success && data.analytics) {
          setAnalytics(data.analytics)
        }
        return
      }
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Use VITE_API_URL if set (production), otherwise use relative path (development with vite proxy)
      const BASE_API_URL = import.meta.env.VITE_API_URL || ''
      const API_URL = `${BASE_API_URL}/api/analytics`

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      if (data.success && data.analytics) {
        // Debug: Log analytics data
        console.log('Analytics Data Received:', {
          totalEvents: data.analytics.overview?.totalEvents,
          totalCampaigns: data.analytics.overview?.totalCampaigns,
          eventsTimeSeries: data.analytics.timeSeries?.events,
          campaignsTimeSeries: data.analytics.timeSeries?.campaigns,
        })
        // Ensure events time series exists
        if (!data.analytics.timeSeries.events) {
          data.analytics.timeSeries.events = []
        }
        // Ensure totalEvents exists
        if (data.analytics.overview.totalEvents === undefined) {
          data.analytics.overview.totalEvents = 0
        }
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Fetch available time periods
  const fetchAvailableTimePeriods = useCallback(async (yearToUse?: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Use VITE_API_URL if set (production), otherwise use relative path (development with vite proxy)
      const BASE_API_URL = import.meta.env.VITE_API_URL || ''
      const API_URL = `${BASE_API_URL}/api/analytics/best-time/time-periods`

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setAvailableYears(data.data.years || [])
          // Set months based on provided year, selected year, or first available year
          const year = yearToUse || selectedYear || data.data.years[0]
          if (year && data.data.monthsByYear && data.data.monthsByYear[year]) {
            setAvailableMonths(data.data.monthsByYear[year] || [])
          } else {
            setAvailableMonths([])
          }
        }
      }
    } catch (error) {
      console.error('[Time Periods] Error:', error)
    }
  }, [selectedYear])

  const fetchBestTimeAnalytics = useCallback(async (platform?: string) => {
    try {
      setBestTimeLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('[Best Time Analytics] No auth token found')
        setBestTimeLoading(false)
        return
      }

      // Use VITE_API_URL if set (production), otherwise use relative path (development with vite proxy)
      const BASE_API_URL = import.meta.env.VITE_API_URL || ''

      // Build query parameters
      const params = new URLSearchParams()
      if (platform && platform !== 'all') {
        params.append('platform', platform)
      }
      if (selectedYear) {
        params.append('year', selectedYear.toString())
      }
      if (selectedMonth) {
        params.append('month', selectedMonth.toString())
      }

      const url = `${BASE_API_URL}/api/analytics/best-time/all?${params.toString()}`

      console.log('[Best Time Analytics] Fetching from:', url)

      // Also fetch heatmap with selected metric
      const heatmapParams = new URLSearchParams()
      if (platform && platform !== 'all') {
        heatmapParams.append('platform', platform)
      }
      heatmapParams.append('metric', selectedHeatmapMetric)
      if (selectedYear) {
        heatmapParams.append('year', selectedYear.toString())
      }
      if (selectedMonth) {
        heatmapParams.append('month', selectedMonth.toString())
      }

      const heatmapUrl = `${BASE_API_URL}/api/analytics/best-time/heatmap?${heatmapParams.toString()}`

      const [mainResponse, heatmapResponse] = await Promise.all([
        fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(heatmapUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      if (!mainResponse.ok || !heatmapResponse.ok) {
        const errorText = await mainResponse.text()
        console.error('[Best Time Analytics] API error:', mainResponse.status, errorText)
        throw new Error(`Failed to fetch best time analytics: ${mainResponse.status}`)
      }

      const data = await mainResponse.json()
      const heatmapData = await heatmapResponse.json()

      console.log('[Best Time Analytics] Response received:', {
        success: data.success,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : [],
        dataPreview: data.data ? {
          bestHours: data.data.bestHours ? Object.keys(data.data.bestHours).length : 0,
          bestDays: data.data.bestDays ? Object.keys(data.data.bestDays).length : 0,
          heatmap: heatmapData.data ? Object.keys(heatmapData.data).length : 0,
          engagement: data.data.engagement ? data.data.engagement.length : 0,
          topPosts: data.data.topPosts ? data.data.topPosts.length : 0,
        } : null,
      })

      if (data.success && data.data) {
        setBestTimeData({
          ...data.data,
          heatmap: heatmapData.success ? heatmapData.data : data.data.heatmap || {},
        })
      } else {
        console.warn('[Best Time Analytics] No data in response:', data)
        // Initialize with empty structure if no data
        setBestTimeData({
          bestHours: {},
          bestDays: {},
          heatmap: {},
          engagement: [],
          topPosts: [],
          sentiment: [],
          platformComparison: [],
          hashtags: [],
          countries: [],
        })
      }
    } catch (error) {
      console.error('[Best Time Analytics] Error:', error)
      // Set empty data on error to prevent undefined state
      setBestTimeData({
        bestHours: {},
        bestDays: {},
        heatmap: {},
        engagement: [],
        topPosts: [],
        sentiment: [],
        platformComparison: [],
        hashtags: [],
        countries: [],
      })
    } finally {
      setBestTimeLoading(false)
    }
  }, [selectedYear, selectedMonth, selectedHeatmapMetric])


  // Initial data fetch on mount
  useEffect(() => {
    fetchAnalytics()
    fetchAvailableTimePeriods()
  }, [fetchAnalytics, fetchAvailableTimePeriods])

  // Fetch best time analytics when relevant filters change
  useEffect(() => {
    if (selectedSection.startsWith('best-time')) {
      fetchBestTimeAnalytics(selectedBestTimePlatform !== 'all' ? selectedBestTimePlatform : undefined)
    }
  }, [selectedSection, selectedBestTimePlatform, selectedYear, selectedMonth, selectedHeatmapMetric, fetchBestTimeAnalytics])

  // Update available months when year changes
  useEffect(() => {
    if (selectedYear) {
      fetchAvailableTimePeriods(selectedYear)
    } else {
      fetchAvailableTimePeriods()
    }
  }, [selectedYear, fetchAvailableTimePeriods])

  // Auto-refresh every 30 seconds to get latest data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics()
      if (selectedSection.startsWith('best-time')) {
        fetchBestTimeAnalytics(selectedBestTimePlatform !== 'all' ? selectedBestTimePlatform : undefined)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchAnalytics, fetchBestTimeAnalytics, selectedSection, selectedBestTimePlatform])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchBestTimeAnalytics(selectedBestTimePlatform !== 'all' ? selectedBestTimePlatform : undefined)
      ])
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          isLoggedIn={isLoggedIn}
          onLoginSuccess={onLoginSuccess}
          onLogout={onLogout}
          user={user}
        />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 20 }}>
            <Text>Loading analytics...</Text>
          </div>
        </Content>
      </Layout>
    )
  }

  if (!analytics) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          isLoggedIn={isLoggedIn}
          onLoginSuccess={onLoginSuccess}
          onLogout={onLogout}
          user={user}
        />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Text type="secondary">Failed to load analytics data</Text>
        </Content>
      </Layout>
    )
  }

  const { overview, breakdown, recentActivity, timeSeries, upcomingWeekEvents = [], lastUpdated } = analytics

  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    try {
      // Handle both ISO date strings and YYYY-MM-DD format
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        // If parsing fails, try adding time component for YYYY-MM-DD format
        const dateWithTime = new Date(dateString + 'T00:00:00')
        if (!isNaN(dateWithTime.getTime())) {
          return dateWithTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
        return dateString // Return original if all parsing fails
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return dateString
    }
  }

  // Helper function to prepare cumulative data for charts
  const prepareCumulativeData = (data: Array<{ date: string; count: number }>) => {
    if (!data || data.length === 0) {
      return []
    }

    // Sort data by date to ensure chronological order
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

    let cumulative = 0
    return sortedData.map((item) => {
      cumulative += item.count || 0
      return {
        date: formatDate(item.date),
        count: cumulative,
        daily: item.count || 0,
      }
    })
  }

  // Calculate insights and trends
  const calculateInsights = () => {
    const insights: Array<{
      title: string
      value: string | number
      trend: 'up' | 'down' | 'stable'
      percentage: number
      description: string
      icon: React.ReactNode
      color: string
    }> = []

    // Calculate growth rates for time series data
    const calculateGrowthRate = (data: Array<{ date: string; count: number }>) => {
      if (data.length < 2) return 0
      const firstHalf = data.slice(0, Math.floor(data.length / 2))
      const secondHalf = data.slice(Math.floor(data.length / 2))
      const firstSum = firstHalf.reduce((sum, item) => sum + item.count, 0)
      const secondSum = secondHalf.reduce((sum, item) => sum + item.count, 0)
      if (firstSum === 0) return secondSum > 0 ? 100 : 0
      return ((secondSum - firstSum) / firstSum) * 100
    }

    // Post generation rate
    if (timeSeries.posts && timeSeries.posts.length > 0) {
      const postGrowth = calculateGrowthRate(timeSeries.posts)
      const recentPosts = timeSeries.posts.slice(-7).reduce((sum, item) => sum + item.count, 0)
      const avgDaily = recentPosts / 7 || 0
      insights.push({
        title: 'Content Creation Rate',
        value: `${avgDaily.toFixed(1)}/day`,
        trend: postGrowth > 10 ? 'up' : postGrowth < -10 ? 'down' : 'stable',
        percentage: Math.abs(postGrowth),
        description: postGrowth > 10
          ? `Creating ${Math.abs(postGrowth).toFixed(1)}% more posts per day`
          : 'Maintaining consistent content creation',
        icon: <FileTextOutlined />,
        color: postGrowth > 10 ? '#52c41a' : '#1890ff',
      })
    }

    // LinkedIn deployment rate
    if (timeSeries.linkedInPosts && timeSeries.linkedInPosts.length > 0) {
      const linkedInGrowth = calculateGrowthRate(timeSeries.linkedInPosts)
      const deploymentRate = overview.totalPostsGenerated > 0
        ? (overview.totalLinkedInPosts / overview.totalPostsGenerated) * 100
        : 0
      insights.push({
        title: 'LinkedIn Publishing',
        value: `${deploymentRate.toFixed(1)}%`,
        trend: linkedInGrowth > 5 ? 'up' : 'stable',
        percentage: Math.abs(linkedInGrowth),
        description: `${overview.totalLinkedInPosts} of ${overview.totalPostsGenerated} posts published to LinkedIn`,
        icon: <LinkedinOutlined />,
        color: deploymentRate > 50 ? '#52c41a' : '#faad14',
      })
    }

    // AI content efficiency
    if (overview.totalAIGeneratedContent > 0 && overview.totalPostsGenerated > 0) {
      const aiEfficiency = (overview.totalPostsGenerated / overview.totalAIGeneratedContent) * 100
      const usageRate = overview.aiContentUsedInPosts && overview.totalPostsGenerated > 0
        ? (overview.aiContentUsedInPosts / overview.totalPostsGenerated) * 100
        : 0
      insights.push({
        title: 'AI Content Usage',
        value: `${usageRate > 0 ? usageRate.toFixed(1) : aiEfficiency.toFixed(1)}%`,
        trend: usageRate > 50 || aiEfficiency > 50 ? 'up' : 'stable',
        percentage: usageRate > 0 ? usageRate : aiEfficiency,
        description: usageRate > 0
          ? `${overview.aiContentUsedInPosts} posts use AI-generated content`
          : `${Math.round(overview.totalPostsGenerated)} posts created from ${overview.totalAIGeneratedContent} AI-generated pieces`,
        icon: <RobotOutlined />,
        color: usageRate > 50 || aiEfficiency > 50 ? '#52c41a' : '#faad14',
      })
    }

    // Publishing rate
    if (overview.totalPostsGenerated > 0) {
      const publishRate = overview.publishedPosts && overview.publishedPosts > 0
        ? (overview.publishedPosts / overview.totalPostsGenerated) * 100
        : 0
      if (publishRate > 0) {
        insights.push({
          title: 'Publishing Rate',
          value: `${publishRate.toFixed(1)}%`,
          trend: publishRate > 70 ? 'up' : publishRate > 40 ? 'stable' : 'down',
          percentage: publishRate,
          description: `${overview.publishedPosts} of ${overview.totalPostsGenerated} posts published`,
          icon: <CheckCircleOutlined />,
          color: publishRate > 70 ? '#52c41a' : publishRate > 40 ? '#faad14' : '#ff4d4f',
        })
      }
    }

    // Engagement metrics
    if (overview.totalEngagement && overview.totalEngagement > 0 && overview.publishedPosts && overview.publishedPosts > 0) {
      const avgEngagement = overview.totalEngagement / overview.publishedPosts
      insights.push({
        title: 'Avg Engagement',
        value: Math.round(avgEngagement).toLocaleString(),
        trend: 'stable',
        percentage: 0,
        description: `${overview.totalEngagement.toLocaleString()} total engagement across ${overview.publishedPosts} published posts`,
        icon: <HeartOutlined />,
        color: '#ff4d4f',
      })
    }

    // Campaign activity
    if (overview.totalCampaigns > 0) {
      const activeCampaigns = breakdown.campaignsByStatus?.['active'] || 0
      insights.push({
        title: 'Active Campaigns',
        value: activeCampaigns,
        trend: activeCampaigns > 0 ? 'up' : 'stable',
        percentage: activeCampaigns,
        description: `${activeCampaigns} of ${overview.totalCampaigns} campaigns currently active`,
        icon: <FundProjectionScreenOutlined />,
        color: activeCampaigns > 0 ? '#52c41a' : '#1890ff',
      })
    }

    // Scheduling efficiency
    if (overview.totalCalendarItems > 0 && overview.totalPostsGenerated > 0) {
      const schedulingRate = (overview.totalCalendarItems / overview.totalPostsGenerated) * 100
      insights.push({
        title: 'Scheduling Rate',
        value: `${schedulingRate.toFixed(1)}%`,
        trend: schedulingRate > 60 ? 'up' : 'stable',
        percentage: schedulingRate,
        description: `${overview.totalCalendarItems} posts scheduled out of ${overview.totalPostsGenerated} created`,
        icon: <CalendarOutlined />,
        color: schedulingRate > 60 ? '#52c41a' : '#1890ff',
      })
    }

    // Event activity
    if (timeSeries.events && timeSeries.events.length > 0) {
      const eventGrowth = calculateGrowthRate(timeSeries.events)
      const recentEvents = timeSeries.events.slice(-7).reduce((sum, item) => sum + (item.count || 0), 0)
      const totalEvents = overview.totalEvents || 0
      insights.push({
        title: 'Event Activity',
        value: recentEvents > 0 ? recentEvents : totalEvents,
        trend: eventGrowth > 10 ? 'up' : eventGrowth < -10 ? 'down' : 'stable',
        percentage: Math.abs(eventGrowth) || 0,
        description: recentEvents > 0
          ? eventGrowth > 10
            ? `${recentEvents} events in last 7 days (${Math.abs(eventGrowth).toFixed(1)}% growth)`
            : `${recentEvents} events created in last 7 days`
          : totalEvents > 0
            ? `${totalEvents} total events created`
            : 'No events yet',
        icon: <FundProjectionScreenOutlined />,
        color: eventGrowth > 10 ? '#52c41a' : eventGrowth < -10 ? '#ff4d4f' : '#1890ff',
      })
    } else if (overview.totalEvents > 0) {
      // Show total events even if time series is empty
      insights.push({
        title: 'Event Activity',
        value: overview.totalEvents,
        trend: 'stable',
        percentage: 0,
        description: `${overview.totalEvents} total events created`,
        icon: <FundProjectionScreenOutlined />,
        color: '#1890ff',
      })
    }

    // Chat activity
    if (overview.totalConversations > 0) {
      insights.push({
        title: 'Chat Activity',
        value: overview.totalConversations,
        trend: 'stable',
        percentage: 0,
        description: `${overview.totalConversations} chat sessions with AI assistant`,
        icon: <MessageOutlined />,
        color: '#1890ff',
      })
    }

    // Calendar utilization
    if (timeSeries.calendarItems && timeSeries.calendarItems.length > 0) {
      const calendarGrowth = calculateGrowthRate(timeSeries.calendarItems)
      const recentCalendarItems = timeSeries.calendarItems.slice(-7).reduce((sum, item) => sum + item.count, 0)
      const avgDailyCalendar = recentCalendarItems / 7 || 0
      insights.push({
        title: 'Scheduling Activity',
        value: `${avgDailyCalendar.toFixed(1)}/day`,
        trend: calendarGrowth > 10 ? 'up' : calendarGrowth < -10 ? 'down' : 'stable',
        percentage: Math.abs(calendarGrowth),
        description: calendarGrowth > 10
          ? `Scheduling ${Math.abs(calendarGrowth).toFixed(1)}% more posts to calendar`
          : `Scheduling ${overview.totalCalendarItems} posts in your calendar`,
        icon: <CalendarOutlined />,
        color: calendarGrowth > 10 ? '#52c41a' : '#1890ff',
      })
    }

    return insights
  }

  const insights = calculateInsights()

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarDrawerOpen(!sidebarDrawerOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const handleSectionSelect = (section: AnalyticsSection) => {
    setSelectedSection(section)
    if (isMobile) {
      setSidebarDrawerOpen(false)
    }
  }

  return (
    <Layout className={`${styles.dashboard} ${styles.dashboardLight}`} style={{ minHeight: '100vh' }}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Layout className={styles.dashboardLayout}>
        {/* Analytics Sidebar */}
        {isLoggedIn && !isMobile && (
          <Sider
            width={280}
            collapsedWidth={isTablet ? 0 : 80}
            collapsed={sidebarCollapsed || false}
            theme="light"
            trigger={null}
            breakpoint="lg"
            className={styles.sider}
            style={{
              position: 'sticky',
              top: 99,
              height: 'calc(100vh - 99px)',
              overflow: 'auto',
            }}
          >
            <AnalyticsSidebar
              collapsed={sidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
              selectedSection={selectedSection}
              onSectionSelect={handleSectionSelect}
            />
          </Sider>
        )}
        {isLoggedIn && isMobile && (
          <Drawer
            title="Navigation"
            placement="left"
            onClose={() => setSidebarDrawerOpen(false)}
            open={sidebarDrawerOpen}
            width={280}
            className={styles.sidebarDrawer}
          >
            <AnalyticsSidebar
              collapsed={false}
              onToggleSidebar={() => setSidebarDrawerOpen(false)}
              selectedSection={selectedSection}
              onSectionSelect={handleSectionSelect}
            />
          </Drawer>
        )}
        <Content
          id="analytics-content"
          className={`${styles.content} ${styles.contentLight}`}
          style={{
            padding: isMobile ? '16px 0' : '32px 0',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 99px)',
            overflow: 'auto',
            flex: '1 1 auto',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Unified Container for all content - ensures left alignment */}
          <div
            style={{
              width: '100%',
              maxWidth: 1200,
              margin: '0 auto',
              paddingLeft: isMobile ? 16 : screens.xl ? 32 : 24,
              paddingRight: isMobile ? 16 : screens.xl ? 32 : 24,
            }}
          >
            {/* Global Header Section - Matching Social Dashboard Style */}
            <div
              style={{
                marginTop: isMobile ? 16 : 24,
                marginBottom: isMobile ? 8 : 12,
              }}
            >
              <Row
                gutter={[16, 16]}
                align="middle"
                justify="space-between"
                style={{ width: '100%' }}
              >
                <Col
                  xs={24}
                  sm={24}
                  md={16}
                  lg={18}
                >
                  {isMobile && (
                    <Button
                      icon={<BarChartOutlined />}
                      onClick={() => setSidebarDrawerOpen(true)}
                      style={{
                        marginBottom: 16,
                        border: '1px solid #d9d9d9',
                        background: '#fff',
                        color: '#595959'
                      }}
                    />
                  )}
                  <Text
                    type="secondary"
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      display: 'block',
                      lineHeight: 1.5,
                    }}
                  >
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </Text>
                </Col>
                <Col xs={24} sm={24} md={8} lg={6}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: isMobile ? 'flex-start' : 'flex-end',
                      gap: 16,
                      alignItems: isMobile ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                      loading={refreshing}
                      size={isMobile ? 'middle' : undefined}
                      style={{
                        width: 150,
                        height: 44,
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        color: '#595959',
                      }}
                    >
                      Refresh
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Section 1: Overview & Insights - Redesigned */}
            <div id="overview-stats" style={{ scrollMarginTop: '100px', paddingTop: '0px', marginBottom: 48 }}>
              <div style={{
                marginBottom: 32,
                paddingBottom: 20,
                borderBottom: '3px solid #e8e8e8'
              }}>
                <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
                  <DashboardOutlined style={{ marginRight: 12, color: '#1890ff', fontSize: 28 }} />
                  Content Performance Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: 15, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                  Comprehensive insights into your content creation, engagement, and productivity metrics
                </Text>
              </div>

              {/* KPI Section with Best Times - Wrapped for Demo */}
              <div data-demo-id="analytics-kpi-cards">
                {/* Core KPI Metrics - 4 Main Metrics */}
                <div style={{ marginBottom: 40 }}>
                  <Title level={4} style={{ marginBottom: 20, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                    Key Performance Indicators
                  </Title>
                <Row gutter={[20, 20]}>
                  {/* 1. TOTAL POSTS */}
                  {overview.totalPosts && (
                    <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 16,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                          color: '#fff',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          height: '100%'
                        }}
                        bodyStyle={{ padding: '24px' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, display: 'block', marginBottom: 12, fontWeight: 500, letterSpacing: '0.5px' }}>
                            TOTAL POSTS
                          </Text>
                          <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                            {overview.totalPosts.total.toLocaleString()}
                          </Title>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginTop: 8 }}>
                            {overview.totalPosts.publishedText}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  )}

                  {/* 2. SCHEDULED ITEMS */}
                  {overview.scheduledItems && (
                    <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 16,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
                          color: '#fff',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          height: '100%'
                        }}
                        bodyStyle={{ padding: '24px' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, display: 'block', marginBottom: 12, fontWeight: 500, letterSpacing: '0.5px' }}>
                            SCHEDULED ITEMS
                          </Text>
                          <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                            {overview.scheduledItems.total.toLocaleString()}
                          </Title>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginTop: 8 }}>
                            {overview.scheduledItems.scheduledPct}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  )}

                  {/* 3. AI CONTENT UTILIZATION */}
                  {overview.aiContentUtilization && (
                    <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 16,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                          color: '#fff',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          height: '100%'
                        }}
                        bodyStyle={{ padding: '24px' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, display: 'block', marginBottom: 12, fontWeight: 500, letterSpacing: '0.5px' }}>
                            AI CONTENT
                          </Text>
                          <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                            {overview.aiContentUtilization.total.toLocaleString()}
                          </Title>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginTop: 8 }}>
                            {overview.aiContentUtilization.usagePct}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  )}

                  {/* 4. TOTAL AI WORDS */}
                  {overview.totalAIWords !== undefined && (
                    <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 16,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                          color: '#fff',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          height: '100%'
                        }}
                        bodyStyle={{ padding: '24px' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, display: 'block', marginBottom: 12, fontWeight: 500, letterSpacing: '0.5px' }}>
                            TOTAL AI WORDS
                          </Text>
                          <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                            {overview.totalAIWords.toLocaleString()}
                          </Title>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginTop: 8 }}>
                            Generated by AI
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  )}
                </Row>

                  {/* Best Posting Times */}
                  {overview.bestPostingTimes && (
                    <Card
                      data-demo-id="analytics-best-time"
                      style={{
                        marginTop: 24,
                        borderRadius: 16,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
                        <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#262626' }}>
                          💡 Best Times to Post
                        </Title>
                      </div>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <Text strong style={{ color: '#1890ff', fontSize: 13, display: 'block', marginBottom: 4 }}>Instagram</Text>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{overview.bestPostingTimes.instagram}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <Text strong style={{ color: '#fa8c16', fontSize: 13, display: 'block', marginBottom: 4 }}>Facebook</Text>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{overview.bestPostingTimes.facebook}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <Text strong style={{ color: '#722ed1', fontSize: 13, display: 'block', marginBottom: 4 }}>Twitter</Text>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{overview.bestPostingTimes.twitter}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <Text strong style={{ color: '#52c41a', fontSize: 13, display: 'block', marginBottom: 4 }}>Overall Best</Text>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{overview.bestPostingTimes.overall}</Text>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  )}
                </div>
              </div>

              {/* Next 7 Days - Upcoming Content */}
              {overview.next7Days && overview.next7Days.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <Title level={4} style={{ marginBottom: 20, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                    Next 7 Days - Upcoming Content
                  </Title>
                  <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Row gutter={[16, 16]}>
                      {overview.next7Days.slice(0, 7).map((item, idx) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                          <div style={{
                            padding: 16,
                            background: '#fafafa',
                            borderRadius: 12,
                            border: '1px solid #e8e8e8'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Tag color={item.status === 'scheduled' ? 'blue' : 'default'}>
                                {item.status}
                              </Tag>
                              <Tag>{item.platform}</Tag>
                            </div>
                            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                              {item.title}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                              {new Date(item.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                ...(item.time ? { hour: 'numeric', minute: '2-digit' } : {})
                              })}
                              {item.time && ` • ${item.time}`}
                            </Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </div>
              )}

              {/* Drafts vs Live - Content Library Status */}
              {breakdown.calendarItemsByStatus && (
                <div style={{ marginBottom: 40 }}>
                  <Title level={4} style={{ marginBottom: 20, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                    Content Library Status
                  </Title>
                  <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={12}>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Draft', value: breakdown.calendarItemsByStatus?.draft || 0 },
                                { name: 'Scheduled', value: breakdown.calendarItemsByStatus?.scheduled || 0 },
                                { name: 'Published', value: breakdown.calendarItemsByStatus?.published || 0 },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => {
                                const total = (breakdown.calendarItemsByStatus?.draft || 0) +
                                  (breakdown.calendarItemsByStatus?.scheduled || 0) +
                                  (breakdown.calendarItemsByStatus?.published || 0)
                                if (total === 0) return ''
                                const percent = ((entry.value / total) * 100).toFixed(0)
                                return `${entry.name}: ${percent}%`
                              }}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell key="draft" fill="#faad14" />
                              <Cell key="scheduled" fill="#1890ff" />
                              <Cell key="published" fill="#52c41a" />
                            </Pie>
                            <Tooltip formatter={(value: number | undefined) => [value || 0, 'Items']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Col>
                      <Col xs={24} md={12}>
                        <div style={{ padding: 20, height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 4, background: '#faad14' }} />
                                <Text strong style={{ fontSize: 16 }}>Draft</Text>
                              </div>
                              <Text strong style={{ fontSize: 18, color: '#faad14' }}>
                                {breakdown.calendarItemsByStatus?.draft || 0}
                              </Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 4, background: '#1890ff' }} />
                                <Text strong style={{ fontSize: 16 }}>Scheduled</Text>
                              </div>
                              <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                                {breakdown.calendarItemsByStatus?.scheduled || 0}
                              </Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 4, background: '#52c41a' }} />
                                <Text strong style={{ fontSize: 16 }}>Published</Text>
                              </div>
                              <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                                {breakdown.calendarItemsByStatus?.published || 0}
                              </Text>
                            </div>
                            <div style={{
                              marginTop: 16,
                              paddingTop: 16,
                              borderTop: '1px solid #f0f0f0'
                            }}>
                              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                                Total Items
                              </Text>
                              <Text style={{ fontSize: 24, fontWeight: 700, color: '#262626' }}>
                                {(breakdown.calendarItemsByStatus?.draft || 0) +
                                  (breakdown.calendarItemsByStatus?.scheduled || 0) +
                                  (breakdown.calendarItemsByStatus?.published || 0)}
                              </Text>
                            </div>
                          </Space>
                        </div>
                      </Col>
                    </Row>
                    <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, color: '#595959' }}>
                        💡 This shows your content library: items in <strong>draft</strong> (building your library), <strong>scheduled</strong> (ready to go), and <strong>published</strong> (live content).
                      </Text>
                    </div>
                  </Card>
                </div>
              )}

            </div>

            {/* Key Insights Section */}
            <div id="key-insights" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 48, marginBottom: 48 }}>
              <div style={{
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '2px solid #f0f0f0'
              }}>
                <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                  <ThunderboltOutlined style={{ marginRight: 12, color: '#722ed1' }} />
                  Key Insights & Trends
                </Title>
                <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                  Important metrics and trends for your content strategy
                </Text>
              </div>
              {insights.length > 0 && (
                <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                  {insights.map((insight, index) => {
                    const getGradient = () => {
                      if (insight.trend === 'up') {
                        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      } else if (insight.trend === 'down') {
                        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      } else {
                        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                      }
                    }

                    return (
                      <Col xs={24} sm={12} md={12} lg={8} xl={6} key={index}>
                        <Card
                          hoverable
                          style={{
                            borderRadius: 16,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            background: getGradient(),
                            color: '#fff',
                            height: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          bodyStyle={{ padding: '24px' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                              <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 10,
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {insight.icon}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {insight.trend === 'up' && (
                                  <Tag
                                    color="success"
                                    style={{
                                      margin: 0,
                                      background: 'rgba(255,255,255,0.2)',
                                      border: 'none',
                                      color: '#fff'
                                    }}
                                  >
                                    <ArrowUpOutlined /> {insight.percentage > 0 ? `${insight.percentage.toFixed(1)}%` : ''}
                                  </Tag>
                                )}
                                {insight.trend === 'down' && (
                                  <Tag
                                    color="error"
                                    style={{
                                      margin: 0,
                                      background: 'rgba(255,255,255,0.2)',
                                      border: 'none',
                                      color: '#fff'
                                    }}
                                  >
                                    <ArrowDownOutlined /> {insight.percentage > 0 ? `${insight.percentage.toFixed(1)}%` : ''}
                                  </Tag>
                                )}
                                {insight.trend === 'stable' && (
                                  <Tag
                                    color="default"
                                    style={{
                                      margin: 0,
                                      background: 'rgba(255,255,255,0.2)',
                                      border: 'none',
                                      color: '#fff'
                                    }}
                                  >
                                    Stable
                                  </Tag>
                                )}
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <Text style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: 13,
                                display: 'block',
                                marginBottom: 8,
                                fontWeight: 500
                              }}>
                                {insight.title}
                              </Text>
                              <Title level={2} style={{
                                color: '#fff',
                                margin: 0,
                                fontSize: 28,
                                fontWeight: 700,
                                lineHeight: 1.2,
                                fontVariantNumeric: 'normal'
                              }}>
                                {typeof insight.value === 'number'
                                  ? insight.value.toLocaleString('en-US', {
                                    style: 'decimal',
                                    useGrouping: true,
                                    maximumFractionDigits: 0
                                  })
                                  : typeof insight.value === 'string'
                                    ? insight.value
                                    : String(insight.value)}
                              </Title>
                              <Text style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: 12,
                                display: 'block',
                                marginTop: 12,
                                lineHeight: 1.5
                              }}>
                                {insight.description}
                              </Text>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              )}
            </div>

            {/* Section 2: Detailed Analytics */}
            <div id="time-series" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 48, marginBottom: 48 }}>
              <div style={{
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '2px solid #f0f0f0'
              }}>
                <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                  <LineChartOutlined style={{ marginRight: 12, color: '#eb2f96' }} />
                  Activity Trends
                </Title>
                <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                  See how your content creation and scheduling activity has changed over time
                </Text>
              </div>
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={24} lg={8}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: '16px' }}
                    title={
                      <Space>
                        <FileTextOutlined style={{ color: '#eb2f96' }} />
                        <span style={{ fontWeight: 600 }}>Posts Created Over Time</span>
                      </Space>
                    }
                  >
                    {timeSeries.posts.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={prepareCumulativeData(timeSeries.posts)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} stroke="#d9d9d9" />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#666' }}
                            label={{ value: 'Posts', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                            stroke="#d9d9d9"
                          />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8e8e8' }} />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#eb2f96"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#eb2f96' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>No data</Text>
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={24} lg={8}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: '16px' }}
                    title={
                      <Space>
                        <LinkedinOutlined style={{ color: '#0077B5' }} />
                        <span style={{ fontWeight: 600 }}>LinkedIn Posts</span>
                      </Space>
                    }
                  >
                    {timeSeries.linkedInPosts && timeSeries.linkedInPosts.length > 0 ? (
                      (() => {
                        const chartData = prepareCumulativeData(timeSeries.linkedInPosts)
                        const validData = chartData.filter(item => typeof item.count === 'number' && !isNaN(item.count))

                        if (validData.length === 0) {
                          return (
                            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Text type="secondary" style={{ fontSize: 13 }}>No chart data available</Text>
                            </div>
                          )
                        }

                        return (
                          <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={validData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#666' }}
                                angle={validData.length > 5 ? -45 : 0}
                                textAnchor={validData.length > 5 ? "end" : "middle"}
                                height={validData.length > 5 ? 70 : 30}
                                stroke="#d9d9d9"
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#666' }}
                                label={{ value: 'Posts', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                                allowDecimals={false}
                                domain={[0, 'auto']}
                                stroke="#d9d9d9"
                              />
                              <Tooltip
                                contentStyle={{ borderRadius: 8, border: '1px solid #e8e8e8' }}
                                formatter={(value: number | undefined) => [value || 0, 'Cumulative Posts']}
                                labelFormatter={(label) => `Date: ${label}`}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#0077B5"
                                strokeWidth={3}
                                dot={{ r: validData.length <= 10 ? 4 : 2, fill: '#0077B5' }}
                                activeDot={{ r: 6 }}
                                isAnimationActive={true}
                                connectNulls={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )
                      })()
                    ) : (
                      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {timeSeries.linkedInPosts ? 'No LinkedIn posts data' : 'Loading...'}
                        </Text>
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={24} lg={8}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: '16px' }}
                    title={
                      <Space>
                        <RobotOutlined style={{ color: '#13c2c2' }} />
                        <span style={{ fontWeight: 600 }}>AI Content Generated</span>
                      </Space>
                    }
                  >
                    {timeSeries.aiContent.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={prepareCumulativeData(timeSeries.aiContent)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} stroke="#d9d9d9" />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#666' }}
                            label={{ value: 'AI Content', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                            stroke="#d9d9d9"
                          />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8e8e8' }} />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#13c2c2"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#13c2c2' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>No data</Text>
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={24} lg={8}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: '16px' }}
                    title={
                      <Space>
                        <MessageOutlined style={{ color: '#722ed1' }} />
                        <span style={{ fontWeight: 600 }}>Chat Sessions</span>
                      </Space>
                    }
                  >
                    {timeSeries.conversations.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={prepareCumulativeData(timeSeries.conversations)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} stroke="#d9d9d9" />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#666' }}
                            label={{ value: 'Conversations', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                            stroke="#d9d9d9"
                          />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8e8e8' }} />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#722ed1"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#722ed1' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>No data</Text>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Content Breakdown - Unified Design */}
            <div id="breakdown" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 48, marginBottom: 48 }}>
              <div style={{
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '2px solid #f0f0f0'
              }}>
                <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                  <BarChartOutlined style={{ marginRight: 12, color: '#52c41a' }} />
                  Data Breakdown
                </Title>
                <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                  Distribution of your content across platforms, statuses, calendar items, campaigns, and AI content types
                </Text>
              </div>

              {/* Posts by Platform */}
              {Object.keys(breakdown.postsByPlatform).length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <Title level={4} style={{ marginBottom: 16 }}>Posts by Platform</Title>
                  <Row gutter={[16, 16]}>
                    {Object.entries(breakdown.postsByPlatform)
                      .sort(([, a], [, b]) => b - a)
                      .map(([platform, count]) => {
                        const totalPlatformPosts = Object.values(breakdown.postsByPlatform).reduce((sum, c) => sum + c, 0)
                        const percentage = totalPlatformPosts > 0 ? Math.round((count / totalPlatformPosts) * 100) : 0

                        const platformConfig: Record<string, { gradient: string; icon: React.ReactNode }> = {
                          linkedin: {
                            gradient: 'linear-gradient(135deg, #0077b5 0%, #00a0dc 100%)',
                            icon: <LinkedinOutlined style={{ fontSize: 20 }} />
                          },
                          twitter: {
                            gradient: 'linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%)',
                            icon: <GlobalOutlined style={{ fontSize: 20 }} />
                          },
                          instagram: {
                            gradient: 'linear-gradient(135deg, #e1306c 0%, #fd1d1d 100%)',
                            icon: <PictureOutlined style={{ fontSize: 20 }} />
                          },
                          facebook: {
                            gradient: 'linear-gradient(135deg, #1877f2 0%, #0c63d4 100%)',
                            icon: <GlobalOutlined style={{ fontSize: 20 }} />
                          },
                        }
                        const config = platformConfig[platform.toLowerCase()] || {
                          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          icon: <GlobalOutlined style={{ fontSize: 20 }} />
                        }
                        const hasData = count > 0

                        return (
                          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={`platform-${platform}`}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                background: hasData ? config.gradient : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                color: hasData ? '#fff' : '#333',
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                              bodyStyle={{ padding: '24px' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      color: hasData ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.45)',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      {config.icon}
                                    </div>
                                    <div>
                                      <Text strong style={{
                                        fontSize: 15,
                                        color: hasData ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.65)',
                                        display: 'block',
                                        marginBottom: 4,
                                        textTransform: 'capitalize'
                                      }}>
                                        {platform}
                                      </Text>
                                      <Text style={{
                                        fontSize: 13,
                                        color: hasData ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)'
                                      }}>
                                        {percentage}% of posts
                                      </Text>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                  <Title level={2} style={{
                                    color: hasData ? '#fff' : '#333',
                                    margin: 0,
                                    fontSize: 32,
                                    fontWeight: 700
                                  }}>
                                    {count}
                                  </Title>
                                  <Text style={{
                                    fontSize: 12,
                                    color: hasData ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)',
                                    display: 'block',
                                    marginTop: 4
                                  }}>
                                    Posts
                                  </Text>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        )
                      })}
                  </Row>
                </div>
              )}


              {/* Calendar Items by Platform */}
              {breakdown.calendarItemsByPlatform && Object.keys(breakdown.calendarItemsByPlatform).length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <Title level={4} style={{ marginBottom: 16 }}>Scheduled Items by Platform</Title>
                  <Row gutter={[16, 16]}>
                    {Object.entries(breakdown.calendarItemsByPlatform)
                      .sort(([, a], [, b]) => b - a)
                      .map(([platform, count]) => {
                        const total = Object.values(breakdown.calendarItemsByPlatform || {}).reduce((sum, c) => sum + c, 0)
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0

                        return (
                          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={`calendar-platform-${platform}`}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: '#fff',
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                              bodyStyle={{ padding: '24px' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                              }}
                            >
                              <div style={{ marginBottom: 12 }}>
                                <Text strong style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize' }}>
                                  {platform}
                                </Text>
                                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: 4 }}>
                                  {percentage}% of scheduled
                                </Text>
                              </div>
                              <Title level={2} style={{ color: '#fff', margin: 0, fontSize: 32, fontWeight: 700 }}>
                                {count}
                              </Title>
                              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: 4 }}>
                                Scheduled Items
                              </Text>
                            </Card>
                          </Col>
                        )
                      })}
                  </Row>
                </div>
              )}

              {/* Campaigns by Status */}
              {breakdown.campaignsByStatus && Object.keys(breakdown.campaignsByStatus).length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <Title level={4} style={{ marginBottom: 16 }}>Campaigns by Status</Title>
                  <Row gutter={[16, 16]}>
                    {Object.entries(breakdown.campaignsByStatus)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, count]) => {
                        const statusColors: Record<string, string> = {
                          active: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                          completed: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                          draft: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                        }
                        const gradient = statusColors[status.toLowerCase()] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

                        return (
                          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={`campaign-status-${status}`}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                background: gradient,
                                color: '#fff',
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                              bodyStyle={{ padding: '24px' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                              }}
                            >
                              <div style={{ marginBottom: 12 }}>
                                <Text strong style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize' }}>
                                  {status}
                                </Text>
                              </div>
                              <Title level={2} style={{ color: '#fff', margin: 0, fontSize: 32, fontWeight: 700 }}>
                                {count}
                              </Title>
                              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: 4 }}>
                                Campaigns
                              </Text>
                            </Card>
                          </Col>
                        )
                      })}
                  </Row>
                </div>
              )}

              {/* AI Content by Type */}
              {Object.keys(breakdown.aiContentByType).length > 0 && (
                <div>
                  <Title level={4} style={{ marginBottom: 16 }}>AI Content by Type</Title>
                  <Row gutter={[16, 16]}>
                    {Object.entries(breakdown.aiContentByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => {
                        const typeLabels: Record<string, string> = {
                          text: 'Text',
                          image: 'Images',
                          content_plan: 'Plans',
                          suggestion: 'Suggestions',
                          summary: 'Summaries',
                          translation: 'Translations',
                        }
                        const label = typeLabels[type] || type
                        const totalAIContent = Object.values(breakdown.aiContentByType).reduce((sum, c) => sum + c, 0)
                        const percentage = totalAIContent > 0 ? Math.round((count / totalAIContent) * 100) : 0

                        const typeConfig: Record<string, { gradient: string; icon: React.ReactNode }> = {
                          text: {
                            gradient: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                            icon: <FileTextOutlined style={{ fontSize: 20 }} />
                          },
                          image: {
                            gradient: 'linear-gradient(135deg, #b37feb 0%, #d3adf7 100%)',
                            icon: <PictureOutlined style={{ fontSize: 20 }} />
                          },
                          content_plan: {
                            gradient: 'linear-gradient(135deg, #9254de 0%, #b37feb 100%)',
                            icon: <CalendarOutlined style={{ fontSize: 20 }} />
                          },
                          suggestion: {
                            gradient: 'linear-gradient(135deg, #d3adf7 0%, #efdbff 100%)',
                            icon: <BulbOutlined style={{ fontSize: 20 }} />
                          },
                          summary: {
                            gradient: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)',
                            icon: <FileTextOutlined style={{ fontSize: 20 }} />
                          },
                          translation: {
                            gradient: 'linear-gradient(135deg, #b37feb 0%, #d3adf7 100%)',
                            icon: <TranslationOutlined style={{ fontSize: 20 }} />
                          },
                        }
                        const config = typeConfig[type] || {
                          gradient: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                          icon: <RobotOutlined style={{ fontSize: 20 }} />
                        }
                        const hasData = count > 0

                        return (
                          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={`type-${type}`}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                background: hasData ? config.gradient : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                color: hasData ? '#fff' : '#333',
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                              bodyStyle={{ padding: '24px' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      color: hasData ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.45)',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      {config.icon}
                                    </div>
                                    <div>
                                      <Text strong style={{
                                        fontSize: 15,
                                        color: hasData ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.65)',
                                        display: 'block',
                                        marginBottom: 4
                                      }}>
                                        {label}
                                      </Text>
                                      <Text style={{
                                        fontSize: 13,
                                        color: hasData ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)'
                                      }}>
                                        {percentage}% of AI content
                                      </Text>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                  <Title level={2} style={{
                                    color: hasData ? '#fff' : '#333',
                                    margin: 0,
                                    fontSize: 32,
                                    fontWeight: 700
                                  }}>
                                    {count}
                                  </Title>
                                  <Text style={{
                                    fontSize: 12,
                                    color: hasData ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)',
                                    display: 'block',
                                    marginTop: 4
                                  }}>
                                    AI Content
                                  </Text>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        )
                      })}
                  </Row>
                </div>
              )}
            </div>

            {/* Advanced Analytics - Operational Health & Strategic Insights */}
            {analytics.advancedAnalytics && (
              <div id="advanced-analytics" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 48, marginBottom: 48 }}>
                <div style={{
                  marginBottom: 32,
                  paddingBottom: 20,
                  borderBottom: '3px solid #e8e8e8'
                }}>
                  <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
                    <ThunderboltOutlined style={{ marginRight: 12, color: '#722ed1', fontSize: 28 }} />
                    Advanced Analytics & Strategic Insights
                  </Title>
                  <Text type="secondary" style={{ fontSize: 15, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                    Deep insights into operational health, AI efficiency, platform strategy, and content performance
                  </Text>
                </div>

                {/* 1. Content Velocity Funnel */}
                <div style={{ marginBottom: 48 }}>
                  <Title level={4} style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                    1. Content Velocity Funnel
                  </Title>
                  <div style={{
                    marginBottom: 16,
                    padding: 12,
                    background: '#e6f7ff',
                    borderRadius: 8,
                    border: '1px solid #91d5ff'
                  }}>
                    <Text style={{ fontSize: 12, color: '#1890ff' }}>
                      <strong>Calculation:</strong> Ideation = Total conversations (melo.conversations), Planning = Calendar items with status 'draft' (melo.calendaritems), Live = Published posts (melo.socialmediaposts with status 'published'). Conversion Rate = (Live / Ideation) × 100.
                    </Text>
                  </div>
                  <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={16}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                          {/* Funnel Visualization */}
                          <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {['ideation', 'planning', 'live'].map((stage, idx) => {
                              const funnel = analytics.advancedAnalytics?.contentVelocityFunnel
                              if (!funnel) return null
                              const value = funnel[stage as keyof typeof funnel] as number
                              const maxValue = Math.max(
                                funnel.ideation,
                                funnel.planning,
                                funnel.live
                              )
                              // Traditional funnel: each stage is narrower than the previous
                              const baseWidth = 100
                              const funnelWidth = baseWidth - (idx * 15) // Each stage 15% narrower
                              const actualWidth = maxValue > 0 ? (value / maxValue) * funnelWidth : 0
                              const colors = ['#1890ff', '#52c41a', '#fa8c16']
                              const labels = { ideation: 'Ideation', planning: 'Planning', live: 'Live' }

                              return (
                                <div key={stage} style={{ marginBottom: idx < 2 ? 8 : 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, width: '100%', maxWidth: `${funnelWidth}%` }}>
                                    <Text strong style={{ fontSize: 14, textTransform: 'capitalize' }}>
                                      {labels[stage as keyof typeof labels]}
                                    </Text>
                                    <Text strong style={{ fontSize: 16, color: colors[idx] }}>
                                      {value}
                                    </Text>
                                  </div>
                                  <div style={{
                                    width: `${funnelWidth}%`,
                                    height: 50,
                                    background: '#f0f0f0',
                                    borderRadius: idx === 0 ? '8px 8px 0 0' : idx === 2 ? '0 0 8px 8px' : '0',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    clipPath: idx < 2 ? `polygon(0 0, 100% 0, ${100 - 7.5}% 100%, ${7.5}% 100%)` : undefined
                                  }}>
                                    <div style={{
                                      width: `${actualWidth}%`,
                                      height: '100%',
                                      background: `linear-gradient(135deg, ${colors[idx]} 0%, ${colors[idx]}dd 100%)`,
                                      borderRadius: idx === 0 ? '8px 8px 0 0' : idx === 2 ? '0 0 8px 8px' : '0',
                                      transition: 'width 0.5s ease',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#fff',
                                      fontWeight: 600,
                                      minWidth: actualWidth > 0 ? '40px' : '0'
                                    }}>
                                      {actualWidth > 15 && value}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} lg={8}>
                        <div style={{ padding: 20, background: '#f0f2f5', borderRadius: 12 }}>
                          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
                            Conversion Metrics
                          </Text>
                          <div style={{ marginBottom: 12 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>Ideation → Live Rate</Text>
                            <Text strong style={{ fontSize: 24, display: 'block', color: '#1890ff' }}>
                              {analytics.advancedAnalytics.contentVelocityFunnel.conversionRate.toFixed(1)}%
                            </Text>
                          </div>
                          {analytics.advancedAnalytics.contentVelocityFunnel.insight && (
                            <div style={{
                              padding: 12,
                              background: '#fff3cd',
                              borderRadius: 8,
                              border: '1px solid #ffc53d',
                              marginTop: 16
                            }}>
                              <Text style={{ fontSize: 13, color: '#d48806' }}>
                                💡 {analytics.advancedAnalytics.contentVelocityFunnel.insight}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </div>

                {/* 2. AI Efficiency & ROI */}
                {analytics.advancedAnalytics.aiEfficiency && (
                  <div style={{ marginBottom: 48 }}>
                    <Title level={4} style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                      2. AI Efficiency & ROI
                    </Title>
                    <div style={{
                      marginBottom: 16,
                      padding: 12,
                      background: '#e6f7ff',
                      borderRadius: 8,
                      border: '1px solid #91d5ff'
                    }}>
                      <Text style={{ fontSize: 12, color: '#1890ff' }}>
                        <strong>Calculation:</strong> Processing time from melo.aigeneratedcontents (processingTime in milliseconds). Human benchmark = 1800 seconds (30 minutes) per post. Time Saved = (30 min × Total AI Posts) - Sum(processingTime). Efficiency Ratio = Human Time Total / AI Processing Time Total.
                      </Text>
                    </div>
                    <Row gutter={[20, 20]}>
                      <Col xs={24} sm={12} md={8}>
                        <Card
                          style={{
                            borderRadius: 16,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff'
                          }}
                        >
                          <Text style={{ fontSize: 13, opacity: 0.9, display: 'block', marginBottom: 8 }}>
                            TIME RECLAIMED
                          </Text>
                          <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 48, fontWeight: 700 }}>
                            {analytics.advancedAnalytics.aiEfficiency.timeSavedHours}
                          </Title>
                          <Text style={{ fontSize: 14, opacity: 0.9, display: 'block', marginTop: 4 }}>
                            Hours Saved
                          </Text>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                          <Statistic
                            title="Efficiency Ratio"
                            value={analytics.advancedAnalytics.aiEfficiency.efficiencyRatio}
                            suffix="x"
                            valueStyle={{ fontSize: 32, fontWeight: 700, color: '#52c41a' }}
                          />
                          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                            {analytics.advancedAnalytics.aiEfficiency.totalAIPosts} AI posts generated
                          </Text>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                          <Statistic
                            title="Avg Processing Time"
                            value={Math.round(analytics.advancedAnalytics.aiEfficiency.avgProcessingTime / 1000)}
                            suffix="sec"
                            valueStyle={{ fontSize: 32, fontWeight: 700, color: '#1890ff' }}
                          />
                          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                            vs 30 min human benchmark
                          </Text>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* 3. Cross-Platform Strategy Mix */}
                <div style={{ marginBottom: 48 }}>
                  <Title level={4} style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                    3. Cross-Platform Strategy Mix
                  </Title>
                  <div style={{
                    marginBottom: 16,
                    padding: 12,
                    background: '#e6f7ff',
                    borderRadius: 8,
                    border: '1px solid #91d5ff'
                  }}>
                    <Text style={{ fontSize: 12, color: '#1890ff' }}>
                      <strong>Calculation:</strong> Planned = Count of calendar items by platform (melo.calendaritems grouped by platform). Published = Count of published posts by platform (melo.socialmediaposts with status 'published' grouped by platform). Gap = Planned - Published. Completion Rate = (Published / Planned) × 100.
                    </Text>
                  </div>
                  <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={analytics.advancedAnalytics.crossPlatformStrategy}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="platform"
                          tick={{ fontSize: 11, fill: '#666' }}
                          label={{ value: 'Platform', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#666' } }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#666' }}
                          label={{ value: 'Posts', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e8e8e8' }}
                          formatter={(value: number | undefined, name: string | undefined) => [value || 0, name === 'planned' ? 'Planned' : 'Published']}
                        />
                        <Legend />
                        <Bar dataKey="planned" fill="#1890ff" name="Planned" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="published" fill="#52c41a" name="Published" radius={[8, 8, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    {analytics.advancedAnalytics.crossPlatformStrategy.some(p => p.insight) && (
                      <div style={{ marginTop: 24, padding: 16, background: '#fff3cd', borderRadius: 8, border: '1px solid #ffc53d' }}>
                        {analytics.advancedAnalytics.crossPlatformStrategy
                          .filter(p => p.insight)
                          .map((p, idx) => (
                            <Text key={idx} style={{ fontSize: 13, color: '#d48806', display: 'block', marginBottom: 4 }}>
                              💡 {p.insight}
                            </Text>
                          ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* 4. Media Asset Utilization */}
                {analytics.advancedAnalytics.mediaUtilization && (
                  <div style={{ marginBottom: 48 }}>
                    <Title level={4} style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                      4. Media Asset Utilization
                    </Title>
                    <div style={{
                      marginBottom: 16,
                      padding: 12,
                      background: '#e6f7ff',
                      borderRadius: 8,
                      border: '1px solid #91d5ff'
                    }}>
                      <Text style={{ fontSize: 12, color: '#1890ff' }}>
                        <strong>Calculation:</strong> Total Assets = Count of all media files (melo.mediafiles). Used Assets = Count of posts with non-empty mediaAttachments array (melo.socialmediaposts where mediaAttachments[0].url exists). Utilization Rate = (Used Assets / Total Assets) × 100. Untapped Potential = Total Assets - Used Assets.
                      </Text>
                    </div>
                    <Row gutter={[20, 20]}>
                      <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Used', value: analytics.advancedAnalytics.mediaUtilization.usedAssets },
                                  { name: 'Untapped Potential', value: analytics.advancedAnalytics.mediaUtilization.unusedAssets },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(props: any) => {
                                  const { name, percent } = props
                                  return `${name || 'Unknown'}: ${((percent || 0) * 100).toFixed(0)}%`
                                }}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#52c41a" />
                                <Cell fill="#ffc53d" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card>
                      </Col>
                      <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                          <div style={{ padding: 20 }}>
                            <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 16 }}>
                              Asset Statistics
                            </Text>
                            <div style={{ marginBottom: 12 }}>
                              <Text type="secondary" style={{ fontSize: 13 }}>Total Assets</Text>
                              <Text strong style={{ fontSize: 24, display: 'block', color: '#1890ff' }}>
                                {analytics.advancedAnalytics.mediaUtilization.totalAssets}
                              </Text>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <Text type="secondary" style={{ fontSize: 13 }}>Used Assets</Text>
                              <Text strong style={{ fontSize: 24, display: 'block', color: '#52c41a' }}>
                                {analytics.advancedAnalytics.mediaUtilization.usedAssets}
                              </Text>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <Text type="secondary" style={{ fontSize: 13 }}>Untapped Potential</Text>
                              <Text strong style={{ fontSize: 24, display: 'block', color: '#faad14' }}>
                                {analytics.advancedAnalytics.mediaUtilization.unusedAssets}
                              </Text>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <Text type="secondary" style={{ fontSize: 13 }}>Utilization Rate</Text>
                              <Text strong style={{ fontSize: 24, display: 'block', color: '#722ed1' }}>
                                {analytics.advancedAnalytics.mediaUtilization.utilizationRate}%
                              </Text>
                            </div>
                            {analytics.advancedAnalytics.mediaUtilization.insight && (
                              <div style={{
                                padding: 12,
                                background: '#fff3cd',
                                borderRadius: 8,
                                border: '1px solid #ffc53d',
                                marginTop: 16
                              }}>
                                <Text style={{ fontSize: 13, color: '#d48806' }}>
                                  💡 {analytics.advancedAnalytics.mediaUtilization.insight}
                                </Text>
                              </div>
                            )}
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* 5. Content DNA (Thematic Analysis) */}
                <div style={{ marginBottom: 48 }}>
                  <Title level={4} style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#262626' }}>
                    5. Content DNA (Thematic Analysis)
                  </Title>
                  <div style={{
                    marginBottom: 16,
                    padding: 12,
                    background: '#e6f7ff',
                    borderRadius: 8,
                    border: '1px solid #91d5ff'
                  }}>
                    <Text style={{ fontSize: 12, color: '#1890ff' }}>
                      <strong>Calculation:</strong> Hashtags extracted from content fields in melo.calendaritems and melo.socialmediaposts using regex pattern /#(\w+)/g. Frequency counted per hashtag (case-insensitive). Top 20 hashtags displayed by frequency. Tag size proportional to usage count.
                    </Text>
                  </div>
                  <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 20, minHeight: 200, alignItems: 'center', justifyContent: 'center' }}>
                      {analytics.advancedAnalytics?.contentDNA && analytics.advancedAnalytics.contentDNA.length > 0 ? (
                        (() => {
                          const contentDNA = analytics.advancedAnalytics!.contentDNA
                          return contentDNA.map((tag, idx) => {
                            const maxCount = Math.max(...contentDNA.map(t => t.count))
                            const size = maxCount > 0 ? 12 + (tag.count / maxCount) * 24 : 16
                            const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96']
                            const color = colors[idx % colors.length]

                            return (
                              <Tag
                                key={idx}
                                color={idx < 3 ? color : 'default'}
                                style={{
                                  fontSize: size,
                                  padding: '8px 16px',
                                  margin: 0,
                                  fontWeight: idx < 3 ? 600 : 400,
                                  borderRadius: 20,
                                  border: idx < 3 ? `2px solid ${color}` : undefined
                                }}
                              >
                                {tag.hashtag} ({tag.count})
                              </Tag>
                            )
                          })
                        })()
                      ) : (
                        <Empty description="No hashtags found in content" />
                      )}
                    </div>
                    {analytics.advancedAnalytics.contentDNA.length >= 2 && (
                      <div style={{ marginTop: 20, padding: 16, background: '#f0f2f5', borderRadius: 8 }}>
                        <Text style={{ fontSize: 13, color: '#666' }}>
                          <strong>Brand Perception:</strong> Your content is primarily associated with{' '}
                          <strong>{analytics.advancedAnalytics.contentDNA[0]?.hashtag}</strong> and{' '}
                          <strong>{analytics.advancedAnalytics.contentDNA[1]?.hashtag}</strong>, indicating your brand's thematic focus.
                        </Text>
                      </div>
                    )}
                  </Card>
                </div>

              </div>
            )}

            {/* Recent Activity - Detailed */}
            <div id="recent-activity" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 48, marginBottom: 48 }}>
              <div style={{
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '2px solid #f0f0f0'
              }}>
                <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                  <CalendarOutlined style={{ marginRight: 12, color: '#fa8c16' }} />
                  Recent Activity (Last 7 Days)
                </Title>
                <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                  Daily breakdown of your content creation and scheduling activity
                </Text>
              </div>
              {recentActivity.length > 0 && (
                <>
                  <Row gutter={[20, 20]}>
                    {recentActivity.map((activity) => {
                      const isToday = new Date(activity.date).toDateString() === new Date().toDateString()
                      const dayName = new Date(activity.date).toLocaleDateString('en-US', { weekday: 'short' })
                      const dateStr = new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                      const getGradient = () => {
                        if (isToday) {
                          return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        } else if (activity.total > 0) {
                          return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        } else {
                          return 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                        }
                      }

                      return (
                        <Col xs={24} sm={12} md={8} lg={6} xl={6} key={activity.date}>
                          <Card
                            hoverable
                            style={{
                              borderRadius: 16,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              background: getGradient(),
                              color: activity.total > 0 || isToday ? '#fff' : '#333',
                              height: '100%',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            bodyStyle={{ padding: '24px' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)'
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 10,
                                  background: 'rgba(255,255,255,0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <CalendarOutlined style={{ fontSize: 20 }} />
                                </div>
                                <Tag
                                  color={isToday ? 'success' : activity.total > 0 ? 'processing' : 'default'}
                                  style={{
                                    margin: 0,
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: activity.total > 0 || isToday ? '#fff' : '#999'
                                  }}
                                >
                                  {isToday ? 'Today' : dayName}
                                </Tag>
                              </div>
                              <div style={{ flex: 1 }}>
                                <Text style={{
                                  color: activity.total > 0 || isToday ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
                                  fontSize: 13,
                                  display: 'block',
                                  marginBottom: 8,
                                  fontWeight: 500
                                }}>
                                  {dateStr}
                                </Text>
                                <Title level={2} style={{
                                  color: activity.total > 0 || isToday ? '#fff' : '#333',
                                  margin: 0,
                                  fontSize: 32,
                                  fontWeight: 700,
                                  lineHeight: 1.2
                                }}>
                                  {activity.total || 0}
                                </Title>
                                <Text style={{
                                  color: activity.total > 0 || isToday ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                                  fontSize: 12,
                                  display: 'block',
                                  marginTop: 12,
                                  lineHeight: 1.5
                                }}>
                                  {activity.posts > 0 && `${activity.posts} posts`}
                                  {activity.posts > 0 && activity.events > 0 && ' • '}
                                  {activity.events > 0 && `${activity.events} events`}
                                  {!activity.posts && !activity.events && 'No activity'}
                                </Text>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                </>
              )}
              {recentActivity.length === 0 && (
                <Empty
                  description="No recent activity found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>

            {/* Best Time Analytics Sections */}
            {bestTimeLoading && selectedSection.startsWith('best-time') && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>Loading best time analytics...</Text>
                </div>
              </div>
            )}

            {/* Best Hours to Post */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'best-time-hours' && (
              <div id="best-time-hours" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ margin: 0 }}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Best Hours to Post (Global Benchmark)
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
                    Optimal posting hours per platform based on historical engagement data
                  </Text>
                  <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Platform:</Text>
                      <Select
                        value={selectedBestTimePlatform}
                        onChange={setSelectedBestTimePlatform}
                        style={{ width: 180 }}
                      >
                        <Select.Option value="all">All Platforms</Select.Option>
                        <Select.Option value="instagram">Instagram</Select.Option>
                        <Select.Option value="twitter">Twitter/X</Select.Option>
                        <Select.Option value="linkedin">LinkedIn</Select.Option>
                        <Select.Option value="facebook">Facebook</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Year:</Text>
                      <Select
                        value={selectedYear}
                        onChange={(value) => {
                          setSelectedYear(value)
                          setSelectedMonth(undefined) // Reset month when year changes
                        }}
                        placeholder="All Years"
                        allowClear
                        style={{ width: 120 }}
                      >
                        {availableYears.map(year => (
                          <Select.Option key={year} value={year}>{year}</Select.Option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Month:</Text>
                      <Select
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        placeholder="All Months"
                        allowClear
                        disabled={!selectedYear}
                        style={{ width: 150 }}
                      >
                        {availableMonths.map(month => {
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                          return (
                            <Select.Option key={month} value={month}>{monthNames[month - 1]}</Select.Option>
                          )
                        })}
                      </Select>
                    </div>
                  </div>
                </div>
                {bestTimeData.bestHours && Object.keys(bestTimeData.bestHours).length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {Object.entries(bestTimeData.bestHours).map(([platform, platformData]) => {
                      if (selectedBestTimePlatform !== 'all' && platform !== selectedBestTimePlatform) return null

                      const hours = platformData?.hours || (Array.isArray(platformData) ? platformData : [])
                      if (!Array.isArray(hours) || hours.length === 0) return null

                      const recommendation = platformData?.recommendation || null

                      const chartData = hours.map((h: any) => ({
                        hour: `${h.hour}:00`,
                        engagement: h.metrics?.avgEngagement || 0,
                        likes: h.metrics?.avgLikes || 0,
                        retweets: h.metrics?.avgRetweets || 0,
                      }))

                      return (
                        <Col xs={24} lg={12} key={platform}>
                          <Card
                            title={<span style={{ textTransform: 'capitalize' }}>{platform}</span>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          >
                            {recommendation && (
                              <div style={{
                                marginBottom: 16,
                                padding: 12,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 8,
                                color: 'white'
                              }}>
                                <Text strong style={{ color: 'white', fontSize: 14 }}>
                                  💡 Best Time to Post: {recommendation}
                                </Text>
                              </div>
                            )}
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="engagement" fill="#1890ff" name="Avg Engagement" />
                              </BarChart>
                            </ResponsiveContainer>
                            <div style={{ marginTop: 16 }}>
                              <Text strong>Top Hours:</Text>
                              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {(() => {
                                  // Format hour for display
                                  const formatHourDisplay = (hour: number) => {
                                    if (hour === 0) return '12am'
                                    if (hour < 12) return `${hour}am`
                                    if (hour === 12) return '12pm'
                                    return `${hour - 12}pm`
                                  }

                                  // Use topHoursByEngagement from backend if available (sorted by engagement)
                                  // Otherwise fall back to filtering hours array
                                  let hoursToShow: Array<{ hour: number; avgEngagement: number }> = []

                                  if (platformData?.topHoursByEngagement && Array.isArray(platformData.topHoursByEngagement)) {
                                    // Use backend-provided top hours sorted by engagement
                                    hoursToShow = platformData.topHoursByEngagement
                                  } else {
                                    // Fallback: Get topHours set from backend and filter hours array
                                    const topHoursSet = new Set(platformData?.topHours || [])
                                    const topHoursData = hours
                                      .filter((h: any) => topHoursSet.has(h.hour))
                                      .sort((a: any, b: any) => (b.metrics?.avgEngagement || 0) - (a.metrics?.avgEngagement || 0))
                                      .slice(0, 5)
                                      .map((h: any) => ({
                                        hour: h.hour,
                                        avgEngagement: h.metrics?.avgEngagement || 0
                                      }))

                                    hoursToShow = topHoursData
                                  }

                                  return hoursToShow.slice(0, 5).map((hourData, idx) => (
                                    <Tag key={idx} color={idx < 2 ? 'blue' : 'cyan'} style={{ fontSize: 12, padding: '4px 8px' }}>
                                      {formatHourDisplay(hourData.hour)} ({hourData.avgEngagement.toFixed(0)} avg engagement)
                                    </Tag>
                                  ))
                                })()}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Empty description="No best hours data available" />
                )}
              </div>
            )}

            {/* Best Time Analytics Sections */}
            {bestTimeLoading && selectedSection.startsWith('best-time') && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text>Loading best time analytics...</Text>
                </div>
              </div>
            )}

            {/* Best Hours to Post */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'best-time-hours' && (
              <div id="best-time-hours" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ margin: 0 }}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    Best Hours to Post (Global Benchmark)
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
                    Optimal posting hours per platform based on historical engagement data
                  </Text>
                  <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Platform:</Text>
                      <Select
                        value={selectedBestTimePlatform}
                        onChange={setSelectedBestTimePlatform}
                        style={{ width: 180 }}
                      >
                        <Select.Option value="all">All Platforms</Select.Option>
                        <Select.Option value="instagram">Instagram</Select.Option>
                        <Select.Option value="twitter">Twitter/X</Select.Option>
                        <Select.Option value="linkedin">LinkedIn</Select.Option>
                        <Select.Option value="facebook">Facebook</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Year:</Text>
                      <Select
                        value={selectedYear}
                        onChange={(value) => {
                          setSelectedYear(value)
                          setSelectedMonth(undefined) // Reset month when year changes
                        }}
                        placeholder="All Years"
                        allowClear
                        style={{ width: 120 }}
                      >
                        {availableYears.map(year => (
                          <Select.Option key={year} value={year}>{year}</Select.Option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Month:</Text>
                      <Select
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        placeholder="All Months"
                        allowClear
                        disabled={!selectedYear}
                        style={{ width: 150 }}
                      >
                        {availableMonths.map(month => {
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                          return (
                            <Select.Option key={month} value={month}>{monthNames[month - 1]}</Select.Option>
                          )
                        })}
                      </Select>
                    </div>
                  </div>
                </div>
                {bestTimeData.bestHours && Object.keys(bestTimeData.bestHours).length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {Object.entries(bestTimeData.bestHours).map(([platform, platformData]) => {
                      if (selectedBestTimePlatform !== 'all' && platform !== selectedBestTimePlatform) return null

                      const hours = platformData?.hours || (Array.isArray(platformData) ? platformData : [])
                      if (!Array.isArray(hours) || hours.length === 0) return null

                      const recommendation = platformData?.recommendation || null

                      const chartData = hours.map((h: any) => ({
                        hour: `${h.hour}:00`,
                        engagement: h.metrics?.avgEngagement || 0,
                        likes: h.metrics?.avgLikes || 0,
                        retweets: h.metrics?.avgRetweets || 0,
                      }))

                      return (
                        <Col xs={24} lg={12} key={platform}>
                          <Card
                            title={<span style={{ textTransform: 'capitalize' }}>{platform}</span>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          >
                            {recommendation && (
                              <div style={{
                                marginBottom: 16,
                                padding: 12,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 8,
                                color: 'white'
                              }}>
                                <Text strong style={{ color: 'white', fontSize: 14 }}>
                                  💡 Best Time to Post: {recommendation}
                                </Text>
                              </div>
                            )}
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="engagement" fill="#1890ff" name="Avg Engagement" />
                              </BarChart>
                            </ResponsiveContainer>
                            <div style={{ marginTop: 16 }}>
                              <Text strong>Top Hours:</Text>
                              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {(() => {
                                  // Format hour for display
                                  const formatHourDisplay = (hour: number) => {
                                    if (hour === 0) return '12am'
                                    if (hour < 12) return `${hour}am`
                                    if (hour === 12) return '12pm'
                                    return `${hour - 12}pm`
                                  }

                                  // Use topHoursByEngagement from backend if available (sorted by engagement)
                                  // Otherwise fall back to filtering hours array
                                  let hoursToShow: Array<{ hour: number; avgEngagement: number }> = []

                                  if (platformData?.topHoursByEngagement && Array.isArray(platformData.topHoursByEngagement)) {
                                    // Use backend-provided top hours sorted by engagement
                                    hoursToShow = platformData.topHoursByEngagement
                                  } else {
                                    // Fallback: Get topHours set from backend and filter hours array
                                    const topHoursSet = new Set(platformData?.topHours || [])
                                    const topHoursData = hours
                                      .filter((h: any) => topHoursSet.has(h.hour))
                                      .sort((a: any, b: any) => (b.metrics?.avgEngagement || 0) - (a.metrics?.avgEngagement || 0))
                                      .slice(0, 5)
                                      .map((h: any) => ({
                                        hour: h.hour,
                                        avgEngagement: h.metrics?.avgEngagement || 0
                                      }))

                                    // If still no data, use top 5 from sorted hours
                                    hoursToShow = topHoursData.length > 0
                                      ? topHoursData
                                      : hours.slice(0, 5).map((h: any) => ({
                                        hour: h.hour,
                                        avgEngagement: h.metrics?.avgEngagement || 0
                                      }))
                                  }

                                  return hoursToShow.map((h: any, idx: number) => (
                                    <Tag key={h.hour} color={idx < 2 ? 'green' : idx < 3 ? 'blue' : 'default'}>
                                      {formatHourDisplay(h.hour)} ({Math.round(h.avgEngagement || 0)} avg)
                                    </Tag>
                                  ))
                                })()}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Card>
                    <Empty description="No data available. The prediction_best_time dataset may be empty." />
                  </Card>
                )}
              </div>
            )}

            {/* Best Days to Post */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'best-time-days' && (
              <div id="best-time-days" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ margin: 0 }}>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    Best Days to Post (Global Benchmark)
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
                    Optimal posting days per platform based on historical engagement data
                  </Text>
                  <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Platform:</Text>
                      <Select
                        value={selectedBestTimePlatform}
                        onChange={setSelectedBestTimePlatform}
                        style={{ width: 180 }}
                      >
                        <Select.Option value="all">All Platforms</Select.Option>
                        <Select.Option value="instagram">Instagram</Select.Option>
                        <Select.Option value="twitter">Twitter/X</Select.Option>
                        <Select.Option value="linkedin">LinkedIn</Select.Option>
                        <Select.Option value="facebook">Facebook</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Year:</Text>
                      <Select
                        value={selectedYear}
                        onChange={(value) => {
                          setSelectedYear(value)
                          setSelectedMonth(undefined) // Reset month when year changes
                        }}
                        placeholder="All Years"
                        allowClear
                        style={{ width: 120 }}
                      >
                        {availableYears.map(year => (
                          <Select.Option key={year} value={year}>{year}</Select.Option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Month:</Text>
                      <Select
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        placeholder="All Months"
                        allowClear
                        disabled={!selectedYear}
                        style={{ width: 150 }}
                      >
                        {availableMonths.map(month => {
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                          return (
                            <Select.Option key={month} value={month}>{monthNames[month - 1]}</Select.Option>
                          )
                        })}
                      </Select>
                    </div>
                  </div>
                </div>
                {bestTimeData.bestDays && Object.keys(bestTimeData.bestDays).length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {Object.entries(bestTimeData.bestDays).map(([platform, platformData]) => {
                      if (selectedBestTimePlatform !== 'all' && platform !== selectedBestTimePlatform) return null

                      const days = platformData?.days || (Array.isArray(platformData) ? platformData : [])
                      if (!Array.isArray(days) || days.length === 0) return null

                      const recommendation = platformData?.recommendation || null

                      const chartData = days.map((d: any) => ({
                        day: d.day,
                        engagement: d.metrics?.avgEngagement || 0,
                        likes: d.metrics?.avgLikes || 0,
                        retweets: d.metrics?.avgRetweets || 0,
                      }))

                      return (
                        <Col xs={24} lg={12} key={platform}>
                          <Card
                            title={<span style={{ textTransform: 'capitalize' }}>{platform}</span>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          >
                            {recommendation && (
                              <div style={{
                                marginBottom: 16,
                                padding: 12,
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                borderRadius: 8,
                                color: 'white'
                              }}>
                                <Text strong style={{ color: 'white', fontSize: 14 }}>
                                  📅 Best Days to Post: {recommendation}
                                </Text>
                              </div>
                            )}
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="engagement" fill="#52c41a" name="Avg Engagement" />
                              </BarChart>
                            </ResponsiveContainer>
                            <div style={{ marginTop: 16 }}>
                              <Text strong>Best Days:</Text>
                              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {days.slice(0, 3).map((d: any, idx: number) => (
                                  <Tag key={d.day} color={idx === 0 ? 'green' : 'blue'}>
                                    {d.day} ({Math.round(d.metrics?.avgEngagement || 0)} avg)
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Card>
                    <Empty description="No data available" />
                  </Card>
                )}
              </div>
            )}

            {/* Day × Hour Heatmap */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'best-time-heatmap' && (
              <div id="best-time-heatmap" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ margin: 0 }}>
                    <HeatMapOutlined style={{ marginRight: 8 }} />
                    Day × Hour Heatmap
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
                    Heatmap showing engagement levels across different days and hours
                  </Text>
                  <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Metric:</Text>
                      <Select
                        value={selectedHeatmapMetric}
                        onChange={(value) => setSelectedHeatmapMetric(value)}
                        style={{ width: 150 }}
                      >
                        <Select.Option value="engagement">Engagement</Select.Option>
                        <Select.Option value="likes">Likes</Select.Option>
                        <Select.Option value="retweets">Retweets</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Platform:</Text>
                      <Select
                        value={selectedBestTimePlatform}
                        onChange={setSelectedBestTimePlatform}
                        style={{ width: 180 }}
                      >
                        <Select.Option value="all">All Platforms</Select.Option>
                        <Select.Option value="instagram">Instagram</Select.Option>
                        <Select.Option value="twitter">Twitter/X</Select.Option>
                        <Select.Option value="linkedin">LinkedIn</Select.Option>
                        <Select.Option value="facebook">Facebook</Select.Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Year:</Text>
                      <Select
                        value={selectedYear}
                        onChange={(value) => {
                          setSelectedYear(value)
                          setSelectedMonth(undefined) // Reset month when year changes
                        }}
                        placeholder="All Years"
                        allowClear
                        style={{ width: 120 }}
                      >
                        {availableYears.map(year => (
                          <Select.Option key={year} value={year}>{year}</Select.Option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Text strong style={{ marginRight: 8 }}>Month:</Text>
                      <Select
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        placeholder="All Months"
                        allowClear
                        disabled={!selectedYear}
                        style={{ width: 150 }}
                      >
                        {availableMonths.map(month => {
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                          return (
                            <Select.Option key={month} value={month}>{monthNames[month - 1]}</Select.Option>
                          )
                        })}
                      </Select>
                    </div>
                  </div>
                </div>
                {bestTimeData.heatmap && Object.keys(bestTimeData.heatmap).length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {Object.entries(bestTimeData.heatmap).map(([platform, heatmapData]) => {
                      if (selectedBestTimePlatform !== 'all' && platform !== selectedBestTimePlatform) return null

                      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                      const hours = Array.from({ length: 24 }, (_, i) => i)

                      // Create matrix for heatmap
                      const matrix = days.map(day => {
                        const dayData = heatmapData.filter((d: any) => d.day === day)
                        return hours.map(hour => {
                          const hourData = dayData.find((d: any) => d.hour === hour)
                          return hourData ? hourData.value : 0
                        })
                      })

                      const maxValue = Math.max(...matrix.flat(), 1) // Avoid division by zero

                      // Get metric label
                      const metricLabel = selectedHeatmapMetric === 'engagement'
                        ? 'Engagement'
                        : selectedHeatmapMetric === 'likes'
                          ? 'Likes'
                          : 'Retweets'

                      return (
                        <Col xs={24} key={platform}>
                          <Card
                            title={<span style={{ textTransform: 'capitalize' }}>{platform} - {metricLabel} Heatmap</span>}
                            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          >
                            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Darker colors indicate higher {metricLabel.toLowerCase()}
                                </Text>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Text type="secondary" style={{ fontSize: 11 }}>Low</Text>
                                  <div style={{
                                    width: 100,
                                    height: 16,
                                    background: 'linear-gradient(to right, rgba(24, 144, 255, 0.1), rgba(24, 144, 255, 1))',
                                    borderRadius: 4
                                  }} />
                                  <Text type="secondary" style={{ fontSize: 11 }}>High</Text>
                                </div>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '10px', textAlign: 'left', backgroundColor: '#fafafa', fontWeight: 'bold' }}>Day</th>
                                    {hours.map(h => (
                                      <th key={h} style={{ padding: '8px', textAlign: 'center', fontSize: '11px', backgroundColor: '#fafafa', minWidth: '40px' }}>
                                        {h}h
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {days.map((day, dayIdx) => (
                                    <tr key={day}>
                                      <td style={{ padding: '10px', fontWeight: 'bold', backgroundColor: '#fafafa' }}>{day.substring(0, 3)}</td>
                                      {hours.map((hour, hourIdx) => {
                                        const value = matrix[dayIdx][hourIdx]
                                        const intensity = maxValue > 0 ? Math.min(value / maxValue, 1) : 0
                                        // Use a better color scale (blue to purple gradient)
                                        const hue = 240 - (intensity * 60) // Blue (240) to Purple (180)
                                        const saturation = 70 + (intensity * 30)
                                        const lightness = 95 - (intensity * 40)
                                        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
                                        return (
                                          <td
                                            key={hour}
                                            style={{
                                              padding: '10px',
                                              backgroundColor: color,
                                              textAlign: 'center',
                                              fontSize: '11px',
                                              color: intensity > 0.6 ? '#fff' : '#000',
                                              fontWeight: intensity > 0.7 ? 'bold' : 'normal',
                                              cursor: 'pointer',
                                              transition: 'transform 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.transform = 'scale(1.1)'
                                              e.currentTarget.style.zIndex = '10'
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.transform = 'scale(1)'
                                            }}
                                            title={`${day} ${hour}:00 - ${metricLabel}: ${value.toLocaleString()}`}
                                          >
                                            {value > 0 ? value.toLocaleString() : ''}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Card>
                    <Empty description="No heatmap data available" />
                  </Card>
                )}
              </div>
            )}

            {/* Engagement Metrics */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'engagement-metrics' && (
              <div id="engagement-metrics" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                    <HeartOutlined style={{ marginRight: 12, color: '#ff4d4f' }} />
                    Global Engagement Metrics
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                    Aggregated engagement statistics from the historical dataset
                  </Text>
                </div>
                {bestTimeData.engagement && bestTimeData.engagement.length > 0 ? (
                  <>
                    {/* Summary Chart */}
                    <Card
                      style={{
                        borderRadius: 16,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        marginBottom: 24
                      }}
                    >
                      <Title level={4} style={{ marginBottom: 16 }}>Engagement by Platform</Title>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bestTimeData.engagement}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="group" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avgEngagementPerPost" fill="#1890ff" name="Avg Engagement/Post" />
                          <Bar dataKey="avgLikesPerPost" fill="#52c41a" name="Avg Likes/Post" />
                          <Bar dataKey="avgRetweetsPerPost" fill="#faad14" name="Avg Retweets/Post" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Detailed Metrics Cards */}
                    <Row gutter={[16, 16]}>
                      {bestTimeData.engagement.map((metric, idx) => {
                        const performanceColor = metric.performanceLabel === 'High' ? '#52c41a' :
                          metric.performanceLabel === 'Average' ? '#faad14' : '#ff4d4f'
                        return (
                          <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                              }}
                            >
                              <div style={{ marginBottom: 12 }}>
                                <Text strong style={{ fontSize: 16, textTransform: 'capitalize' }}>
                                  {metric.group}
                                </Text>
                                <Tag
                                  color={performanceColor}
                                  style={{ marginLeft: 8, fontSize: 11 }}
                                >
                                  {metric.performanceLabel} ({metric.performanceRatio}x)
                                </Tag>
                              </div>
                              <Statistic
                                title="Total Posts"
                                value={metric.totalPosts}
                                valueStyle={{ fontSize: 24, fontWeight: 600 }}
                                formatter={(value) => typeof value === 'number' ? value : Number(value)}
                              />
                              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                                <Row gutter={[8, 8]}>
                                  <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Avg Likes</Text>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
                                      {metric.avgLikesPerPost}
                                    </div>
                                  </Col>
                                  <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Avg Retweets</Text>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#faad14' }}>
                                      {metric.avgRetweetsPerPost}
                                    </div>
                                  </Col>
                                  <Col span={24}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Avg Engagement</Text>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
                                      {metric.avgEngagementPerPost}
                                    </div>
                                  </Col>
                                  <Col span={24}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Range</Text>
                                    <div style={{ fontSize: 12 }}>
                                      {metric.minEngagement} - {metric.maxEngagement}
                                    </div>
                                  </Col>
                                </Row>
                              </div>
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                  </>
                ) : (
                  <Card style={{ borderRadius: 16 }}>
                    <Empty description="No engagement metrics available" />
                  </Card>
                )}
              </div>
            )}

            {/* Top Posts */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'top-posts' && (
              <div id="top-posts" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                    <TrophyOutlined style={{ marginRight: 12, color: '#faad14' }} />
                    Top Performing Posts (Dataset-wide)
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                    Top posts from the historical dataset ranked by engagement performance
                  </Text>
                </div>
                {bestTimeData.topPosts && bestTimeData.topPosts.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {bestTimeData.topPosts.map((post: any, idx: number) => {
                      const isTop3 = idx < 3
                      const formatHour = (hour: number) => {
                        if (hour === 0) return '12am'
                        if (hour < 12) return `${hour}am`
                        if (hour === 12) return '12pm'
                        return `${hour - 12}pm`
                      }

                      return (
                        <Col xs={24} key={idx}>
                          <Card
                            hoverable
                            style={{
                              borderRadius: 16,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              borderLeft: `6px solid ${isTop3 ? '#52c41a' : '#1890ff'}`,
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateX(4px)'
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                          >
                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                              {/* Rank Badge */}
                              <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: 12,
                                background: isTop3
                                  ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                                  : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: '#fff',
                                fontSize: 24,
                                fontWeight: 700
                              }}>
                                #{post.rank || idx + 1}
                              </div>

                              {/* Post Content */}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                                  <Tag color={isTop3 ? 'green' : 'blue'} style={{ fontSize: 12 }}>
                                    {post.platform?.toUpperCase()}
                                  </Tag>
                                  {post.sentiment && (
                                    <Tag color={post.sentiment === 'positive' ? 'green' : post.sentiment === 'negative' ? 'red' : 'default'} style={{ fontSize: 12 }}>
                                      {post.sentiment}
                                    </Tag>
                                  )}
                                  {post.percentile && (
                                    <Tag color="purple" style={{ fontSize: 12 }}>
                                      {post.percentile}
                                    </Tag>
                                  )}
                                  {post.day && post.hour !== undefined && (
                                    <Tag style={{ fontSize: 12 }}>
                                      {post.day} {formatHour(post.hour)}
                                    </Tag>
                                  )}
                                </div>

                                <Text style={{ fontSize: 14, lineHeight: 1.6, display: 'block', marginBottom: 12 }}>
                                  {post.text}
                                </Text>

                                {/* Engagement Metrics */}
                                <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
                                  <Col>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ fontSize: 16 }}>❤️</span>
                                      <Text strong style={{ fontSize: 14 }}>{post.likes?.toLocaleString()}</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>likes</Text>
                                    </div>
                                  </Col>
                                  <Col>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ fontSize: 16 }}>🔄</span>
                                      <Text strong style={{ fontSize: 14 }}>{post.retweets?.toLocaleString()}</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>retweets</Text>
                                    </div>
                                  </Col>
                                  <Col>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ fontSize: 16 }}>📊</span>
                                      <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                                        {post.engagementScore?.toLocaleString()}
                                      </Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>engagement</Text>
                                    </div>
                                  </Col>
                                  {post.country && (
                                    <Col>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 16 }}>🌍</span>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{post.country}</Text>
                                      </div>
                                    </Col>
                                  )}
                                </Row>

                                {/* Hashtags */}
                                {post.hashtags && post.hashtags.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {post.hashtags.slice(0, 5).map((tag: string, tagIdx: number) => (
                                      <Tag key={tagIdx} color="purple" style={{ marginBottom: 4 }}>
                                        #{tag.replace('#', '')}
                                      </Tag>
                                    ))}
                                    {post.hashtags.length > 5 && (
                                      <Tag style={{ marginBottom: 4 }}>
                                        +{post.hashtags.length - 5} more
                                      </Tag>
                                    )}
                                  </div>
                                )}

                                {/* Timestamp */}
                                {post.timestamp && (
                                  <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      Posted: {new Date(post.timestamp).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Card style={{ borderRadius: 16 }}>
                    <Empty
                      description={
                        <div style={{ textAlign: 'center' }}>
                          <Text style={{ fontSize: 16, color: '#8c8c8c', display: 'block', marginBottom: 8 }}>
                            Engagement data syncs every 24 hours
                          </Text>
                          <Text style={{ fontSize: 14, color: '#bfbfbf', display: 'block' }}>
                            Start posting to see your reach grow!
                          </Text>
                        </div>
                      }
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </Card>
                )}
              </div>
            )}

            {/* Sentiment Insights */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'sentiment-insights' && (
              <div id="sentiment-insights" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                    <BulbOutlined style={{ marginRight: 12, color: '#722ed1' }} />
                    Sentiment-Aware Posting Insights
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                    Best times to post content with different sentiment levels per platform
                  </Text>
                </div>
                {bestTimeData.sentiment && bestTimeData.sentiment.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {bestTimeData.sentiment.map((insight: any, idx: number) => {
                      const sentimentColors: Record<string, string> = {
                        positive: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        negative: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                        neutral: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                      }
                      const gradient = sentimentColors[insight.sentiment?.toLowerCase()] || sentimentColors.neutral

                      const formatHour = (hour: number) => {
                        if (hour === 0) return '12am'
                        if (hour < 12) return `${hour}am`
                        if (hour === 12) return '12pm'
                        return `${hour - 12}pm`
                      }

                      return (
                        <Col xs={24} md={12} lg={8} key={idx}>
                          <Card
                            hoverable
                            style={{
                              borderRadius: 16,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)'
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                          >
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Tag
                                  style={{
                                    background: gradient,
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    padding: '4px 12px'
                                  }}
                                >
                                  {insight.platform?.toUpperCase()}
                                </Tag>
                                <Tag
                                  color={insight.sentiment === 'positive' ? 'green' : insight.sentiment === 'negative' ? 'red' : 'default'}
                                  style={{ fontSize: 12 }}
                                >
                                  {insight.sentiment?.toUpperCase()}
                                </Tag>
                              </div>
                              {insight.recommendation && (
                                <div style={{
                                  padding: 12,
                                  background: gradient,
                                  borderRadius: 8,
                                  marginBottom: 12
                                }}>
                                  <Text strong style={{ color: '#fff', fontSize: 13 }}>
                                    💡 Best Time: {insight.recommendation}
                                  </Text>
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: 12 }}>
                              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                                Top Hours by Engagement:
                              </Text>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {insight.bestHours?.slice(0, 5).map((h: any, hourIdx: number) => (
                                  <Tag
                                    key={hourIdx}
                                    color={hourIdx < 2 ? 'green' : hourIdx < 3 ? 'blue' : 'default'}
                                    style={{ marginBottom: 4 }}
                                  >
                                    {formatHour(h.hour)} ({h.avgEngagement} avg)
                                  </Tag>
                                ))}
                              </div>
                            </div>

                            {insight.totalPosts > 0 && (
                              <div style={{
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: '1px solid #f0f0f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 12
                              }}>
                                <Text type="secondary">
                                  {insight.totalPosts} posts
                                </Text>
                                <Text type="secondary">
                                  Avg: {insight.avgEngagement} engagement
                                </Text>
                              </div>
                            )}
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Card style={{ borderRadius: 16 }}>
                    <Empty description="No sentiment insights available" />
                  </Card>
                )}
              </div>
            )}

            {/* Platform Comparison */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'platform-comparison' && (
              <div id="platform-comparison" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                    <BarChartOutlined style={{ marginRight: 12, color: '#13c2c2' }} />
                    Platform Comparison
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                    Compare engagement metrics and performance across different platforms
                  </Text>
                </div>
                {bestTimeData.platformComparison && bestTimeData.platformComparison.length > 0 ? (
                  <>
                    {/* Comparison Chart */}
                    <Card
                      style={{
                        borderRadius: 16,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        marginBottom: 24
                      }}
                    >
                      <Title level={4} style={{ marginBottom: 16 }}>Average Engagement Metrics</Title>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={bestTimeData.platformComparison}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avgEngagementPerPost" fill="#1890ff" name="Avg Engagement/Post" />
                          <Bar dataKey="avgLikesPerPost" fill="#52c41a" name="Avg Likes/Post" />
                          <Bar dataKey="avgRetweetsPerPost" fill="#faad14" name="Avg Retweets/Post" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Platform Cards */}
                    <Row gutter={[16, 16]}>
                      {bestTimeData.platformComparison.map((platform: any) => {
                        const rankColors: Record<number, string> = {
                          1: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                          2: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                          3: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                        }
                        const cardGradient = rankColors[platform.rank] || 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'

                        return (
                          <Col xs={24} sm={12} md={8} lg={6} key={platform.platform}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: 16,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                background: platform.rank <= 3 ? cardGradient : undefined,
                                color: platform.rank <= 3 ? '#fff' : undefined,
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                              }}
                            >
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <Text strong style={{
                                    fontSize: 16,
                                    textTransform: 'capitalize',
                                    color: platform.rank <= 3 ? '#fff' : undefined
                                  }}>
                                    {platform.platform}
                                  </Text>
                                  {platform.rank && (
                                    <Tag
                                      style={{
                                        background: platform.rank <= 3 ? 'rgba(255,255,255,0.3)' : undefined,
                                        color: platform.rank <= 3 ? '#fff' : undefined,
                                        border: 'none'
                                      }}
                                    >
                                      #{platform.rank}
                                    </Tag>
                                  )}
                                </div>
                                {platform.bestHoursFormatted && (
                                  <div style={{
                                    padding: 8,
                                    background: platform.rank <= 3 ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                                    borderRadius: 6,
                                    marginBottom: 8
                                  }}>
                                    <Text style={{
                                      fontSize: 12,
                                      color: platform.rank <= 3 ? '#fff' : undefined
                                    }}>
                                      ⏰ Best: {platform.bestHoursFormatted}
                                    </Text>
                                  </div>
                                )}
                              </div>

                              <Statistic
                                title={<span style={{ color: platform.rank <= 3 ? 'rgba(255,255,255,0.9)' : undefined }}>
                                  Total Posts
                                </span>}
                                value={platform.totalPosts}
                                valueStyle={{
                                  fontSize: 28,
                                  fontWeight: 700,
                                  color: platform.rank <= 3 ? '#fff' : undefined
                                }}
                                formatter={(value) => typeof value === 'number' ? value : Number(value)}
                              />

                              <div style={{
                                marginTop: 16,
                                paddingTop: 16,
                                borderTop: platform.rank <= 3 ? '1px solid rgba(255,255,255,0.2)' : '1px solid #f0f0f0'
                              }}>
                                <Row gutter={[8, 8]}>
                                  <Col span={24}>
                                    <Text style={{
                                      fontSize: 11,
                                      color: platform.rank <= 3 ? 'rgba(255,255,255,0.9)' : undefined
                                    }}>
                                      Avg Engagement
                                    </Text>
                                    <div style={{
                                      fontSize: 20,
                                      fontWeight: 700,
                                      color: platform.rank <= 3 ? '#fff' : '#1890ff'
                                    }}>
                                      {platform.avgEngagementPerPost}
                                    </div>
                                  </Col>
                                  <Col span={12}>
                                    <Text style={{
                                      fontSize: 11,
                                      color: platform.rank <= 3 ? 'rgba(255,255,255,0.8)' : undefined
                                    }}>
                                      Avg Likes
                                    </Text>
                                    <div style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: platform.rank <= 3 ? '#fff' : '#52c41a'
                                    }}>
                                      {platform.avgLikesPerPost}
                                    </div>
                                  </Col>
                                  <Col span={12}>
                                    <Text style={{
                                      fontSize: 11,
                                      color: platform.rank <= 3 ? 'rgba(255,255,255,0.8)' : undefined
                                    }}>
                                      Avg Retweets
                                    </Text>
                                    <div style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: platform.rank <= 3 ? '#fff' : '#faad14'
                                    }}>
                                      {platform.avgRetweetsPerPost}
                                    </div>
                                  </Col>
                                  {platform.performanceRatio && (
                                    <Col span={24}>
                                      <Text style={{
                                        fontSize: 11,
                                        color: platform.rank <= 3 ? 'rgba(255,255,255,0.8)' : undefined
                                      }}>
                                        Performance Ratio
                                      </Text>
                                      <div style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: platform.rank <= 3 ? '#fff' : undefined
                                      }}>
                                        {platform.performanceRatio}x average
                                      </div>
                                    </Col>
                                  )}
                                </Row>
                              </div>
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                  </>
                ) : (
                  <Card style={{ borderRadius: 16 }}>
                    <Empty description="No platform comparison data available" />
                  </Card>
                )}
              </div>
            )}

            {/* Hashtag Trends */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'hashtag-trends' && (
              <div id="hashtag-trends" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                    <TagOutlined style={{ marginRight: 12, color: '#f5222d' }} />
                    Hashtag Trend Timing
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                    Best times to post trending hashtags based on engagement performance
                  </Text>
                </div>
                {bestTimeData.hashtags && bestTimeData.hashtags.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {bestTimeData.hashtags.slice(0, 12).map((hashtag: any, idx: number) => {
                      const formatHour = (hour: number) => {
                        if (hour === 0) return '12am'
                        if (hour < 12) return `${hour}am`
                        if (hour === 12) return '12pm'
                        return `${hour - 12}pm`
                      }

                      return (
                        <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                          <Card
                            hoverable
                            style={{
                              borderRadius: 16,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)'
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                          >
                            <div style={{ marginBottom: 16 }}>
                              <Tag
                                color="purple"
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  padding: '4px 12px',
                                  marginBottom: 12
                                }}
                              >
                                #{hashtag.hashtag?.replace('#', '')}
                              </Tag>

                              {hashtag.peakHoursFormatted && (
                                <div style={{
                                  padding: 10,
                                  background: 'linear-gradient(135deg, #f5222d 0%, #ff7875 100%)',
                                  borderRadius: 8,
                                  marginBottom: 12
                                }}>
                                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                                    ⏰ Peak Time: {hashtag.peakHoursFormatted}
                                  </Text>
                                </div>
                              )}
                            </div>

                            <Statistic
                              title="Total Posts"
                              value={hashtag.totalCount}
                              valueStyle={{ fontSize: 24, fontWeight: 700 }}
                              suffix={<span style={{ fontSize: 14 }}>posts</span>}
                              formatter={(value) => typeof value === 'number' ? value : Number(value)}
                            />

                            <div style={{
                              marginTop: 16,
                              paddingTop: 16,
                              borderTop: '1px solid #f0f0f0'
                            }}>
                              <Row gutter={[8, 8]}>
                                <Col span={24}>
                                  <Text type="secondary" style={{ fontSize: 11 }}>Avg Engagement</Text>
                                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>
                                    {hashtag.avgEngagement}
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <Text type="secondary" style={{ fontSize: 11 }}>Total Likes</Text>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: '#52c41a' }}>
                                    {hashtag.totalLikes?.toLocaleString()}
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <Text type="secondary" style={{ fontSize: 11 }}>Total Retweets</Text>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: '#faad14' }}>
                                    {hashtag.totalRetweets?.toLocaleString()}
                                  </div>
                                </Col>
                                {hashtag.peakDay && (
                                  <Col span={24}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Peak Day</Text>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                                      {hashtag.peakDay}
                                    </div>
                                  </Col>
                                )}
                              </Row>
                            </div>

                            <div style={{ marginTop: 16 }}>
                              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                Top Hours:
                              </Text>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {hashtag.hours?.slice(0, 3).map((h: any, hourIdx: number) => (
                                  <Tag
                                    key={hourIdx}
                                    color={hourIdx === 0 ? 'green' : hourIdx === 1 ? 'blue' : 'default'}
                                    style={{ marginBottom: 4 }}
                                  >
                                    {formatHour(h.hour)} ({h.avgEngagement} avg)
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Card style={{ borderRadius: 16 }}>
                    <Empty description="No hashtag trends available" />
                  </Card>
                )}
              </div>
            )}

            {/* Country Insights */}
            {!bestTimeLoading && bestTimeData && selectedSection === 'country-insights' && (
              <div id="country-insights" style={{ scrollMarginTop: '100px', paddingTop: '20px', marginTop: 32, marginBottom: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
                    <EnvironmentOutlined style={{ marginRight: 12, color: '#2f54eb' }} />
                    Country-Based Insights
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block', color: '#8c8c8c' }}>
                    Best posting times adjusted for different countries and platforms
                  </Text>
                </div>
                {bestTimeData.countries && bestTimeData.countries.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {bestTimeData.countries.map((country: any, idx: number) => {
                      const formatHour = (hour: number) => {
                        if (hour === 0) return '12am'
                        if (hour < 12) return `${hour}am`
                        if (hour === 12) return '12pm'
                        return `${hour - 12}pm`
                      }

                      return (
                        <Col xs={24} md={12} lg={8} key={idx}>
                          <Card
                            hoverable
                            style={{
                              borderRadius: 16,
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)'
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                          >
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <EnvironmentOutlined style={{ fontSize: 20, color: '#2f54eb' }} />
                                <Text strong style={{ fontSize: 16 }}>
                                  {country.country}
                                </Text>
                                <Tag style={{ fontSize: 12 }}>
                                  {country.platform?.toUpperCase()}
                                </Tag>
                              </div>

                              {country.recommendation && (
                                <div style={{
                                  padding: 12,
                                  background: 'linear-gradient(135deg, #2f54eb 0%, #597ef7 100%)',
                                  borderRadius: 8,
                                  marginBottom: 12
                                }}>
                                  <Text strong style={{ color: '#fff', fontSize: 13 }}>
                                    ⏰ Best Time: {country.recommendation}
                                  </Text>
                                </div>
                              )}
                            </div>

                            {country.totalPosts > 0 && (
                              <div style={{ marginBottom: 16 }}>
                                <Row gutter={[8, 8]}>
                                  <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Total Posts</Text>
                                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                                      {country.totalPosts}
                                    </div>
                                  </Col>
                                  <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Avg Engagement</Text>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
                                      {country.avgEngagementPerPost}
                                    </div>
                                  </Col>
                                </Row>
                              </div>
                            )}

                            <div style={{
                              marginTop: 16,
                              paddingTop: 16,
                              borderTop: '1px solid #f0f0f0'
                            }}>
                              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                                Top Hours by Engagement:
                              </Text>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {country.bestHours?.slice(0, 5).map((h: any, hourIdx: number) => (
                                  <Tag
                                    key={hourIdx}
                                    color={hourIdx < 2 ? 'green' : hourIdx < 3 ? 'blue' : 'default'}
                                    style={{ marginBottom: 4 }}
                                  >
                                    {formatHour(h.hour)} ({h.avgEngagement} avg)
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                ) : (
                  <Card style={{ borderRadius: 16 }}>
                    <Empty description="No country insights available" />
                  </Card>
                )}
              </div>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

