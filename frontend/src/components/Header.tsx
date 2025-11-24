import type { MenuProps } from 'antd'
import { Button, Layout, Menu, Space, Typography } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './Header.module.css'

interface HeaderProps {
  isLoggedIn?: boolean
}

const navItems: MenuProps['items'] = [
  { key: '/dashboard', label: 'Dashboard' },
  { key: '/calendar', label: 'Calendar' },
  { key: '/settings', label: 'Settings' },
]

const logoSrc = 'https://www.figma.com/api/mcp/asset/e4dc93cd-bef8-48fe-b81c-d4e7430cbf99'

const { Header: AntHeader } = Layout

export default function Header({ isLoggedIn = false }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey =
    navItems?.find((item) => location.pathname.startsWith(String(item?.key)))?.key ?? ''

  return (
    <AntHeader className={styles.header}>
      <button className={styles.logoButton} onClick={() => navigate('/dashboard')}>
        <div className={styles.logoGroup}>
          <img src={logoSrc} alt="MELO.AI Logo" className={styles.logoImage} />
          <Typography.Title level={4} className={styles.logoText}>
            MELO.AI
          </Typography.Title>
        </div>
      </button>
      <Menu
        className={styles.menu}
        mode="horizontal"
        selectedKeys={selectedKey ? [String(selectedKey)] : []}
        items={navItems}
        onClick={({ key }) => navigate(String(key))}
      />
      {!isLoggedIn && (
        <Space size="middle">
          <Button>Sign in</Button>
          <Button type="primary">Register</Button>
        </Space>
      )}
    </AntHeader>
  )
}

