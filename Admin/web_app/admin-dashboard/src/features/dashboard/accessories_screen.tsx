import React, { useEffect, useState } from 'react'
import './accessories_screen.css'
import type { CatalogAccessory } from '../../data/models/admin_models'

const ACCESSORY_TYPES = ['installation', 'upgrades', 'warranty', 'support', 'other']

interface AccessoriesScreenProps {
  apiBaseUrl: string
}

export const AccessoriesScreen: React.FC<AccessoriesScreenProps> = ({ apiBaseUrl }) => {
  const [accessories, setAccessories] = useState<CatalogAccessory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingAccessory, setEditingAccessory] = useState<CatalogAccessory | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAccessories = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${apiBaseUrl}/catalog/accessories`)
      if (selectedType !== 'all') {
        url.searchParams.append('type', selectedType)
      }

       const response = await fetch(url.toString(), {
         headers: { 'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}` }
       })

      if (!response.ok) throw new Error('Failed to fetch accessories')
      const data = await response.json()
      setAccessories(data.data.accessories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessories()
  }, [selectedType])

  const handleSaveAccessory = async (formData: any) => {
    try {
      const url = editingAccessory
        ? `${apiBaseUrl}/catalog/accessories/${editingAccessory.accessoryId}`
        : `${apiBaseUrl}/catalog/accessories`

      const method = editingAccessory ? 'PATCH' : 'POST'

       const response = await fetch(url, {
         method,
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}`
         },
         body: JSON.stringify(formData)
       })

      if (!response.ok) throw new Error('Failed to save accessory')

      setShowModal(false)
      setEditingAccessory(null)
      await fetchAccessories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDeleteAccessory = async (accessoryId: string) => {
    if (!window.confirm('Delete this accessory?')) return

    try {
       const response = await fetch(`${apiBaseUrl}/catalog/accessories/${accessoryId}`, {
         method: 'DELETE',
         headers: { 'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}` }
       })

      if (!response.ok) throw new Error('Failed to delete')
      await fetchAccessories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const filteredAccessories = accessories.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="accessories-screen">
      <div className="accessories-header">
        <h1>Accessories Management</h1>
        <button className="btn-primary" onClick={() => {
          setEditingAccessory(null)
          setShowModal(true)
        }}>
          + Add Accessory
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="accessories-controls">
        <input
          type="text"
          placeholder="Search accessories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="type-filters">
          <button
            className={`filter-chip ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            All Types
          </button>
          {ACCESSORY_TYPES.map(t => (
            <button
              key={t}
              className={`filter-chip ${selectedType === t ? 'active' : ''}`}
              onClick={() => setSelectedType(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredAccessories.length === 0 ? (
        <div className="empty-state">
          <p>No accessories found</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Create your first accessory
          </button>
        </div>
      ) : (
        <div className="accessories-grid">
          {filteredAccessories.map(acc => (
            <div key={acc.accessoryId} className="accessory-card">
              {acc.imageUrl && (
                <img src={acc.imageUrl} alt={acc.name} className="acc-image" />
              )}
              
              <div className="acc-info">
                <h3>{acc.name}</h3>
                {acc.description && <p>{acc.description}</p>}
                
                <div className="acc-details">
                  <div><span>Type:</span> {acc.type}</div>
                  <div><span>Price:</span> ₹{acc.price}</div>
                  <div><span>Stock:</span> {acc.stock}</div>
                </div>

                {!acc.isAvailable && <div className="badge-unavailable">Unavailable</div>}
                {acc.isFeatured && <div className="badge-featured">Featured</div>}

                <div className="acc-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditingAccessory(acc)
                      setShowModal(true)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteAccessory(acc.accessoryId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AccessoryFormModal
          accessory={editingAccessory}
          onSave={handleSaveAccessory}
          onClose={() => {
            setShowModal(false)
            setEditingAccessory(null)
          }}
        />
      )}
    </div>
  )
}

const AccessoryFormModal: React.FC<{
  accessory?: CatalogAccessory | null
  onSave: (data: any) => void
  onClose: () => void
}> = ({ accessory, onSave, onClose }) => {
  const [data, setData] = useState(accessory || {
    name: '',
    type: 'installation',
    category: '',
    price: 0,
    stock: 0,
    isAvailable: true,
    taxRate: 18,
    displayPriority: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(data)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{accessory ? 'Edit Accessory' : 'Add Accessory'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              required
              value={(data as any).name}
              onChange={(e) => setData({ ...data, name: e.target.value } as any)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={(data as any).description || ''}
              onChange={(e) => setData({ ...data, description: e.target.value } as any)}
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select
                required
                value={(data as any).type}
                onChange={(e) => setData({ ...data, type: e.target.value } as any)}
              >
                {ACCESSORY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                required
                value={(data as any).category}
                onChange={(e) => setData({ ...data, category: e.target.value } as any)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                required
                step="0.01"
                value={(data as any).price}
                onChange={(e) => setData({ ...data, price: parseFloat(e.target.value) } as any)}
              />
            </div>

            <div className="form-group">
              <label>Stock *</label>
              <input
                type="number"
                required
                value={(data as any).stock}
                onChange={(e) => setData({ ...data, stock: parseInt(e.target.value) } as any)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isAvailable"
                checked={(data as any).isAvailable}
                onChange={(e) => setData({ ...data, isAvailable: e.target.checked } as any)}
              />
              <label htmlFor="isAvailable">Available</label>
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isFeatured"
                checked={(data as any).isFeatured}
                onChange={(e) => setData({ ...data, isFeatured: e.target.checked } as any)}
              />
              <label htmlFor="isFeatured">Featured</label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
