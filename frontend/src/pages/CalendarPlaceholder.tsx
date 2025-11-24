import { Card, Calendar, Layout, Space, Typography } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import Header from '../components/Header'
import { MELO_LOGO } from '../constants/assets'
import styles from './CalendarPlaceholder.module.css'

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
    <Layout className={styles.layout}>
      <Header isLoggedIn={false} showBrandName={false} logoSrc={MELO_LOGO} />
      <Content className={styles.content}>
        <Space direction="vertical" size="large" className={styles.container}>
          <Typography.Title level={2} className={styles.title}>
            Smart Calendar
          </Typography.Title>
          <Card className={styles.card}>
            <Calendar
              fullscreen
              validRange={[dayjs().subtract(1, 'year'), dayjs().add(2, 'year')]}
              value={value}
              onSelect={onSelect}
              onPanelChange={onPanelChange}
            />
          </Card>
          <Card className={styles.card}>
            <Typography.Text strong>
              Selected date: {selectedValue.format('YYYY-MM-DD')}
            </Typography.Text>
          </Card>
        </Space>
      </Content>
    </Layout>
  )
}

