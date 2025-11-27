import { ConfigProvider } from 'antd'
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import OAuthCallback from './components/OAuthCallback'
import './App.css'
import { DEFAULT_TAGLINE, MELO_LOGO } from './constants/assets'
import BrandProfile from './pages/BrandProfile'
import CalendarPage from './pages/Calendar'
import Personal from './pages/Personal'
import PhoneDemo from './pages/PhoneDemo'
import { authService, User } from './services/authService'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setIsLoggedIn(true);
          setUser(currentUser);
        } else {
          // Token invalid
          authService.logout();
          setIsLoggedIn(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setIsLoggedIn(true);
    setUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "Inter, system-ui, sans-serif",
          colorBgBase: "#f5f5f5",
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
                  isLoggedIn={isLoggedIn}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  user={user}
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
                  isLoggedIn={isLoggedIn}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  user={user}
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
              path="/calendar"
              element={
                <CalendarPage
                  isLoggedIn={isLoggedIn}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  user={user}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <BrandProfile
                  isLoggedIn={isLoggedIn}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  user={user}
                />
              }
            />
            <Route
              path="/personal"
              element={
                <Personal
                  isLoggedIn={isLoggedIn}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  user={user}
                />
              }
            />
            <Route
              path="/auth/callback"
              element={<OAuthCallback onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="/auth/phone-demo" element={<PhoneDemo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
