import { Layout, Typography } from 'antd'
import ChatBox from './ChatBox'
import Header from './Header'
import Sidebar from './Sidebar'
import styles from './Dashboard.module.css'

interface DashboardProps {
  isLoggedIn?: boolean
}

const { Content, Sider } = Layout

export default function Dashboard({ isLoggedIn = false }: DashboardProps) {
  return (
    <Layout className={styles.dashboard}>
      <Header isLoggedIn={isLoggedIn} />
      <Layout>
        {isLoggedIn && (
          <Sider width={360} className={styles.sider} theme="light">
            <Sidebar />
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

