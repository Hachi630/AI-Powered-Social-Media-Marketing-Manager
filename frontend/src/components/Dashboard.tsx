import { Layout, Typography } from 'antd'
import { useState, useCallback } from 'react'
import ChatBox from './ChatBox'
import Header, { type HeaderProps } from './Header'
import Sidebar from './Sidebar'
import styles from './Dashboard.module.css'
import { DEFAULT_TAGLINE } from '../constants/assets'
import { User } from '../services/authService'

interface DashboardProps {
  isLoggedIn?: boolean
  heroTitle?: string
  tagline?: string
  background?: 'default' | 'light'
  headerOverrides?: Partial<HeaderProps>
  onLoginSuccess?: (user: User) => void
  onLogout?: () => void
  user?: User | null
}

const { Content, Sider } = Layout

const defaultHero = 'What Can I Do For You Today?'

export default function Dashboard({
  isLoggedIn = false,
  heroTitle = defaultHero,
  tagline = DEFAULT_TAGLINE,
  background = 'default',
  headerOverrides,
  onLoginSuccess,
  onLogout,
  user,
}: DashboardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [conversationsUpdateTrigger, setConversationsUpdateTrigger] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [hasMessages, setHasMessages] = useState(false)

  const dashboardClass = `${styles.dashboard} ${
    background === 'light' ? styles.dashboardLight : ''
  }`
  const contentClass = `${styles.content} ${
    background === 'light' ? styles.contentLight : ''
  }`

  const handleConversationSelect = useCallback((conversationId: string | null) => {
    setSelectedConversationId(conversationId)
  }, [])

  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(null)
  }, [])

  const handleConversationChange = useCallback((conversationId: string | null) => {
    setSelectedConversationId(conversationId)
    // Trigger conversations list update
    setConversationsUpdateTrigger((prev) => prev + 1)
  }, [])

  const handleConversationsUpdate = useCallback(() => {
    // This will be called when conversations need to be refreshed
    setConversationsUpdateTrigger((prev) => prev + 1)
  }, [])

  const handleTypingStatus = useCallback((typing: boolean) => {
    setIsTyping(typing)
  }, [])

  const handleContentChange = useCallback((hasContent: boolean) => {
    setHasMessages(hasContent)
  }, [])

  return (
    <Layout className={dashboardClass.trim()}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
        {...headerOverrides}
      />
      <Layout>
        {/* Sidebar with "Flippy chats" only shows when user is logged in */}
        {isLoggedIn && (
          <Sider
            width={360}
            collapsedWidth={88}
            collapsed={collapsed}
            theme="light"
            trigger={null}
            className={styles.sider}
          >
            <Sidebar
              collapsed={collapsed}
              onToggleSidebar={() => setCollapsed((prev) => !prev)}
              user={user}
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
              onNewConversation={handleNewConversation}
              conversationsUpdateTrigger={conversationsUpdateTrigger}
            />
          </Sider>
        )}
        <Content className={contentClass.trim()}>
          {!isTyping && !hasMessages && (
            <Typography.Title level={1} className={styles.title}>
              {heroTitle}
            </Typography.Title>
          )}
          <ChatBox
            conversationId={selectedConversationId}
            onConversationChange={handleConversationChange}
            onTypingStatusChange={handleTypingStatus}
            onContentChange={handleContentChange}
          />
          {tagline && (
            <Typography.Paragraph className={styles.tagline}>{tagline}</Typography.Paragraph>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}
