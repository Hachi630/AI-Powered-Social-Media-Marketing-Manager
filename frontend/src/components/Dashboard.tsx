import { Layout, Typography } from 'antd'
import { useState } from 'react'
import ChatBox from './ChatBox'
import Header from './Header'
import Sidebar from './Sidebar'
import styles from './Dashboard.module.css'

interface DashboardProps {
  isLoggedIn?: boolean
}

const { Content, Sider } = Layout

export default function Dashboard({ isLoggedIn = false }: DashboardProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout className={styles.dashboard}>
      <Header isLoggedIn={isLoggedIn} />
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
        <Content className={styles.content}>
          <Typography.Title level={1} className={styles.title}>
            What Can I Do For You Today?
          </Typography.Title>
          <ChatBox />
        </Content>
      </Layout>
    </Layout>
  )
}

