import { ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import './App.css'
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard isLoggedIn />} />
            <Route path="/calendar" element={<CalendarPlaceholder />} />
            <Route path="/settings" element={<BrandProfile />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App

