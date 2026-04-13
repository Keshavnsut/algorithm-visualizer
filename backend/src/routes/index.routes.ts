import express from 'express'

const router = express.Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Algorithm Visualizer Backend is running' })
})

export default router
