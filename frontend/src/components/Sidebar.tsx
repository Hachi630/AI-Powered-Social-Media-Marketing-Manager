import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Input, List, Typography, Spin } from 'antd'
import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'
import { User } from '../services/authService'
import { chatService, ConversationListItem } from '../services/chatService'

const avatarSrc = 'https://www.figma.com/api/mcp/asset/3d8e0cdd-ecdb-4f02-b256-ee2d85bad6ec'

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
              <Button type="text" icon={<PlusOutlined />} onClick={handleNewChat} />
            </>
          )}
        </div>
        {!collapsed && (
          <>
            <Input
              className={styles.searchInput}
              placeholder="Search"
              prefix={<SearchOutlined />}
              allowClear
            />
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
                  dataSource={conversations}
                  renderItem={(item) => (
                    <List.Item
                      className={`${styles.chatItem} ${
                        selectedConversationId === item.id ? styles.chatItemActive : ''
                      }`}
                      onClick={() => handleConversationClick(item.id)}
                    >
                      <Typography.Text ellipsis>{item.title}</Typography.Text>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </>
        )}
      </div>
      <div className={styles.userSection}>
        <Avatar size={32} src={avatarSrc} />
        {!collapsed && <Typography.Text>{user?.email || 'Guest'}</Typography.Text>}
      </div>
    </aside>
  )
}
