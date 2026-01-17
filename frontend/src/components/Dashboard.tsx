import { Layout, Typography, Grid, Drawer, FloatButton } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useState, useCallback, useEffect } from "react";
import ChatBox from "./ChatBox";
import Header, { type HeaderProps } from "./Header";
import Sidebar from "./Sidebar";
import styles from "./Dashboard.module.css";
import { DEFAULT_TAGLINE } from "../constants/assets";
import { User } from "../services/authService";

interface DashboardProps {
  isLoggedIn?: boolean;
  heroTitle?: string;
  tagline?: string;
  background?: "default" | "light";
  headerOverrides?: Partial<HeaderProps>;
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  user?: User | null;
}

const { Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const defaultHero = "What Can I Do For You Today?";

export default function Dashboard({
  isLoggedIn = false,
  heroTitle = defaultHero,
  tagline = DEFAULT_TAGLINE,
  background = "default",
  headerOverrides,
  onLoginSuccess,
  onLogout,
  user,
}: DashboardProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const isTablet = screens.md && !screens.lg;
  const [collapsed, setCollapsed] = useState(isMobile || isTablet);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversationsUpdateTrigger, setConversationsUpdateTrigger] =
    useState(0);
  const [, setIsTyping] = useState(false);
  const [hasMessages, setHasMessages] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // Listen for messages from ELO widget
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'elo-pending-message' && e.newValue) {
        setPendingMessage(e.newValue);
        // Clear the storage after reading
        localStorage.removeItem('elo-pending-message');
      }
    };

    // Check for pending message on mount
    const storedMessage = localStorage.getItem('elo-pending-message');
    if (storedMessage) {
      setPendingMessage(storedMessage);
      localStorage.removeItem('elo-pending-message');
    }

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle insert content tip from ChatBox
  const handleInsertContent = useCallback(() => {
    // Dispatch event for ELO to show tip
    window.dispatchEvent(new CustomEvent('elo-show-tip', {
      detail: {
        message: "Remember to use the 'Send to Calendar' button to schedule your content",
        type: 'reminder',
        duration: 5000,
      }
    }));
  }, []);

  // Handle pending message by creating new conversation
  useEffect(() => {
    if (pendingMessage) {
      setSelectedConversationId(null);
      // Trigger a custom event that ChatBox can listen to
      window.dispatchEvent(new CustomEvent('elo-send-message', { detail: { message: pendingMessage } }));
      setPendingMessage(null);
    }
  }, [pendingMessage]);

  // Update collapsed state when screen size changes
  useEffect(() => {
    if (isMobile || isTablet) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile, isTablet]);

  const dashboardClass = `${styles.dashboard} ${
    background === "light" ? styles.dashboardLight : ""
  }`;
  const contentClass = `${styles.content} ${
    background === "light" ? styles.contentLight : ""
  }`;

  const handleConversationSelect = useCallback(
    (conversationId: string | null) => {
      setSelectedConversationId(conversationId);
    },
    []
  );

  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  const handleConversationChange = useCallback(
    (conversationId: string | null) => {
      // Only update if conversationId actually changed
      // This prevents unnecessary re-renders when the same conversation is set again
      if (conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
      // Trigger conversations list update
      setConversationsUpdateTrigger((prev) => prev + 1);
      }
    },
    [selectedConversationId]
  );

  const handleTypingStatus = useCallback((typing: boolean) => {
    setIsTyping(typing);
  }, []);

  const handleContentChange = useCallback((hasContent: boolean) => {
    setHasMessages(hasContent);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarDrawerOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const handleConversationSelectWithClose = useCallback(
    (conversationId: string | null) => {
      handleConversationSelect(conversationId);
      if (isMobile) {
        setSidebarDrawerOpen(false);
      }
    },
    [handleConversationSelect, isMobile]
  );

  return (
    <Layout className={dashboardClass.trim()}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
        {...headerOverrides}
      />
      <Layout className={styles.dashboardLayout}>
        {/* Sidebar with "Flippy chats" only shows when user is logged in */}
        {isLoggedIn && !isMobile && (
          <Sider
            width={270}
            collapsedWidth={isTablet ? 0 : 88}
            collapsed={collapsed}
            theme="light"
            trigger={null}
            breakpoint="lg"
            className={styles.sider}
          >
            <Sidebar
              collapsed={collapsed ?? false}
              onToggleSidebar={handleToggleSidebar}
              user={user}
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelect}
              onNewConversation={handleNewConversation}
              conversationsUpdateTrigger={conversationsUpdateTrigger}
            />
          </Sider>
        )}
        {isLoggedIn && isMobile && (
          <Drawer
            title="Flippy chats"
            placement="left"
            onClose={() => setSidebarDrawerOpen(false)}
            open={sidebarDrawerOpen}
            width={280}
            className={styles.sidebarDrawer}
          >
            <Sidebar
              collapsed={false}
              onToggleSidebar={() => setSidebarDrawerOpen(false)}
              user={user}
              selectedConversationId={selectedConversationId}
              onConversationSelect={handleConversationSelectWithClose}
              onNewConversation={handleNewConversation}
              conversationsUpdateTrigger={conversationsUpdateTrigger}
            />
          </Drawer>
        )}
        <Content className={contentClass.trim()}>
          {isMobile ? (
            <>
              {/* Mobile: Title removed */}
              {/* Mobile: Chat box container */}
              <div className={styles.mobileChatWrapper}>
                <ChatBox
                  conversationId={selectedConversationId}
                  onConversationChange={handleConversationChange}
                  onTypingStatusChange={handleTypingStatus}
                  onContentChange={handleContentChange}
                  onInsertContent={handleInsertContent}
                />
                {/* Mobile: Tagline fixed below chat box */}
                {tagline && (
                  <Typography.Paragraph className={styles.mobileTagline}>
                    {tagline}
                  </Typography.Paragraph>
                )}
              </div>
              {isLoggedIn && (
                <FloatButton
                  icon={<MenuOutlined />}
                  type="primary"
                  style={{
                    right: 16,
                    bottom: 80, // Moved up to avoid blocking send button
                    backgroundColor: "#AE906E",
                    borderColor: "#AE906E",
                  }}
                  onClick={() => setSidebarDrawerOpen(true)}
                />
              )}
            </>
          ) : (
            <>
              {/* Web: Keep original layout */}
              {!hasMessages && (
                <Typography.Title level={1} className={styles.title}>
                  {heroTitle}
                </Typography.Title>
              )}
              <ChatBox
                conversationId={selectedConversationId}
                onConversationChange={handleConversationChange}
                onTypingStatusChange={handleTypingStatus}
                onContentChange={handleContentChange}
                onInsertContent={handleInsertContent}
              />
              {tagline && !hasMessages && (
                <Typography.Paragraph className={styles.tagline}>
                  {tagline}
                </Typography.Paragraph>
              )}
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
