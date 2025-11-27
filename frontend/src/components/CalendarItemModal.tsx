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
  Descriptions,
  Tag,
  Typography,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { CalendarItem, calendarService } from '../services/calendarService'
import { Campaign, campaignService } from '../services/campaignService'
import styles from './CalendarItemModal.module.css'

const { Text } = Typography

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
  const [isEditing, setIsEditing] = useState(false)

  const isEditMode = !!item
  const isPreviewMode = isEditMode && !isEditing

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
          variants: item.variants || {},
        })
        // Set active tab to main platform
        setActivePlatformTab(item.platform)
        // Preview mode by default for existing items
        setIsEditing(false)
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
          variants: {},
        })
        setActivePlatformTab(PLATFORMS.INSTAGRAM_POST)
        // Create mode: always in editing state
        setIsEditing(true)
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
    setIsEditing(false)
    onClose()
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (item) {
      // Reset form to original values
      form.setFieldsValue({
        platform: item.platform,
        date: dayjs(item.date),
        time: item.time ? dayjs(item.time, 'HH:mm') : null,
        title: item.title,
        content: item.content,
        status: item.status,
        campaignId: item.campaignId || undefined,
        variants: item.variants || {},
      })
      setActivePlatformTab(item.platform)
    }
    setIsEditing(false)
  }

  const getPlatformLabel = (platform: string) => {
    return platformOptions.find((opt) => opt.value === platform)?.label || platform
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default'
      case 'scheduled':
        return 'processing'
      case 'published':
        return 'success'
      default:
        return 'default'
    }
  }

  const platformTabs = [
    { key: 'main', label: 'Main Content' },
    ...platformOptions.map((p) => ({ key: p.value, label: p.label })),
  ]

  return (
    <Modal
      title={isEditMode ? (isPreviewMode ? 'Calendar Item Details' : 'Edit Calendar Item') : 'Create Calendar Item'}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      className={styles.modal}
    >
      {isPreviewMode && item ? (
        // Preview Mode
        <div className={styles.previewMode}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Platform">
              <Tag color="blue">{getPlatformLabel(item.platform)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {item.date}
            </Descriptions.Item>
            <Descriptions.Item label="Time">
              {item.time || 'Not set'}
            </Descriptions.Item>
            <Descriptions.Item label="Title">
              <Text strong>{item.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Content">
              <div className={styles.contentPreview}>{item.content}</div>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(item.status)}>{item.status.toUpperCase()}</Tag>
            </Descriptions.Item>
            {item.campaignName && (
              <Descriptions.Item label="Campaign">
                {item.campaignName}
              </Descriptions.Item>
            )}
            {item.variants && Object.keys(item.variants).length > 0 && (
              <Descriptions.Item label="Platform Variants">
                <Tabs
                  size="small"
                  items={Object.entries(item.variants).map(([platform, content]) => ({
                    key: platform,
                    label: getPlatformLabel(platform),
                    children: <div className={styles.contentPreview}>{content}</div>,
                  }))}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
          <div className={styles.previewActions}>
            <Space>
              <Button danger onClick={handleDelete} loading={loading}>
                Delete
              </Button>
              <Button onClick={handleClose}>Close</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                Edit
              </Button>
            </Space>
          </div>
        </div>
      ) : (
        // Edit Mode
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
                <Button onClick={handleCancelEdit}>Cancel</Button>
              )}
              {!isEditMode && (
                <Button onClick={handleClose}>Cancel</Button>
              )}
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}

