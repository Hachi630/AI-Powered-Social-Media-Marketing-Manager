// API base URL - use VITE_API_URL if set (production), otherwise use relative path (development with vite proxy)
const BASE_API_URL = import.meta.env.VITE_API_URL || ''
const API_URL = `${BASE_API_URL}/api/auth`

// Company data structure for multi-company support
export interface CompanyData {
  id: string
  name: string
  brandName: string
  industry: string
  toneOfVoice: string
  customTone: string
  knowledgeProducts: string[]
  targetAudience: string[]
  companyDescription: string
  brandLogoUrl?: string
  productTypes?: string[]
  productImages?: string[]
  meloGoals?: string[]
}

export interface User {
  id: string
  email: string
  name?: string
  brandName?: string
  brandLogoUrl?: string
  phone?: string
  birthday?: string
  gender?: string
  address?: string
  aboutMe?: string
  avatar?: string
  industry?: string
  toneOfVoice?: string
  knowledgeProducts?: string[]
  targetAudience?: string[]
  companies?: CompanyData[]
  authProvider?: 'local' | 'google'
  onboardingCompleted?: boolean
  productTypes?: string[]
  productImages?: string[]
  meloGoals?: string[]
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  message?: string
}

export const authService = {
  // Register user
  register: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const url = `${API_URL}/register`
      console.log('[Auth Service] Register request to:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
            console.error('[Auth Service] Register error (JSON):', errorData)
          } else {
            const errorText = await response.text()
            if (errorText) {
              try {
                const parsed = JSON.parse(errorText)
                errorMessage = parsed.message || parsed.error || errorText.substring(0, 200)
              } catch {
                errorMessage = errorText.substring(0, 200) || errorMessage
              }
            }
            console.error('[Auth Service] Register error (text):', errorText.substring(0, 200))
          }
        } catch (parseError: any) {
          console.error('[Auth Service] Failed to parse error response:', parseError)
          if (response.status === 500) {
            errorMessage = 'Server error. Please check backend logs or try again later.'
          } else if (response.status === 400) {
            errorMessage = 'Invalid request. Please check your email and password.'
          }
        }
        return { success: false, message: errorMessage }
      }
      
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      return data
    } catch (error: any) {
      console.error('[Auth Service] Register network error:', error)
      let errorMessage = 'Network error: Unable to connect to server'
      if (error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error: Unable to connect to server. Please make sure the backend server is running on port 5000.'
        } else {
          errorMessage = `Network error: ${error.message}`
        }
      }
      return { success: false, message: errorMessage }
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const url = `${API_URL}/login`
      console.log('[Auth Service] Login request to:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
            console.error('[Auth Service] Login error (JSON):', errorData)
          } else {
            const errorText = await response.text()
            if (errorText) {
              try {
                const parsed = JSON.parse(errorText)
                errorMessage = parsed.message || parsed.error || errorText.substring(0, 200)
              } catch {
                errorMessage = errorText.substring(0, 200) || errorMessage
              }
            }
            console.error('[Auth Service] Login error (text):', errorText.substring(0, 200))
          }
        } catch (parseError: any) {
          console.error('[Auth Service] Failed to parse error response:', parseError)
          if (response.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.'
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please check backend logs or try again later.'
          } else if (response.status === 400) {
            errorMessage = 'Invalid request. Please check your email and password.'
          }
        }
        return { success: false, message: errorMessage }
      }
      
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      return data
    } catch (error: any) {
      console.error('[Auth Service] Login network error:', error)
      let errorMessage = 'Network error: Unable to connect to server'
      if (error.message) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error: Unable to connect to server. Please make sure the backend server is running on port 5000.'
        } else {
          errorMessage = `Network error: ${error.message}`
        }
      }
      return { success: false, message: errorMessage }
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token')
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      return data.success ? data.user : null
    } catch (error) {
      return null
    }
  },

  // Check if user is logged in
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token')
  },

  // Login/Register with Google OAuth
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    try {
      const url = `${API_URL}/google`
      console.log('[Auth Service] Google login request to:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })
      
      console.log('[Auth Service] Google login response status:', response.status)
      
      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        try {
          // Clone the response to read it without consuming the original
          const responseClone = response.clone()
          const contentType = response.headers.get('content-type')
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await responseClone.json()
            console.error('[Auth Service] Google login error (JSON):', {
              status: response.status,
              statusText: response.statusText,
              errorData: errorData,
              message: errorData?.message,
              error: errorData?.error,
              success: errorData?.success
            })
            
            // Extract error message from various possible fields
            errorMessage = errorData?.message || 
                         errorData?.error || 
                         errorData?.error?.message ||
                         (typeof errorData === 'string' ? errorData : errorMessage)
          } else {
            // Try to get text response
            const errorText = await responseClone.text()
            console.error('[Auth Service] Google login error (text):', {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText.substring(0, 200)
            })
            if (errorText) {
              // Try to parse as JSON if it looks like JSON
              try {
                const parsed = JSON.parse(errorText)
                errorMessage = parsed.message || parsed.error || errorText.substring(0, 200)
              } catch {
                errorMessage = errorText.substring(0, 200) || errorMessage
              }
            }
          }
        } catch (parseError: any) {
          console.error('[Auth Service] Failed to parse error response:', {
            parseError: parseError,
            message: parseError?.message,
            status: response.status,
            statusText: response.statusText
          })
          // Use status-based error messages
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Invalid Google token. Please try again.'
          } else if (response.status === 400) {
            errorMessage = 'Invalid request. Please check your credentials.'
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please check backend logs or try again later.'
          } else if (response.status === 403) {
            errorMessage = 'Access forbidden. Please check your Google OAuth configuration.'
          } else if (response.status === 0 || response.status >= 500) {
            errorMessage = 'Unable to connect to server. Please check your connection.'
          }
        }
        
        console.error('[Auth Service] Final error message:', errorMessage)
        return { 
          success: false, 
          message: errorMessage
        }
      }
      
      const data = await response.json()
      console.log('[Auth Service] Google login success:', data.success)
      console.log('[Auth Service] User data received:', {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.name,
        avatar: data.user?.avatar,
        hasAvatar: !!data.user?.avatar
      })
      
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      return data
    } catch (error: any) {
      console.error('[Auth Service] Google login network error:', error)
      return { 
        success: false, 
        message: error.message || 'Network error: Unable to connect to server' 
      }
    }
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User>): Promise<AuthResponse> => {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })
      const data = await response.json()
      if (data.success && data.user) {
        return { success: true, user: data.user }
      }
      return { success: false, message: data.message || 'Failed to update profile' }
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  // Change password
  changePassword: async (newPassword: string): Promise<AuthResponse> => {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      })
      const data = await response.json()
      if (data.success) {
        return { success: true, message: data.message || 'Password changed successfully' }
      }
      return { success: false, message: data.message || 'Failed to change password' }
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  // Complete onboarding process
  completeOnboarding: async (onboardingData: {
    brandName?: string
    targetAudience?: string[]
    productTypes?: string[]
    productImages?: string[]
    meloGoals?: string[]
  }): Promise<AuthResponse> => {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(onboardingData),
      })
      const data = await response.json()
      if (data.success && data.user) {
        return { success: true, user: data.user }
      }
      return { success: false, message: data.message || 'Failed to complete onboarding' }
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },
}

