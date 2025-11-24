import { Card, Calendar, Layout, Space, Typography } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import Header from '../components/Header'

const { Content } = Layout

export default function CalendarPlaceholder() {
  const [value, setValue] = useState(dayjs())
  const [selectedValue, setSelectedValue] = useState<Dayjs>(dayjs())

  const onSelect = (newValue: Dayjs) => {
    setValue(newValue)
    setSelectedValue(newValue)
  }

  const onPanelChange = (newValue: Dayjs) => {
    setValue(newValue)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header isLoggedIn={false} />
      <Content style={{ padding: '48px 24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 0 }}>
            Smart Calendar
          </Typography.Title>
          <Card>
            <Calendar
              fullscreen
              validRange={[dayjs().subtract(1, 'year'), dayjs().add(2, 'year')]}
              value={value}
              onSelect={onSelect}
              onPanelChange={onPanelChange}
            />
          </Card>
          <Card>
            <Typography.Text strong>
              Selected date: {selectedValue.format('YYYY-MM-DD')}
            </Typography.Text>
          </Card>
        </Space>
      </Content>
    </Layout>
  )
}

