import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Input, List, Typography, Spin, Modal, message } from 'antd'
import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'
import { User } from '../services/authService'
import { chatService, ConversationListItem } from '../services/chatService'

interface SidebarProps {
  collapsed: boolean
  onToggleSidebar: () => void
  user?: User | null
  selectedConversationId?: string | null
  onConversationSelect?: (conversationId: string | null) => void
  onNewConversation?: () => void
  conversationsUpdateTrigger?: number
}

export default function Sidebar({
  collapsed,
  onToggleSidebar,
  user,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  conversationsUpdateTrigger,
}: SidebarProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const loadConversations = async () => {
    if (!user) {
      setConversations([])
      return
    }
    setLoading(true)
    try {
      const result = await chatService.getConversations()
      if (result.success && result.conversations) {
        setConversations(result.conversations)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load conversations on mount, when user changes, or when update trigger changes
  useEffect(() => {
    loadConversations()
  }, [user, conversationsUpdateTrigger])

  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId)
    }
  }

  const handleNewChat = () => {
    if (onNewConversation) {
      onNewConversation()
    }
    if (onConversationSelect) {
      onConversationSelect(null)
    }
  }

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    // Prevent event bubbling to avoid triggering conversation selection
    e.stopPropagation()

    Modal.confirm({
      title: 'Delete Conversation',
      content: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await chatService.deleteConversation(conversationId)
          if (result.success) {
            message.success('Conversation deleted successfully')
            // Reload conversations
            await loadConversations()
            // If deleted conversation was selected, clear selection
            if (selectedConversationId === conversationId && onConversationSelect) {
              onConversationSelect(null)
            }
          } else {
            message.error(result.message || 'Failed to delete conversation')
          }
        } catch (error) {
          message.error('An error occurred while deleting the conversation')
        }
      },
    })
  }

  // Filter conversations based on search keyword
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchKeyword.trim()) {
      return true
    }
    const keyword = searchKeyword.toLowerCase().trim()
    return conversation.title.toLowerCase().includes(keyword)
  })

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.topSection}>
        <div className={styles.header}>
          <Button
            shape="circle"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleSidebar}
            className={styles.menuButton}
          />
          {!collapsed && (
            <>
              <Typography.Title level={5} className={styles.title}>
                Flippy chats
              </Typography.Title>
              <div className={styles.headerActions}>
                <Button 
                  type="text" 
                  icon={<SearchOutlined />} 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={styles.searchIconButton}
                />
                <Button type="text" icon={<PlusOutlined />} onClick={handleNewChat} className={styles.newChatButton} />
              </div>
            </>
          )}
        </div>
        {!collapsed && (
          <>
            {isSearchOpen && (
              <Input
                className={styles.searchInput}
                placeholder="Search"
                prefix={<SearchOutlined />}
                allowClear
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                autoFocus
                onPressEnter={() => {
                  // Keep search open when pressing enter
                }}
                onBlur={() => {
                  // Keep search open if there's a keyword, close if empty
                  if (!searchKeyword.trim()) {
                    setTimeout(() => {
                      setIsSearchOpen(false)
                    }, 150)
                  }
                }}
              />
            )}
            <div className={styles.chatsSection}>
              <Typography.Text type="secondary" className={styles.sectionTitle}>
                Chats
              </Typography.Text>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin size="small" />
                </div>
              ) : (
                <List
                  className={styles.chatList}
                  dataSource={filteredConversations}
                  renderItem={(item) => (
                    <List.Item
                      className={`${styles.chatItem} ${
                        selectedConversationId === item.id ? styles.chatItemActive : ''
                      }`}
                      onClick={() => handleConversationClick(item.id)}
                      actions={[
                        <Button
                          key="delete"
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => handleDeleteConversation(e, item.id)}
                          className={styles.deleteButton}
                        />,
                      ]}
                    >
                      <div className={styles.chatItemContent}>
                        <MessageOutlined className={styles.chatIcon} />
                        <Typography.Text ellipsis className={styles.chatTitle}>
                          {item.title}
                        </Typography.Text>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </>
        )}
      </div>
      <div className={styles.userSection}>
        <Avatar
          size={36}
          src={user?.avatar}
          style={{ backgroundColor: '#87d068' }}
        >
          {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'G'}
        </Avatar>
        {!collapsed && (
          <div className={styles.userInfo}>
            <Typography.Text className={styles.userName} ellipsis>
              {user?.name || user?.brandName || 'Melo User'}
            </Typography.Text>
            {user?.email && (
              <Typography.Text className={styles.userEmail} ellipsis>
                {user.email}
              </Typography.Text>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
