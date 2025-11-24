import { ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import './App.css'
import { DEFAULT_TAGLINE, MELO_LOGO } from './constants/assets'
import BrandProfile from './pages/BrandProfile'
import CalendarPlaceholder from './pages/CalendarPlaceholder'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'Inter, system-ui, sans-serif',
          colorBgBase: '#f5f5f5',
        },
      }}
    >
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  heroTitle="Where every word begins with a little melody?"
                  tagline={DEFAULT_TAGLINE}
                  background="light"
                  headerOverrides={{
                    showBrandName: false,
                    logoSrc: MELO_LOGO,
                  }}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  isLoggedIn
                  heroTitle="Where every word begins with a little melody?"
                  tagline={DEFAULT_TAGLINE}
                  background="light"
                  headerOverrides={{
                    showBrandName: false,
                    logoSrc: MELO_LOGO,
                  }}
                />
              }
            />
            <Route path="/calendar" element={<CalendarPlaceholder />} />
            <Route path="/settings" element={<BrandProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App

