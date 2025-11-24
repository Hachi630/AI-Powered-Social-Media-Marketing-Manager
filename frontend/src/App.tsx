import { ConfigProvider } from 'antd'
import Dashboard from './components/Dashboard'
import './App.css'

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
      <div className="app">
        <Dashboard isLoggedIn={false} />
      </div>
    </ConfigProvider>
  )
}

export default App

