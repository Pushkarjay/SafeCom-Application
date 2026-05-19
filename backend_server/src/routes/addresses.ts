import { Router } from 'express'
import { z } from 'zod'
import { getDb } from '../services/firestore.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { SavedAddress } from '../types.js'

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number(),
  longitude: z.number(),
  isDefault: z.boolean().optional().default(false),
})

export const addressesRouter = Router()

// GET /customers/:customerId/addresses - List all addresses
addressesRouter.get('/:customerId/addresses', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  if (req.firebaseUid !== req.params.customerId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  try {
    const db = getDb()
    const doc = await db.collection('customers').doc(req.params.customerId).get()
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })
    const data = doc.data() as Record<string, unknown>
    const addresses = (data.savedAddresses as SavedAddress[]) || []
    return res.json({ success: true, data: { addresses, defaultAddressId: data.defaultAddressId || null } })
  } catch (error) {
    console.error('Failed to fetch addresses:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch addresses' })
  }
})

// POST /customers/:customerId/addresses - Add new address
addressesRouter.post('/:customerId/addresses', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  if (req.firebaseUid !== req.params.customerId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  const parsed = addressSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid address payload', issues: parsed.error.flatten() })
  }
  try {
    const db = getDb()
    const docRef = db.collection('customers').doc(req.params.customerId)
    const doc = await docRef.get()
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })

    const data = doc.data() as Record<string, unknown>
    const addresses = (data.savedAddresses as SavedAddress[]) || []

    const newAddress: SavedAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      label: parsed.data.label,
      address: parsed.data.address,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      isDefault: parsed.data.isDefault || addresses.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    let updatedAddresses = [...addresses, newAddress]
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: a.id === newAddress.id }))
    }

    await docRef.update({
      savedAddresses: updatedAddresses,
      defaultAddressId: newAddress.isDefault ? newAddress.id : (data.defaultAddressId || null),
      address: newAddress.isDefault ? newAddress.address : (data.address || ''),
    } as Record<string, unknown>)

    return res.status(201).json({ success: true, data: newAddress })
  } catch (error) {
    console.error('Failed to add address:', error)
    return res.status(500).json({ success: false, message: 'Failed to add address' })
  }
})

// PATCH /customers/:customerId/addresses/:addressId - Update address
addressesRouter.patch('/:customerId/addresses/:addressId', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  if (req.firebaseUid !== req.params.customerId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  const parsed = addressSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid address payload', issues: parsed.error.flatten() })
  }
  try {
    const db = getDb()
    const docRef = db.collection('customers').doc(req.params.customerId)
    const doc = await docRef.get()
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })

    const data = doc.data() as Record<string, unknown>
    const addresses = (data.savedAddresses as SavedAddress[]) || []
    const index = addresses.findIndex(a => a.id === req.params.addressId)
    if (index === -1) return res.status(404).json({ success: false, message: 'Address not found' })

    const updated = { ...addresses[index], ...parsed.data, updatedAt: new Date().toISOString() }
    let updatedAddresses = [...addresses]
    updatedAddresses[index] = updated

    if (parsed.data.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: a.id === updated.id }))
    }

    await docRef.update({
      savedAddresses: updatedAddresses,
      defaultAddressId: updated.isDefault ? updated.id : (data.defaultAddressId || null),
      address: updated.isDefault ? updated.address : (data.address || ''),
    } as Record<string, unknown>)

    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update address:', error)
    return res.status(500).json({ success: false, message: 'Failed to update address' })
  }
})

// DELETE /customers/:customerId/addresses/:addressId - Delete address
addressesRouter.delete('/:customerId/addresses/:addressId', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  if (req.firebaseUid !== req.params.customerId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  try {
    const db = getDb()
    const docRef = db.collection('customers').doc(req.params.customerId)
    const doc = await docRef.get()
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })

    const data = doc.data() as Record<string, unknown>
    const addresses = (data.savedAddresses as SavedAddress[]) || []
    const deleted = addresses.find(a => a.id === req.params.addressId)
    if (!deleted) return res.status(404).json({ success: false, message: 'Address not found' })

    const remaining = addresses.filter(a => a.id !== req.params.addressId)

    let newDefaultId = data.defaultAddressId as string | undefined
    if (deleted.isDefault) {
      if (remaining.length > 0) {
        remaining[0].isDefault = true
        newDefaultId = remaining[0].id
      } else {
        newDefaultId = undefined
      }
    }

    const updateData: Record<string, unknown> = {
      savedAddresses: remaining,
      defaultAddressId: newDefaultId || null,
    }
    if (remaining.length > 0) {
      const defaultAddr = remaining.find(a => a.isDefault) || remaining[0]
      updateData.address = defaultAddr.address
    } else {
      updateData.address = ''
    }

    await docRef.update(updateData)

    return res.json({ success: true, message: 'Address deleted' })
  } catch (error) {
    console.error('Failed to delete address:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete address' })
  }
})

// PUT /customers/:customerId/addresses/:addressId/default - Set as default
addressesRouter.put('/:customerId/addresses/:addressId/default', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  if (req.firebaseUid !== req.params.customerId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  try {
    const db = getDb()
    const docRef = db.collection('customers').doc(req.params.customerId)
    const doc = await docRef.get()
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Customer not found' })

    const data = doc.data() as Record<string, unknown>
    const addresses = (data.savedAddresses as SavedAddress[]) || []
    const target = addresses.find(a => a.id === req.params.addressId)
    if (!target) return res.status(404).json({ success: false, message: 'Address not found' })

    const updatedAddresses = addresses.map(a => ({ ...a, isDefault: a.id === req.params.addressId, updatedAt: new Date().toISOString() }))

    await docRef.update({
      savedAddresses: updatedAddresses,
      defaultAddressId: req.params.addressId,
      address: target.address,
    } as Record<string, unknown>)

    return res.json({ success: true, data: { message: 'Default address updated', addressId: req.params.addressId } })
  } catch (error) {
    console.error('Failed to set default address:', error)
    return res.status(500).json({ success: false, message: 'Failed to set default address' })
  }
})
