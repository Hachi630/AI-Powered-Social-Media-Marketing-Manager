import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Input,
  List,
  Typography,
  Spin,
  Modal,
  message,
} from "antd";
import { useState, useEffect, useCallback } from "react";
import styles from "./Sidebar.module.css";
import { User } from "../services/authService";
import { chatService, ConversationListItem } from "../services/chatService";

const avatarSrc =
  "https://www.figma.com/api/mcp/asset/3d8e0cdd-ecdb-4f02-b256-ee2d85bad6ec";

interface SidebarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  user?: User | null;
  selectedConversationId?: string | null;
  onConversationSelect?: (conversationId: string | null) => void;
  onNewConversation?: () => void;
  conversationsUpdateTrigger?: number;
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
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    setLoading(true);
    try {
      const result = await chatService.getConversations();
      if (result.success && result.conversations) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load conversations on mount, when user changes, or when update trigger changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations, conversationsUpdateTrigger]);

  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  const handleNewChat = () => {
    if (onNewConversation) {
      onNewConversation();
    }
    if (onConversationSelect) {
      onConversationSelect(null);
    }
  };

  const handleDeleteConversation = (
    e: React.MouseEvent,
    conversationId: string
  ) => {
    // Prevent event bubbling to avoid triggering conversation selection
    e.stopPropagation();

    Modal.confirm({
      title: "Delete Conversation",
      content:
        "Are you sure you want to delete this conversation? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await chatService.deleteConversation(conversationId);
          if (result.success) {
            message.success("Conversation deleted successfully");
            // Reload conversations
            await loadConversations();
            // If deleted conversation was selected, clear selection
            if (
              selectedConversationId === conversationId &&
              onConversationSelect
            ) {
              onConversationSelect(null);
            }
          } else {
            message.error(result?.message ?? "Failed to delete conversation");
          }
        } catch {
          message.error("An error occurred while deleting the conversation");
        }
      },
    });
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
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
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={handleNewChat}
              />
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
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Spin size="small" />
                </div>
              ) : (
                <List
                  className={styles.chatList}
                  dataSource={conversations}
                  renderItem={(item) => (
                    <List.Item
                      className={`${styles.chatItem} ${
                        selectedConversationId === item.id
                          ? styles.chatItemActive
                          : ""
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
        {!collapsed && (
          <Typography.Text>{user?.email || "Guest"}</Typography.Text>
        )}
      </div>
    </aside>
  );
}
