import { Request, Response, NextFunction } from 'express'

/**
 * Simple in-memory rate limiter
 * For production, consider using redis-based rate limiting (e.g., express-rate-limit with redis)
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Rate limit configuration
const RATE_LIMITS = {
  chat: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  imageGeneration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
}

/**
 * Get client identifier (IP address or user ID)
 */
const getClientId = (req: Request): string => {
  // Try to get user ID if authenticated
  if ((req as any).user?._id) {
    return `user_${(req as any).user._id.toString()}`
  }
  // Fallback to IP address
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

/**
 * Clean up expired entries (run every 5 minutes)
 */
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

/**
 * Create rate limiter middleware
 */
export const createRateLimiter = (
  limitType: keyof typeof RATE_LIMITS = 'general'
) => {
  const limit = RATE_LIMITS[limitType]

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req)
    const key = `${limitType}_${clientId}`
    const now = Date.now()

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + limit.windowMs,
      }
    }

    // Increment count
    store[key].count++

    // Check if limit exceeded
    if (store[key].count > limit.maxRequests) {
      const resetTime = new Date(store[key].resetTime).toISOString()
      console.warn('[Rate Limiter] Rate limit exceeded', {
        clientId,
        limitType,
        count: store[key].count,
        maxRequests: limit.maxRequests,
        resetTime,
      })

      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${limit.maxRequests} requests per ${limit.windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
        resetTime,
      })
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.maxRequests - store[key].count).toString())
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString())

    next()
  }
}

/**
 * Rate limiter for chat endpoints
 */
export const chatRateLimiter = createRateLimiter('chat')

/**
 * Rate limiter for image generation endpoints
 */
export const imageRateLimiter = createRateLimiter('imageGeneration')

/**
 * General rate limiter
 */
export const generalRateLimiter = createRateLimiter('general')

