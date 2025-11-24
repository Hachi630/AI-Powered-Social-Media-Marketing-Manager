import {
  MenuOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Input, List, Space, Typography } from 'antd'
import { useState } from 'react'
import styles from './Sidebar.module.css'

const chatHistory = [
  'Analog Clock React app',
  'Simple Design System',
  'Figma variable planning',
  'OKCLH token algorithm',
  'Component naming advice',
]

const avatarSrc = 'https://www.figma.com/api/mcp/asset/3d8e0cdd-ecdb-4f02-b256-ee2d85bad6ec'

export default function Sidebar() {
  const [selectedChat, setSelectedChat] = useState(0)

  return (
    <div className={styles.sidebar}>
      <Space direction="vertical" size="large" className={styles.scrollable}>
        <Space align="center" className={styles.headerRow}>
          <Button shape="circle" icon={<MenuOutlined />} />
          <Typography.Title level={5} className={styles.title}>
            Flippy chats
          </Typography.Title>
          <Button type="text" icon={<PlusOutlined />} />
        </Space>
        <Input
          className={styles.searchInput}
          placeholder="Search"
          prefix={<SearchOutlined />}
          allowClear
        />
        <div>
          <Typography.Text type="secondary" className={styles.sectionLabel}>
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
      </Space>
      <Space align="center" className={styles.userSection}>
        <Avatar size={32} src={avatarSrc} />
        <Typography.Text>Miya@gmail.com</Typography.Text>
      </Space>
    </div>
  )
}

