import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Space,
  Tabs,
  message,
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { CalendarItem, calendarService } from '../services/calendarService'
import { Campaign, campaignService } from '../services/campaignService'
import styles from './CalendarItemModal.module.css'

const { TextArea } = Input
const { Option } = Select

export const PLATFORMS = {
  INSTAGRAM_POST: 'instagram_post',
  INSTAGRAM_STORY: 'instagram_story',
  INSTAGRAM_REELS: 'instagram_reels',
  TIKTOK: 'tiktok',
  XIAOHONGSHU: 'xiaohongshu',
  FACEBOOK: 'facebook',
} as const

const platformOptions = [
  { value: PLATFORMS.INSTAGRAM_POST, label: 'Instagram Post' },
  { value: PLATFORMS.INSTAGRAM_STORY, label: 'Instagram Story' },
  { value: PLATFORMS.INSTAGRAM_REELS, label: 'Instagram Reels' },
  { value: PLATFORMS.TIKTOK, label: 'TikTok' },
  { value: PLATFORMS.XIAOHONGSHU, label: '小红书' },
  { value: PLATFORMS.FACEBOOK, label: 'Facebook' },
]

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

interface CalendarItemModalProps {
  open: boolean
  item?: CalendarItem | null
  defaultDate?: Dayjs
  onClose: () => void
  onSave: () => void
}

export default function CalendarItemModal({
  open,
  item,
  defaultDate,
  onClose,
  onSave,
}: CalendarItemModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activePlatformTab, setActivePlatformTab] = useState<string>('main')

  const isEditMode = !!item

  useEffect(() => {
    if (open) {
      loadCampaigns()
      if (item) {
        // Edit mode: populate form with item data
        form.setFieldsValue({
          platform: item.platform,
          date: dayjs(item.date),
          time: item.time ? dayjs(item.time, 'HH:mm') : null,
          title: item.title,
          content: item.content,
          status: item.status,
          campaignId: item.campaignId || undefined,
        })
        // Set active tab to main platform
        setActivePlatformTab(item.platform)
      } else {
        // Create mode: set defaults
        form.setFieldsValue({
          platform: PLATFORMS.INSTAGRAM_POST,
          date: defaultDate || dayjs(),
          time: null,
          title: '',
          content: '',
          status: 'draft',
          campaignId: undefined,
        })
        setActivePlatformTab(PLATFORMS.INSTAGRAM_POST)
      }
    }
  }, [open, item, defaultDate, form])

  const loadCampaigns = async () => {
    const response = await campaignService.getCampaigns()
    if (response.success && response.campaigns) {
      setCampaigns(response.campaigns)
    }
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const formData = {
        platform: values.platform,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time ? values.time.format('HH:mm') : null,
        title: values.title,
        content: values.content,
        status: values.status,
        campaignId: values.campaignId || null,
        variants: {
          ...(values.variants || {}),
        },
      }

      if (isEditMode && item) {
        // Update existing item
        const response = await calendarService.updateCalendarItem(item.id, formData)
        if (response.success) {
          message.success('Calendar item updated successfully')
          onSave()
          onClose()
        } else {
          message.error(response.message || 'Failed to update calendar item')
        }
      } else {
        // Create new item
        const response = await calendarService.createCalendarItem(formData)
        if (response.success) {
          message.success('Calendar item created successfully')
          onSave()
          onClose()
        } else {
          message.error(response.message || 'Failed to create calendar item')
        }
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return

    Modal.confirm({
      title: 'Delete Calendar Item',
      content: 'Are you sure you want to delete this calendar item?',
      onOk: async () => {
        setLoading(true)
        const response = await calendarService.deleteCalendarItem(item.id)
        if (response.success) {
          message.success('Calendar item deleted successfully')
          onSave()
          onClose()
        } else {
          message.error(response.message || 'Failed to delete calendar item')
        }
        setLoading(false)
      },
    })
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const platformTabs = [
    { key: 'main', label: 'Main Content' },
    ...platformOptions.map((p) => ({ key: p.value, label: p.label })),
  ]

  return (
    <Modal
      title={isEditMode ? 'Edit Calendar Item' : 'Create Calendar Item'}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      className={styles.modal}
    >
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item
          name="platform"
          label="Platform"
          rules={[{ required: true, message: 'Please select a platform' }]}
        >
          <Select placeholder="Select platform" onChange={(value) => setActivePlatformTab(value)}>
            {platformOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="time" label="Time" style={{ flex: 1 }}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Space>

        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="Short title for calendar display" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="content"
          label="Content"
          rules={[{ required: true, message: 'Please enter content' }]}
        >
          <TextArea
            rows={6}
            placeholder="Full content text"
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Tabs
          activeKey={activePlatformTab}
          onChange={setActivePlatformTab}
          items={platformTabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: (
              <Form.Item
                name={tab.key === 'main' ? 'content' : ['variants', tab.key]}
                label={tab.key === 'main' ? 'Main Content' : `${tab.label} Variant`}
              >
                <TextArea
                  rows={4}
                  placeholder={
                    tab.key === 'main'
                      ? 'Main content (used as default)'
                      : `Platform-specific content for ${tab.label}`
                  }
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            ),
          }))}
        />

        <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
          <Form.Item name="status" label="Status" style={{ flex: 1 }}>
            <Select placeholder="Select status">
              {statusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="campaignId" label="Campaign" style={{ flex: 1 }}>
            <Select placeholder="Select campaign (optional)" allowClear>
              {campaigns.map((campaign) => (
                <Option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Space>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {isEditMode && (
              <Button danger onClick={handleDelete} loading={loading}>
                Delete
              </Button>
            )}
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

