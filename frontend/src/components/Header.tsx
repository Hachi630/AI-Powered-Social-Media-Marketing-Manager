import type { MenuProps } from 'antd'
import { Button, Layout, Menu, Space, Typography, Dropdown, Drawer, Grid } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MELO_LOGO } from '../constants/assets'
import AuthModal from './AuthModal'
import AppSettings from '../pages/AppSettings'
import Personal from '../pages/Personal'
import styles from './Header.module.css'
import { UserOutlined, LogoutOutlined, MenuOutlined, SettingOutlined } from '@ant-design/icons'
import { User } from '../services/authService'
import { Avatar } from 'antd'
import { enableDemoMode, disableDemoMode, isDemoBuild, isDemoMode, isEmbedMode, resetDemoMode } from '../demo/demoMode'

const { useBreakpoint } = Grid

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
  { key: '/settings', label: 'Brands' },
  { key: '/socialdashboard', label: 'Social Dashboard' },
  { key: '/analytics', label: 'Analytics' },
  { key: '/messaging', label: 'Messaging' },
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
  const screens = useBreakpoint()
  const isMobile = !screens.lg
  const embed = isEmbedMode()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isPersonalModalOpen, setIsPersonalModalOpen] = useState(false)

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
    setIsPersonalModalOpen(true)
  }

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true)
  }

  const handleLogoutClick = () => {
    onLogout?.()
    navigate('/home')
  }

  const handleDemoStart = () => {
    resetDemoMode()
    enableDemoMode()
    window.location.href = '/dashboard'
  }

  const handleDemoExit = () => {
    disableDemoMode()
    window.location.href = '/home'
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
        key: 'settings',
        label: 'Settings',
        icon: <SettingOutlined />,
        onClick: handleSettingsClick,
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

  if (embed) {
    return null
  }

  return (
    <>
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
        {isLoggedIn && !isHomePage && !isMobile && (
          <Menu
            className={styles.menu}
            mode="horizontal"
            selectedKeys={selectedKey ? [String(selectedKey)] : []}
            items={navItems}
            onClick={({ key }) => navigate(String(key))}
          />
        )}
        <div className={styles.headerActions}>
          {isDemoMode() && (
            <span data-demo-id="demo-banner" className={styles.demoBadge}>
              Demo Mode
            </span>
          )}
          {isLoggedIn && !isHomePage && isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              className={styles.mobileMenuButton}
            />
          )}
          {isDemoBuild() && !isDemoMode() && !isMobile && (
            <Button onClick={handleDemoStart}>Demo</Button>
          )}
          {isDemoBuild() && isDemoMode() && !isMobile && (
            <Button onClick={handleDemoExit}>Exit Demo</Button>
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
        </div>
      </AntHeader>
      {isLoggedIn && !isHomePage && isMobile && (
        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
          zIndex={4000}
          className={styles.mobileDrawer}
        >
          <Menu
            mode="vertical"
            selectedKeys={selectedKey ? [String(selectedKey)] : []}
            items={navItems}
            onClick={({ key }) => {
              navigate(String(key))
              setMobileMenuOpen(false)
            }}
          />
        </Drawer>
      )}
      <AuthModal
        open={isAuthModalOpen}
        onCancel={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          onLoginSuccess?.(user)
          setIsAuthModalOpen(false)
        }}
      />
      <AppSettings
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <Personal
        open={isPersonalModalOpen}
        onClose={() => setIsPersonalModalOpen(false)}
        user={user}
        onLoginSuccess={onLoginSuccess}
      />
    </>
  )
}
