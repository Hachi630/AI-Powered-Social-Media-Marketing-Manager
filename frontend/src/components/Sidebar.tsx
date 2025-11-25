import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Input, List, Typography } from 'antd'
import { useState } from 'react'
import styles from './Sidebar.module.css'
import { User } from '../services/authService'

const chatHistory = [
  'Analog Clock React app',
  'Simple Design System',
  'Figma variable planning',
  'OKCLH token algorithm',
  'Component naming advice',
]

const avatarSrc = 'https://www.figma.com/api/mcp/asset/3d8e0cdd-ecdb-4f02-b256-ee2d85bad6ec'

interface SidebarProps {
  collapsed: boolean
  onToggleSidebar: () => void
  user?: User | null
}

export default function Sidebar({ collapsed, onToggleSidebar, user }: SidebarProps) {
  const [selectedChat, setSelectedChat] = useState(0)

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
              <Button type="text" icon={<PlusOutlined />} />
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
              <List
                className={styles.chatList}
                dataSource={chatHistory}
                renderItem={(item, index) => (
                  <List.Item
                    className={`${styles.chatItem} ${
                      selectedChat === index ? styles.chatItemActive : ''
                    }`}
                    onClick={() => setSelectedChat(index)}
                  >
                    <Typography.Text>{item}</Typography.Text>
                  </List.Item>
                )}
              />
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
