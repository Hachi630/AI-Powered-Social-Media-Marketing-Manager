import { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import User from '../models/User'
import { AuthRequest } from '../types'

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    console.error('Auth middleware: No token provided')
    console.error('Authorization header:', req.headers.authorization)
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route. Please log in again.' 
    })
  }

  try {
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.id) {
      console.error('Auth middleware: Invalid token payload', decoded)
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please log in again.' 
      })
    }

    const user = await User.findById(decoded.id)

    if (!user) {
      console.error('Auth middleware: User not found for id:', decoded.id)
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with this id. Please log in again.' 
      })
    }

    req.user = user
    next()
  } catch (error: any) {
    console.error('Auth middleware error:', error.message || error)
    return res.status(401).json({ 
      success: false, 
      message: error.message === 'jwt expired' 
        ? 'Your session has expired. Please log in again.'
        : 'Not authorized to access this route. Please log in again.' 
    })
  }
}

// alias for backwards compatibility
export const protect = requireAuth
