import { useState, useEffect, useRef, useCallback } from 'react';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatService, ChatMessage } from '../services/chatService';
import ELOQuickActions from './ELOQuickActions';
import styles from './ELOChatDialog.module.css';

export interface ELOChatDialogProps {
  open: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onSendToDashboard?: (message: string) => void;
  currentPage?: 'calendar' | 'dashboard' | 'chat' | 'campaign';
}

interface ConversationHistory {
  id: string;
  messages: ChatMessage[];
  timestamp: Date;
  title: string;
}

const WELCOME_MESSAGE = "Hello! I'm ELO, I'm happy to help you! How can I assist you today?";

// Context-aware welcome messages based on current page
const getContextualWelcome = (currentPage?: 'calendar' | 'dashboard' | 'chat' | 'campaign'): string => {
  switch (currentPage) {
    case 'calendar':
      return "Hello! I'm ELO. I see you're on the Calendar page. I can help you create events, manage your schedule, or answer questions about calendar features!";
    case 'campaign':
      return "Hello! I'm ELO. I see you're on the Social Dashboard. I can help you with social media management, content creation, or campaign planning!";
    case 'dashboard':
      return "Hello! I'm ELO, I'm happy to help you! How can I assist you today?";
    default:
      return WELCOME_MESSAGE;
  }
};

// Check if user is new (first time using ELO)
const isNewUser = (): boolean => {
  const hasUsedELO = localStorage.getItem('elo-has-used');
  return !hasUsedELO;
};

// Mark user as having used ELO
const markUserAsReturning = () => {
  localStorage.setItem('elo-has-used', 'true');
};

export default function ELOChatDialog({
  open,
  onClose,
  position,
  onSendToDashboard,
  currentPage = 'dashboard',
}: ELOChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isNewUserState, setIsNewUserState] = useState(false);

  // Check if user is new on mount
  useEffect(() => {
    const newUser = isNewUser();
    setIsNewUserState(newUser);
    if (newUser && open) {
      markUserAsReturning();
    }
  }, [open]);

  // Load conversation history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem('elo-conversation-history');
        if (stored) {
          const history = JSON.parse(stored);
          setConversationHistory(history.map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          })));
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    };
    loadHistory();
  }, []);

  // Save conversation history to localStorage
  const saveHistory = useCallback((newHistory: ConversationHistory[]) => {
    try {
      localStorage.setItem('elo-conversation-history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setShowQuickActions(true);
      setInputMessage('');
    }
  }, [open]);

  // Handle quick action selection
  const handleQuickAction = useCallback(async (actionId: string) => {
    setShowQuickActions(false);
    let prompt = '';

    // Context-aware prompts based on current page
    const getContextualPrompt = (actionId: string): string => {
      const pageContext = currentPage === 'calendar' 
        ? 'calendar and event management'
        : currentPage === 'campaign'
        ? 'social media campaigns and content planning'
        : 'the platform';

      switch (actionId) {
        case 'guide':
          return `I am ${isNewUserState ? 'a new user' : 'looking for guidance'}. Can you guide me through how to use ${pageContext}?`;
        case 'quick-create':
          if (currentPage === 'calendar') {
            return 'Help me create a new calendar event. What should I do?';
          } else if (currentPage === 'campaign') {
            return 'Help me create a new social media campaign. What should I do?';
          }
          return 'Help me create a new project or campaign. What should I do?';
        case 'faq':
          return `What are the most frequently asked questions about using ${pageContext}?`;
        case 'tips':
          return `What are some useful tips and best practices for using ${pageContext}?`;
        case 'project-guide':
          return 'I need guidance on creating and managing projects. Can you help me step by step?';
        default:
          return '';
      }
    };

    switch (actionId) {
      case 'guide':
        prompt = getContextualPrompt('guide');
        break;
      case 'quick-create':
        prompt = getContextualPrompt('quick-create');
        break;
      case 'faq':
        prompt = getContextualPrompt('faq');
        break;
      case 'tips':
        prompt = getContextualPrompt('tips');
        break;
      case 'project-guide':
        prompt = getContextualPrompt('project-guide');
        break;
      case 'send-dashboard':
        if (onSendToDashboard) {
          onSendToDashboard(inputMessage || 'Hello, I need help');
          onClose();
        }
        return;
      default:
        return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages([userMessage]);
    setLoading(true);

    try {
      const response = await chatService.sendMessage(prompt, conversationId || undefined);
      if (response.success && response.response) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        setMessages([userMessage, assistantMessage]);
        if (response.conversationId) {
          setConversationId(response.conversationId);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
      }
    }, [conversationId, onSendToDashboard, onClose, inputMessage, currentPage, isNewUserState]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setShowQuickActions(false);
    setLoading(true);

    try {
      const response = await chatService.sendMessage(
        inputMessage.trim(),
        conversationId || undefined
      );

      if (response.success && response.response) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);

        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        // Save to history
        if (finalMessages.length >= 2) {
          const historyItem: ConversationHistory = {
            id: response.conversationId || `elo-${Date.now()}`,
            messages: finalMessages,
            timestamp: new Date(),
            title: userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
          };
          const updatedHistory = [historyItem, ...conversationHistory].slice(0, 10); // Keep last 10
          setConversationHistory(updatedHistory);
          saveHistory(updatedHistory);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  }, [inputMessage, messages, conversationId, conversationHistory, saveHistory, loading]);

  // Handle load history
  const handleLoadHistory = useCallback((historyItem: ConversationHistory) => {
    setMessages(historyItem.messages);
    setConversationId(historyItem.id);
    setShowHistory(false);
    setShowQuickActions(false);
  }, []);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Calculate dialog position (top left of Live2D widget)
  // Position dialog to the left and above the Live2D widget
  const dialogWidth = 360;
  const widgetWidth = 200;
  const widgetHeight = 200;
  
  // Position to the left of the widget, aligned with the top
  const dialogLeft = position.x - dialogWidth - 10; // 10px gap from widget, to the left
  const dialogTop = position.y; // Align with top of widget
  
  // Ensure dialog stays within viewport
  const constrainedLeft = Math.max(20, Math.min(dialogLeft, window.innerWidth - dialogWidth - 20));
  const constrainedTop = Math.max(20, Math.min(dialogTop, window.innerHeight - 300));
  
  const dialogStyle: React.CSSProperties = {
    top: `${constrainedTop}px`,
    left: `${constrainedLeft}px`,
  };

  if (!open) return null;

  return (
    <div className={styles.cloudBubble} style={dialogStyle}>
      <div className={styles.dialogHeader}>
        <h3 className={styles.dialogTitle}>
          <span>ELO</span>
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {messages.length > 0 && !showQuickActions && (
            <button
              className={styles.closeButton}
              onClick={() => {
                setShowQuickActions(true);
                setMessages([]);
                setInputMessage('');
              }}
              aria-label="Back"
              title="Back to menu"
            >
              ←
            </button>
          )}
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <CloseOutlined />
          </button>
        </div>
      </div>

      <div className={styles.dialogContent}>
        {showQuickActions && messages.length === 0 && (
          <>
            <div className={styles.welcomeMessage}>
              {isNewUserState 
                ? "Welcome! I'm ELO, your AI assistant. I'm here to help you get started and guide you through using this platform. What would you like to know?"
                : getContextualWelcome(currentPage)
              }
            </div>
            <ELOQuickActions
              onActionSelect={handleQuickAction}
              onSendToDashboard={() => {
                if (onSendToDashboard) {
                  onSendToDashboard(inputMessage || 'Hello');
                  onClose();
                }
              }}
            />
            {conversationHistory.length > 0 && (
              <div className={styles.historySection}>
                <div className={styles.historyTitle}>Recent Conversations</div>
                {conversationHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={styles.historyItem}
                    onClick={() => handleLoadHistory(item)}
                  >
                    <span>{item.title}</span>
                    <span className={styles.historyItemTime}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {messages.length > 0 && (
          <div className={styles.messagesContainer}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={styles.messageItem}
              >
                <div
                  className={
                    message.role === 'user'
                      ? styles.messageUser
                      : styles.messageAssistant
                  }
                >
                  <div className={styles.messageContent}>
                    {message.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className={styles.loadingIndicator}>
                <span>ELO is thinking</span>
                <div className={styles.loadingDots}>
                  <div className={styles.loadingDot}></div>
                  <div className={styles.loadingDot}></div>
                  <div className={styles.loadingDot}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {messages.length === 0 && !showQuickActions && (
          <div className={styles.emptyState}>Start a conversation with ELO</div>
        )}
      </div>

      <div className={styles.inputArea}>
        <textarea
          ref={inputRef}
          className={styles.inputField}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          rows={1}
          disabled={loading}
        />
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!inputMessage.trim() || loading}
          aria-label="Send message"
        >
          <SendOutlined />
        </button>
      </div>
    </div>
  );
}
