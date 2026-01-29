import { useEffect, useState, useCallback, useRef } from 'react'
import jsPDF from 'jspdf'
// Dynamic import for html2canvas (used only for PDF chart generation)
let html2canvas: any = null
import { Layout, Card, Row, Col, Spin, Typography, Tag, Space, Button, Drawer, Grid, Select, Statistic, Empty, Tooltip as AntdTooltip, message } from 'antd'
import {
  CalendarOutlined,
  MessageOutlined,
  FundProjectionScreenOutlined,
  FileTextOutlined,
  LinkedinOutlined,
  RobotOutlined,
  ReloadOutlined,
  DownloadOutlined,
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
  InfoCircleOutlined,
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
    // Trend 1: Content Creation Over Time
    postsCreated: Array<{ date: string; count: number }>
    // Trend 2: Publishing vs Scheduling
    publishedPosts: Array<{ date: string; count: number }>
    scheduledPosts: Array<{ date: string; count: number }>
    // Trend 3: AI Generation Activity
    aiContent: Array<{ date: string; count: number }>
    // Trend 4: Publishing Method Trend
    calendarPublishes: Array<{ date: string; count: number }>
    directPublishes: Array<{ date: string; count: number }>
    // Trend 5: User Interaction Activity
    conversations: Array<{ date: string; count: number }>
    events: Array<{ date: string; count: number }>
    // Legacy fields (kept for backward compatibility)
    campaigns: Array<{ date: string; count: number }>
    calendarItems: Array<{ date: string; count: number }>
    posts: Array<{ date: string; count: number }>
    linkedInPosts: Array<{ date: string; count: number }>
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
          // Normalize timeSeries to ensure all required properties exist
          const ts = data.analytics.timeSeries as any
          const normalizedTimeSeries: AnalyticsData['timeSeries'] = {
            postsCreated: ts?.postsCreated || [],
            publishedPosts: ts?.publishedPosts || [],
            scheduledPosts: ts?.scheduledPosts || [],
            aiContent: ts?.aiContent || [],
            calendarPublishes: ts?.calendarPublishes || [],
            directPublishes: ts?.directPublishes || [],
            conversations: ts?.conversations || [],
            events: ts?.events || [],
            campaigns: ts?.campaigns || [],
            calendarItems: ts?.calendarItems || [],
            posts: ts?.posts || [],
            linkedInPosts: ts?.linkedInPosts || [],
            mediaFiles: ts?.mediaFiles || [],
          }
          setAnalytics({
            ...data.analytics,
            timeSeries: normalizedTimeSeries
          })
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
        // Try to extract error message from response
        let errorMessage = 'Failed to fetch analytics'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
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
      } else if (!data.success) {
        // Handle case where API returns success: false
        const errorMessage = data.message || 'Failed to fetch analytics'
        message.error(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics'
      message.error(errorMessage)
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
        // Try to extract error message from response
        let errorMessage = 'Failed to fetch best time analytics'
        try {
          const errorData = await mainResponse.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          // If JSON parsing fails, try text
          try {
            const errorText = await mainResponse.text()
            if (errorText) {
              errorMessage = errorText
            }
          } catch {
            errorMessage = `Failed to fetch best time analytics: ${mainResponse.status}`
          }
        }
        throw new Error(errorMessage)
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch best time analytics'
      message.error(errorMessage)
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

  const handleExportPDF = async () => {
    if (!analytics) {
      message.error('No analytics data available to export')
      return
    }

    try {
      // Dynamically load html2canvas for chart capture
      if (!html2canvas) {
        try {
          const html2canvasModule = await import('html2canvas')
          html2canvas = html2canvasModule.default
        } catch (error) {
          console.warn('html2canvas not available, charts will be skipped:', error)
          message.warning('Note: Chart images require html2canvas package. Installing...')
        }
      }
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 20
      const margin = 20
      const lineHeight = 7
      const sectionSpacing = 15
      
      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
          return true
        }
        return false
      }

      // Helper function to draw a horizontal line
      const drawHorizontalLine = () => {
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.5)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 5
      }

      // Enhanced section header with better styling
      const addSectionHeader = (title: string) => {
        checkPageBreak(sectionSpacing + 8)
        yPosition += sectionSpacing
        
        // Background with gradient effect
        doc.setFillColor(240, 247, 255)
        doc.rect(margin, yPosition - 6, pageWidth - margin * 2, 10, 'F')
        
        // Accent line
        doc.setFillColor(24, 144, 255)
        doc.rect(margin, yPosition - 6, 4, 10, 'F')
        
        doc.setFontSize(15)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(25, 25, 25)
        doc.text(title, margin + 8, yPosition + 1)
        
        // Underline
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.5)
        doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3)
        
        yPosition += lineHeight * 2
      }

      // Enhanced Header with gradient-like effect
      doc.setFillColor(24, 144, 255)
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      // Add subtle pattern/shadow effect
      doc.setFillColor(20, 120, 220)
      doc.rect(0, 0, pageWidth, 5, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Analytics Report', margin, 22)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(240, 240, 240)
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 30)
      
      if (user?.name || user?.email) {
        doc.text(`User: ${user?.name || user?.email || 'N/A'}`, margin, 35)
      }
      
      yPosition = 50
      doc.setTextColor(0, 0, 0)

      // Overview Section with styled table
      addSectionHeader('Overview')
      
      const overviewItems = [
        ['Total Posts Generated', (analytics.overview.totalPostsGenerated || 0).toString()],
        ['Published Posts', (analytics.overview.publishedPosts || 0).toString()],
        ['Draft Posts', (analytics.overview.draftPosts || 0).toString()],
        ['Scheduled Posts', (analytics.overview.scheduledPosts || 0).toString()],
        ['Calendar Items', (analytics.overview.totalCalendarItems || 0).toString()],
        ['AI Generated Content', (analytics.overview.totalAIGeneratedContent || 0).toString()],
        ['Total Conversations', (analytics.overview.totalConversations || 0).toString()],
        ['Total Events', (analytics.overview.totalEvents || 0).toString()],
        ['Total Campaigns', (analytics.overview.totalCampaigns || 0).toString()],
      ]

      // Draw table with better column alignment
      const rowHeight = 9
      const tableStartY = yPosition
      const tableWidth = pageWidth - margin * 2
      const labelColumnWidth = tableWidth * 0.65 // 65% for labels
      const valueColumnWidth = tableWidth * 0.35 // 35% for values
      const valueStartX = margin + labelColumnWidth + 10
      
      // Draw header row (optional - light header)
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
      doc.line(valueStartX - 5, yPosition - 5, valueStartX - 5, yPosition + rowHeight - 5)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text('Metric', margin + 5, yPosition + 2)
      doc.text('Value', valueStartX, yPosition + 2)
      yPosition += rowHeight
      
      overviewItems.forEach(([label, value], index) => {
        checkPageBreak(rowHeight + 2)
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252)
          doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
        }
        
        // Draw vertical separator
        doc.setDrawColor(230, 230, 230)
        doc.setLineWidth(0.2)
        doc.line(valueStartX - 5, yPosition - 5, valueStartX - 5, yPosition + rowHeight - 5)
        
        // Draw horizontal border
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        // Wrap label if needed
        const labelLines = doc.splitTextToSize(label, labelColumnWidth - 10)
        doc.text(labelLines, margin + 5, yPosition + 2)
        
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(24, 144, 255)
        doc.text(value, valueStartX, yPosition + 2)
        
        // Adjust yPosition based on label wrapping
        const labelHeight = labelLines.length * 4
        yPosition += Math.max(rowHeight, labelHeight + 2)
      })
      
      // Draw bottom border
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
      yPosition += 8

      // Key Insights Section with improved 2-column card layout
      addSectionHeader('Key Insights & Trends')

      // Helper function to draw insight card
      const drawInsightCard = (doc: any, insight: any, x: number, y: number, width: number, height: number) => {
        // Card background
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(235, 235, 235)
        doc.setLineWidth(0.5)
        doc.roundedRect(x, y - 3, width, height, 2, 2, 'FD')
        
        // Status indicator (colored dot)
        const statusColors: Record<string, [number, number, number]> = {
          'on-track': [82, 196, 26],
          'needs-attention': [250, 173, 20],
          'action-needed': [255, 77, 79]
        }
        const statusColor = statusColors[insight.status] || [128, 128, 128]
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
        doc.circle(x + 5, y + 5, 3, 'F')
        
        // Title
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(25, 25, 25)
        const titleLines = doc.splitTextToSize(insight.title, width - 15)
        const titleY = y + (titleLines.length > 1 ? 3 : 5)
        doc.text(titleLines, x + 12, titleY)
        
        // Value
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(24, 144, 255)
        const valueLines = doc.splitTextToSize(insight.value.toString(), width - 10)
        const valueY = y + (titleLines.length > 1 ? 10 : 12)
        doc.text(valueLines, x + 5, valueY)
        
        // Description
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        const descLines = doc.splitTextToSize(insight.description, width - 10)
        const descY = y + (titleLines.length > 1 ? 17 : 19)
        doc.text(descLines, x + 5, descY)
      }

      const cardWidth = (pageWidth - margin * 2 - 10) / 2 // 10px gap between cards
      const cardHeight = 30
      const cardGap = 10
      const cardVerticalGap = 10
      let currentRow = 0
      
      insights.forEach((insight, index) => {
        const col = index % 2
        const cardY = yPosition + (currentRow * (cardHeight + cardVerticalGap))
        
        // Check if we need a new page
        if (cardY + cardHeight > pageHeight - margin - 20) {
          doc.addPage()
          yPosition = margin
          currentRow = 0
          const newCardY = yPosition
          const xPos = col === 0 ? margin : margin + cardWidth + cardGap
          drawInsightCard(doc, insight, xPos, newCardY, cardWidth, cardHeight)
        } else {
          const xPos = col === 0 ? margin : margin + cardWidth + cardGap
          drawInsightCard(doc, insight, xPos, cardY, cardWidth, cardHeight)
        }
        
        // Move to next row after 2 columns
        if (col === 1) {
          currentRow++
        }
      })
      
      // Update yPosition after all insights
      const totalRows = Math.ceil(insights.length / 2)
      yPosition += (totalRows * (cardHeight + cardVerticalGap)) + 10

      // Breakdown Section with styled tables
      if (analytics.breakdown) {
        addSectionHeader('Content Breakdown')

        // Posts by Platform - improved table layout
        if (analytics.breakdown.postsByPlatform && Object.keys(analytics.breakdown.postsByPlatform).length > 0) {
          checkPageBreak(lineHeight * 4)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('Posts by Platform', margin, yPosition)
          yPosition += 10
          
          const platformEntries = Object.entries(analytics.breakdown.postsByPlatform)
          const rowHeight = 8
          const tableWidth = pageWidth - margin * 2
          const platformColWidth = tableWidth * 0.7
          const countColWidth = tableWidth * 0.3
          const countStartX = margin + platformColWidth + 5
          
          // Header row
          doc.setFillColor(240, 247, 255)
          doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 100, 100)
          doc.text('Platform', margin + 5, yPosition + 2)
          doc.text('Count', countStartX, yPosition + 2)
          yPosition += rowHeight
          
          platformEntries.forEach(([platform, count], index) => {
            checkPageBreak(rowHeight + 2)
            
            if (index % 2 === 0) {
              doc.setFillColor(252, 252, 252)
              doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            }
            
            // Vertical separator
            doc.setDrawColor(230, 230, 230)
            doc.setLineWidth(0.2)
            doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
            
            // Horizontal border
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(60, 60, 60)
            const displayName = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/_/g, ' ')
            doc.text(displayName, margin + 5, yPosition + 2)
            
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(24, 144, 255)
            doc.text(count.toString(), countStartX, yPosition + 2)
            
            yPosition += rowHeight
          })
          
          // Bottom border
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          yPosition += 10
        }

        // Posts by Status - improved table layout
        if (analytics.breakdown.postsByStatus && Object.keys(analytics.breakdown.postsByStatus).length > 0) {
          checkPageBreak(lineHeight * 4)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('Posts by Status', margin, yPosition)
          yPosition += 10
          
          const statusEntries = Object.entries(analytics.breakdown.postsByStatus)
          const rowHeight = 8
          const tableWidth = pageWidth - margin * 2
          const statusColWidth = tableWidth * 0.7
          const countColWidth = tableWidth * 0.3
          const countStartX = margin + statusColWidth + 5
          
          // Header row
          doc.setFillColor(240, 247, 255)
          doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 100, 100)
          doc.text('Status', margin + 5, yPosition + 2)
          doc.text('Count', countStartX, yPosition + 2)
          yPosition += rowHeight
          
          statusEntries.forEach(([status, count], index) => {
            checkPageBreak(rowHeight + 2)
            
            if (index % 2 === 0) {
              doc.setFillColor(252, 252, 252)
              doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            }
            
            // Vertical separator
            doc.setDrawColor(230, 230, 230)
            doc.setLineWidth(0.2)
            doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
            
            // Horizontal border
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(60, 60, 60)
            const displayStatus = status.charAt(0).toUpperCase() + status.slice(1)
            doc.text(displayStatus, margin + 5, yPosition + 2)
            
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(24, 144, 255)
            doc.text(count.toString(), countStartX, yPosition + 2)
            
            yPosition += rowHeight
          })
          
          // Bottom border
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          yPosition += 10
        }
      }

      // Time Series Summary with styled layout
      if (analytics.timeSeries) {
        addSectionHeader('Activity Trends Summary')

        const trendItems: Array<{label: string, total: number, recent: number}> = []

        // Content Creation
        if (analytics.timeSeries.postsCreated && analytics.timeSeries.postsCreated.length > 0) {
          const totalCreated = analytics.timeSeries.postsCreated.reduce((sum, item) => sum + item.count, 0)
          const recent = analytics.timeSeries.postsCreated.slice(-7).reduce((sum, item) => sum + item.count, 0)
          trendItems.push({ label: 'Content Created', total: totalCreated, recent })
        }

        // Published Posts
        if (analytics.timeSeries.publishedPosts && analytics.timeSeries.publishedPosts.length > 0) {
          const totalPublished = analytics.timeSeries.publishedPosts.reduce((sum, item) => sum + item.count, 0)
          const recent = analytics.timeSeries.publishedPosts.slice(-7).reduce((sum, item) => sum + item.count, 0)
          trendItems.push({ label: 'Published Posts', total: totalPublished, recent })
        }

        // Calendar vs Direct Publishing
        if (analytics.timeSeries.calendarPublishes && analytics.timeSeries.directPublishes) {
          const calendarTotal = analytics.timeSeries.calendarPublishes.reduce((sum, item) => sum + item.count, 0)
          const directTotal = analytics.timeSeries.directPublishes.reduce((sum, item) => sum + item.count, 0)
          trendItems.push({ label: 'Calendar Posts', total: calendarTotal, recent: 0 })
          trendItems.push({ label: 'Direct Posts', total: directTotal, recent: 0 })
        }

        // AI Content
        if (analytics.timeSeries.aiContent && analytics.timeSeries.aiContent.length > 0) {
          const totalAI = analytics.timeSeries.aiContent.reduce((sum, item) => sum + item.count, 0)
          const recent = analytics.timeSeries.aiContent.slice(-7).reduce((sum, item) => sum + item.count, 0)
          trendItems.push({ label: 'AI Content Generated', total: totalAI, recent })
        }

        // Conversations
        if (analytics.timeSeries.conversations && analytics.timeSeries.conversations.length > 0) {
          const totalChats = analytics.timeSeries.conversations.reduce((sum, item) => sum + item.count, 0)
          const recent = analytics.timeSeries.conversations.slice(-7).reduce((sum, item) => sum + item.count, 0)
          trendItems.push({ label: 'AI Chat Sessions', total: totalChats, recent })
        }

        // Events
        if (analytics.timeSeries.events && analytics.timeSeries.events.length > 0) {
          const totalEvents = analytics.timeSeries.events.reduce((sum, item) => sum + item.count, 0)
          const recent = analytics.timeSeries.events.slice(-7).reduce((sum, item) => sum + item.count, 0)
          trendItems.push({ label: 'Events Created', total: totalEvents, recent })
        }

        const rowHeight = 9
        const tableWidth = pageWidth - margin * 2
        const labelColWidth = tableWidth * 0.65
        const valueColWidth = tableWidth * 0.35
        const valueStartX = margin + labelColWidth + 10
        
        // Header row
        doc.setFillColor(240, 247, 255)
        doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
        doc.line(valueStartX - 5, yPosition - 5, valueStartX - 5, yPosition + rowHeight - 5)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(100, 100, 100)
        doc.text('Activity', margin + 5, yPosition + 2)
        doc.text('Summary', valueStartX, yPosition + 2)
        yPosition += rowHeight
        
        trendItems.forEach((item, index) => {
          checkPageBreak(rowHeight + 2)
          
          if (index % 2 === 0) {
            doc.setFillColor(252, 252, 252)
            doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
          }
          
          // Vertical separator
          doc.setDrawColor(230, 230, 230)
          doc.setLineWidth(0.2)
          doc.line(valueStartX - 5, yPosition - 5, valueStartX - 5, yPosition + rowHeight - 5)
          
          // Horizontal border
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(60, 60, 60)
          doc.text(item.label, margin + 5, yPosition + 2)
          
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(24, 144, 255)
          if (item.recent > 0) {
            doc.text(`${item.total} total, ${item.recent} (7d)`, valueStartX, yPosition + 2)
          } else {
            doc.text(item.total.toString(), valueStartX, yPosition + 2)
          }
          
          yPosition += rowHeight
        })
        
        // Bottom border
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
        yPosition += 12
      }

      // Detailed Activity Trends Section
      if (analytics.timeSeries) {
        addSectionHeader('Activity Trends - Detailed Analysis')

        // Helper function to format date for PDF display
        const formatDateForPDF = (dateStr: string) => {
          try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) {
              const dateWithTime = new Date(dateStr + 'T00:00:00')
              if (!isNaN(dateWithTime.getTime())) {
                return dateWithTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              return dateStr
            }
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          } catch {
            return dateStr
          }
        }

        // Helper function to prepare daily data (same as component function)
        const prepareDailyDataForPDF = (data: Array<{ date: string; count: number }>) => {
          if (!data || data.length === 0) return []
          
          // Sort data by date to ensure chronological order
          const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateA - dateB
          })
          
          return sortedData.map(item => ({
            date: item.date, // Keep original date for sorting
            count: item.count || 0
          }))
        }

        // Helper function to merge time series (same as component function)
        const mergeTimeSeriesForPDF = (
          series1: Array<{ date: string; count: number }>,
          series2: Array<{ date: string; count: number }>,
          key1: string,
          key2: string
        ) => {
          const map = new Map<string, { date: string; [key: string]: number | string }>()
          
          // Add data1
          series1.forEach(item => {
            map.set(item.date, {
              date: item.date,
              [key1]: item.count || 0,
              [key2]: 0,
            })
          })
          
          // Add/update with data2
          series2.forEach(item => {
            const existing = map.get(item.date) || { date: item.date, [key1]: 0, [key2]: 0 }
            existing[key2] = item.count || 0
            map.set(item.date, existing)
          })
          
          return Array.from(map.values()).sort((a, b) => {
            const dateA = new Date(a.date as string).getTime()
            const dateB = new Date(b.date as string).getTime()
            return dateA - dateB
          })
        }

        // Helper function to draw a simple line chart
        const drawLineChart = (
          doc: any,
          data: Array<{ date: string; count: number }>,
          title: string,
          color: [number, number, number] = [24, 144, 255],
          x: number = margin,
          y: number = yPosition,
          width: number = pageWidth - margin * 2,
          height: number = 40
        ) => {
          if (!data || data.length === 0) return y + height
          
          // Chart background
          doc.setFillColor(252, 252, 252)
          doc.rect(x, y, width, height, 'F')
          
          // Draw border
          doc.setDrawColor(220, 220, 220)
          doc.setLineWidth(0.5)
          doc.rect(x, y, width, height, 'S')
          
          // Find max value for scaling
          const maxValue = Math.max(...data.map(d => d.count || 0), 1)
          const minValue = Math.min(...data.map(d => d.count || 0), 0)
          const valueRange = maxValue - minValue || 1
          
          // Padding inside chart
          const chartPadding = 8
          const chartX = x + chartPadding
          const chartY = y + chartPadding
          const chartWidth = width - chartPadding * 2
          const chartHeight = height - chartPadding * 2 - 10
          
          // Draw grid lines
          doc.setDrawColor(240, 240, 240)
          doc.setLineWidth(0.2)
          for (let i = 0; i <= 4; i++) {
            const gridY = chartY + (chartHeight / 4) * i
            doc.line(chartX, gridY, chartX + chartWidth, gridY)
          }
          
          // Draw axis labels
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(150, 150, 150)
          doc.text(maxValue.toString(), x + 3, chartY + 4)
          doc.text('0', x + 3, chartY + chartHeight + 4)
          
          // Draw line chart
          doc.setDrawColor(color[0], color[1], color[2])
          doc.setFillColor(color[0], color[1], color[2])
          doc.setLineWidth(1.5)
          
          const pointSpacing = chartWidth / (data.length - 1 || 1)
          let pathStarted = false
          let lastX = 0
          let lastY = 0
          
          data.forEach((point, index) => {
            const pointX = chartX + (pointSpacing * index)
            const normalizedValue = ((point.count || 0) - minValue) / valueRange
            const pointY = chartY + chartHeight - (normalizedValue * chartHeight)
            
            // Draw data point
            doc.circle(pointX, pointY, 1.5, 'F')
            
            // Draw line to next point
            if (pathStarted) {
              doc.line(lastX, lastY, pointX, pointY)
            }
            
            lastX = pointX
            lastY = pointY
            pathStarted = true
          })
          
          // Draw title
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(50, 50, 50)
          doc.text(title, x + width / 2, y + height - 3, { align: 'center' })
          
          return y + height + 5
        }

        // Trend 1: Content Creation Over Time
        if (analytics.timeSeries.postsCreated && analytics.timeSeries.postsCreated.length > 0) {
          checkPageBreak(lineHeight * 6 + 50)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('1. Content Creation Over Time', margin, yPosition)
          yPosition += 8
          
          const postsData = prepareDailyDataForPDF(analytics.timeSeries.postsCreated)
          const recentData = postsData.slice(-14) // Last 14 days
          
          // Draw chart first
          if (recentData.length > 0) {
            yPosition = drawLineChart(doc, recentData.map(d => ({ date: d.date, count: d.count })), 'Posts Created Over Time', [235, 47, 150], margin, yPosition, pageWidth - margin * 2, 45)
            yPosition += 5
          }
          
          if (recentData.length > 0) {
            const tableWidth = pageWidth - margin * 2
            const dateColWidth = tableWidth * 0.5
            const countColWidth = tableWidth * 0.5
            const countStartX = margin + dateColWidth + 5
            const rowHeight = 7
            
            // Header
            doc.setFillColor(240, 247, 255)
            doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(100, 100, 100)
            doc.text('Date', margin + 5, yPosition + 2)
            doc.text('Posts Created', countStartX, yPosition + 2)
            yPosition += rowHeight
            
            // Show last 14 days
            recentData.forEach((item, index) => {
              checkPageBreak(rowHeight + 2)
              
              if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252)
                doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              }
              
              doc.setDrawColor(230, 230, 230)
              doc.setLineWidth(0.2)
              doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              
              doc.setFontSize(9)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(60, 60, 60)
              doc.text(formatDateForPDF(item.date), margin + 5, yPosition + 2)
              
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(235, 47, 150) // Pink color matching chart
              doc.text(item.count.toString(), countStartX, yPosition + 2)
              
              yPosition += rowHeight
            })
            
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            yPosition += 10
          }
        }

        // Trend 2: Publishing vs Scheduling
        if ((analytics.timeSeries.publishedPosts && analytics.timeSeries.publishedPosts.length > 0) ||
            (analytics.timeSeries.scheduledPosts && analytics.timeSeries.scheduledPosts.length > 0)) {
          checkPageBreak(lineHeight * 6 + 50)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('2. Publishing vs Scheduling', margin, yPosition)
          yPosition += 8
          
          const mergedData = mergeTimeSeriesForPDF(
            analytics.timeSeries.publishedPosts || [],
            analytics.timeSeries.scheduledPosts || [],
            'published',
            'scheduled'
          )
          const recentData = mergedData.slice(-14)
          
          // Draw comparison chart
          if (recentData.length > 0) {
            // Draw published line
            yPosition = drawLineChart(doc, recentData.map(d => ({ date: d.date, count: (d as any).published || 0 })), 'Published vs Scheduled', [82, 196, 26], margin, yPosition, pageWidth - margin * 2, 45)
            
            // Draw scheduled line on same chart
            const scheduledData = recentData.map(d => ({ date: d.date, count: (d as any).scheduled || 0 }))
            const maxValue = Math.max(...scheduledData.map(d => d.count || 0), 1)
            const minValue = Math.min(...scheduledData.map(d => d.count || 0), 0)
            const valueRange = maxValue - minValue || 1
            
            const chartPadding = 8
            const chartX = margin + chartPadding
            const chartY = yPosition - 45 + chartPadding
            const chartWidth = (pageWidth - margin * 2) - chartPadding * 2
            const chartHeight = 45 - chartPadding * 2 - 10
            
            doc.setDrawColor(250, 173, 20)
            doc.setFillColor(250, 173, 20)
            doc.setLineWidth(1.5)
            
            const pointSpacing = chartWidth / (scheduledData.length - 1 || 1)
            let pathStarted = false
            let lastX = 0
            let lastY = 0
            
            scheduledData.forEach((point, index) => {
              const pointX = chartX + (pointSpacing * index)
              const normalizedValue = ((point.count || 0) - minValue) / valueRange
              const pointY = chartY + chartHeight - (normalizedValue * chartHeight)
              
              doc.circle(pointX, pointY, 1.5, 'F')
              if (pathStarted) {
                doc.line(lastX, lastY, pointX, pointY)
              }
              lastX = pointX
              lastY = pointY
              pathStarted = true
            })
            
            // Add legend
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setFillColor(82, 196, 26)
            doc.circle(margin + 10, yPosition - 8, 2, 'F')
            doc.setTextColor(100, 100, 100)
            doc.text('Published', margin + 15, yPosition - 6)
            
            doc.setFillColor(250, 173, 20)
            doc.circle(margin + 50, yPosition - 8, 2, 'F')
            doc.text('Scheduled', margin + 55, yPosition - 6)
            
            yPosition += 5
          }
          
          if (recentData.length > 0) {
            const tableWidth = pageWidth - margin * 2
            const dateColWidth = tableWidth * 0.35
            const publishedColWidth = tableWidth * 0.32
            const scheduledColWidth = tableWidth * 0.33
            const publishedStartX = margin + dateColWidth + 5
            const scheduledStartX = publishedStartX + publishedColWidth + 5
            const rowHeight = 7
            
            // Header
            doc.setFillColor(240, 247, 255)
            doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            doc.line(publishedStartX - 3, yPosition - 5, publishedStartX - 3, yPosition + rowHeight - 5)
            doc.line(scheduledStartX - 3, yPosition - 5, scheduledStartX - 3, yPosition + rowHeight - 5)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(100, 100, 100)
            doc.text('Date', margin + 5, yPosition + 2)
            doc.text('Published', publishedStartX, yPosition + 2)
            doc.text('Scheduled', scheduledStartX, yPosition + 2)
            yPosition += rowHeight
            
            recentData.forEach((item: any, index) => {
              checkPageBreak(rowHeight + 2)
              
              if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252)
                doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              }
              
              doc.setDrawColor(230, 230, 230)
              doc.setLineWidth(0.2)
              doc.line(publishedStartX - 3, yPosition - 5, publishedStartX - 3, yPosition + rowHeight - 5)
              doc.line(scheduledStartX - 3, yPosition - 5, scheduledStartX - 3, yPosition + rowHeight - 5)
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              
              doc.setFontSize(9)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(60, 60, 60)
              doc.text(formatDateForPDF(item.date), margin + 5, yPosition + 2)
              
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(82, 196, 26) // Green for published
              doc.text((item.published || 0).toString(), publishedStartX, yPosition + 2)
              
              doc.setTextColor(250, 173, 20) // Orange for scheduled
              doc.text((item.scheduled || 0).toString(), scheduledStartX, yPosition + 2)
              
              yPosition += rowHeight
            })
            
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            yPosition += 10
          }
        }

        // Trend 3: AI Generation Activity
        if (analytics.timeSeries.aiContent && analytics.timeSeries.aiContent.length > 0) {
          checkPageBreak(lineHeight * 6 + 50)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('3. AI Generation Activity', margin, yPosition)
          yPosition += 8
          
          const aiData = prepareDailyDataForPDF(analytics.timeSeries.aiContent)
          const recentData = aiData.slice(-14)
          
          // Draw chart first
          if (recentData.length > 0) {
            yPosition = drawLineChart(doc, recentData.map(d => ({ date: d.date, count: d.count })), 'AI Content Generated Over Time', [19, 194, 194], margin, yPosition, pageWidth - margin * 2, 45)
            yPosition += 5
          }
          
          if (recentData.length > 0) {
            const tableWidth = pageWidth - margin * 2
            const dateColWidth = tableWidth * 0.5
            const countColWidth = tableWidth * 0.5
            const countStartX = margin + dateColWidth + 5
            const rowHeight = 7
            
            // Header
            doc.setFillColor(240, 247, 255)
            doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(100, 100, 100)
            doc.text('Date', margin + 5, yPosition + 2)
            doc.text('AI Pieces Generated', countStartX, yPosition + 2)
            yPosition += rowHeight
            
            recentData.forEach((item, index) => {
              checkPageBreak(rowHeight + 2)
              
              if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252)
                doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              }
              
              doc.setDrawColor(230, 230, 230)
              doc.setLineWidth(0.2)
              doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              
              doc.setFontSize(9)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(60, 60, 60)
              doc.text(formatDateForPDF(item.date), margin + 5, yPosition + 2)
              
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(19, 194, 194) // Cyan color matching chart
              doc.text(item.count.toString(), countStartX, yPosition + 2)
              
              yPosition += rowHeight
            })
            
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            yPosition += 10
          }
        }

        // Trend 4: Publishing Method Trend
        if ((analytics.timeSeries.calendarPublishes && analytics.timeSeries.calendarPublishes.length > 0) ||
            (analytics.timeSeries.directPublishes && analytics.timeSeries.directPublishes.length > 0)) {
          checkPageBreak(lineHeight * 6 + 50)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('4. Publishing Method Trend', margin, yPosition)
          yPosition += 8
          
          const mergedData = mergeTimeSeriesForPDF(
            analytics.timeSeries.calendarPublishes || [],
            analytics.timeSeries.directPublishes || [],
            'calendar',
            'direct'
          )
          const recentData = mergedData.slice(-14)
          
          // Draw comparison chart
          if (recentData.length > 0) {
            // Draw calendar line
            yPosition = drawLineChart(doc, recentData.map(d => ({ date: d.date, count: (d as any).calendar || 0 })), 'Calendar vs Direct Publishing', [114, 46, 209], margin, yPosition, pageWidth - margin * 2, 45)
            
            // Draw direct line on same chart
            const directData = recentData.map(d => ({ date: d.date, count: (d as any).direct || 0 }))
            const maxValue = Math.max(...directData.map(d => d.count || 0), 1)
            const minValue = Math.min(...directData.map(d => d.count || 0), 0)
            const valueRange = maxValue - minValue || 1
            
            const chartPadding = 8
            const chartX = margin + chartPadding
            const chartY = yPosition - 45 + chartPadding
            const chartWidth = (pageWidth - margin * 2) - chartPadding * 2
            const chartHeight = 45 - chartPadding * 2 - 10
            
            doc.setDrawColor(255, 77, 79)
            doc.setFillColor(255, 77, 79)
            doc.setLineWidth(1.5)
            
            const pointSpacing = chartWidth / (directData.length - 1 || 1)
            let pathStarted = false
            let lastX = 0
            let lastY = 0
            
            directData.forEach((point, index) => {
              const pointX = chartX + (pointSpacing * index)
              const normalizedValue = ((point.count || 0) - minValue) / valueRange
              const pointY = chartY + chartHeight - (normalizedValue * chartHeight)
              
              doc.circle(pointX, pointY, 1.5, 'F')
              if (pathStarted) {
                doc.line(lastX, lastY, pointX, pointY)
              }
              lastX = pointX
              lastY = pointY
              pathStarted = true
            })
            
            // Add legend
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setFillColor(114, 46, 209)
            doc.circle(margin + 10, yPosition - 8, 2, 'F')
            doc.setTextColor(100, 100, 100)
            doc.text('Calendar', margin + 15, yPosition - 6)
            
            doc.setFillColor(255, 77, 79)
            doc.circle(margin + 50, yPosition - 8, 2, 'F')
            doc.text('Direct', margin + 55, yPosition - 6)
            
            yPosition += 5
          }
          
          if (recentData.length > 0) {
            const tableWidth = pageWidth - margin * 2
            const dateColWidth = tableWidth * 0.35
            const calendarColWidth = tableWidth * 0.32
            const directColWidth = tableWidth * 0.33
            const calendarStartX = margin + dateColWidth + 5
            const directStartX = calendarStartX + calendarColWidth + 5
            const rowHeight = 7
            
            // Header
            doc.setFillColor(240, 247, 255)
            doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            doc.line(calendarStartX - 3, yPosition - 5, calendarStartX - 3, yPosition + rowHeight - 5)
            doc.line(directStartX - 3, yPosition - 5, directStartX - 3, yPosition + rowHeight - 5)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(100, 100, 100)
            doc.text('Date', margin + 5, yPosition + 2)
            doc.text('Calendar', calendarStartX, yPosition + 2)
            doc.text('Direct', directStartX, yPosition + 2)
            yPosition += rowHeight
            
            recentData.forEach((item: any, index) => {
              checkPageBreak(rowHeight + 2)
              
              if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252)
                doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              }
              
              doc.setDrawColor(230, 230, 230)
              doc.setLineWidth(0.2)
              doc.line(calendarStartX - 3, yPosition - 5, calendarStartX - 3, yPosition + rowHeight - 5)
              doc.line(directStartX - 3, yPosition - 5, directStartX - 3, yPosition + rowHeight - 5)
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              
              doc.setFontSize(9)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(60, 60, 60)
              doc.text(formatDateForPDF(item.date), margin + 5, yPosition + 2)
              
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(114, 46, 209) // Purple for calendar
              doc.text((item.calendar || 0).toString(), calendarStartX, yPosition + 2)
              
              doc.setTextColor(24, 144, 255) // Blue for direct
              doc.text((item.direct || 0).toString(), directStartX, yPosition + 2)
              
              yPosition += rowHeight
            })
            
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            yPosition += 10
          }
        }

        // Trend 5: User Interaction Activity
        if ((analytics.timeSeries.conversations && analytics.timeSeries.conversations.length > 0) ||
            (analytics.timeSeries.events && analytics.timeSeries.events.length > 0)) {
          checkPageBreak(lineHeight * 6)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('5. User Interaction Activity', margin, yPosition)
          yPosition += 8
          
          const mergedData = mergeTimeSeriesForPDF(
            analytics.timeSeries.conversations || [],
            analytics.timeSeries.events || [],
            'chatSessions',
            'events'
          )
          const recentData = mergedData.slice(-14)
          
          if (recentData.length > 0) {
            const tableWidth = pageWidth - margin * 2
            const dateColWidth = tableWidth * 0.35
            const chatColWidth = tableWidth * 0.32
            const eventsColWidth = tableWidth * 0.33
            const chatStartX = margin + dateColWidth + 5
            const eventsStartX = chatStartX + chatColWidth + 5
            const rowHeight = 7
            
            // Header
            doc.setFillColor(240, 247, 255)
            doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            doc.line(chatStartX - 3, yPosition - 5, chatStartX - 3, yPosition + rowHeight - 5)
            doc.line(eventsStartX - 3, yPosition - 5, eventsStartX - 3, yPosition + rowHeight - 5)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(100, 100, 100)
            doc.text('Date', margin + 5, yPosition + 2)
            doc.text('AI Chat', chatStartX, yPosition + 2)
            doc.text('Events', eventsStartX, yPosition + 2)
            yPosition += rowHeight
            
            recentData.forEach((item: any, index) => {
              checkPageBreak(rowHeight + 2)
              
              if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252)
                doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              }
              
              doc.setDrawColor(230, 230, 230)
              doc.setLineWidth(0.2)
              doc.line(chatStartX - 3, yPosition - 5, chatStartX - 3, yPosition + rowHeight - 5)
              doc.line(eventsStartX - 3, yPosition - 5, eventsStartX - 3, yPosition + rowHeight - 5)
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              
              doc.setFontSize(9)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(60, 60, 60)
              doc.text(formatDateForPDF(item.date), margin + 5, yPosition + 2)
              
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(250, 140, 22) // Orange for chat
              doc.text((item.chatSessions || 0).toString(), chatStartX, yPosition + 2)
              
              doc.setTextColor(235, 47, 150) // Pink for events
              doc.text((item.events || 0).toString(), eventsStartX, yPosition + 2)
              
              yPosition += rowHeight
            })
            
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            yPosition += 12
          }
        }
      }

      // Advanced Analytics Summary with styled sections
      if (analytics.advancedAnalytics) {
        addSectionHeader('Advanced Analytics Summary')

        // Content Velocity Funnel
        if (analytics.advancedAnalytics.contentVelocityFunnel) {
          const funnel = analytics.advancedAnalytics.contentVelocityFunnel
          checkPageBreak(lineHeight * 6)
          
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('Content Velocity Funnel', margin, yPosition)
          yPosition += 8
          
          // Draw funnel data as a table with better alignment
          const funnelData = [
            ['Stage', 'Count'],
            ['Ideation', funnel.ideation.toString()],
            ['Planning', funnel.planning.toString()],
            ['Live', funnel.live.toString()],
            ['Conversion Rate', `${funnel.conversionRate.toFixed(1)}%`]
          ]
          
          const rowHeight = 8
          const tableWidth = pageWidth - margin * 2
          const stageColWidth = tableWidth * 0.65
          const countColWidth = tableWidth * 0.35
          const countStartX = margin + stageColWidth + 5
          
          funnelData.forEach(([label, value], index) => {
            checkPageBreak(rowHeight + 2)
            
            if (index === 0) {
              // Header row
              doc.setFillColor(240, 247, 255)
              doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              doc.setDrawColor(200, 200, 200)
              doc.setLineWidth(0.3)
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(9)
              doc.setTextColor(100, 100, 100)
              doc.text(label, margin + 5, yPosition + 2)
              doc.text(value, countStartX, yPosition + 2)
            } else {
              if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252)
                doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              }
              
              // Vertical separator
              doc.setDrawColor(230, 230, 230)
              doc.setLineWidth(0.2)
              doc.line(countStartX - 3, yPosition - 5, countStartX - 3, yPosition + rowHeight - 5)
              
              // Horizontal border
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              
              doc.setFont('helvetica', index === funnelData.length - 1 ? 'bold' : 'normal')
              doc.setFontSize(10)
              doc.setTextColor(index === funnelData.length - 1 ? 24 : 60, index === funnelData.length - 1 ? 144 : 60, index === funnelData.length - 1 ? 255 : 60)
              doc.text(label, margin + 5, yPosition + 2)
              doc.text(value, countStartX, yPosition + 2)
            }
            
            yPosition += rowHeight
          })
          
          // Bottom border
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          yPosition += 12
        }

        // AI Efficiency
        if (analytics.advancedAnalytics.aiEfficiency) {
          const aiEff = analytics.advancedAnalytics.aiEfficiency
          checkPageBreak(lineHeight * 7)
          
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('AI Efficiency & ROI', margin, yPosition)
          yPosition += 8
          
          const efficiencyData = [
            ['Metric', 'Value'],
            ['Time Saved', `${aiEff.timeSavedHours.toFixed(1)} hours`],
            ['Efficiency Ratio', aiEff.efficiencyRatio.toFixed(2).toString()],
            ['Avg Processing Time', `${aiEff.avgProcessingTime.toFixed(1)}s`],
            ['Total AI Posts', aiEff.totalAIPosts.toString()]
          ]
          
          const rowHeight = 8
          const tableWidth = pageWidth - margin * 2
          const metricColWidth = tableWidth * 0.65
          const valueColWidth = tableWidth * 0.35
          const valueStartX = margin + metricColWidth + 5
          
          efficiencyData.forEach(([label, value], index) => {
            checkPageBreak(rowHeight + 2)
            
            if (index === 0) {
              // Header row
              doc.setFillColor(240, 247, 255)
              doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              doc.setDrawColor(200, 200, 200)
              doc.setLineWidth(0.3)
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              doc.line(valueStartX - 3, yPosition - 5, valueStartX - 3, yPosition + rowHeight - 5)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(9)
              doc.setTextColor(100, 100, 100)
              doc.text(label, margin + 5, yPosition + 2)
              doc.text(value, valueStartX, yPosition + 2)
            } else {
              if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252)
                doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
              }
              
              // Vertical separator
              doc.setDrawColor(230, 230, 230)
              doc.setLineWidth(0.2)
              doc.line(valueStartX - 3, yPosition - 5, valueStartX - 3, yPosition + rowHeight - 5)
              
              // Horizontal border
              doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
              
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(10)
              doc.setTextColor(60, 60, 60)
              doc.text(label, margin + 5, yPosition + 2)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(24, 144, 255)
              doc.text(value, valueStartX, yPosition + 2)
            }
            
            yPosition += rowHeight
          })
          
          // Bottom border
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          yPosition += 12
        }

        // Cross-Platform Strategy
        if (analytics.advancedAnalytics.crossPlatformStrategy && analytics.advancedAnalytics.crossPlatformStrategy.length > 0) {
          checkPageBreak(lineHeight * 6)
          
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(25, 25, 25)
          doc.text('Cross-Platform Strategy', margin, yPosition)
          yPosition += 8
          
          const headerRow = ['Platform', 'Planned', 'Published']
          const rowHeight = 8
          const tableWidth = pageWidth - margin * 2
          const platformColWidth = tableWidth * 0.45
          const plannedColWidth = tableWidth * 0.27
          const publishedColWidth = tableWidth * 0.28
          const plannedStartX = margin + platformColWidth + 5
          const publishedStartX = plannedStartX + plannedColWidth + 5
          
          // Header
          doc.setFillColor(240, 247, 255)
          doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          doc.line(plannedStartX - 3, yPosition - 5, plannedStartX - 3, yPosition + rowHeight - 5)
          doc.line(publishedStartX - 3, yPosition - 5, publishedStartX - 3, yPosition + rowHeight - 5)
          
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 100, 100)
          doc.text(headerRow[0], margin + 5, yPosition + 2)
          doc.text(headerRow[1], plannedStartX, yPosition + 2)
          doc.text(headerRow[2], publishedStartX, yPosition + 2)
          yPosition += rowHeight
          
          // Data rows
          analytics.advancedAnalytics.crossPlatformStrategy.slice(0, 5).forEach((platform: any, index: number) => {
            checkPageBreak(rowHeight + 2)
            
            if (index % 2 === 0) {
              doc.setFillColor(252, 252, 252)
              doc.rect(margin, yPosition - 5, tableWidth, rowHeight, 'F')
            }
            
            // Vertical separators
            doc.setDrawColor(230, 230, 230)
            doc.setLineWidth(0.2)
            doc.line(plannedStartX - 3, yPosition - 5, plannedStartX - 3, yPosition + rowHeight - 5)
            doc.line(publishedStartX - 3, yPosition - 5, publishedStartX - 3, yPosition + rowHeight - 5)
            
            // Horizontal border
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(60, 60, 60)
            const platformName = platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)
            doc.text(platformName, margin + 5, yPosition + 2)
            doc.text(platform.planned.toString(), plannedStartX, yPosition + 2)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(24, 144, 255)
            doc.text(platform.published.toString(), publishedStartX, yPosition + 2)
            
            yPosition += rowHeight
          })
          
          // Bottom border
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
          yPosition += 12
        }
      }

      // Enhanced Footer on each page
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        
        // Draw footer background
        doc.setFillColor(248, 249, 250)
        doc.rect(0, pageHeight - 18, pageWidth, 18, 'F')
        
        // Draw footer top border
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.5)
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)
        
        // Page number and branding with better styling
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(24, 144, 255)
        doc.text('Generated by Melo Analytics', margin, pageHeight - 10)
        
        // Add report date on right
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120, 120, 120)
        doc.text(new Date().toLocaleDateString(), pageWidth - margin, pageHeight - 10, { align: 'right' })
      }

      // Save PDF
      const fileName = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      message.success('Analytics report exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      message.error('Failed to export analytics report')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setRefreshing(false)
        return
      }

      // Add cache-busting timestamp to force fresh data
      const timestamp = Date.now()

      // Fetch analytics with cache-busting
      const analyticsResponse = await fetch(`/api/analytics?_=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      })

      if (!analyticsResponse.ok) {
        // Try to extract error message from response
        let errorMessage = 'Failed to fetch analytics'
        try {
          const errorData = await analyticsResponse.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = analyticsResponse.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const analyticsData = await analyticsResponse.json()
      if (analyticsData.success && analyticsData.analytics) {
        // Ensure events time series exists
        if (!analyticsData.analytics.timeSeries.events) {
          analyticsData.analytics.timeSeries.events = []
        }
        // Ensure totalEvents exists
        if (analyticsData.analytics.overview.totalEvents === undefined) {
          analyticsData.analytics.overview.totalEvents = 0
        }
        // Normalize timeSeries to ensure all required properties exist
        const normalizedTimeSeries = {
          postsCreated: analyticsData.analytics.timeSeries?.postsCreated || [],
          publishedPosts: analyticsData.analytics.timeSeries?.publishedPosts || [],
          scheduledPosts: analyticsData.analytics.timeSeries?.scheduledPosts || [],
          aiContent: analyticsData.analytics.timeSeries?.aiContent || [],
          calendarPublishes: analyticsData.analytics.timeSeries?.calendarPublishes || [],
          directPublishes: analyticsData.analytics.timeSeries?.directPublishes || [],
          conversations: analyticsData.analytics.timeSeries?.conversations || [],
          events: analyticsData.analytics.timeSeries?.events || [],
          campaigns: analyticsData.analytics.timeSeries?.campaigns || [],
          calendarItems: analyticsData.analytics.timeSeries?.calendarItems || [],
          posts: analyticsData.analytics.timeSeries?.posts || [],
          linkedInPosts: analyticsData.analytics.timeSeries?.linkedInPosts || [],
          mediaFiles: analyticsData.analytics.timeSeries?.mediaFiles || [],
        }
        // Update lastUpdated to current time when refreshing
        setAnalytics({
          ...analyticsData.analytics,
          timeSeries: normalizedTimeSeries,
          lastUpdated: new Date().toISOString()
        })
      }

      // Fetch best time analytics with cache-busting
      const platform = selectedBestTimePlatform !== 'all' ? selectedBestTimePlatform : undefined
      const params = new URLSearchParams()
      if (platform) {
        params.append('platform', platform)
      }
      if (selectedYear) {
        params.append('year', selectedYear.toString())
      }
      if (selectedMonth) {
        params.append('month', selectedMonth.toString())
      }
      params.append('_', timestamp.toString())
      
      const bestTimeUrl = `/api/analytics/best-time/all?${params.toString()}`
      
      const heatmapParams = new URLSearchParams()
      if (platform) {
        heatmapParams.append('platform', platform)
      }
      heatmapParams.append('metric', selectedHeatmapMetric)
      if (selectedYear) {
        heatmapParams.append('year', selectedYear.toString())
      }
      if (selectedMonth) {
        heatmapParams.append('month', selectedMonth.toString())
      }
      heatmapParams.append('_', timestamp.toString())
      
      const heatmapUrl = `/api/analytics/best-time/heatmap?${heatmapParams.toString()}`
      
      const fetchOptions = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store' as RequestCache,
      }

      const [bestTimeResponse, heatmapResponse] = await Promise.all([
        fetch(bestTimeUrl, fetchOptions),
        fetch(heatmapUrl, fetchOptions),
      ])

      if (bestTimeResponse.ok && heatmapResponse.ok) {
        const bestTimeData = await bestTimeResponse.json()
        const heatmapData = await heatmapResponse.json()
        
        if (bestTimeData.success && bestTimeData.data) {
          setBestTimeData({
            ...bestTimeData.data,
            heatmap: heatmapData.success ? heatmapData.data : bestTimeData.data.heatmap || {},
          })
        } else if (!bestTimeData.success) {
          const errorMessage = bestTimeData.message || 'Failed to fetch best time analytics'
          message.error(errorMessage)
        }
      } else {
        // Handle non-ok responses
        let errorMessage = 'Failed to fetch best time analytics'
        const failedResponse = !bestTimeResponse.ok ? bestTimeResponse : heatmapResponse
        try {
          const errorData = await failedResponse.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = failedResponse.statusText || errorMessage
        }
        message.error(errorMessage)
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh analytics'
      message.error(errorMessage)
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

  // Helper function to prepare cumulative data for charts
  const prepareCumulativeData = (data: Array<{ date: string; count: number }>) => {
    if (!data || data.length === 0) return []
    let cumulative = 0
    return data.map(item => {
      cumulative += item.count || 0
      return {
        date: item.date,
        count: cumulative
      }
    })
  }

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

  // Helper function to prepare daily data for charts (NOT cumulative)
  const prepareDailyData = (data: Array<{ date: string; count: number }>) => {
    if (!data || data.length === 0) {
      return []
    }

    // Sort data by date to ensure chronological order
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

    return sortedData.map((item) => ({
      date: formatDate(item.date),
      count: item.count || 0,
    }))
  }
  
  // Helper function to merge two time series for comparison charts
  const mergeTimeSeries = (
    data1: Array<{ date: string; count: number }>,
    data2: Array<{ date: string; count: number }>,
    label1: string,
    label2: string
  ) => {
    const map = new Map<string, { date: string; [key: string]: number | string }>()
    
    // Add data1
    data1.forEach(item => {
      const dateKey = formatDate(item.date)
      map.set(dateKey, {
        date: dateKey,
        [label1]: item.count || 0,
        [label2]: 0,
      })
    })
    
    // Add/update with data2
    data2.forEach(item => {
      const dateKey = formatDate(item.date)
      const existing = map.get(dateKey) || { date: dateKey, [label1]: 0, [label2]: 0 }
      existing[label2] = item.count || 0
      map.set(dateKey, existing)
    })
    
    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.date as string).getTime()
      const dateB = new Date(b.date as string).getTime()
      return dateA - dateB
    })
  }

  // Calculate insights and trends - MEANINGFUL VERSION
  const calculateInsights = () => {
    const insights: Array<{
      title: string
      value: string | number
      description: string
      icon: React.ReactNode
      trend?: 'up' | 'down' | 'stable'
      percentage?: number
      color?: string
      status?: 'on-track' | 'needs-attention' | 'action-needed'
      priority?: number
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
          title: 'Publishing',
          value: `${publishRate.toFixed(1)}%`,
          trend: publishRate >= 80 ? 'up' : publishRate >= 50 ? 'stable' : 'down',
          percentage: publishRate,
          description: `${overview.publishedPosts} of ${overview.totalPostsGenerated} posts published`,
          icon: <CheckCircleOutlined />,
          color: publishRate >= 80 ? '#52c41a' : publishRate >= 50 ? '#faad14' : '#ff4d4f',
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

    // Insight 5: Direct Posting vs Calendar Posting (Show publishing methods)
    const calendarPublishesTotal = timeSeries.calendarPublishes && timeSeries.calendarPublishes.length > 0
      ? timeSeries.calendarPublishes.reduce((sum, item) => sum + item.count, 0)
      : 0
    const directPublishesTotal = timeSeries.directPublishes && timeSeries.directPublishes.length > 0
      ? timeSeries.directPublishes.reduce((sum, item) => sum + item.count, 0)
      : 0
    
    if (calendarPublishesTotal > 0 || directPublishesTotal > 0) {
      const totalPublishes = calendarPublishesTotal + directPublishesTotal
      
      if (calendarPublishesTotal > directPublishesTotal) {
        insights.push({
          title: 'Publishing Method',
          value: `${calendarPublishesTotal} calendar → ${directPublishesTotal} direct`,
          description: "Most posts are published via calendar (AI-generated content). You're planning ahead well",
          icon: <CalendarOutlined />,
          status: calendarPublishesTotal >= totalPublishes * 0.6 ? 'on-track' : 'needs-attention',
          priority: 5,
        })
      } else if (directPublishesTotal > calendarPublishesTotal) {
        insights.push({
          title: 'Publishing Method',
          value: `${directPublishesTotal} direct → ${calendarPublishesTotal} calendar`,
          description: "More posts are shared directly from social dashboard. Consider using the calendar for AI-generated content planning",
          icon: <GlobalOutlined />,
          status: directPublishesTotal >= totalPublishes * 0.7 ? 'needs-attention' : 'action-needed',
          priority: 5,
        })
      } else if (calendarPublishesTotal > 0 && directPublishesTotal > 0) {
        insights.push({
          title: 'Publishing Method',
          value: `${calendarPublishesTotal} calendar → ${directPublishesTotal} direct`,
          description: "You're using both methods. Calendar posts help with AI-generated content planning",
          icon: <CalendarOutlined />,
          status: 'on-track',
          priority: 5,
        })
      } else if (calendarPublishesTotal > 0) {
        insights.push({
          title: 'Publishing Method',
          value: `${calendarPublishesTotal} via calendar`,
          description: "All posts are published via calendar. Great use of AI-generated content planning!",
          icon: <CalendarOutlined />,
          status: 'on-track',
          priority: 5,
        })
      } else if (directPublishesTotal > 0) {
        insights.push({
          title: 'Publishing Method',
          value: `${directPublishesTotal} direct posts`,
          description: "Posts are shared directly from social dashboard. Try using the calendar for planning",
          icon: <GlobalOutlined />,
          status: 'needs-attention',
          priority: 5,
        })
      }
    }

    // Insight 6: Recent Publishing Activity (Last 7 days)
    if (timeSeries.publishedPosts && timeSeries.publishedPosts.length > 0) {
      const recentPublished = timeSeries.publishedPosts.slice(-7).reduce((sum, item) => sum + item.count, 0)
      if (recentPublished > 0) {
        const avgDaily = Math.round(recentPublished / 7)
        insights.push({
          title: 'Publishing Activity',
          value: `${recentPublished} ${recentPublished === 1 ? 'post' : 'posts'} published this week`,
          description: avgDaily >= 3
            ? "You're publishing content consistently"
            : "Keep publishing regularly to maintain engagement",
          icon: <ThunderboltOutlined />,
          status: avgDaily >= 3 ? 'on-track' : avgDaily >= 1 ? 'needs-attention' : 'action-needed',
          priority: 6,
        })
      }
    }

    // Insight 7: AI Chat Usage (Show engagement with AI)
    const recentChats = timeSeries.conversations && timeSeries.conversations.length > 0
      ? timeSeries.conversations.slice(-7).reduce((sum, item) => sum + item.count, 0)
      : 0
    const totalChats = overview.totalConversations || 0
    
    if (recentChats > 0) {
      insights.push({
        title: 'AI Chat Activity',
        value: `${recentChats} ${recentChats === 1 ? 'conversation' : 'conversations'} this week`,
        description: recentChats >= 5
          ? "You're actively using AI for ideas and content creation"
          : "You're using AI to help with content - keep it up!",
        icon: <MessageOutlined />,
        status: recentChats >= 5 ? 'on-track' : 'needs-attention',
        priority: 6,
      })
    } else if (totalChats > 0) {
      insights.push({
        title: 'AI Chat Activity',
        value: `${totalChats} ${totalChats === 1 ? 'conversation' : 'conversations'} total`,
        description: "Try using AI chat more this week to boost productivity",
        icon: <MessageOutlined />,
        trend: 'stable',
        percentage: 0,
        color: '#1890ff',
      })
    }

    // Scheduling Activity
    if (timeSeries.calendarItems && timeSeries.calendarItems.length > 0) {
      const calendarGrowth = calculateGrowthRate(timeSeries.calendarItems)
      const recentCalendar = timeSeries.calendarItems.slice(-7).reduce((sum, item) => sum + item.count, 0)
      const avgDailyCalendar = recentCalendar / 7 || 0
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

    // Insight 8: Event Planning (Show if events exist)
    const recentEvents = timeSeries.events && timeSeries.events.length > 0
      ? timeSeries.events.slice(-7).reduce((sum, item) => sum + (item.count || 0), 0)
      : 0
    const totalEvents = overview.totalEvents || 0
    
    if (recentEvents > 0) {
      insights.push({
        title: 'Event Planning',
        value: `${recentEvents} ${recentEvents === 1 ? 'event' : 'events'} this week`,
        description: "You're actively planning content moments and campaigns",
        icon: <FundProjectionScreenOutlined />,
        status: 'on-track',
        priority: 8,
      })
    } else if (totalEvents > 0) {
      insights.push({
        title: 'Event Planning',
        value: `${totalEvents} ${totalEvents === 1 ? 'event' : 'events'} created`,
        description: totalEvents >= 3
          ? "You're using events to organize content"
          : "Create more events to plan content campaigns",
        icon: <FundProjectionScreenOutlined />,
        status: totalEvents >= 3 ? 'needs-attention' : 'action-needed',
        priority: 8,
      })
    }

    // Insight 9: Engagement (If available)
    const totalPublishedForEngagement = overview.publishedPosts || 0
    if (overview.totalEngagement && overview.totalEngagement > 0 && totalPublishedForEngagement > 0) {
      const avgEngagement = Math.round(overview.totalEngagement / totalPublishedForEngagement)
      insights.push({
        title: 'Average Engagement',
        value: `${avgEngagement.toLocaleString()} per post`,
        description: totalPublishedForEngagement > 0
          ? `Across ${totalPublishedForEngagement} ${totalPublishedForEngagement === 1 ? 'post' : 'posts'}`
          : "Track how your audience responds to content",
        icon: <HeartOutlined />,
        status: avgEngagement >= 100 ? 'on-track' : avgEngagement >= 50 ? 'needs-attention' : 'action-needed',
        priority: 9,
      })
    }

    // Sort by priority (lower number = higher priority) and return top 8
    return insights.sort((a, b) => (a.priority || 999) - (b.priority || 999)).slice(0, 8)
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
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: isMobile ? 'flex-start' : 'flex-end',
                      gap: 12,
                      alignItems: isMobile ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportPDF}
                      disabled={!analytics}
                      size={isMobile ? 'middle' : undefined}
                      style={{
                        width: isMobile ? 150 : 150,
                        height: 44,
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#1890ff',
                        border: '1px solid #1890ff',
                        color: '#fff',
                      }}
                    >
                      Export Data
                    </Button>
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
                  {(overview as any).bestPostingTimes && (
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
                            <Text style={{ fontSize: 12, color: '#595959' }}>{(overview as any).bestPostingTimes.instagram}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <Text strong style={{ color: '#fa8c16', fontSize: 13, display: 'block', marginBottom: 4 }}>Facebook</Text>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{(overview as any).bestPostingTimes.facebook}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <Text strong style={{ color: '#722ed1', fontSize: 13, display: 'block', marginBottom: 4 }}>Twitter</Text>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{(overview as any).bestPostingTimes.twitter}</Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8' }}>
                            <Text strong style={{ color: '#52c41a', fontSize: 13, display: 'block', marginBottom: 4 }}>Overall Best</Text>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{(overview as any).bestPostingTimes.overall}</Text>
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
                                    <ArrowUpOutlined /> {insight.percentage && insight.percentage > 0 ? `${insight.percentage.toFixed(1)}%` : ''}
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
                                    <ArrowDownOutlined /> {insight.percentage && insight.percentage > 0 ? `${insight.percentage.toFixed(1)}%` : ''}
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

