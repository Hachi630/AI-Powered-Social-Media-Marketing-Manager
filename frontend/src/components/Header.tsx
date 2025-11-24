import type { MenuProps } from 'antd'
import { Button, Layout, Menu, Space, Typography } from 'antd'
import styles from './Header.module.css'

interface HeaderProps {
  isLoggedIn?: boolean
}

const navItems: MenuProps['items'] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'settings', label: 'Settings' },
]

const logoSrc = 'https://www.figma.com/api/mcp/asset/e4dc93cd-bef8-48fe-b81c-d4e7430cbf99'

const { Header: AntHeader } = Layout

export default function Header({ isLoggedIn = false }: HeaderProps) {
  return (
    <AntHeader className={styles.header}>
      <div className={styles.logoGroup}>
        <img src={logoSrc} alt="MELO.AI Logo" className={styles.logoImage} />
        <Typography.Title level={4} className={styles.logoText}>
          MELO.AI
        </Typography.Title>
      </div>
      <Menu className={styles.menu} mode="horizontal" selectable={false} items={navItems} />
      {!isLoggedIn && (
        <Space size="middle">
          <Button>Sign in</Button>
          <Button type="primary">Register</Button>
        </Space>
      )}
    </AntHeader>
  )
}

