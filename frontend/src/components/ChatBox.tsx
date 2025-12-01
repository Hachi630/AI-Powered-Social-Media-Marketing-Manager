import { ArrowUpOutlined, AudioOutlined, CodeOutlined, PictureOutlined, CalendarOutlined } from '@ant-design/icons'
import { Button, Card, Input, Space, Tooltip, message, Spin } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './ChatBox.module.css'
import { chatService, ChatMessage } from '../services/chatService'
import ImageGenerationModal from './ImageGenerationModal'
import ContentPlanModal from './ContentPlanModal'

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
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [contentPlanModalOpen, setContentPlanModalOpen] = useState(false)
  const [lastUserMessage, setLastUserMessage] = useState<string>('')

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

  // Check if message contains content plan intent
  const hasContentPlanIntent = (message: string): boolean => {
    const lowerMessage = message.toLowerCase()
    const keywords = [
      'generate',
      'create',
      'plan',
      'content plan',
      'marketing plan',
      'calendar',
      'schedule',
      'campaign',
      'social media',
      'post schedule',
    ]
    return keywords.some((keyword) => lowerMessage.includes(keyword))
  }

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
    setLastUserMessage(currentInput)
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

  const handleOpenContentPlanModal = () => {
    setContentPlanModalOpen(true)
  }

  const handleContentPlanSuccess = () => {
    message.success('Content plan sent to calendar successfully')
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

  const handleImageGenerate = () => {
    setImageModalOpen(true)
  }

  const handleImageSuccess = async (imageUrl: string, newConversationId?: string) => {
    // Create assistant message with image
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: `Generated image`,
      images: [imageUrl],
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    // Update conversation ID if it's a new conversation
    if (newConversationId && !currentConversationId) {
      setCurrentConversationId(newConversationId)
      if (onConversationChange) {
        onConversationChange(newConversationId)
      }
    } else if (currentConversationId) {
      // Reload conversation to get updated messages
      loadConversation(currentConversationId)
    }
  }

  const getImageUrl = (imagePath: string): string => {
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    // Otherwise, use relative path (Vite proxy will handle it)
    return imagePath
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
                {msg.images && msg.images.length > 0 && (
                  <div className={styles.messageImages}>
                    {msg.images.map((img, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={getImageUrl(img)}
                        alt="Generated"
                        className={styles.generatedImage}
                      />
                    ))}
                  </div>
                )}
                <div className={styles.markdownContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === 'assistant' &&
                  index === messages.length - 1 &&
                  hasContentPlanIntent(lastUserMessage) && (
                    <div className={styles.actionButtons}>
                      <Button
                        type="primary"
                        icon={<CalendarOutlined />}
                        onClick={handleOpenContentPlanModal}
                        size="small"
                      >
                        Send to Calendar
                      </Button>
                    </div>
                  )}
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
      <Card className={styles.chatCard} styles={{ body: { padding: 24 } }}>
        <Space orientation="vertical" size={24} className={styles.inner}>
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
                  <Button
                    shape="circle"
                    icon={action.icon}
                    disabled={loading}
                    onClick={action.key === 'image' ? handleImageGenerate : undefined}
                  />
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

      {/* Image Generation Modal */}
      <ImageGenerationModal
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        onSuccess={handleImageSuccess}
        conversationId={currentConversationId}
      />

      {/* Content Plan Modal */}
      <ContentPlanModal
        open={contentPlanModalOpen}
        goal={lastUserMessage}
        onClose={() => setContentPlanModalOpen(false)}
        onSuccess={handleContentPlanSuccess}
      />
    </div>
  )
}

