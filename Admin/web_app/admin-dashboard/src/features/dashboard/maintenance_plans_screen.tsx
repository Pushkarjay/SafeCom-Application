import React, { useEffect, useState } from 'react'
import './maintenance_plans_screen.css'
import type { MaintenancePlan, CatalogService } from '../../data/models/admin_models'

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'semi-annual', 'annual']

interface MaintenancePlansScreenProps {
  apiBaseUrl: string
}

export const MaintenancePlansScreen: React.FC<MaintenancePlansScreenProps> = ({ apiBaseUrl }) => {
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [services, setServices] = useState<CatalogService[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${apiBaseUrl}/catalog/maintenance-plans`)
      if (selectedFrequency !== 'all') {
        url.searchParams.append('frequency', selectedFrequency)
      }

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}` }
      })

      if (!response.ok) throw new Error('Failed to fetch maintenance plans')
      const data = await response.json()
      setPlans(data.data.plans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/catalog/services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}` }
      })
      if (!response.ok) throw new Error('Failed to fetch services')
      const data = await response.json()
      setServices(data.data.services || [])
    } catch (err) {
      console.error('Error fetching services:', err)
    }
  }

  useEffect(() => {
    fetchPlans()
    fetchServices()
  }, [selectedFrequency])

  const handleSavePlan = async (formData: any) => {
    try {
      const url = editingPlan
        ? `${apiBaseUrl}/catalog/maintenance-plans/${editingPlan.planId}`
        : `${apiBaseUrl}/catalog/maintenance-plans`

      const method = editingPlan ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save plan')

      setShowModal(false)
      setEditingPlan(null)
      await fetchPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Delete this maintenance plan?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/catalog/maintenance-plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}` }
      })

      if (!response.ok) throw new Error('Failed to delete')
      await fetchPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const filteredPlans = plans.filter(p =>
    p.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="maintenance-plans-screen">
      <div className="plans-header">
        <h1>Maintenance Plans</h1>
        <button className="btn-primary" onClick={() => {
          setEditingPlan(null)
          setShowModal(true)
        }}>
          + Add Plan
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="plans-controls">
        <input
          type="text"
          placeholder="Search plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="frequency-filters">
          <button
            className={`filter-chip ${selectedFrequency === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFrequency('all')}
          >
            All Frequencies
          </button>
          {FREQUENCIES.map(f => (
            <button
              key={f}
              className={`filter-chip ${selectedFrequency === f ? 'active' : ''}`}
              onClick={() => setSelectedFrequency(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="empty-state">
          <p>No maintenance plans found</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="plans-grid">
          {filteredPlans.map(plan => (
            <div key={plan.planId} className="plan-card">
              <div className="plan-header">
                <h3>{plan.planName}</h3>
                <div className="plan-badges">
                  {!plan.isAvailable && <div className="badge-unavailable">Unavailable</div>}
                  {plan.isFeatured && <div className="badge-featured">Featured</div>}
                </div>
              </div>

              {plan.description && <p className="plan-description">{plan.description}</p>}

              <div className="plan-details">
                <div><span>Frequency:</span> {plan.frequency}</div>
                <div><span>Duration:</span> {plan.durationMonths} months</div>
                <div><span>Base Price:</span> ₹{plan.basePrice}</div>
                {plan.renewalPrice && <div><span>Renewal:</span> ₹{plan.renewalPrice}</div>}
                <div><span>Services:</span> {plan.planItems.length} items</div>
              </div>

              <div className="plan-services">
                <strong>Services Included:</strong>
                <ul>
                  {plan.planItems.map((item, idx) => (
                    <li key={idx}>{item.serviceName} (Qty: {item.quantity})</li>
                  ))}
                </ul>
              </div>

              <div className="plan-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setEditingPlan(plan)
                    setShowModal(true)
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeletePlan(plan.planId)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <MaintenancePlanFormModal
          plan={editingPlan}
          services={services}
          onSave={handleSavePlan}
          onClose={() => {
            setShowModal(false)
            setEditingPlan(null)
          }}
        />
      )}
    </div>
  )
}

const MaintenancePlanFormModal: React.FC<{
  plan?: MaintenancePlan | null
  services: CatalogService[]
  onSave: (data: any) => void
  onClose: () => void
}> = ({ plan, services, onSave, onClose }) => {
  const [data, setData] = useState(plan || {
    planName: '',
    description: '',
    category: '',
    planItems: [],
    basePrice: 0,
    frequency: 'monthly',
    durationMonths: 12,
    isAvailable: true,
    taxRate: 18,
    displayPriority: 0
  })

  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const handleAddService = () => {
    if (!selectedServiceId) return

    const service = services.find(s => s.serviceId === selectedServiceId)
    if (!service) return

    const newItem = {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      quantity: selectedQuantity,
      unitPrice: service.basePrice,
      lineTotal: service.basePrice * selectedQuantity
    }

    const existingItems = (data as any).planItems || []
    setData({
      ...data,
      planItems: [...existingItems, newItem]
    } as any)

    setSelectedServiceId('')
    setSelectedQuantity(1)
  }

  const handleRemoveService = (index: number) => {
    const items = (data as any).planItems || []
    setData({
      ...data,
      planItems: items.filter((_: any, i: number) => i !== index)
    } as any)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((data as any).planItems.length === 0) {
      alert('Add at least one service to the plan')
      return
    }
    onSave(data)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{plan ? 'Edit Maintenance Plan' : 'Add Maintenance Plan'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              required
              value={(data as any).planName}
              onChange={(e) => setData({ ...data, planName: e.target.value } as any)}
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
              <label>Category *</label>
              <input
                type="text"
                required
                value={(data as any).category}
                onChange={(e) => setData({ ...data, category: e.target.value } as any)}
              />
            </div>

            <div className="form-group">
              <label>Frequency *</label>
              <select
                required
                value={(data as any).frequency}
                onChange={(e) => setData({ ...data, frequency: e.target.value } as any)}
              >
                {FREQUENCIES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (months) *</label>
              <input
                type="number"
                required
                min="1"
                value={(data as any).durationMonths}
                onChange={(e) => setData({ ...data, durationMonths: parseInt(e.target.value) } as any)}
              />
            </div>

            <div className="form-group">
              <label>Base Price *</label>
              <input
                type="number"
                required
                step="0.01"
                value={(data as any).basePrice}
                onChange={(e) => setData({ ...data, basePrice: parseFloat(e.target.value) } as any)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Renewal Price</label>
            <input
              type="number"
              step="0.01"
              value={(data as any).renewalPrice || ''}
              onChange={(e) => setData({ ...data, renewalPrice: e.target.value ? parseFloat(e.target.value) : undefined } as any)}
            />
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

          {/* Services Section */}
          <div className="services-section">
            <h3>Plan Services</h3>

            {((data as any).planItems || []).length > 0 && (
              <div className="services-list">
                {((data as any).planItems || []).map((item: any, idx: number) => (
                  <div key={idx} className="service-item">
                    <div>
                      <strong>{item.serviceName}</strong>
                      <small>Qty: {item.quantity}, Price: ₹{item.unitPrice}, Total: ₹{item.lineTotal}</small>
                    </div>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveService(idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="add-service">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">Select service...</option>
                {services.map(s => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.serviceName} - ₹{s.basePrice}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                placeholder="Qty"
              />

              <button
                type="button"
                className="btn-add"
                onClick={handleAddService}
              >
                Add Service
              </button>
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
