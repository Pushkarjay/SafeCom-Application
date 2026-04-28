import { Router } from 'express'
import { customers } from '../data/mock-data.js'

export const customersRouter = Router()

customersRouter.get('/', (_req, res) => {
  return res.json(customers)
})

customersRouter.get('/:id', (req, res) => {
  const customer = customers.find((item) => item.id === req.params.id)

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  return res.json(customer)
})
