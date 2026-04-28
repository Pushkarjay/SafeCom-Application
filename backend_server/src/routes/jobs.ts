import { Router } from 'express'
import { jobs } from '../data/mock-data.js'

export const jobsRouter = Router()

jobsRouter.get('/', (_req, res) => {
  return res.json(jobs)
})

jobsRouter.get('/:id', (req, res) => {
  const job = jobs.find((item) => item.id === req.params.id)

  if (!job) {
    return res.status(404).json({ message: 'Job not found' })
  }

  return res.json(job)
})
