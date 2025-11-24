import { Layout, Result } from 'antd'
import Header from '../components/Header'

const { Content } = Layout

export default function CalendarPlaceholder() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header isLoggedIn={false} />
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
        }}
      >
        <Result
          status="info"
          title="Calendar page is coming soon"
          subTitle="Use the Settings tab to configure your brand profile while the calendar experience is under construction."
        />
      </Content>
    </Layout>
  )
}

