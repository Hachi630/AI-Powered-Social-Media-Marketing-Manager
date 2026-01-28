import {
  DashboardOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  BarChartOutlined,
  CalendarOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HeatMapOutlined,
  TrophyOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  TagOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Layout, Button, Typography, Tooltip, Avatar } from "antd";
import styles from "./AnalyticsSidebar.module.css";

const { Sider } = Layout;

export type AnalyticsSection = 
  | "overview-stats" 
  | "key-insights" 
  | "time-series" 
  | "breakdown" 
  | "advanced-analytics"
  | "content-velocity-funnel"
  | "ai-efficiency-roi"
  | "cross-platform-strategy"
  | "media-asset-utilization"
  | "content-dna"
  | "recent-activity" 
  | "best-time-hours"
  | "best-time-days"
  | "best-time-heatmap"
  | "engagement-metrics"
  | "top-posts"
  | "sentiment-insights"
  | "platform-comparison"
  | "hashtag-trends"
  | "country-insights";

interface AnalyticsSidebarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  selectedSection: AnalyticsSection;
  onSectionSelect: (section: AnalyticsSection) => void;
}

interface SectionConfig {
  key: AnalyticsSection;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export default function AnalyticsSidebar({
  collapsed,
  onToggleSidebar,
  selectedSection,
  onSectionSelect,
}: AnalyticsSidebarProps) {
  const sections: SectionConfig[] = [
    {
      key: "overview-stats",
      label: "Overview Statistics",
      icon: <DashboardOutlined />,
      color: "#1890ff",
    },
    {
      key: "key-insights",
      label: "Key Insights & Trends",
      icon: <ThunderboltOutlined />,
      color: "#722ed1",
    },
    {
      key: "time-series",
      label: "Time Series Charts",
      icon: <LineChartOutlined />,
      color: "#eb2f96",
    },
    {
      key: "breakdown",
      label: "Data Breakdown",
      icon: <BarChartOutlined />,
      color: "#52c41a",
    },
    {
      key: "advanced-analytics",
      label: "Advanced Analytics & Strategic Insights",
      icon: <ThunderboltOutlined />,
      color: "#722ed1",
    },
    {
      key: "recent-activity",
      label: "Recent Activity",
      icon: <CalendarOutlined />,
      color: "#fa8c16",
    },
  ];

  // Advanced Analytics subsections
  const advancedAnalyticsSections: SectionConfig[] = [
    {
      key: "content-velocity-funnel",
      label: "Content Velocity Funnel",
      icon: <LineChartOutlined />,
      color: "#1890ff",
    },
    {
      key: "ai-efficiency-roi",
      label: "AI Efficiency & ROI",
      icon: <ThunderboltOutlined />,
      color: "#722ed1",
    },
    {
      key: "cross-platform-strategy",
      label: "Cross-Platform Strategy Mix",
      icon: <BarChartOutlined />,
      color: "#52c41a",
    },
    {
      key: "media-asset-utilization",
      label: "Media Asset Utilization",
      icon: <PictureOutlined />,
      color: "#fa8c16",
    },
    {
      key: "content-dna",
      label: "Content DNA (Thematic Analysis)",
      icon: <TagOutlined />,
      color: "#eb2f96",
    },
  ];


  // Add Best Time Analytics sections (from prediction_best_time dataset)
  const bestTimeSections: SectionConfig[] = [
    {
      key: "best-time-hours",
      label: "Best Hours to Post",
      icon: <ClockCircleOutlined />,
      color: "#1890ff",
    },
    {
      key: "best-time-days",
      label: "Best Days to Post",
      icon: <CalendarOutlined />,
      color: "#52c41a",
    },
    {
      key: "best-time-heatmap",
      label: "Day × Hour Heatmap",
      icon: <HeatMapOutlined />,
      color: "#eb2f96",
    },
    {
      key: "engagement-metrics",
      label: "Engagement Metrics",
      icon: <HeartOutlined />,
      color: "#ff4d4f",
    },
    {
      key: "top-posts",
      label: "Top Posts",
      icon: <TrophyOutlined />,
      color: "#faad14",
    },
    {
      key: "sentiment-insights",
      label: "Sentiment Insights",
      icon: <BulbOutlined />,
      color: "#722ed1",
    },
    {
      key: "platform-comparison",
      label: "Platform Comparison",
      icon: <BarChartOutlined />,
      color: "#13c2c2",
    },
    {
      key: "hashtag-trends",
      label: "Hashtag Trends",
      icon: <TagOutlined />,
      color: "#f5222d",
    },
    {
      key: "country-insights",
      label: "Country Insights",
      icon: <EnvironmentOutlined />,
      color: "#2f54eb",
    },
  ];

  // Group sections into subsections
  const overviewSections = sections.slice(0, 2); // Overview Statistics, Key Insights
  const detailedSections = sections.slice(2, 4); // Time Series, Breakdown
  const advancedAnalyticsMain = sections.slice(4, 5); // Advanced Analytics & Strategic Insights
  const recentActivitySection = sections.slice(5); // Recent Activity

  return (
    <Sider
      width={280}
      collapsedWidth={80}
      collapsed={collapsed}
      theme="light"
      trigger={null}
      className={styles.analyticsSider}
    >
      <div className={styles.sidebarContainer}>
        {/* Header */}
        {!collapsed && (
          <div className={styles.header}>
            <Button
              shape="circle"
              icon={<MenuFoldOutlined />}
              onClick={onToggleSidebar}
              className={styles.menuButton}
            />
            <Typography.Title level={5} className={styles.title}>
              Navigation
            </Typography.Title>
          </div>
        )}

        {/* Navigation List */}
        <div className={styles.navList}>
          {/* Toggle button for collapsed state - positioned at top */}
          {collapsed && (
            <div
              style={{
                padding: "8px 0",
                display: "flex",
                justifyContent: "center",
                marginBottom: 8,
                width: "100%",
              }}
            >
              <Button
                shape="circle"
                icon={<MenuUnfoldOutlined />}
                onClick={onToggleSidebar}
                className={styles.menuButton}
                size="small"
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </div>
          )}

          {/* Overview & Insights Subsection */}
          {!collapsed && (
            <div className={styles.subsection}>
              <Typography.Text className={styles.subsectionTitle}>
                Overview & Insights
              </Typography.Text>
            </div>
          )}
          {overviewSections.map((section) => {
            const isSelected = selectedSection === section.key;
            const SectionIcon = section.icon;

            return (
              <Tooltip
                key={section.key}
                title={collapsed ? section.label : undefined}
                placement="right"
              >
                <div
                  className={`${styles.sectionItem} ${
                    isSelected ? styles.sectionItemActive : ""
                  }`}
                  onClick={() => {
                    onSectionSelect(section.key);
                    // Scroll to section with proper offset
                    const element = document.getElementById(section.key);
                    if (element) {
                      const headerHeight = 64; // Header height
                      const offset = 100; // Additional offset for spacing
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                >
                  <div className={styles.sectionContent}>
                    <Avatar
                      size={collapsed ? 40 : 40}
                      icon={SectionIcon}
                      style={{
                        backgroundColor: section.color,
                        color: "#fff",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    {!collapsed && (
                      <div className={styles.sectionInfo}>
                        <Typography.Text
                          strong
                          className={styles.sectionLabel}
                        >
                          {section.label}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                  {!collapsed && isSelected && (
                    <div
                      className={styles.selectedIndicator}
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}

          {/* Detailed Analytics Subsection */}
          {!collapsed && (
            <div className={styles.subsection} style={{ marginTop: 24 }}>
              <Typography.Text className={styles.subsectionTitle}>
                Detailed Analytics
              </Typography.Text>
            </div>
          )}
          {detailedSections.map((section) => {
            const isSelected = selectedSection === section.key;
            const SectionIcon = section.icon;

            return (
              <Tooltip
                key={section.key}
                title={collapsed ? section.label : undefined}
                placement="right"
              >
                <div
                  className={`${styles.sectionItem} ${
                    isSelected ? styles.sectionItemActive : ""
                  }`}
                  onClick={() => {
                    onSectionSelect(section.key);
                    // Scroll to section with proper offset
                    const element = document.getElementById(section.key);
                    if (element) {
                      const headerHeight = 64; // Header height
                      const offset = 100; // Additional offset for spacing
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                >
                  <div className={styles.sectionContent}>
                    <Avatar
                      size={collapsed ? 40 : 40}
                      icon={SectionIcon}
                      style={{
                        backgroundColor: section.color,
                        color: "#fff",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    {!collapsed && (
                      <div className={styles.sectionInfo}>
                        <Typography.Text
                          strong
                          className={styles.sectionLabel}
                        >
                          {section.label}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                  {!collapsed && isSelected && (
                    <div
                      className={styles.selectedIndicator}
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}

          {/* Advanced Analytics Main Section */}
          {advancedAnalyticsMain.map((section) => {
            const isSelected = selectedSection === section.key;
            const SectionIcon = section.icon;

            return (
              <Tooltip
                key={section.key}
                title={collapsed ? section.label : undefined}
                placement="right"
              >
                <div
                  className={`${styles.sectionItem} ${
                    isSelected ? styles.sectionItemActive : ""
                  }`}
                  onClick={() => {
                    onSectionSelect(section.key);
                    const element = document.getElementById(section.key);
                    if (element) {
                      const headerHeight = 64;
                      const offset = 100;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                >
                  <div className={styles.sectionContent}>
                    <Avatar
                      size={collapsed ? 40 : 40}
                      icon={SectionIcon}
                      style={{
                        backgroundColor: section.color,
                        color: "#fff",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    {!collapsed && (
                      <div className={styles.sectionInfo}>
                        <Typography.Text
                          strong
                          className={styles.sectionLabel}
                        >
                          {section.label}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                  {!collapsed && isSelected && (
                    <div
                      className={styles.selectedIndicator}
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}

          {/* Advanced Analytics Subsections */}
          {!collapsed && (
            <div className={styles.subsection} style={{ marginTop: 24 }}>
              <Typography.Text className={styles.subsectionTitle}>
                Advanced Analytics Subsections
              </Typography.Text>
            </div>
          )}
          {advancedAnalyticsSections.map((section) => {
            const isSelected = selectedSection === section.key;
            const SectionIcon = section.icon;

            return (
              <Tooltip
                key={section.key}
                title={collapsed ? section.label : undefined}
                placement="right"
              >
                <div
                  className={`${styles.sectionItem} ${
                    isSelected ? styles.sectionItemActive : ""
                  }`}
                  onClick={() => {
                    onSectionSelect(section.key);
                    const element = document.getElementById(section.key);
                    if (element) {
                      const headerHeight = 64;
                      const offset = 100;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                >
                  <div className={styles.sectionContent}>
                    <Avatar
                      size={collapsed ? 40 : 40}
                      icon={SectionIcon}
                      style={{
                        backgroundColor: section.color,
                        color: "#fff",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    {!collapsed && (
                      <div className={styles.sectionInfo}>
                        <Typography.Text
                          strong
                          className={styles.sectionLabel}
                        >
                          {section.label}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                  {!collapsed && isSelected && (
                    <div
                      className={styles.selectedIndicator}
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}

          {/* Recent Activity Section */}
          {recentActivitySection.map((section) => {
            const isSelected = selectedSection === section.key;
            const SectionIcon = section.icon;

            return (
              <Tooltip
                key={section.key}
                title={collapsed ? section.label : undefined}
                placement="right"
              >
                <div
                  className={`${styles.sectionItem} ${
                    isSelected ? styles.sectionItemActive : ""
                  }`}
                  onClick={() => {
                    onSectionSelect(section.key);
                    const element = document.getElementById(section.key);
                    if (element) {
                      const headerHeight = 64;
                      const offset = 100;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                >
                  <div className={styles.sectionContent}>
                    <Avatar
                      size={collapsed ? 40 : 40}
                      icon={SectionIcon}
                      style={{
                        backgroundColor: section.color,
                        color: "#fff",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    {!collapsed && (
                      <div className={styles.sectionInfo}>
                        <Typography.Text
                          strong
                          className={styles.sectionLabel}
                        >
                          {section.label}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                  {!collapsed && isSelected && (
                    <div
                      className={styles.selectedIndicator}
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}

          {/* Best Time Analytics Subsection */}
          {!collapsed && (
            <div className={styles.subsection} style={{ marginTop: 24 }}>
              <Typography.Text className={styles.subsectionTitle}>
                Best Time Analytics (Global Benchmark)
              </Typography.Text>
            </div>
          )}
          {bestTimeSections.map((section) => {
            const isSelected = selectedSection === section.key;
            const SectionIcon = section.icon;

            return (
              <Tooltip
                key={section.key}
                title={collapsed ? section.label : undefined}
                placement="right"
              >
                <div
                  className={`${styles.sectionItem} ${
                    isSelected ? styles.sectionItemActive : ""
                  }`}
                  onClick={() => {
                    onSectionSelect(section.key);
                    // Scroll to section with proper offset
                    const element = document.getElementById(section.key);
                    if (element) {
                      const headerHeight = 64; // Header height
                      const offset = 100; // Additional offset for spacing
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                >
                  <div className={styles.sectionContent}>
                    <Avatar
                      size={collapsed ? 40 : 40}
                      icon={SectionIcon}
                      style={{
                        backgroundColor: section.color,
                        color: "#fff",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                    {!collapsed && (
                      <div className={styles.sectionInfo}>
                        <Typography.Text
                          strong
                          className={styles.sectionLabel}
                        >
                          {section.label}
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                  {!collapsed && isSelected && (
                    <div
                      className={styles.selectedIndicator}
                      style={{ backgroundColor: section.color }}
                    />
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </Sider>
  );
}

