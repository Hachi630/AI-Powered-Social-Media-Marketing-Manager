import { Layout, Typography } from 'antd'
import { useState } from 'react'
import ChatBox from './ChatBox'
import Header, { type HeaderProps } from './Header'
import Sidebar from './Sidebar'
import styles from './Dashboard.module.css'
import { DEFAULT_TAGLINE } from '../constants/assets'

interface DashboardProps {
  isLoggedIn?: boolean
  heroTitle?: string
  tagline?: string
  background?: 'default' | 'light'
  headerOverrides?: Partial<HeaderProps>
}

const { Content, Sider } = Layout

const defaultHero = 'What Can I Do For You Today?'

export default function Dashboard({
  isLoggedIn = false,
  heroTitle = defaultHero,
  tagline = DEFAULT_TAGLINE,
  background = 'default',
  headerOverrides,
}: DashboardProps) {
  const [collapsed, setCollapsed] = useState(false)

  const dashboardClass = `${styles.dashboard} ${
    background === 'light' ? styles.dashboardLight : ''
  }`
  const contentClass = `${styles.content} ${
    background === 'light' ? styles.contentLight : ''
  }`

  return (
    <Layout className={dashboardClass.trim()}>
      <Header isLoggedIn={isLoggedIn} {...headerOverrides} />
      <Layout>
        {isLoggedIn && (
          <Sider
            width={360}
            collapsedWidth={88}
            collapsed={collapsed}
            theme="light"
            trigger={null}
            className={styles.sider}
          >
            <Sidebar collapsed={collapsed} onToggleSidebar={() => setCollapsed((prev) => !prev)} />
          </Sider>
        )}
        <Content className={contentClass.trim()}>
          <Typography.Title level={1} className={styles.title}>
            {heroTitle}
          </Typography.Title>
          <ChatBox />
          {tagline && (
            <Typography.Paragraph className={styles.tagline}>{tagline}</Typography.Paragraph>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

