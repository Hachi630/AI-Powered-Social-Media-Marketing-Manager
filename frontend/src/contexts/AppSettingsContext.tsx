import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AppSettings {
  fontSize: number
  fontFamily: string
  accentColor: string
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
  accentColor: '#bacf65',
}

const STORAGE_KEY = 'melo_app_settings'

// Helper function to calculate text color based on background
const getContrastColor = (bgColor: string): string => {
  // Validate input
  if (!bgColor || typeof bgColor !== 'string') {
    return '#1e1e1e' // Default to dark text
  }
  
  try {
    // Remove # if present
    const hex = bgColor.replace('#', '')
    if (hex.length !== 6) {
      return '#1e1e1e' // Default to dark text for invalid hex
    }
    
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Validate parsed values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return '#1e1e1e' // Default to dark text
    }
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? '#1e1e1e' : '#ffffff'
  } catch (error) {
    console.error('Error calculating contrast color:', error)
    return '#1e1e1e' // Default to dark text on error
  }
}

// Helper function to darken color for hover states
const darkenColor = (color: string, amount: number): string => {
  // Validate input
  if (!color || typeof color !== 'string') {
    return DEFAULT_SETTINGS.accentColor // Return default color
  }
  
  try {
    // Remove # if present
    const hex = color.replace('#', '')
    if (hex.length !== 6) {
      return DEFAULT_SETTINGS.accentColor // Return default for invalid hex
    }
    
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount)
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount)
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount)
    
    // Validate parsed values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return DEFAULT_SETTINGS.accentColor // Return default on parse error
    }
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch (error) {
    console.error('Error darkening color:', error)
    return DEFAULT_SETTINGS.accentColor // Return default on error
  }
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  // Validate input
  if (!hex || typeof hex !== 'string') {
    // Return default rgba for default accent color
    return 'rgba(186, 207, 101, ' + alpha + ')' // Default accent color #bacf65
  }
  
  try {
    const h = hex.replace('#', '')
    if (h.length !== 6) {
      return 'rgba(186, 207, 101, ' + alpha + ')' // Default accent color
    }
    
    const r = parseInt(h.substr(0, 2), 16)
    const g = parseInt(h.substr(2, 2), 16)
    const b = parseInt(h.substr(4, 2), 16)
    
    // Validate parsed values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return 'rgba(186, 207, 101, ' + alpha + ')' // Default accent color
    }
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch (error) {
    console.error('Error converting hex to rgba:', error)
    return 'rgba(186, 207, 101, ' + alpha + ')' // Default accent color on error
  }
}

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
    // Ensure accentColor exists, use default if not
    const accentColor = settings.accentColor || DEFAULT_SETTINGS.accentColor
    
    const root = document.documentElement
    root.style.setProperty('--custom-font-size', `${settings.fontSize}px`)
    root.style.setProperty('--custom-font-family', settings.fontFamily)
    root.style.setProperty('--accent-color', accentColor)
    root.style.setProperty('--accent-color-hover', darkenColor(accentColor, 20))
    root.style.setProperty('--accent-color-text', getContrastColor(accentColor))
    root.style.setProperty('--accent-color-rgba-08', hexToRgba(accentColor, 0.08))
    root.style.setProperty('--accent-color-rgba-10', hexToRgba(accentColor, 0.1))
    root.style.setProperty('--accent-color-rgba-12', hexToRgba(accentColor, 0.12))
    root.style.setProperty('--accent-color-rgba-15', hexToRgba(accentColor, 0.15))
    
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
      
      /* Apply font to input and textarea elements specifically */
      input, textarea, .ant-input, .ant-input-affix-wrapper input, 
      .ant-input-affix-wrapper textarea, textarea.ant-input {
        font-family: ${settings.fontFamily} !important;
        font-size: ${settings.fontSize}px !important;
      }
      
      /* Apply accent color to input caret */
      input:focus, textarea:focus, .ant-input:focus, 
      .ant-input-affix-wrapper-focused input, textarea.ant-input:focus {
        caret-color: ${accentColor} !important;
      }
      
      /* Apply font to placeholder text */
      input::placeholder, textarea::placeholder,
      .ant-input::placeholder, .ant-input-affix-wrapper input::placeholder {
        font-family: ${settings.fontFamily} !important;
      }
      
      /* Apply accent color to primary buttons */
      .ant-btn-primary,
      .ant-btn-primary:not(:disabled):not(.ant-btn-disabled) {
        background-color: ${accentColor} !important;
        border-color: ${accentColor} !important;
      }
      
      .ant-btn-primary:hover:not(:disabled):not(.ant-btn-disabled),
      .ant-btn-primary:focus:not(:disabled):not(.ant-btn-disabled) {
        background-color: ${darkenColor(accentColor, 20)} !important;
        border-color: ${darkenColor(accentColor, 20)} !important;
      }
      
      /* Apply accent color to links */
      a {
        color: ${accentColor} !important;
      }
      
      a:hover {
        color: ${darkenColor(accentColor, 20)} !important;
      }
      
      /* Apply accent color to user message bubbles */
      .userMessage .messageContent {
        background-color: ${accentColor} !important;
        color: ${getContrastColor(accentColor)} !important;
        border-color: ${accentColor} !important;
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

