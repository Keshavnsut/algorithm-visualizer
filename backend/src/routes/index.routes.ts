import express from 'express'

const router = express.Router()

router.get('/', (_req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  // Make localhost:5000 user-friendly by forwarding to the frontend app.
  res.redirect(frontendUrl)
})

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Algorithm Visualizer Backend is running' })
})

export default router
