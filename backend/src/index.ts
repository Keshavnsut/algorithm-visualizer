import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initializeDatabase, closeDatabase } from './db/database.js'
import aiRoutes from './routes/ai.routes.js'
import indexRoutes from './routes/index.routes.js'

const app = express()
const PORT = process.env.PORT || 5000
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const frontendDistPath = path.resolve(__dirname, '../public')
const frontendIndexPath = path.join(frontendDistPath, 'index.html')
const hasFrontendBuild = fs.existsSync(frontendIndexPath)

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

const corsOrigin = allowedOrigins.includes('*')
  ? true
  : allowedOrigins.length <= 1
    ? (allowedOrigins[0] || true)
    : allowedOrigins

// Middleware
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Initialize database
initializeDatabase()

// Routes
app.use('/api/ai', aiRoutes)
app.use('/', indexRoutes)

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next()
    }

    res.sendFile(frontendIndexPath)
  })
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    hint: hasFrontendBuild
      ? 'If this is an API request, verify the /api path and endpoint.'
      : `Frontend UI runs at ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Algorithm Visualizer Backend running on port ${PORT}`)
  console.log(`📡 Allowed frontend origins: ${allowedOrigins.join(', ') || 'all'}`)
  console.log(`🤖 AI Provider: ${(process.env.AI_PROVIDER || 'openai').toLowerCase()}`)
  if (hasFrontendBuild) {
    console.log(`🌐 Serving frontend build from ${frontendDistPath}`)
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...')
  closeDatabase()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
