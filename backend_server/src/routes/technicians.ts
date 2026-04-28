import { Router } from 'express'
import { technicians } from '../data/mock-data.js'

export const techniciansRouter = Router()

techniciansRouter.get('/', (_req, res) => {
  return res.json(technicians)
})

techniciansRouter.get('/:id', (req, res) => {
  const technician = technicians.find((item) => item.id === req.params.id)

  if (!technician) {
    return res.status(404).json({ message: 'Technician not found' })
  }

  return res.json(technician)
})
