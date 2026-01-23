import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import * as path from 'path'

import templateRoutes from './routes/templates'
import imageGenRoutes from './routes/imageGen'
import { closeBrowser } from './services/renderer'

const app = express()
const PORT = process.env.API_PORT || 3000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quote-imagen'
const API_KEY = process.env.API_KEY || 'dev-api-key'
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '../../output')

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Serve generated images
app.use('/output', express.static(OUTPUT_DIR))

// API Key middleware
const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key']
  
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }
  
  next()
}

// Health check (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes (require API key)
app.use('/api/templates', apiKeyMiddleware, templateRoutes)
app.use('/api/image-gen', apiKeyMiddleware, imageGenRoutes)

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`API Key: ${API_KEY.substring(0, 4)}...`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...')
  await closeBrowser()
  await mongoose.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...')
  await closeBrowser()
  await mongoose.disconnect()
  process.exit(0)
})

start()
