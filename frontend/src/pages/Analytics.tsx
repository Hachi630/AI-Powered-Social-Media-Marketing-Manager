import { useEffect, useState } from 'react'
import { Layout, Card, Row, Col, Statistic, Spin, Typography, Tag, Space, Button } from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  MessageOutlined,
  FundProjectionScreenOutlined,
  FileTextOutlined,
  LinkedinOutlined,
  RobotOutlined,
  ReloadOutlined,
  BarChartOutlined,
  ShopOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Header from '../components/Header'
import { User } from '../services/authService'

const { Content } = Layout
const { Title, Text } = Typography

interface AnalyticsProps {
  isLoggedIn?: boolean
  onLoginSuccess?: (user: User) => void
  onLogout?: () => void
  user?: User | null
}

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalBrandProfiles: number
    totalCalendarItems: number
    totalConversations: number
    totalCampaigns: number
    totalEvents: number
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
  timeSeries: {
    users: Array<{ date: string; count: number }>
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

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/analytics', {
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
  }

  useEffect(() => {
    fetchAnalytics()
    
    // Auto-refresh every 30 seconds to get latest data
    const interval = setInterval(() => {
      fetchAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalytics()
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

  // Helper function to prepare engagement rate data (conversations vs posts)
  const prepareEngagementRateData = () => {
    if (!timeSeries.conversations || !timeSeries.posts || timeSeries.conversations.length === 0 || timeSeries.posts.length === 0) {
      return []
    }

    // Create a map of dates to combine data
    const dateMap = new Map<string, { conversations: number; posts: number; originalDate: string }>()
    
    timeSeries.conversations.forEach((item) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { conversations: 0, posts: 0, originalDate: item.date })
      }
      dateMap.get(item.date)!.conversations += item.count
    })

    timeSeries.posts.forEach((item) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { conversations: 0, posts: 0, originalDate: item.date })
      }
      dateMap.get(item.date)!.posts += item.count
    })

    return Array.from(dateMap.values())
      .map((data) => ({
        date: formatDate(data.originalDate),
        engagementRate: data.posts > 0 ? (data.conversations / data.posts) * 100 : 0,
        conversations: data.conversations,
        posts: data.posts,
        originalDate: data.originalDate,
      }))
      .sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime())
      .map(({ originalDate, ...rest }) => rest) // Remove originalDate from final output
  }

  // Helper function to prepare event timeline data (upcoming week calendar items)
  const prepareEventTimelineData = () => {
    if (!upcomingWeekEvents || upcomingWeekEvents.length === 0) {
      return []
    }

    // Sort calendar items by date
    const sortedItems = [...upcomingWeekEvents].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

    return sortedItems.map((item) => ({
      date: formatDate(item.date),
      count: item.count,
      originalDate: item.date,
      items: item.items || []
    }))
  }

  // Helper function to prepare media integration trend data
  const prepareMediaIntegrationData = () => {
    if (!timeSeries.mediaFiles || !timeSeries.posts || timeSeries.mediaFiles.length === 0 || timeSeries.posts.length === 0) {
      return []
    }

    // Create a map of dates to combine data
    const dateMap = new Map<string, { mediaFiles: number; posts: number; originalDate: string }>()
    
    timeSeries.mediaFiles.forEach((item) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { mediaFiles: 0, posts: 0, originalDate: item.date })
      }
      dateMap.get(item.date)!.mediaFiles += item.count
    })

    timeSeries.posts.forEach((item) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { mediaFiles: 0, posts: 0, originalDate: item.date })
      }
      dateMap.get(item.date)!.posts += item.count
    })

    return Array.from(dateMap.values())
      .map((data) => ({
        date: formatDate(data.originalDate),
        integrationRate: data.posts > 0 ? (data.mediaFiles / data.posts) * 100 : 0,
        mediaFiles: data.mediaFiles,
        posts: data.posts,
        originalDate: data.originalDate,
      }))
      .sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime())
      .map(({ originalDate, ...rest }) => rest) // Remove originalDate from final output
  }

  // Helper function to prepare events trend data
  const prepareEventsTrendData = () => {
    if (!timeSeries.events || timeSeries.events.length === 0) {
      return []
    }

    // Sort events by date and prepare cumulative data
    const sortedEvents = [...timeSeries.events].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

    let cumulative = 0
    return sortedEvents.map((item) => {
      cumulative += item.count || 0
      return {
        date: formatDate(item.date),
        count: cumulative,
        daily: item.count || 0,
        originalDate: item.date,
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

    // User growth
    if (timeSeries.users && timeSeries.users.length > 0) {
      const userGrowth = calculateGrowthRate(timeSeries.users)
      const recentUsers = timeSeries.users.slice(-7).reduce((sum, item) => sum + item.count, 0)
      insights.push({
        title: 'User Growth (Last 7 Days)',
        value: recentUsers,
        trend: userGrowth > 5 ? 'up' : userGrowth < -5 ? 'down' : 'stable',
        percentage: Math.abs(userGrowth),
        description: userGrowth > 5 
          ? `Growing at ${Math.abs(userGrowth).toFixed(1)}% rate` 
          : userGrowth < -5 
          ? `Declining at ${Math.abs(userGrowth).toFixed(1)}% rate`
          : 'Stable growth',
        icon: <UserOutlined />,
        color: userGrowth > 5 ? '#52c41a' : userGrowth < -5 ? '#ff4d4f' : '#1890ff',
      })
    }

    // Post generation rate
    if (timeSeries.posts && timeSeries.posts.length > 0) {
      const postGrowth = calculateGrowthRate(timeSeries.posts)
      const recentPosts = timeSeries.posts.slice(-7).reduce((sum, item) => sum + item.count, 0)
      const avgDaily = recentPosts / 7 || 0
      insights.push({
        title: 'Post Generation Rate',
        value: `${avgDaily.toFixed(1)}/day`,
        trend: postGrowth > 10 ? 'up' : postGrowth < -10 ? 'down' : 'stable',
        percentage: Math.abs(postGrowth),
        description: postGrowth > 10 
          ? `${Math.abs(postGrowth).toFixed(1)}% increase in post generation`
          : 'Consistent post generation',
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
        title: 'LinkedIn Deployment Rate',
        value: `${deploymentRate.toFixed(1)}%`,
        trend: linkedInGrowth > 5 ? 'up' : 'stable',
        percentage: Math.abs(linkedInGrowth),
        description: `${overview.totalLinkedInPosts} of ${overview.totalPostsGenerated} posts deployed to LinkedIn`,
        icon: <LinkedinOutlined />,
        color: deploymentRate > 50 ? '#52c41a' : '#faad14',
      })
    }

    // AI content efficiency
    if (overview.totalAIGeneratedContent > 0 && overview.totalPostsGenerated > 0) {
      const aiEfficiency = (overview.totalPostsGenerated / overview.totalAIGeneratedContent) * 100
      insights.push({
        title: 'AI Content Efficiency',
        value: `${aiEfficiency.toFixed(1)}%`,
        trend: aiEfficiency > 50 ? 'up' : 'stable',
        percentage: aiEfficiency,
        description: `${aiEfficiency > 50 ? 'High' : 'Moderate'} conversion rate from AI content to posts`,
        icon: <RobotOutlined />,
        color: aiEfficiency > 50 ? '#52c41a' : '#faad14',
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

    // Engagement rate (conversations vs posts)
    if (overview.totalConversations > 0 && overview.totalPostsGenerated > 0) {
      const engagementRate = (overview.totalConversations / overview.totalPostsGenerated) * 100
      insights.push({
        title: 'User Engagement',
        value: `${engagementRate.toFixed(1)}%`,
        trend: engagementRate > 30 ? 'up' : 'stable',
        percentage: engagementRate,
        description: `${overview.totalConversations} conversations generated from ${overview.totalPostsGenerated} posts`,
        icon: <MessageOutlined />,
        color: engagementRate > 30 ? '#52c41a' : '#1890ff',
      })
    }

    // Calendar utilization
    if (timeSeries.calendarItems && timeSeries.calendarItems.length > 0) {
      const calendarGrowth = calculateGrowthRate(timeSeries.calendarItems)
      const recentCalendarItems = timeSeries.calendarItems.slice(-7).reduce((sum, item) => sum + item.count, 0)
      const avgDailyCalendar = recentCalendarItems / 7 || 0
      insights.push({
        title: 'Calendar Utilization',
        value: `${avgDailyCalendar.toFixed(1)}/day`,
        trend: calendarGrowth > 10 ? 'up' : calendarGrowth < -10 ? 'down' : 'stable',
        percentage: Math.abs(calendarGrowth),
        description: calendarGrowth > 10 
          ? `Active calendar planning with ${Math.abs(calendarGrowth).toFixed(1)}% growth`
          : `${overview.totalCalendarItems} total calendar items scheduled`,
        icon: <CalendarOutlined />,
        color: calendarGrowth > 10 ? '#52c41a' : '#1890ff',
      })
    }


    // Brand profile activity
    if (overview.totalBrandProfiles > 0) {
      const postsPerBrand = overview.totalPostsGenerated / overview.totalBrandProfiles
      const eventsPerBrand = (overview.totalEvents || 0) / overview.totalBrandProfiles
      const activityScore = (postsPerBrand + eventsPerBrand) / 2
      insights.push({
        title: 'Brand Profile Activity',
        value: `${activityScore.toFixed(1)}`,
        trend: activityScore > 10 ? 'up' : activityScore > 5 ? 'stable' : 'down',
        percentage: activityScore,
        description: `Average ${postsPerBrand.toFixed(1)} posts and ${eventsPerBrand.toFixed(1)} events per brand`,
        icon: <ShopOutlined />,
        color: activityScore > 10 ? '#52c41a' : activityScore > 5 ? '#1890ff' : '#faad14',
      })
    }

    return insights
  }

  const insights = calculateInsights()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 8 }} />
              Analytics Dashboard
            </Title>
            <Text type="secondary">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
        </div>

        {/* Overview Statistics - Compact Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="Users"
                value={overview.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="Brands"
                value={overview.totalBrandProfiles}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#faad14', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="Calendar"
                value={overview.totalCalendarItems}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="Chats"
                value={overview.totalConversations}
                prefix={<MessageOutlined />}
                valueStyle={{ color: '#722ed1', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="Events"
                value={overview.totalEvents || 0}
                prefix={<FundProjectionScreenOutlined />}
                valueStyle={{ color: '#fa8c16', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="Posts"
                value={overview.totalPostsGenerated}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#eb2f96', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="LinkedIn"
                value={overview.totalLinkedInPosts}
                prefix={<LinkedinOutlined />}
                valueStyle={{ color: '#0077B5', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small" hoverable>
              <Statistic
                title="AI Content"
                value={overview.totalAIGeneratedContent}
                prefix={<RobotOutlined />}
                valueStyle={{ color: '#13c2c2', fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Key Insights Section */}
        {insights.length > 0 && (
          <Card 
            title={
              <Space>
                <ThunderboltOutlined />
                <span>Key Insights & Trends</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[16, 16]}>
              {insights.map((insight, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                  <Card 
                    size="small" 
                    style={{ 
                      borderLeft: `4px solid ${insight.color}`,
                      height: '100%'
                    }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 12, color: '#666' }}>
                          {insight.title}
                        </Text>
                        {insight.trend === 'up' && <ArrowUpOutlined style={{ color: '#52c41a' }} />}
                        {insight.trend === 'down' && <ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
                      </div>
                      <Statistic
                        value={insight.value}
                        valueStyle={{ color: insight.color, fontSize: 18, fontWeight: 'bold' }}
                        prefix={insight.icon}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {insight.description}
                      </Text>
                      {insight.percentage > 0 && (
                        <Tag color={insight.trend === 'up' ? 'green' : insight.trend === 'down' ? 'red' : 'blue'}>
                          {insight.trend === 'up' ? <RiseOutlined /> : insight.trend === 'down' ? <FallOutlined /> : null}
                          {' '}
                          {insight.percentage.toFixed(1)}%
                        </Tag>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Trend Charts */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} sm={12} lg={8}>
                <Card title="Engagement Rate Trend" size="small" style={{ height: '100%' }}>
                  {prepareEngagementRateData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={prepareEngagementRateData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          label={{ value: 'Engagement Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Engagement Rate']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="engagementRate"
                          stroke="#722ed1"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Engagement Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>No engagement data available</Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card title="Media Integration Trend" size="small" style={{ height: '100%' }}>
                  {prepareMediaIntegrationData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={prepareMediaIntegrationData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          label={{ value: 'Integration Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Integration Rate']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="integrationRate"
                          stroke="#f5222d"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Integration Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>No media integration data available</Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card title="Event Timeline" size="small" style={{ height: '100%' }}>
                  {prepareEventTimelineData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={prepareEventTimelineData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }} 
                          angle={prepareEventTimelineData().length > 5 ? -45 : 0}
                          textAnchor={prepareEventTimelineData().length > 5 ? "end" : "middle"}
                          height={prepareEventTimelineData().length > 5 ? 60 : 30}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }} 
                          label={{ value: 'Events', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => {
                            if (name === 'count') {
                              const itemDetails = props.payload.items?.slice(0, 3).map((item: any) => 
                                `${item.title} (${item.platform}${item.time ? ` - ${item.time}` : ''})`
                              ).join(', ') || ''
                              const moreItems = props.payload.items?.length > 3 ? ` and ${props.payload.items.length - 3} more` : ''
                              return [
                                <div key="tooltip">
                                  <div>{value} event{value !== 1 ? 's' : ''} scheduled</div>
                                  {itemDetails && (
                                    <div style={{ fontSize: 10, marginTop: 4, maxWidth: 200 }}>
                                      {itemDetails}{moreItems}
                                    </div>
                                  )}
                                </div>,
                                'Events'
                              ]
                            }
                            return [value, name]
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#fa8c16"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Events"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>No upcoming events in the next 7 days</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Card>
        )}

        {/* Time Series Charts - Compact Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <Card title="Users Growth" size="small" style={{ height: '100%' }}>
              {timeSeries.users.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={prepareCumulativeData(timeSeries.users)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <Card title="Posts Generated" size="small" style={{ height: '100%' }}>
              {timeSeries.posts.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={prepareCumulativeData(timeSeries.posts)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#eb2f96"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <Card title="LinkedIn Posts" size="small" style={{ height: '100%' }}>
              {timeSeries.linkedInPosts && timeSeries.linkedInPosts.length > 0 ? (
                (() => {
                  const chartData = prepareCumulativeData(timeSeries.linkedInPosts)
                  console.log('LinkedIn Posts Chart Data:', chartData)
                  
                  if (chartData.length === 0) {
                    return (
                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>No chart data available</Text>
                      </div>
                    )
                  }
                  
                  // Ensure we have valid numeric values
                  const validData = chartData.filter(item => typeof item.count === 'number' && !isNaN(item.count))
                  
                  if (validData.length === 0) {
                    return (
                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Invalid data format</Text>
                      </div>
                    )
                  }
                  
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={validData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          angle={validData.length > 5 ? -45 : 0}
                          textAnchor={validData.length > 5 ? "end" : "middle"}
                          height={validData.length > 5 ? 60 : 30}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          allowDecimals={false}
                          domain={[0, 'auto']}
                        />
                        <Tooltip 
                          formatter={(value: number) => [value, 'Cumulative Posts']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#0077B5"
                          strokeWidth={2}
                          dot={{ r: validData.length <= 10 ? 4 : 2 }}
                          activeDot={{ r: 6 }}
                          isAnimationActive={true}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )
                })()
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {timeSeries.linkedInPosts ? 'No LinkedIn posts data' : 'Loading...'}
                  </Text>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <Card title="AI Content" size="small" style={{ height: '100%' }}>
              {timeSeries.aiContent.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={prepareCumulativeData(timeSeries.aiContent)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#13c2c2"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <Card title="Conversations" size="small" style={{ height: '100%' }}>
              {timeSeries.conversations.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={prepareCumulativeData(timeSeries.conversations)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#722ed1"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Breakdown Cards - Compact */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card title="Posts by Platform" size="small" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {Object.entries(breakdown.postsByPlatform).map(([platform, count]) => (
                  <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                    <Tag color="blue" style={{ textTransform: 'capitalize', margin: 0 }}>
                      {platform}
                    </Tag>
                    <Text strong style={{ fontSize: 14 }}>{count}</Text>
                  </div>
                ))}
                {Object.keys(breakdown.postsByPlatform).length === 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>No posts yet</Text>
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card title="Posts by Status" size="small" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {Object.entries(breakdown.postsByStatus).map(([status, count]) => {
                  const colorMap: Record<string, string> = {
                    published: 'green',
                    draft: 'orange',
                    scheduled: 'blue',
                    failed: 'red',
                  }
                  return (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <Tag color={colorMap[status] || 'default'} style={{ textTransform: 'capitalize', margin: 0 }}>
                        {status}
                      </Tag>
                      <Text strong style={{ fontSize: 14 }}>{count}</Text>
                    </div>
                  )
                })}
                {Object.keys(breakdown.postsByStatus).length === 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>No posts yet</Text>
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card title="AI Content by Type" size="small" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {Object.entries(breakdown.aiContentByType).map(([type, count]) => {
                  const typeLabels: Record<string, string> = {
                    text: 'Text Responses',
                    image: 'Generated Images',
                    content_plan: 'Content Plans',
                    suggestion: 'Suggestions',
                    summary: 'Summaries',
                    translation: 'Translations',
                  }
                  return (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <Tag color="purple" style={{ margin: 0 }}>
                        {typeLabels[type] || type}
                      </Tag>
                      <Text strong style={{ fontSize: 14 }}>{count}</Text>
                    </div>
                  )
                })}
                {Object.keys(breakdown.aiContentByType).length === 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>No AI content yet</Text>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity - Compact */}
        {recentActivity.length > 0 && (
          <Card title="Recent Activity (Last 7 Days)" size="small" style={{ marginTop: 24 }}>
            <Row gutter={[8, 8]}>
              {recentActivity.map((activity) => (
                <Col xs={12} sm={8} md={6} lg={3} key={activity.date}>
                  <div style={{ textAlign: 'center', padding: '8px', background: '#f5f5f5', borderRadius: 4 }}>
                    <Text strong style={{ display: 'block', fontSize: 16, color: '#1890ff' }}>
                      {activity.count}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </Content>
    </Layout>
  )
}

