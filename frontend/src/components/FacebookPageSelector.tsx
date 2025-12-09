import { Card, Button, Spin, message, Typography, Tag, Space } from 'antd'
import { CheckCircleOutlined, InstagramOutlined, FacebookOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { calendarService } from '../services/calendarService'
import styles from './FacebookPageSelector.module.css'

const { Title, Text } = Typography

interface FacebookPage {
  id: string
  name: string
  category: string
  hasInstagramAccount: boolean
  instagramUsername?: string
}

export default function FacebookPageSelector() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const tokenKey = searchParams.get('token_key')

  useEffect(() => {
    if (!tokenKey) {
      message.error('Missing token key. Please reconnect your account.')
      navigate('/settings')
      return
    }

    loadPages()
  }, [tokenKey, navigate])

  const loadPages = async () => {
    if (!tokenKey) return

    try {
      setLoading(true)
      const response = await calendarService.getFacebookPages(tokenKey)

      if (response.success && response.pages) {
        // Filter to only show pages with Instagram accounts
        const pagesWithInstagram = response.pages.filter((page) => page.hasInstagramAccount)
        
        if (pagesWithInstagram.length === 0) {
          message.warning('No Facebook Pages with Instagram Business Accounts found. Please connect an Instagram Business Account to your Facebook Page first.')
          navigate('/settings')
          return
        }

        setPages(pagesWithInstagram)
      } else {
        message.error(response.message || 'Failed to load Facebook Pages')
        navigate('/settings')
      }
    } catch (error) {
      console.error('Error loading pages:', error)
      message.error('Failed to load Facebook Pages')
      navigate('/settings')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!selectedPageId || !tokenKey) {
      message.error('Please select a Facebook Page')
      return
    }

    try {
      setConnecting(true)
      const response = await calendarService.connectFacebookPage(selectedPageId, tokenKey)

      if (response.success) {
        message.success(
          `Successfully connected! Instagram: @${response.instagram?.username}, Facebook Page: ${response.facebook?.pageName}`
        )
        // Redirect to Facebook Page management page
        if (response.redirectUrl) {
          setTimeout(() => {
            window.location.href = response.redirectUrl!
          }, 1500)
        } else {
          // Fallback to settings page if no redirect URL
          setTimeout(() => {
            window.location.href = '/settings?instagram_connected=true'
          }, 1500)
        }
      } else {
        message.error(response.message || 'Failed to connect page')
      }
    } catch (error) {
      console.error('Error connecting page:', error)
      message.error('Failed to connect page')
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text>Loading your Facebook Pages...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Title level={2}>Select Facebook Page</Title>
        <Text type="secondary" className={styles.description}>
          Select the Facebook Page you want to connect. This will also connect the associated Instagram Business Account.
        </Text>

        <div className={styles.pagesList}>
          {pages.map((page) => (
            <Card
              key={page.id}
              className={`${styles.pageCard} ${selectedPageId === page.id ? styles.selected : ''}`}
              hoverable
              onClick={() => setSelectedPageId(page.id)}
            >
              <div className={styles.pageContent}>
                <div className={styles.pageInfo}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className={styles.pageHeader}>
                      <FacebookOutlined className={styles.icon} />
                      <Title level={4} style={{ margin: 0 }}>
                        {page.name}
                      </Title>
                      {selectedPageId === page.id && (
                        <CheckCircleOutlined className={styles.checkIcon} />
                      )}
                    </div>
                    {page.category && (
                      <Tag color="blue">{page.category}</Tag>
                    )}
                    {page.hasInstagramAccount && page.instagramUsername && (
                      <div className={styles.instagramInfo}>
                        <InstagramOutlined className={styles.icon} />
                        <Text>Instagram: @{page.instagramUsername}</Text>
                      </div>
                    )}
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className={styles.actions}>
          <Button onClick={() => navigate('/settings')}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleConnect}
            disabled={!selectedPageId || connecting}
            loading={connecting}
          >
            Connect Selected Page
          </Button>
        </div>
      </Card>
    </div>
  )
}

