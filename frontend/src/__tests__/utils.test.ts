import { describe, it, expect } from 'vitest'

/**
 * Utility function tests for common frontend logic
 */

describe('Date Utilities', () => {
  describe('formatDate', () => {
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }

    it('should format date to YYYY-MM-DD', () => {
      expect(formatDate('2025-01-15T10:30:00Z')).toBe('2025-01-15')
    })

    it('should handle ISO date format', () => {
      expect(formatDate('2025-01-15')).toBe('2025-01-15')
    })
  })

  describe('isToday', () => {
    const isToday = (date: Date): boolean => {
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }

    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true)
    })

    it('should return false for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isToday(yesterday)).toBe(false)
    })
  })

  describe('getWeekStart', () => {
    const getWeekStart = (date: Date): Date => {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
      d.setDate(diff)
      return d
    }

    it('should return Monday for a Wednesday', () => {
      const wednesday = new Date('2025-01-15') // This is a Wednesday
      const monday = getWeekStart(wednesday)
      expect(monday.getDay()).toBe(1) // Monday
    })
  })
})

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    it('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
    })

    it('should reject email without @', () => {
      expect(validateEmail('testexample.com')).toBe(false)
    })

    it('should reject email without domain', () => {
      expect(validateEmail('test@')).toBe(false)
    })

    it('should reject email with spaces', () => {
      expect(validateEmail('test @example.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
      const errors: string[] = []
      
      if (password.length < 6) {
        errors.push('Password must be at least 6 characters')
      }
      
      return { isValid: errors.length === 0, errors }
    }

    it('should accept password with 6+ characters', () => {
      expect(validatePassword('password123').isValid).toBe(true)
    })

    it('should reject password under 6 characters', () => {
      const result = validatePassword('12345')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 6 characters')
    })
  })
})

describe('Content Utilities', () => {
  describe('truncateText', () => {
    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength - 3) + '...'
    }

    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })

    it('should truncate long text with ellipsis', () => {
      expect(truncateText('Hello World!', 8)).toBe('Hello...')
    })
  })

  describe('getTwitterCharCount', () => {
    const getTwitterCharCount = (text: string): { count: number; remaining: number; isValid: boolean } => {
      const count = text.length
      const remaining = 280 - count
      return { count, remaining, isValid: count <= 280 }
    }

    it('should count characters correctly', () => {
      const result = getTwitterCharCount('Hello Twitter!')
      expect(result.count).toBe(14)
      expect(result.remaining).toBe(266)
      expect(result.isValid).toBe(true)
    })

    it('should mark over-limit text as invalid', () => {
      const longText = 'a'.repeat(300)
      const result = getTwitterCharCount(longText)
      expect(result.isValid).toBe(false)
      expect(result.remaining).toBe(-20)
    })
  })

  describe('extractHashtags', () => {
    const extractHashtags = (text: string): string[] => {
      const matches = text.match(/#\w+/g)
      return matches || []
    }

    it('should extract hashtags from text', () => {
      const result = extractHashtags('Hello #world #test!')
      expect(result).toEqual(['#world', '#test'])
    })

    it('should return empty array when no hashtags', () => {
      const result = extractHashtags('No hashtags here')
      expect(result).toEqual([])
    })
  })
})

describe('Platform Utilities', () => {
  describe('getPlatformIcon', () => {
    const getPlatformConfig = (platform: string) => {
      const configs: Record<string, { name: string; color: string; maxLength: number }> = {
        twitter: { name: 'Twitter', color: '#1DA1F2', maxLength: 280 },
        linkedin: { name: 'LinkedIn', color: '#0077B5', maxLength: 3000 },
        instagram: { name: 'Instagram', color: '#E4405F', maxLength: 2200 },
        facebook: { name: 'Facebook', color: '#1877F2', maxLength: 63206 }
      }
      return configs[platform] || { name: 'Unknown', color: '#666', maxLength: 1000 }
    }

    it('should return Twitter config', () => {
      const config = getPlatformConfig('twitter')
      expect(config.name).toBe('Twitter')
      expect(config.maxLength).toBe(280)
    })

    it('should return LinkedIn config', () => {
      const config = getPlatformConfig('linkedin')
      expect(config.name).toBe('LinkedIn')
      expect(config.maxLength).toBe(3000)
    })

    it('should return default for unknown platform', () => {
      const config = getPlatformConfig('unknown')
      expect(config.name).toBe('Unknown')
    })
  })
})

describe('Array Utilities', () => {
  describe('groupByDate', () => {
    const groupByDate = <T extends { date: string }>(items: T[]): Record<string, T[]> => {
      return items.reduce((acc, item) => {
        const date = item.date.split('T')[0]
        if (!acc[date]) acc[date] = []
        acc[date].push(item)
        return acc
      }, {} as Record<string, T[]>)
    }

    it('should group items by date', () => {
      const items = [
        { id: '1', date: '2025-01-01', title: 'Item 1' },
        { id: '2', date: '2025-01-01', title: 'Item 2' },
        { id: '3', date: '2025-01-02', title: 'Item 3' }
      ]
      
      const grouped = groupByDate(items)
      
      expect(Object.keys(grouped)).toHaveLength(2)
      expect(grouped['2025-01-01']).toHaveLength(2)
      expect(grouped['2025-01-02']).toHaveLength(1)
    })
  })

  describe('sortByDate', () => {
    const sortByDate = <T extends { date: string }>(items: T[], ascending = true): T[] => {
      return [...items].sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return ascending ? dateA - dateB : dateB - dateA
      })
    }

    it('should sort items by date ascending', () => {
      const items = [
        { id: '1', date: '2025-01-15' },
        { id: '2', date: '2025-01-01' },
        { id: '3', date: '2025-01-10' }
      ]
      
      const sorted = sortByDate(items)
      
      expect(sorted[0].date).toBe('2025-01-01')
      expect(sorted[1].date).toBe('2025-01-10')
      expect(sorted[2].date).toBe('2025-01-15')
    })

    it('should sort items by date descending', () => {
      const items = [
        { id: '1', date: '2025-01-15' },
        { id: '2', date: '2025-01-01' }
      ]
      
      const sorted = sortByDate(items, false)
      
      expect(sorted[0].date).toBe('2025-01-15')
      expect(sorted[1].date).toBe('2025-01-01')
    })
  })
})

