import { useState, useEffect, useRef, useCallback } from 'react';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatService, ChatMessage } from '../services/chatService';
import ELOQuickActions from './ELOQuickActions';
import ELOSubOptions from './ELOSubOptions';
import { presetAnswers, getPresetAnswer, getCategoryOptions, PresetAnswer } from '../data/presetAnswers';
import { classifyQuestion, buildPromptForQuestion } from '../utils/questionClassifier';
import { useInactivity } from '../hooks/useInactivity';
import { getNextTip } from '../utils/dataAnalysisTips';
import styles from './ELOChatDialog.module.css';

export interface ELOChatDialogProps {
  open: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onSendToDashboard?: (message: string) => void;
  currentPage?: 'calendar' | 'dashboard' | 'chat' | 'campaign';
  onShowTip?: (message: string, type?: 'info' | 'reminder' | 'tip', duration?: number) => void;
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
  onShowTip,
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPresetAnswer, setSelectedPresetAnswer] = useState<PresetAnswer | null>(null);
  const [previousCategory, setPreviousCategory] = useState<string | null>(null); // Track previous category for back navigation
  const inactivityTipShownRef = useRef(false); // Track if inactivity tip has been shown
  const dataTipIntervalRef = useRef<NodeJS.Timeout | null>(null); // Timer for data tips

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
      inactivityTipShownRef.current = false;
      // Clear data tip interval
      if (dataTipIntervalRef.current) {
        clearInterval(dataTipIntervalRef.current);
        dataTipIntervalRef.current = null;
      }
    }
  }, [open]);

  // 15-second inactivity detection - only when dialog is open and no messages
  useInactivity({
    timeout: 15000,
    enabled: open && messages.length === 0 && !selectedCategory && !inactivityTipShownRef.current,
    onInactive: () => {
      if (onShowTip && !inactivityTipShownRef.current && messages.length === 0 && !selectedCategory) {
        console.log('[ELO] Showing inactivity tip');
        onShowTip("Do you need any help?", 'info', 5000);
        inactivityTipShownRef.current = true;
      }
    },
  });

  // Data analysis tips - show every minute when dialog is open
  useEffect(() => {
    if (!open || !onShowTip) return;

    console.log('[ELO] Setting up data analysis tips timer');

    // Show first tip after 1 minute
    const firstTipTimer = setTimeout(() => {
      if (open && onShowTip) {
        const tip = getNextTip();
        console.log('[ELO] Showing first data tip:', tip.message);
        onShowTip(tip.message, 'tip', 12000);
      }
    }, 60000); // 1 minute

    // Then show tips every minute
    dataTipIntervalRef.current = setInterval(() => {
      if (open && onShowTip) {
        const tip = getNextTip();
        console.log('[ELO] Showing data tip:', tip.message);
        onShowTip(tip.message, 'tip', 12000);
      }
    }, 60000); // Every 1 minute

    return () => {
      clearTimeout(firstTipTimer);
      if (dataTipIntervalRef.current) {
        clearInterval(dataTipIntervalRef.current);
        dataTipIntervalRef.current = null;
      }
    };
  }, [open, onShowTip]);

  // Handle quick action selection - show sub-options instead of calling AI
  const handleQuickAction = useCallback((actionId: string) => {
    // Handle send to dashboard separately
    if (actionId === 'send-dashboard') {
      if (onSendToDashboard) {
        onSendToDashboard(inputMessage || 'Hello, I need help');
        onClose();
      }
      return;
    }

    // Show sub-options for the selected category
    setShowQuickActions(false);
    setPreviousCategory(null); // Reset previous category when entering sub-options
    setSelectedCategory(actionId);
    setSelectedPresetAnswer(null);
  }, [onSendToDashboard, onClose, inputMessage]);

  // Handle sub-option selection - show preset answer immediately
  const handleSubOptionSelect = useCallback((optionId: string) => {
    if (!selectedCategory) return;

    const presetAnswer = getPresetAnswer(selectedCategory, optionId);
    if (!presetAnswer) return;

    // Save current category as previous for back navigation
    setPreviousCategory(selectedCategory);
    setSelectedPresetAnswer(presetAnswer);
    setSelectedCategory(null);

    // Build answer text
    let answerText = presetAnswer.answer;
    if (presetAnswer.steps && presetAnswer.steps.length > 0) {
      answerText += '\n\n' + presetAnswer.steps.join('\n');
    }

    // Add user message (the question title)
    const userMessage: ChatMessage = {
      role: 'user',
      content: presetAnswer.title,
      timestamp: new Date(),
    };

    // Add assistant message (preset answer)
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: answerText,
      timestamp: new Date(),
    };

    setMessages([userMessage, assistantMessage]);
  }, [selectedCategory]);

  // Handle back navigation - return to previous level
  const handleBack = useCallback(() => {
    if (messages.length > 0 && previousCategory) {
      // If viewing preset answer, return to sub-options
      setMessages([]);
      setSelectedCategory(previousCategory);
      setSelectedPresetAnswer(null);
      setPreviousCategory(null);
    } else if (messages.length > 0 && !previousCategory) {
      // If viewing AI answer at main level, return to main quick actions
      setMessages([]);
      setShowQuickActions(true);
      setSelectedCategory(null);
      setSelectedPresetAnswer(null);
    } else if (selectedCategory) {
      // If viewing sub-options, return to main quick actions
      setSelectedCategory(null);
      setShowQuickActions(true);
      setPreviousCategory(null);
    } else {
      // If at main level, close dialog
      onClose();
    }
  }, [messages.length, previousCategory, selectedCategory, onClose]);

  // Handle send message - with question classification
  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || loading) return;

    const currentInput = inputMessage.trim();
    
    // Save user's original message
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setShowQuickActions(false);
    setSelectedCategory(null);
    setSelectedPresetAnswer(null);
    setLoading(true);

    // Classify question type
    const questionType = classifyQuestion(currentInput);
    
    // Build prompt based on question type (for AI, but save original user message)
    const enhancedPrompt = buildPromptForQuestion(currentInput, questionType);

    try {
      const response = await chatService.sendMessage(
        enhancedPrompt,
        conversationId || undefined,
        undefined,
        undefined,
        undefined,
        questionType
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

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('[ELO Dialog] Dialog opened, position:', dialogStyle);
    } else {
      console.log('[ELO Dialog] Dialog closed');
    }
  }, [open, dialogStyle]);

  if (!open) {
    console.log('[ELO Dialog] Dialog not open, returning null');
    return null;
  }

  console.log('[ELO Dialog] Rendering dialog with style:', dialogStyle);

  return (
    <div className={styles.cloudBubble} style={dialogStyle}>
      <div className={styles.dialogHeader}>
        <h3 className={styles.dialogTitle}>
          <span>ELO</span>
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(messages.length > 0 || selectedCategory) && (
            <button
              className={styles.closeButton}
              onClick={handleBack}
              aria-label="Back"
              title="Back"
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
        {showQuickActions && messages.length === 0 && !selectedCategory && (
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

        {selectedCategory && messages.length === 0 && (
          <ELOSubOptions
            options={getCategoryOptions(selectedCategory)}
            categoryName={presetAnswers.find(cat => cat.categoryId === selectedCategory)?.categoryName || ''}
            onOptionSelect={handleSubOptionSelect}
          />
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

        {messages.length === 0 && !showQuickActions && !selectedCategory && (
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
