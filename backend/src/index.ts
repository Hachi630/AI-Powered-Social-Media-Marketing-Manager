import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { connectDB } from './config/database'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import calendarRoutes from './routes/calendar'
import campaignRoutes from './routes/campaign'
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
app.use('/api/calendar', calendarRoutes)
app.use('/api/campaigns', campaignRoutes)

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Melo API' })
})

// Error Handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
