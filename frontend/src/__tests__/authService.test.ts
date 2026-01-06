import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '../services/authService'

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem = vi.fn()
    localStorage.setItem = vi.fn()
    localStorage.removeItem = vi.fn()
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('valid-token')
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should return false when token does not exist', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      authService.logout()
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('login', () => {
    it('should store token on successful login', async () => {
      const mockResponse = {
        success: true,
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', createdAt: new Date().toISOString() }
      }
      
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      })

      const result = await authService.login('test@example.com', 'password')
      
      expect(result.success).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
    })

    it('should return error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await authService.login('test@example.com', 'password')
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error')
    })
  })

  describe('register', () => {
    it('should store token on successful registration', async () => {
      const mockResponse = {
        success: true,
        token: 'new-user-token',
        user: { id: '2', email: 'new@example.com', createdAt: new Date().toISOString() }
      }
      
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      })

      const result = await authService.register('new@example.com', 'password')
      
      expect(result.success).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-user-token')
    })

    it('should return error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await authService.register('test@example.com', 'password')
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error')
    })
  })

  describe('getCurrentUser', () => {
    it('should return null when no token exists', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      
      const result = await authService.getCurrentUser()
      
      expect(result).toBeNull()
    })

    it('should fetch user data when token exists', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('valid-token')
      
      const mockUser = { 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User',
        createdAt: new Date().toISOString() 
      }
      
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, user: mockUser })
      })

      const result = await authService.getCurrentUser()
      
      expect(result).toEqual(mockUser)
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' }
      })
    })

    it('should return null on API error', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('valid-token')
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))

      const result = await authService.getCurrentUser()
      
      expect(result).toBeNull()
    })
  })
})

