import { useEffect, useState, useCallback } from 'react'
import {
  Layout,
  Card,
  Row,
  Col,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Modal,
  Form,
  message,
  Space,
  Upload,
  Spin,
  Empty,
  Popconfirm,
  Tabs,
  Divider,
  Grid,
  Drawer,
} from 'antd'
import {
  UserAddOutlined,
  SendOutlined,
  DeleteOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
  VideoCameraOutlined,
  PaperClipOutlined,
  WhatsAppOutlined,
  BarChartOutlined,
  MessageOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import Header from '../components/Header'
import MessagingSidebar, { type MessagingSection } from '../components/MessagingSidebar'
import { User } from '../services/authService'
import styles from '../components/Dashboard.module.css'

const { useBreakpoint } = Grid
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  sendSMS,
  sendMMS,
  sendWhatsApp,
  getWhatsAppConversations,
  Contact,
  type WhatsAppConversation,
} from '../services/messagingService'
import { uploadService } from '../services/uploadService'

const { Content, Sider } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

interface MessagingProps {
  isLoggedIn?: boolean
  onLoginSuccess?: (user: User) => void
  onLogout?: () => void
  user?: User | null
}

export default function Messaging({
  isLoggedIn = false,
  onLoginSuccess,
  onLogout,
  user,
}: MessagingProps) {
  const screens = useBreakpoint()
  const isMobile = !screens.lg
  const isTablet = screens.md && !screens.lg
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(Boolean(isMobile || isTablet))
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<MessagingSection>('new-number')
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messageText, setMessageText] = useState('')
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [messageType, setMessageType] = useState<'sms' | 'whatsapp'>('whatsapp') // Default to WhatsApp
  const [activeTab, setActiveTab] = useState<'new' | 'contact' | 'history'>('new') // Tab: 'new' for unknown contacts, 'contact' for saved contacts, 'history' for conversation history
  const [phoneNumber, setPhoneNumber] = useState('') // Direct phone number input
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)

  // Modal states
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const [addContactForm] = Form.useForm()
  const [editContactForm] = Form.useForm()

  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true)
      const data = await getWhatsAppConversations()
      console.log('[Messaging] Fetched conversations:', data.length, 'conversations')
      setConversations(data)
      if (data.length === 0) {
        message.info('No WhatsApp conversations found. Send a message to start a conversation.')
      }
    } catch (error: any) {
      console.error('[Messaging] Error fetching conversations:', error)
      message.error(error.message || 'Failed to fetch conversation history')
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchConversations()
    }
  }, [activeTab, fetchConversations])

  // Update collapsed state when screen size changes
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarCollapsed(true)
    } else {
      setSidebarCollapsed(false)
    }
  }, [isMobile, isTablet])

  // Sync selectedSection with activeTab (only when tab changes directly, not from sidebar)
  useEffect(() => {
    if (activeTab === 'new') {
      setSelectedSection('new-number')
    } else if (activeTab === 'contact') {
      setSelectedSection('contacts')
    }
    // History tab doesn't have a corresponding sidebar section, so don't change selectedSection
  }, [activeTab])

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarDrawerOpen((prev) => !prev)
    } else {
      setSidebarCollapsed((prev) => !prev)
    }
  }

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const data = await getContacts()
      setContacts(data)
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async (values: any) => {
    try {
      const newContact = await createContact(values)
      setContacts([...contacts, newContact])
      setIsAddContactModalOpen(false)
      addContactForm.resetFields()
      message.success('Contact added successfully')
    } catch (error: any) {
      message.error(error.message || 'Failed to add contact')
    }
  }

  const handleEditContact = async (values: any) => {
    if (!editingContact) return

    try {
      const updatedContact = await updateContact(editingContact._id, values)
      setContacts(
        contacts.map((c) => (c._id === updatedContact._id ? updatedContact : c))
      )
      setIsEditContactModalOpen(false)
      setEditingContact(null)
      editContactForm.resetFields()
      message.success('Contact updated successfully')
    } catch (error: any) {
      message.error(error.message || 'Failed to update contact')
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId)
      setContacts(contacts.filter((c) => c._id !== contactId))
      if (selectedContact?._id === contactId) {
        setSelectedContact(null)
      }
      message.success('Contact deleted successfully')
    } catch (error: any) {
      message.error(error.message || 'Failed to delete contact')
    }
  }

  const handleSendMessage = async () => {
    // Determine recipient phone number based on active tab
    let recipientPhoneNumber = ''
    
    if (activeTab === 'contact') {
      if (!selectedContact) {
        message.warning('Please select a contact')
        return
      }
      recipientPhoneNumber = selectedContact.phoneNumber
    } else {
      // New number tab
      if (!phoneNumber || !phoneNumber.trim()) {
        message.warning('Please enter a phone number')
        return
      }
      recipientPhoneNumber = phoneNumber.trim()
    }

    // Check if message is empty (but allow empty message for MMS with media or template messages)
    if (mediaFiles.length === 0 && (!messageText || !messageText.trim())) {
      message.warning('Please enter a message or attach media')
      return
    }

    // For SMS, message body is required
    if (messageType === 'sms' && mediaFiles.length === 0 && !messageText.trim()) {
      message.warning('Message body cannot be empty for SMS')
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      message.error('You are not logged in. Please log in and try again.')
      return
    }

    try {
      setSending(true)

      if (messageType === 'whatsapp') {
        // Send WhatsApp message
        await sendWhatsApp({
          to: recipientPhoneNumber,
          body: messageText,
          mediaUrl: mediaFiles.length > 0 ? mediaFiles : undefined,
        })
        message.success('WhatsApp message sent successfully')
      } else {
        // Send SMS/MMS
        if (mediaFiles.length > 0) {
          // Send MMS
          await sendMMS({
            to: recipientPhoneNumber,
            body: messageText,
            mediaUrl: mediaFiles,
          })
          message.success('MMS sent successfully')
        } else {
          // Send SMS - ensure message is not empty
          const trimmedMessage = messageText.trim()
          if (!trimmedMessage) {
            message.warning('Message body cannot be empty')
            return
          }
          
          await sendSMS({
            to: recipientPhoneNumber,
            body: trimmedMessage,
          })
          message.success('SMS sent successfully')
        }
      }

      setMessageText('')
      setMediaFiles([])
      // Clear phone number if in new number tab
      if (activeTab === 'new') {
        setPhoneNumber('')
      }
      // Refresh conversations if on history tab
      if (activeTab === 'history') {
        fetchConversations()
      }
    } catch (error: any) {
      console.error('Send message error:', error)
      const errorMessage = error.message || 'Failed to send message'
      message.error(errorMessage)
      
      // If authentication error, suggest logging in again
      if (errorMessage.includes('authenticated') || errorMessage.includes('Authentication')) {
        message.warning('Your session may have expired. Please try refreshing the page or logging in again.')
      }
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      
      // Check if it's an image or video
      const isImage = file.type.startsWith('image/')

      let fileUrl: string | undefined

      if (isImage) {
        const result = await uploadService.uploadImage(file)
        fileUrl = result.imageUrl
      } else {
        const result = await uploadService.uploadFile(file)
        fileUrl = result.fileUrl
      }

      if (fileUrl) {
        // Convert to absolute URL if needed
        const absoluteUrl = fileUrl.startsWith('http') 
          ? fileUrl 
          : `${window.location.origin}${fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl}`
        setMediaFiles([...mediaFiles, absoluteUrl])
        message.success('File uploaded successfully')
      } else {
        message.error('Failed to get file URL')
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index))
  }

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact)
    editContactForm.setFieldsValue({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      notes: contact.notes,
    })
    setIsEditContactModalOpen(true)
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          isLoggedIn={isLoggedIn}
          onLoginSuccess={onLoginSuccess}
          onLogout={onLogout}
          user={user}
        />
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 20 }}>
            <Text>Loading contacts...</Text>
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Layout style={{ background: '#f0f2f5' }}>
        {/* Sidebar */}
        {!isMobile && (
          <Sider
            width={280}
            collapsedWidth={80}
            collapsed={sidebarCollapsed}
            theme="light"
            trigger={null}
            breakpoint="lg"
            style={{
              background: '#fafafa',
              borderRight: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
              position: 'sticky',
              top: 99,
              height: 'calc(100vh - 99px)',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            <MessagingSidebar
              collapsed={sidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
              selectedSection={selectedSection}
              onSectionSelect={(section) => {
                setSelectedSection(section)
                // Update activeTab based on section selection
                if (section === 'new-number') {
                  setActiveTab('new')
                } else if (section === 'contacts') {
                  setActiveTab('contact')
                }
              }}
            />
          </Sider>
        )}
        {isMobile && (
          <Drawer
            title="Navigation"
            placement="left"
            onClose={() => setSidebarDrawerOpen(false)}
            open={sidebarDrawerOpen}
            width={280}
            className={styles.sidebarDrawer}
          >
            <MessagingSidebar
              collapsed={false}
              onToggleSidebar={() => setSidebarDrawerOpen(false)}
              selectedSection={selectedSection}
              onSectionSelect={(section) => {
                setSelectedSection(section)
                // Update activeTab based on section selection
                if (section === 'new-number') {
                  setActiveTab('new')
                } else if (section === 'contacts') {
                  setActiveTab('contact')
                }
                setSidebarDrawerOpen(false)
              }}
            />
          </Drawer>
        )}
        <Content 
          className={`${styles.content} ${styles.contentLight}`}
          style={{ 
            padding: isMobile ? '16px 0' : '32px 0',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 99px)',
            overflow: 'auto',
            flex: '1 1 auto',
          }}
        >
        {/* Unified Container for all content - ensures left alignment matching Analytics */}
        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            margin: '0 auto',
            paddingLeft: isMobile ? 16 : screens.xl ? 32 : 24,
            paddingRight: isMobile ? 16 : screens.xl ? 32 : 24,
          }}
        >
          {/* Global Header Section - Matching Analytics Dashboard Style */}
          <div
            style={{
              marginTop: isMobile ? 16 : 24,
              marginBottom: isMobile ? 8 : 12,
            }}
          >
            <Row
              gutter={[16, 16]}
              align="middle"
              justify="space-between"
              style={{ width: '100%' }}
            >
              <Col
                xs={24}
                sm={24}
                md={16}
                lg={18}
              >
                {isMobile && (
                  <Button
                    icon={<BarChartOutlined />}
                    onClick={() => setSidebarDrawerOpen(true)}
                    style={{ 
                      marginBottom: 16,
                      border: '1px solid #d9d9d9',
                      background: '#fff',
                      color: '#595959'
                    }}
                  />
                )}
                <Title
                  level={isMobile ? 3 : 2}
                  style={{
                    margin: 0,
                    marginBottom: isMobile ? 4 : 8,
                    fontSize: isMobile
                      ? 20
                      : screens.xl
                        ? 32
                        : screens.lg
                          ? 28
                          : 24,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: '#262626',
                  }}
                >
                  Messaging Platform
                </Title>
                <Text
                  type="secondary"
                  style={{
                    fontSize: isMobile ? 13 : 14,
                    display: 'block',
                    lineHeight: 1.5,
                    color: '#8c8c8c',
                  }}
                >
                  Send WhatsApp or SMS messages to any number or your saved contacts
                </Text>
              </Col>
            </Row>
          </div>

          <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              const newTab = key as 'new' | 'contact' | 'history'
              setActiveTab(newTab)
              setSelectedContact(null)
              setPhoneNumber('')
              setSelectedConversation(null)
              // fetchConversations will be called by useEffect when activeTab changes
            }}
            items={[
              {
                key: 'new',
                label: (
                  <Space>
                    <PhoneOutlined />
                    <span>Send to New Number</span>
                  </Space>
                ),
                children: (
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                      <Card
                        title={
                          <Space>
                            <PhoneOutlined />
                            <span>Send Message to New Number</span>
                          </Space>
                        }
                        style={{ minHeight: '500px', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {/* Phone Number Input */}
                          <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                              Phone Number
                            </Text>
                            <Input
                              placeholder="Enter phone number (e.g., +1234567890 or 1234567890)"
                              prefix={<PhoneOutlined />}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              size="large"
                            />
                          </div>

                          <Divider />

                          {/* Message Type Selector */}
                          <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                              Message Type
                            </Text>
                            <Space>
                              <Button
                                type={messageType === 'whatsapp' ? 'primary' : 'default'}
                                icon={<WhatsAppOutlined />}
                                onClick={() => setMessageType('whatsapp')}
                                size="large"
                                style={{
                                  borderRadius: 8,
                                  height: 44,
                                  backgroundColor: messageType === 'whatsapp' ? '#25D366' : undefined,
                                  borderColor: messageType === 'whatsapp' ? '#25D366' : undefined,
                                  color: messageType === 'whatsapp' ? '#fff' : undefined
                                }}
                              >
                                WhatsApp
                              </Button>
                              <Button
                                type={messageType === 'sms' ? 'primary' : 'default'}
                                icon={<PhoneOutlined />}
                                onClick={() => setMessageType('sms')}
                                size="large"
                                style={{
                                  borderRadius: 8,
                                  height: 44
                                }}
                              >
                                SMS
                              </Button>
                            </Space>
                          </div>

                          <Divider />

                          {/* Media Preview */}
                          {mediaFiles.length > 0 && (
                            <div>
                              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Attached Media:
                              </Text>
                              <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                                <Space wrap>
                                  {mediaFiles.map((url, index) => (
                                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img
                                          src={url}
                                          alt={`Media ${index + 1}`}
                                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            width: 100,
                                            height: 100,
                                            background: '#d9d9d9',
                                            borderRadius: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                        >
                                          <VideoCameraOutlined style={{ fontSize: 24 }} />
                                        </div>
                                      )}
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveMedia(index)}
                                        style={{
                                          position: 'absolute',
                                          top: -8,
                                          right: -8,
                                          background: 'white',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }}
                                      />
                                    </div>
                                  ))}
                                </Space>
                              </div>
                            </div>
                          )}

                          {/* Message Input */}
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>
                              Message
                            </Text>
                            <TextArea
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder="Type your message here..."
                              rows={8}
                              style={{ width: '100%' }}
                              onPressEnter={(e) => {
                                if (e.shiftKey) {
                                  return
                                }
                                e.preventDefault()
                                handleSendMessage()
                              }}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div style={{ 
                            display: 'flex', 
                            gap: 12, 
                            justifyContent: 'flex-end',
                            marginTop: 8,
                            paddingTop: 16,
                            borderTop: '1px solid #f0f0f0'
                          }}>
                            <Upload
                              beforeUpload={(file) => {
                                handleFileUpload(file)
                                return false
                              }}
                              showUploadList={false}
                              accept="image/*,video/*"
                            >
                              <Button
                                icon={<PaperClipOutlined />}
                                loading={uploading}
                                disabled={uploading}
                                size="large"
                                style={{
                                  borderRadius: 8,
                                  height: 44,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                Attach Media
                              </Button>
                            </Upload>
                            <Button
                              type="primary"
                              icon={messageType === 'whatsapp' ? <WhatsAppOutlined /> : <SendOutlined />}
                              onClick={handleSendMessage}
                              loading={sending}
                              disabled={
                                sending || 
                                (!messageText.trim() && mediaFiles.length === 0) ||
                                !phoneNumber.trim()
                              }
                              size="large"
                              style={{
                                borderRadius: 8,
                                height: 44,
                                minWidth: 140,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: messageType === 'whatsapp' ? '#25D366' : undefined,
                                borderColor: messageType === 'whatsapp' ? '#25D366' : undefined
                              }}
                            >
                              Send {messageType === 'whatsapp' 
                                ? 'WhatsApp' 
                                : mediaFiles.length > 0 
                                  ? 'MMS' 
                                  : 'SMS'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                      <Card 
                        title="Quick Tips" 
                        style={{ minHeight: '500px', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      >
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          <div>
                            <Text strong>📱 Phone Number Format</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Enter phone numbers in international format (e.g., +1234567890) or local format. The system will automatically format it.
                            </Text>
                          </div>
                          <Divider style={{ margin: '12px 0' }} />
                          <div>
                            <Text strong>💬 WhatsApp vs SMS</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              WhatsApp messages work for numbers that have WhatsApp. SMS works for all phone numbers.
                            </Text>
                          </div>
                          <Divider style={{ margin: '12px 0' }} />
                          <div>
                            <Text strong>📎 Media Support</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              You can attach images and videos. WhatsApp supports both, while SMS uses MMS for media.
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'contact',
                label: (
                  <Space>
                    <UserAddOutlined />
                    <span>Send to Contact</span>
                  </Space>
                ),
                children: (
                  <Row gutter={[24, 24]}>
                    {/* Contacts List */}
                    <Col xs={24} md={8} lg={6}>
                      <Card 
                        title="My Contacts" 
                        extra={
                          <Button
                            type="primary"
                            size="small"
                            icon={<UserAddOutlined />}
                            onClick={() => setIsAddContactModalOpen(true)}
                          >
                            Add
                          </Button>
                        }
                        style={{ 
                          height: 'calc(100vh - 300px)', 
                          overflow: 'auto',
                          borderRadius: 16, 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                        }}
                      >
                        {contacts.length === 0 ? (
                          <Empty description="No contacts yet" />
                        ) : (
                          <List
                            dataSource={contacts}
                            renderItem={(contact) => (
                              <List.Item
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor:
                                    selectedContact?._id === contact._id ? '#e6f7ff' : 'transparent',
                                  borderRadius: 8,
                                  padding: '12px',
                                  marginBottom: 8,
                                  border: selectedContact?._id === contact._id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedContact?._id !== contact._id) {
                                    e.currentTarget.style.backgroundColor = '#fafafa'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedContact?._id !== contact._id) {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }
                                }}
                                onClick={() => setSelectedContact(contact)}
                                actions={[
                                  <Button
                                    key="edit"
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditModal(contact)
                                    }}
                                  />,
                                  <Popconfirm
                                    key="delete"
                                    title="Delete contact?"
                                    description="Are you sure you want to delete this contact?"
                                    onConfirm={(e) => {
                                      e?.stopPropagation()
                                      handleDeleteContact(contact._id)
                                    }}
                                    onCancel={(e) => e?.stopPropagation()}
                                  >
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </Popconfirm>,
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar style={{ backgroundColor: '#1890ff' }}>
                                      {contact.name[0].toUpperCase()}
                                    </Avatar>
                                  }
                                  title={contact.name}
                                  description={
                                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                      <Text 
                                        type="secondary" 
                                        style={{ 
                                          fontSize: 12,
                                          display: 'block',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          lineHeight: '1.5'
                                        }}
                                      >
                                        <PhoneOutlined style={{ marginRight: 4 }} />
                                        {contact.phoneNumber}
                                      </Text>
                                      {contact.email && (
                                        <Text 
                                          type="secondary" 
                                          style={{ 
                                            fontSize: 12,
                                            display: 'block',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            lineHeight: '1.5'
                                          }}
                                        >
                                          <MailOutlined style={{ marginRight: 4 }} />
                                          {contact.email}
                                        </Text>
                                      )}
                                    </Space>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        )}
                      </Card>
                    </Col>

                    {/* Message Interface for Contacts */}
                    <Col xs={24} md={16} lg={18}>
                      {selectedContact ? (
                        <Card
                          title={
                            <Space>
                              <Avatar style={{ backgroundColor: '#1890ff' }}>
                                {selectedContact.name[0].toUpperCase()}
                              </Avatar>
                              <div>
                                <div style={{ fontWeight: 500 }}>{selectedContact.name}</div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {selectedContact.phoneNumber}
                                </Text>
                              </div>
                            </Space>
                          }
                          style={{ minHeight: '500px', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Message Type Selector */}
                            <div>
                              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Message Type
                              </Text>
                              <Space>
                                <Button
                                  type={messageType === 'whatsapp' ? 'primary' : 'default'}
                                  icon={<WhatsAppOutlined />}
                                  onClick={() => setMessageType('whatsapp')}
                                  size="large"
                                  style={{
                                    borderRadius: 8,
                                    height: 44,
                                    backgroundColor: messageType === 'whatsapp' ? '#25D366' : undefined,
                                    borderColor: messageType === 'whatsapp' ? '#25D366' : undefined,
                                    color: messageType === 'whatsapp' ? '#fff' : undefined
                                  }}
                                >
                                  WhatsApp
                                </Button>
                                <Button
                                  type={messageType === 'sms' ? 'primary' : 'default'}
                                  icon={<PhoneOutlined />}
                                  onClick={() => setMessageType('sms')}
                                  size="large"
                                  style={{
                                    borderRadius: 8,
                                    height: 44
                                  }}
                                >
                                  SMS
                                </Button>
                              </Space>
                            </div>

                            <Divider />

                            {/* Media Preview */}
                            {mediaFiles.length > 0 && (
                              <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                  Attached Media:
                                </Text>
                                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                                  <Space wrap>
                                    {mediaFiles.map((url, index) => (
                                      <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                          <img
                                            src={url}
                                            alt={`Media ${index + 1}`}
                                            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              width: 100,
                                              height: 100,
                                              background: '#d9d9d9',
                                              borderRadius: 4,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                            }}
                                          >
                                            <VideoCameraOutlined style={{ fontSize: 24 }} />
                                          </div>
                                        )}
                                        <Button
                                          type="text"
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() => handleRemoveMedia(index)}
                                          style={{
                                            position: 'absolute',
                                            top: -8,
                                            right: -8,
                                            background: 'white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </Space>
                                </div>
                              </div>
                            )}

                            {/* Message Input */}
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                Message
                              </Text>
                              <TextArea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message here..."
                                rows={8}
                                style={{ width: '100%' }}
                                onPressEnter={(e) => {
                                  if (e.shiftKey) {
                                    return
                                  }
                                  e.preventDefault()
                                  handleSendMessage()
                                }}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ 
                              display: 'flex', 
                              gap: 12, 
                              justifyContent: 'flex-end',
                              marginTop: 8,
                              paddingTop: 16,
                              borderTop: '1px solid #f0f0f0'
                            }}>
                              <Upload
                                beforeUpload={(file) => {
                                  handleFileUpload(file)
                                  return false
                                }}
                                showUploadList={false}
                                accept="image/*,video/*"
                              >
                                <Button
                                  icon={<PaperClipOutlined />}
                                  loading={uploading}
                                  disabled={uploading}
                                  size="large"
                                  style={{
                                    borderRadius: 8,
                                    height: 44,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  Attach Media
                                </Button>
                              </Upload>
                              <Button
                                type="primary"
                                icon={messageType === 'whatsapp' ? <WhatsAppOutlined /> : <SendOutlined />}
                                onClick={handleSendMessage}
                                loading={sending}
                                disabled={
                                  sending || 
                                  (!messageText.trim() && mediaFiles.length === 0)
                                }
                                size="large"
                                style={{
                                  borderRadius: 8,
                                  height: 44,
                                  minWidth: 140,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: messageType === 'whatsapp' ? '#25D366' : undefined,
                                  borderColor: messageType === 'whatsapp' ? '#25D366' : undefined
                                }}
                              >
                                Send {messageType === 'whatsapp' 
                                  ? 'WhatsApp' 
                                  : mediaFiles.length > 0 
                                    ? 'MMS' 
                                    : 'SMS'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Card style={{ 
                          minHeight: '500px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: 16, 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                        }}>
                          <Empty
                            description="Select a contact from the list to send a message"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        </Card>
                      )}
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'history',
                label: (
                  <Space>
                    <MessageOutlined />
                    <span>Conversation History</span>
                  </Space>
                ),
                children: (
                  <Row gutter={[24, 24]}>
                    {/* Conversations List */}
                    <Col xs={24} md={8} lg={6}>
                      <Card 
                        title="WhatsApp Conversations" 
                        extra={
                          <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={fetchConversations}
                            loading={loadingConversations}
                          />
                        }
                        style={{ 
                          height: 'calc(100vh - 300px)', 
                          overflow: 'auto',
                          borderRadius: 16, 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                        }}
                      >
                        {loadingConversations ? (
                          <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin />
                            <div style={{ marginTop: 16 }}>
                              <Text type="secondary">Loading conversations...</Text>
                            </div>
                          </div>
                        ) : conversations.length === 0 ? (
                          <Empty 
                            description={
                              <div>
                                <Text>No WhatsApp conversations yet</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Send a WhatsApp message to start a conversation
                                </Text>
                              </div>
                            }
                          />
                        ) : (
                          <List
                            dataSource={conversations}
                            renderItem={(conversation) => (
                              <List.Item
                                style={{
                                  cursor: 'pointer',
                                  backgroundColor:
                                    selectedConversation?.phoneNumber === conversation.phoneNumber ? '#e6f7ff' : 'transparent',
                                  borderRadius: 8,
                                  padding: '12px',
                                  marginBottom: 8,
                                  border: selectedConversation?.phoneNumber === conversation.phoneNumber ? '1px solid #1890ff' : '1px solid #f0f0f0',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedConversation?.phoneNumber !== conversation.phoneNumber) {
                                    e.currentTarget.style.backgroundColor = '#fafafa'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedConversation?.phoneNumber !== conversation.phoneNumber) {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }
                                }}
                                onClick={() => setSelectedConversation(conversation)}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar style={{ backgroundColor: '#25D366' }}>
                                      <WhatsAppOutlined />
                                    </Avatar>
                                  }
                                  title={
                                    <Space direction="vertical" size={0}>
                                      <Text strong style={{ fontSize: 14 }}>
                                        {conversation.phoneNumber}
                                      </Text>
                                      <Text type="secondary" style={{ fontSize: 11 }}>
                                        {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                                      </Text>
                                    </Space>
                                  }
                                  description={
                                    <Text 
                                      type="secondary" 
                                      style={{ 
                                        fontSize: 11,
                                        display: 'block',
                                        marginTop: 4,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {new Date(conversation.lastMessageAt).toLocaleString()}
                                    </Text>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        )}
                      </Card>
                    </Col>

                    {/* Conversation Messages */}
                    <Col xs={24} md={16} lg={18}>
                      {selectedConversation ? (
                        <Card
                          title={
                            <Space>
                              <Avatar style={{ backgroundColor: '#25D366' }}>
                                <WhatsAppOutlined />
                              </Avatar>
                              <div>
                                <div style={{ fontWeight: 500 }}>{selectedConversation.phoneNumber}</div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {selectedConversation.messageCount} message{selectedConversation.messageCount !== 1 ? 's' : ''}
                                </Text>
                              </div>
                            </Space>
                          }
                          style={{ 
                            height: 'calc(100vh - 300px)', 
                            overflow: 'auto',
                            borderRadius: 16, 
                            border: 'none', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                          }}
                        >
                          {selectedConversation.messages.length === 0 ? (
                            <Empty description="No messages in this conversation" />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {selectedConversation.messages.map((message, index) => {
                                const isOutgoing = message.direction === 'outgoing' || !message.direction
                                return (
                                  <div
                                    key={message._id || index}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: isOutgoing ? 'flex-end' : 'flex-start',
                                      padding: '12px 16px',
                                      background: isOutgoing ? '#e7f3ff' : '#f0f0f0',
                                      borderRadius: 12,
                                      maxWidth: '70%',
                                      marginLeft: isOutgoing ? 'auto' : 0,
                                      marginRight: isOutgoing ? 0 : 'auto',
                                    }}
                                  >
                                    {message.mediaAttachments && message.mediaAttachments.length > 0 && (
                                      <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {message.mediaAttachments.map((media, mediaIndex) => (
                                          <div key={mediaIndex}>
                                            {media.type === 'image' ? (
                                              <img
                                                src={media.url}
                                                alt={`Media ${mediaIndex + 1}`}
                                                style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }}
                                              />
                                            ) : (
                                              <div style={{ padding: 16, background: '#f0f0f0', borderRadius: 8 }}>
                                                <VideoCameraOutlined style={{ fontSize: 24 }} />
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <Text style={{ fontSize: 14, wordBreak: 'break-word' }}>
                                      {message.content || '(No content)'}
                                    </Text>
                                    <Text 
                                      type="secondary" 
                                      style={{ fontSize: 11, marginTop: 4, alignSelf: isOutgoing ? 'flex-end' : 'flex-start' }}
                                    >
                                      {new Date(message.publishedAt || message.createdAt).toLocaleString()}
                                    </Text>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </Card>
                      ) : (
                        <Card style={{ 
                          height: 'calc(100vh - 300px)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: 16, 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
                        }}>
                          <Empty
                            description="Select a conversation to view messages"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        </Card>
                      )}
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
          </Card>

          {/* Add Contact Modal */}
          <Modal
          title="Add Contact"
          open={isAddContactModalOpen}
          onCancel={() => {
            setIsAddContactModalOpen(false)
            addContactForm.resetFields()
          }}
          footer={null}
        >
          <Form form={addContactForm} onFinish={handleAddContact} layout="vertical">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter contact name' }]}
            >
              <Input placeholder="Contact name" />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              label="Phone Number"
              rules={[
                { required: true, message: 'Please enter phone number' },
                {
                  pattern: /^[\d\s\+\-\(\)]+$/,
                  message: 'Please enter a valid phone number',
                },
              ]}
            >
              <Input placeholder="+1234567890 or 1234567890" prefix={<PhoneOutlined />} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email (Optional)"
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input placeholder="email@example.com" prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item name="notes" label="Notes (Optional)">
              <TextArea rows={3} placeholder="Additional notes about this contact" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Add Contact
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Contact Modal */}
        <Modal
          title="Edit Contact"
          open={isEditContactModalOpen}
          onCancel={() => {
            setIsEditContactModalOpen(false)
            setEditingContact(null)
            editContactForm.resetFields()
          }}
          footer={null}
        >
          <Form form={editContactForm} onFinish={handleEditContact} layout="vertical">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter contact name' }]}
            >
              <Input placeholder="Contact name" />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              label="Phone Number"
              rules={[
                { required: true, message: 'Please enter phone number' },
                {
                  pattern: /^[\d\s\+\-\(\)]+$/,
                  message: 'Please enter a valid phone number',
                },
              ]}
            >
              <Input placeholder="+1234567890 or 1234567890" prefix={<PhoneOutlined />} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email (Optional)"
              rules={[{ type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input placeholder="email@example.com" prefix={<MailOutlined />} />
            </Form.Item>
            <Form.Item name="notes" label="Notes (Optional)">
              <TextArea rows={3} placeholder="Additional notes about this contact" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Contact
              </Button>
            </Form.Item>
          </Form>
          </Modal>
        </div>
      </Content>
      </Layout>
    </Layout>
  )
}

