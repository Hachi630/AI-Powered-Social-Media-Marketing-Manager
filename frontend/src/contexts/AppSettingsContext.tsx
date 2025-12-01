import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AppSettings {
  fontSize: number
  fontFamily: string
}

interface AppSettingsContextType {
  settings: AppSettings
  pendingSettings: AppSettings
  updatePendingSettings: (newSettings: Partial<AppSettings>) => void
  applySettings: () => void
  resetSettings: () => void
  resetPendingSettings: () => void
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined)

const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 14,
  fontFamily: 'Inter, system-ui, sans-serif',
}

const STORAGE_KEY = 'melo_app_settings'

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load app settings:', error)
    }
    return DEFAULT_SETTINGS
  })

  const [pendingSettings, setPendingSettings] = useState<AppSettings>(settings)

  // Sync pendingSettings with settings when settings change
  useEffect(() => {
    setPendingSettings(settings)
  }, [settings])

  // Apply settings to DOM - comprehensive application
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--custom-font-size', `${settings.fontSize}px`)
    root.style.setProperty('--custom-font-family', settings.fontFamily)
    
    // Apply to body
    document.body.style.fontSize = `${settings.fontSize}px`
    document.body.style.fontFamily = settings.fontFamily

    // Apply to main layout elements using CSS
    const style = document.createElement('style')
    style.id = 'app-settings-style'
    style.textContent = `
      /* Apply font settings to body and main content areas */
      body {
        font-size: ${settings.fontSize}px !important;
        font-family: ${settings.fontFamily} !important;
      }
      
      /* Apply font to common text elements */
      p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th, label {
        font-family: ${settings.fontFamily} !important;
      }
      
      /* Apply font size to common elements (but allow headings to scale) */
      p, span, div, a, li, td, th, label, input, textarea, select, button {
        font-size: ${settings.fontSize}px !important;
      }
    `
    
    // Remove old style if exists
    const oldStyle = document.getElementById('app-settings-style')
    if (oldStyle) {
      oldStyle.remove()
    }
    
    document.head.appendChild(style)
  }, [settings])

  // Save to localStorage when settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save app settings:', error)
    }
  }, [settings])

  const updatePendingSettings = (newSettings: Partial<AppSettings>) => {
    setPendingSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const applySettings = () => {
    setSettings(pendingSettings)
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    setPendingSettings(DEFAULT_SETTINGS)
  }

  const resetPendingSettings = () => {
    setPendingSettings(settings)
  }

  return (
    <AppSettingsContext.Provider value={{ 
      settings, 
      pendingSettings,
      updatePendingSettings, 
      applySettings,
      resetSettings,
      resetPendingSettings
    }}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider')
  }
  return context
}

