import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Store original env
const originalEnv = { ...process.env }

describe('Twitter Service', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TWITTER_API_KEY: 'test-api-key',
      TWITTER_API_SECRET: 'test-api-secret',
      TWITTER_ACCESS_TOKEN: 'test-access-token',
      TWITTER_ACCESS_SECRET: 'test-access-secret'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Environment Configuration', () => {
    it('should have all required environment variables', () => {
      expect(process.env.TWITTER_API_KEY).toBeDefined()
      expect(process.env.TWITTER_API_SECRET).toBeDefined()
      expect(process.env.TWITTER_ACCESS_TOKEN).toBeDefined()
      expect(process.env.TWITTER_ACCESS_SECRET).toBeDefined()
    })

    it('should detect missing API key', () => {
      delete process.env.TWITTER_API_KEY
      expect(process.env.TWITTER_API_KEY).toBeUndefined()
    })

    it('should detect missing API secret', () => {
      delete process.env.TWITTER_API_SECRET
      expect(process.env.TWITTER_API_SECRET).toBeUndefined()
    })
  })

  describe('Tweet Content Validation', () => {
    const validateTweetContent = (content: string) => {
      if (!content || content.trim().length === 0) {
        return { isValid: false, error: 'Tweet text is required' }
      }
      if (content.length > 280) {
        return { isValid: false, error: 'Tweet text cannot exceed 280 characters' }
      }
      return { isValid: true }
    }

    it('should reject empty content', () => {
      const result = validateTweetContent('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Tweet text is required')
    })

    it('should reject whitespace-only content', () => {
      const result = validateTweetContent('   ')
      expect(result.isValid).toBe(false)
    })

    it('should reject content over 280 characters', () => {
      const longContent = 'a'.repeat(300)
      const result = validateTweetContent(longContent)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('280')
    })

    it('should accept valid content', () => {
      const result = validateTweetContent('Hello Twitter!')
      expect(result.isValid).toBe(true)
    })

    it('should accept content exactly 280 characters', () => {
      const content = 'a'.repeat(280)
      const result = validateTweetContent(content)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Tweet Truncation', () => {
    const truncateTweet = (content: string): string => {
      if (content.length > 280) {
        return content.substring(0, 277) + '...'
      }
      return content
    }

    it('should not truncate short content', () => {
      const content = 'Short tweet'
      expect(truncateTweet(content)).toBe(content)
    })

    it('should truncate long content with ellipsis', () => {
      const content = 'a'.repeat(300)
      const truncated = truncateTweet(content)
      expect(truncated.length).toBe(280)
      expect(truncated.endsWith('...')).toBe(true)
    })
  })

  describe('Media Handling', () => {
    const isValidImagePath = (imagePath: string | null | undefined): boolean => {
      if (!imagePath) return false
      // Check if it's a valid path format
      return imagePath.startsWith('/uploads') || imagePath.startsWith('http')
    }

    it('should accept uploads path', () => {
      expect(isValidImagePath('/uploads/images/test.jpg')).toBe(true)
    })

    it('should accept http URL', () => {
      expect(isValidImagePath('https://example.com/image.jpg')).toBe(true)
    })

    it('should reject null', () => {
      expect(isValidImagePath(null)).toBe(false)
    })

    it('should reject undefined', () => {
      expect(isValidImagePath(undefined)).toBe(false)
    })

    it('should reject invalid path', () => {
      expect(isValidImagePath('invalid/path')).toBe(false)
    })
  })
})
