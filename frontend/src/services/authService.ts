// API base URL - assuming backend runs on port 5000 and proxy is set up or CORS is handled
const API_URL = 'http://localhost:5000/api/auth'

export interface User {
  id: string
  email: string
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
}

