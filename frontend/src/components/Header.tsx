import type { MenuProps } from 'antd'
import { Button, Layout, Menu, Space, Typography } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MELO_LOGO } from '../constants/assets'
import AuthModal from './AuthModal'
import styles from './Header.module.css'

export interface HeaderProps {
  isLoggedIn?: boolean
  showBrandName?: boolean
  logoSrc?: string
}

const navItems: MenuProps['items'] = [
  { key: '/dashboard', label: 'Dashboard' },
  { key: '/calendar', label: 'Calendar' },
  { key: '/settings', label: 'Settings' },
]

const { Header: AntHeader } = Layout

export default function Header({
  isLoggedIn = false,
  showBrandName = false,
  logoSrc = MELO_LOGO,
}: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  let selectedKey =
    navItems?.find((item) => location.pathname.startsWith(String(item?.key)))?.key ?? ''
  if (!selectedKey && location.pathname === '/') {
    selectedKey = '/dashboard'
  }

  const handleAuthClick = () => {
    setIsAuthModalOpen(true)
  }

  return (
    <AntHeader className={styles.header}>
      <button className={styles.logoButton} onClick={() => navigate('/dashboard')}>
        <div className={`${styles.logoGroup} ${!showBrandName ? styles.logoGroupCompact : ''}`}>
          <img src={logoSrc} alt="MELO logo" className={styles.logoImage} />
          {showBrandName && (
            <Typography.Title level={4} className={styles.logoText}>
              MELO.AI
            </Typography.Title>
          )}
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
          <Button onClick={handleAuthClick}>Sign in</Button>
          <Button type="primary" onClick={handleAuthClick}>
            Register
          </Button>
        </Space>
      )}
      <AuthModal open={isAuthModalOpen} onCancel={() => setIsAuthModalOpen(false)} />
    </AntHeader>
  )
}
