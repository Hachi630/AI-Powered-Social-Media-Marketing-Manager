import type { MenuProps } from 'antd'
import { Button, Layout, Menu, Space, Typography, Dropdown } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MELO_LOGO } from '../constants/assets'
import AuthModal from './AuthModal'
import styles from './Header.module.css'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { User } from '../services/authService'
import { Avatar } from 'antd'

export interface HeaderProps {
  isLoggedIn?: boolean
  showBrandName?: boolean
  logoSrc?: string
  onLoginSuccess?: (user: User) => void
  onLogout?: () => void
  user?: User | null
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
  onLoginSuccess,
  onLogout,
  user,
}: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const isHomePage = location.pathname === '/' || location.pathname === '/home'
  
  let selectedKey =
    navItems?.find((item) => location.pathname.startsWith(String(item?.key)))?.key ?? ''
  if (!selectedKey && location.pathname === '/' && isLoggedIn) {
    selectedKey = '/dashboard'
  }

  const handleAuthClick = () => {
    setIsAuthModalOpen(true)
  }

  const handlePersonalClick = () => {
    navigate('/personal')
  }

  const handleLogoutClick = () => {
    onLogout?.()
    navigate('/home')
  }

  const userMenu: MenuProps = {
    items: [
      {
        key: 'personal',
        label: 'Personal',
        icon: <UserOutlined />,
        onClick: handlePersonalClick,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: 'Log out',
        icon: <LogoutOutlined />,
        onClick: handleLogoutClick,
      },
    ],
  }

  return (
    <AntHeader className={styles.header}>
      <button className={styles.logoButton} onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}>
        <div className={`${styles.logoGroup} ${!showBrandName ? styles.logoGroupCompact : ''}`}>
          <img src={logoSrc} alt="MELO logo" className={styles.logoImage} />
          {showBrandName && (
            <Typography.Title level={4} className={styles.logoText}>
              MELO.AI
            </Typography.Title>
          )}
        </div>
      </button>
      {isLoggedIn && !isHomePage && (
        <Menu
          className={styles.menu}
          mode="horizontal"
          selectedKeys={selectedKey ? [String(selectedKey)] : []}
          items={navItems}
          onClick={({ key }) => navigate(String(key))}
        />
      )}
      {!isLoggedIn ? (
        <Space size="middle">
          <Button onClick={handleAuthClick}>Sign in</Button>
          <Button type="primary" onClick={handleAuthClick}>
            Register
          </Button>
        </Space>
      ) : (
        <Dropdown menu={userMenu} placement="bottomRight" arrow>
          <Avatar
            size="large"
            src={user?.avatar}
            style={{ backgroundColor: '#87d068', cursor: 'pointer' }}
          >
            {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
          </Avatar>
        </Dropdown>
      )}
      <AuthModal
        open={isAuthModalOpen}
        onCancel={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          onLoginSuccess?.(user)
          setIsAuthModalOpen(false)
        }}
      />
    </AntHeader>
  )
}
