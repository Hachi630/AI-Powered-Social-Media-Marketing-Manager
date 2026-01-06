import { generateToken, verifyToken } from '../utils/jwt'

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-123'
      const token = generateToken(userId)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user-1')
      const token2 = generateToken('user-2')
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const userId = 'test-user-456'
      const token = generateToken(userId)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded.id).toBe(userId)
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow()
    })

    it('should throw error for tampered token', () => {
      const token = generateToken('test-user')
      const tamperedToken = token.slice(0, -5) + 'xxxxx'
      
      expect(() => verifyToken(tamperedToken)).toThrow()
    })
  })
})

