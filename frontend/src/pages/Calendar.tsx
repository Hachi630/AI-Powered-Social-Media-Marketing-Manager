import { Card, Calendar, Layout, Typography, Button, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import { MELO_LOGO } from '../constants/assets'
import styles from './Calendar.module.css'
import { User } from '../services/authService'
import { CalendarItem, calendarService } from '../services/calendarService'
import CalendarItemModal from '../components/CalendarItemModal'

const { Content } = Layout

// Platform icon mapping
const platformIcons: Record<string, string> = {
  instagram: '🟣',
  instagram_post: '🟣',
  instagram_story: '📸',
  instagram_reels: '🎬',
  tiktok: '🎵',
  xiaohongshu: '📕',
  facebook: '📘',
}

// Platform label mapping
const platformLabels: Record<string, string> = {
  instagram_post: 'IG',
  instagram_story: 'IG Story',
  instagram_reels: 'IG Reels',
  tiktok: 'TikTok',
  xiaohongshu: '小红书',
  facebook: 'FB',
}

interface CalendarProps {
  isLoggedIn: boolean
  onLoginSuccess: (user: User) => void
  onLogout: () => void
  user?: User | null
}

export default function CalendarPage({
  isLoggedIn,
  onLoginSuccess,
  onLogout,
  user,
}: CalendarProps) {
  const [value, setValue] = useState(dayjs())
  const [selectedValue, setSelectedValue] = useState<Dayjs>(dayjs())
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)

  // Load calendar items for the current month
  const loadCalendarItems = useCallback(async () => {
    if (!isLoggedIn) return

    setLoading(true)
    try {
      // Get start and end of current month
      const startOfMonth = value.startOf('month')
      const endOfMonth = value.endOf('month')

      const response = await calendarService.getCalendarItems(
        startOfMonth.format('YYYY-MM-DD'),
        endOfMonth.format('YYYY-MM-DD')
      )

      if (response.success && response.items) {
        setCalendarItems(response.items)
      } else {
        message.error(response.message || 'Failed to load calendar items')
      }
    } catch (error) {
      console.error('Load calendar items error:', error)
      message.error('Failed to load calendar items')
    } finally {
      setLoading(false)
    }
  }, [value, isLoggedIn])

  useEffect(() => {
    loadCalendarItems()
  }, [loadCalendarItems])

  const onSelect = (newValue: Dayjs) => {
    // Only update selected value, don't open modal
    // Modal should only open when user explicitly clicks on a date cell
    setValue(newValue)
    setSelectedValue(newValue)
  }

  const onPanelChange = (newValue: Dayjs) => {
    setValue(newValue)
    // When panel changes, update selected value but don't open modal
    setSelectedValue(newValue)
  }

  // Get items for a specific date
  const getItemsForDate = (date: Dayjs): CalendarItem[] => {
    const dateStr = date.format('YYYY-MM-DD')
    return calendarItems.filter((item) => item.date === dateStr)
  }

  // Render calendar cell content
  const dateCellRender = (date: Dayjs) => {
    const items = getItemsForDate(date)
    const isToday = date.isSame(dayjs(), 'day')
    const maxDisplay = 2
    const displayItems = items.slice(0, maxDisplay)
    const remainingCount = items.length - maxDisplay

    const handleDateCellClick = (e: React.MouseEvent) => {
      // Only open modal if clicking directly on the date cell (not on items)
      e.stopPropagation()
      setSelectedValue(date)
      const itemsForDate = getItemsForDate(date)
      if (itemsForDate.length === 0) {
        // Empty date cell - open create modal
        setSelectedItem(null)
        setSelectedDate(date)
        setModalOpen(true)
      }
    }

    return (
      <div 
        className={styles.dateCell}
        onClick={handleDateCellClick}
        style={{ cursor: items.length === 0 ? 'pointer' : 'default' }}
      >
        {isToday && <div className={styles.todayIndicator} />}
        <div className={styles.itemsList}>
          {displayItems.map((item) => {
            const icon = platformIcons[item.platform] || '📌'
            const label = platformLabels[item.platform] || item.platform
            return (
              <div
                key={item.id}
                className={styles.itemPreview}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedItem(item)
                  setModalOpen(true)
                }}
                title={item.title}
              >
                <span className={styles.itemIcon}>{icon}</span>
                <span className={styles.itemLabel}>{label}</span>
                <span className={styles.itemTitle}>{item.title}</span>
              </div>
            )
          })}
          {remainingCount > 0 && (
            <div className={styles.moreItems}>+{remainingCount} more</div>
          )}
        </div>
      </div>
    )
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedItem(null)
    setSelectedDate(null)
  }

  const handleModalSave = () => {
    loadCalendarItems()
  }

  const handleNewItem = () => {
    setSelectedItem(null)
    setSelectedDate(selectedValue)
    setModalOpen(true)
  }

  return (
    <Layout className={styles.layout}>
      <Header
        isLoggedIn={isLoggedIn}
        showBrandName={false}
        logoSrc={MELO_LOGO}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Content className={styles.content}>
        <Space direction="vertical" size="large" className={styles.container}>
          <div className={styles.header}>
            <Typography.Title level={2} className={styles.title}>
              Smart Calendar
            </Typography.Title>
            {isLoggedIn && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleNewItem}
                size="large"
              >
                Add Post
              </Button>
            )}
          </div>
          <Card className={styles.card} loading={loading}>
            <Calendar
              fullscreen
              validRange={[dayjs().subtract(1, 'year'), dayjs().add(2, 'year')]}
              value={value}
              onPanelChange={onPanelChange}
              dateCellRender={dateCellRender}
              onSelect={onSelect}
            />
          </Card>
          {isLoggedIn && (
            <Card className={styles.card}>
              <Typography.Text strong>
                Selected date: {selectedValue.format('YYYY-MM-DD')}
                {getItemsForDate(selectedValue).length > 0 && (
                  <span className={styles.itemCount}>
                    {' '}
                    ({getItemsForDate(selectedValue).length} items)
                  </span>
                )}
              </Typography.Text>
            </Card>
          )}
        </Space>
      </Content>
      {isLoggedIn && (
        <CalendarItemModal
          open={modalOpen}
          item={selectedItem}
          defaultDate={selectedDate || undefined}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </Layout>
  )
}

