import {
  MessageOutlined,
  UserAddOutlined,
  PhoneOutlined,
  WhatsAppOutlined,
  SendOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Layout, Button, Typography, Tooltip, Avatar } from "antd";
import styles from "./AnalyticsSidebar.module.css";

const { Sider } = Layout;

export type MessagingSection = 
  | "new-number" 
  | "contacts";

interface MessagingSidebarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  selectedSection: MessagingSection;
  onSectionSelect: (section: MessagingSection) => void;
}

interface SectionConfig {
  key: MessagingSection;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export default function MessagingSidebar({
  collapsed,
  onToggleSidebar,
  selectedSection,
  onSectionSelect,
}: MessagingSidebarProps) {
  const sections: SectionConfig[] = [
    {
      key: "new-number",
      label: "Send to New Number",
      icon: <PhoneOutlined />,
      color: "#1890ff",
    },
    {
      key: "contacts",
      label: "Send to Contact",
      icon: <UserAddOutlined />,
      color: "#52c41a",
    },
  ];

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

          {/* Messaging Options Subsection */}
          {!collapsed && (
            <div className={styles.subsection}>
              <Typography.Text className={styles.subsectionTitle}>
                Messaging Options
              </Typography.Text>
            </div>
          )}
          {sections.map((section) => {
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



