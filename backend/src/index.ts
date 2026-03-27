import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { initializeDatabase, closeDatabase } from './db/database.js'
import aiRoutes from './routes/ai.routes.js'
import indexRoutes from './routes/index.routes.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Initialize database
initializeDatabase()

// Routes
app.use('/', indexRoutes)
app.use('/api/ai', aiRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Algorithm Visualizer Backend running on http://localhost:${PORT}`)
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`🤖 AI Features: OpenAI Integration Active`)
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
