import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId || `req_${Date.now()}`
  let error = { ...err }
  error.message = err.message

  // Enhanced logging with context
  console.error('[Error Handler]', {
    requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  // Gemini API errors
  if (err.message?.includes('Gemini API')) {
    // Don't expose internal API errors in production
    const message =
      process.env.NODE_ENV === 'production'
        ? 'AI service temporarily unavailable'
        : err.message
    error = { message, statusCode: err.code || 503 }
  }

  // Default error response
  const statusCode = error.statusCode || 500
  const response: any = {
    success: false,
    message: error.message || 'Server Error',
  }

  // Include request ID for debugging
  if (process.env.NODE_ENV !== 'production') {
    response.requestId = requestId
    if (err.stack) {
      response.stack = err.stack
    }
  }

  res.status(statusCode).json(response)
}

