import { ArrowUpOutlined, AudioOutlined, CodeOutlined, PictureOutlined } from '@ant-design/icons'
import { Button, Card, Input, Space, Tooltip } from 'antd'
import { useState } from 'react'
import styles from './ChatBox.module.css'

const { TextArea } = Input

const toolbarActions = [
  { key: 'image', icon: <PictureOutlined />, label: 'Insert image' },
  { key: 'code', icon: <CodeOutlined />, label: 'Share code' },
  { key: 'audio', icon: <AudioOutlined />, label: 'Use microphone' },
]

export default function ChatBox() {
  const [message, setMessage] = useState('')
  const isEmpty = !message.trim()

  return (
    <Card className={styles.chatCard} bodyStyle={{ padding: 24 }}>
      <Space direction="vertical" size={24} className={styles.inner}>
        <TextArea
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder="What would you like to know?"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <Space align="center" className={styles.toolbar}>
          <Space size="middle">
            {toolbarActions.map((action) => (
              <Tooltip title={action.label} key={action.key}>
                <Button shape="circle" icon={action.icon} />
              </Tooltip>
            ))}
          </Space>
          <Tooltip title="Send message">
            <Button
              type="primary"
              shape="circle"
              disabled={isEmpty}
              icon={<ArrowUpOutlined />}
            />
          </Tooltip>
        </Space>
      </Space>
    </Card>
  )
}

