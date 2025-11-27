import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { connectDB } from './config/database'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import { errorHandler } from './middleware/errorHandler'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load env vars
dotenv.config()

// Connect to database
connectDB()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Melo API' })
})

// Error Handler
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown handlers
process.on('uncaughtException', (error: Error) => {
  console.error('[FATAL] Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  // Close server gracefully
  server.close(() => {
    console.log('Server closed due to uncaught exception')
    process.exit(1)
  })
})

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('[FATAL] Unhandled Rejection at:', promise)
  console.error('Reason:', reason)
  // Close server gracefully
  server.close(() => {
    console.log('Server closed due to unhandled rejection')
    process.exit(1)
  })
})

// Graceful shutdown on SIGTERM and SIGINT
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('Process terminated')
    process.exit(0)
  })
})
