import { Layout, Typography, Grid, Drawer, FloatButton, Card, Row, Col, Statistic, Tag, Button, Spin, Empty } from "antd";
import { MenuOutlined, LinkedinOutlined, UserOutlined, TeamOutlined, EyeOutlined, SyncOutlined } from "@ant-design/icons";
import { useState, useCallback, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./Dashboard.module.css";
import { getLinkedInMetrics, getLinkedInAuthUrl } from "../services/linkedinService";
import { User } from "../services/authService";

interface LinkedInDashboardProps {
  isLoggedIn?: boolean;
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  user?: User | null;
  jwt?: string;
  userId?: string;
}

const { Content, Sider } = Layout;
const { useBreakpoint } = Grid;

export default function LinkedInDashboard({
  isLoggedIn = false,
  onLoginSuccess,
  onLogout,
  user,
  jwt,
  userId,
}: LinkedInDashboardProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const isTablet = screens.md && !screens.lg;
  const [collapsed, setCollapsed] = useState(isMobile || isTablet);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationsUpdateTrigger, setConversationsUpdateTrigger] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Update collapsed state when screen size changes
  useEffect(() => {
    if (isMobile || isTablet) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile, isTablet]);

  // Load LinkedIn metrics
  useEffect(() => {
    const loadMetrics = async () => {
      if (!jwt) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getLinkedInMetrics(jwt);
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load LinkedIn metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, [jwt]);

  const handleRefreshMetrics = async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      const data = await getLinkedInMetrics(jwt);
      setMetrics(data);
    } catch (error) {
      console.error("Failed to refresh LinkedIn metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = useCallback((conversationId: string | null) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(null);
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

  // Generate auth URL with userId for proper token association
  const authUrl = userId ? getLinkedInAuthUrl(userId) : undefined;

  const renderMetricsContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" />
          <Typography.Paragraph style={{ marginTop: 16, color: "#666" }}>
            Loading LinkedIn metrics...
          </Typography.Paragraph>
        </div>
      );
    }

    if (!jwt || !isLoggedIn) {
      return (
        <Empty
          image={<LinkedinOutlined style={{ fontSize: 64, color: "#0077B5" }} />}
          description={
            <Typography.Text type="secondary">
              Please log in to view your LinkedIn analytics
            </Typography.Text>
          }
        />
      );
    }

    const isConnected = metrics?.followers?.available || metrics?.connections?.available;

    return (
      <div style={{ width: "100%", maxWidth: 1200 }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Typography.Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
              <LinkedinOutlined style={{ color: "#0077B5" }} />
              Social Dashboard
            </Typography.Title>
            <Typography.Text type="secondary">
              Track your LinkedIn presence and engagement
            </Typography.Text>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isConnected && (
              <Button icon={<SyncOutlined />} onClick={handleRefreshMetrics} loading={loading}>
                Refresh
              </Button>
            )}
            {!isConnected && authUrl && (
              <Button type="primary" icon={<LinkedinOutlined />} href={authUrl} style={{ background: "#0077B5", borderColor: "#0077B5" }}>
                Connect LinkedIn
              </Button>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <Row gutter={[24, 24]}>
          {/* Followers Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: "100%", borderRadius: 12 }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: "linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <UserOutlined style={{ fontSize: 24, color: "#fff" }} />
                </div>
                <Typography.Text strong style={{ fontSize: 16 }}>Followers</Typography.Text>
              </div>
              {metrics?.followers?.available ? (
                <Statistic
                  value={metrics.followers.value}
                  valueStyle={{ fontSize: 36, fontWeight: 700, color: "#0077B5" }}
                />
              ) : (
                <div>
                  <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                    Connect LinkedIn to see your follower count
                  </Typography.Text>
                  {authUrl ? (
                    <Button type="link" href={authUrl} style={{ padding: 0, color: "#0077B5" }}>
                      Connect now →
                    </Button>
                  ) : (
                    <Tag color="default">Not Available</Tag>
                  )}
                </div>
              )}
            </Card>
          </Col>

          {/* Connections Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: "100%", borderRadius: 12 }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: "linear-gradient(135deg, #00A0DC 0%, #0077B5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <TeamOutlined style={{ fontSize: 24, color: "#fff" }} />
                </div>
                <Typography.Text strong style={{ fontSize: 16 }}>Connections</Typography.Text>
              </div>
              {metrics?.connections?.available ? (
                <Statistic
                  value={metrics.connections.value}
                  valueStyle={{ fontSize: 36, fontWeight: 700, color: "#00A0DC" }}
                />
              ) : (
                <div>
                  <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                    Your total network connections
                  </Typography.Text>
                  <Tag color="default">Not Available</Tag>
                </div>
              )}
            </Card>
          </Col>

          {/* Profile Views Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: "100%", borderRadius: 12 }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: "linear-gradient(135deg, #86868B 0%, #636366 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <EyeOutlined style={{ fontSize: 24, color: "#fff" }} />
                </div>
                <Typography.Text strong style={{ fontSize: 16 }}>Profile Views</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  90-day profile view analytics
                </Typography.Text>
                <Tag color="warning">Not supported by LinkedIn API</Tag>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Connection Status */}
        <Card style={{ marginTop: 24, borderRadius: 12 }} styles={{ body: { padding: 24 } }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Typography.Text strong style={{ fontSize: 16 }}>
                LinkedIn Connection Status
              </Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {isConnected 
                  ? "Your LinkedIn account is connected and syncing data" 
                  : "Connect your LinkedIn account to start tracking your social metrics"}
              </Typography.Text>
            </Col>
            <Col>
              {isConnected ? (
                <Tag color="success" style={{ padding: "4px 12px", fontSize: 14 }}>
                  ● Connected
                </Tag>
              ) : (
                <Tag color="default" style={{ padding: "4px 12px", fontSize: 14 }}>
                  ○ Not Connected
                </Tag>
              )}
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  return (
    <Layout className={`${styles.dashboard} ${styles.dashboardLight}`}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Layout className={styles.dashboardLayout}>
        {/* Sidebar - same as Dashboard */}
        {isLoggedIn && !isMobile && (
          <Sider
            width={360}
            collapsedWidth={isTablet ? 0 : 88}
            collapsed={collapsed}
            theme="light"
            trigger={null}
            breakpoint="lg"
            className={styles.sider}
          >
            <Sidebar
              collapsed={collapsed}
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
        <Content className={`${styles.content} ${styles.contentLight}`} style={{ padding: isMobile ? 16 : 32, alignItems: "flex-start" }}>
          {renderMetricsContent()}
          {isMobile && isLoggedIn && (
            <FloatButton
              icon={<MenuOutlined />}
              type="primary"
              style={{
                right: 16,
                bottom: 16,
                backgroundColor: "#0077B5",
                borderColor: "#0077B5",
              }}
              onClick={() => setSidebarDrawerOpen(true)}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
