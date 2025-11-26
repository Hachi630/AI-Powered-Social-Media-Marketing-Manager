import { ArrowUpOutlined, AudioOutlined, CodeOutlined, PictureOutlined } from '@ant-design/icons'
import { Button, Card, Input, Space, Tooltip, message, Spin } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './ChatBox.module.css'
import { chatService, ChatMessage } from '../services/chatService'

const { TextArea } = Input

const toolbarActions = [
  { key: 'image', icon: <PictureOutlined />, label: 'Insert image' },
  { key: 'code', icon: <CodeOutlined />, label: 'Share code' },
  { key: 'audio', icon: <AudioOutlined />, label: 'Use microphone' },
]

interface ChatBoxProps {
  conversationId?: string | null
  onConversationChange?: (conversationId: string | null) => void
  onTypingStatusChange?: (typing: boolean) => void
  onContentChange?: (hasMessages: boolean) => void
}

export default function ChatBox({
  conversationId,
  onConversationChange,
  onTypingStatusChange,
  onContentChange,
}: ChatBoxProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null)

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      // Reset to new conversation
      setMessages([])
      setCurrentConversationId(null)
    }
  }, [conversationId])

  // Inform parent when typing state changes
  const updateTypingStatus = useCallback(
    (typing: boolean) => {
      if (onTypingStatusChange) {
        onTypingStatusChange(typing)
      }
    },
    [onTypingStatusChange]
  )

  useEffect(() => {
    if (onContentChange) {
      onContentChange(messages.length > 0)
    }
  }, [messages.length, onContentChange])

  const loadConversation = async (id: string) => {
    setLoading(true)
    try {
      const result = await chatService.getConversation(id)
      if (result.success && result.conversation) {
        setMessages(result.conversation.messages)
        setCurrentConversationId(id)
      } else {
        message.error(result.message || 'Failed to load conversation')
      }
    } catch (error) {
      message.error('An error occurred while loading conversation')
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = !inputMessage.trim()

  const handleSend = async () => {
    if (isEmpty || loading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    // Add user message to the list immediately
    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputMessage.trim()
    setInputMessage('')
    updateTypingStatus(false)
    setLoading(true)

    try {
      const response = await chatService.sendMessage(currentInput, currentConversationId || undefined)

      if (response.success && response.response) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Update conversation ID if it's a new conversation
        if (response.conversationId && !currentConversationId) {
          setCurrentConversationId(response.conversationId)
          if (onConversationChange) {
            onConversationChange(response.conversationId)
          }
        }
      } else {
        message.error(response.message || 'Failed to get response')
        // Remove the last user message if sending failed
        setMessages((prev) => prev.slice(0, -1))
        // Restore input message
        setInputMessage(currentInput)
      }
    } catch (error) {
      message.error('An error occurred while sending message')
      setMessages((prev) => prev.slice(0, -1))
      setInputMessage(currentInput)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setInputMessage(value)
    updateTypingStatus(Boolean(value.trim()))
  }

  const handleFocus = () => {
    if (inputMessage.trim().length > 0) {
      updateTypingStatus(true)
    }
  }

  const handleBlur = () => {
    updateTypingStatus(false)
  }

  // Reset typing status when component unmounts
  useEffect(() => {
    return () => {
      updateTypingStatus(false)
    }
  }, [updateTypingStatus])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.chatContainer}>
      {/* Messages display area */}
      {messages.length > 0 && (
        <div className={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.messageItem} ${
                msg.role === 'user' ? styles.userMessage : styles.assistantMessage
              }`}
            >
              <div className={styles.messageContent}>
                <div className={styles.markdownContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.messageItem} ${styles.assistantMessage}`}>
              <div className={styles.messageContent}>
                <Spin size="small" />
                <span className={styles.thinkingText}>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <Card className={styles.chatCard} bodyStyle={{ padding: 24 }}>
        <Space direction="vertical" size={24} className={styles.inner}>
          <TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="What would you like to know?"
            value={inputMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={loading}
          />
          <Space align="center" className={styles.toolbar}>
            <Space size="middle">
              {toolbarActions.map((action) => (
                <Tooltip title={action.label} key={action.key}>
                  <Button shape="circle" icon={action.icon} disabled={loading} />
                </Tooltip>
              ))}
            </Space>
            <Tooltip title="Send message">
              <Button
                type="primary"
                shape="circle"
                disabled={isEmpty || loading}
                icon={loading ? <Spin size="small" /> : <ArrowUpOutlined />}
                onClick={handleSend}
                loading={loading}
              />
            </Tooltip>
          </Space>
        </Space>
      </Card>
    </div>
  )
}

