// API base URL - using Vite proxy (no CORS issues)
const API_URL = '/api/auth'

export interface User {
  id: string
  email: string
  name?: string
  brandName?: string
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
  authProvider?: 'local' | 'google'
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
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
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
      const response = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      return data
    } catch (error) {
      return { success: false, message: 'Network error' }
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
}

