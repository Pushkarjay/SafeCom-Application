import React, { useEffect, useState } from 'react'
import './services_screen.css'
import type { MasterProduct, CatalogService } from '../../data/models/admin_models'

const CATEGORIES = ['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories']

interface ServicesScreenProps {
  apiBaseUrl: string
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({ apiBaseUrl }) => {
  const [services, setServices] = useState<CatalogService[]>([])
  const [products, setProducts] = useState<MasterProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showBuilderModal, setShowBuilderModal] = useState(false)
  const [editingService, setEditingService] = useState<CatalogService | null>(null)

  // Fetch services and products
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [servicesRes, productsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/catalog/services`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` }
        }),
        fetch(`${apiBaseUrl}/catalog/products`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` }
        })
      ])

      if (!servicesRes.ok || !productsRes.ok) throw new Error('Failed to fetch data')

      const servicesData = await servicesRes.json()
      const productsData = await productsRes.json()

      setServices(servicesData.data.services || [])
      setProducts(productsData.data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`${apiBaseUrl}/catalog/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` }
      })

      if (!response.ok) throw new Error('Failed to delete service')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(s => s.category === selectedCategory)

  return (
    <div className="services-screen">
      <div className="services-header">
        <h1>Service Builder</h1>
        <button className="btn-primary" onClick={() => {
          setEditingService(null)
          setShowBuilderModal(true)
        }}>
          + Create Service
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="category-filters">
        <button
          className={`filter-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Services
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <div className="empty-state">
          <p>No services found</p>
          <button className="btn-primary" onClick={() => {
            setEditingService(null)
            setShowBuilderModal(true)
          }}>
            Create your first service
          </button>
        </div>
      ) : (
        <div className="services-list">
          {filteredServices.map(service => (
            <div key={service.serviceId} className="service-card">
              <div className="service-header">
                <div>
                  <h3>{service.serviceName}</h3>
                  {service.description && <p className="service-desc">{service.description}</p>}
                </div>
                <div className="service-badges">
                  {service.isFeatured && <span className="badge-featured">Featured</span>}
                  {service.isRecurring && <span className="badge-recurring">Recurring</span>}
                  {!service.isAvailable && <span className="badge-unavailable">Unavailable</span>}
                </div>
              </div>

              <div className="service-details">
                <div className="detail-row">
                  <span className="label">Category:</span>
                  <span className="value">{service.category}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Price:</span>
                  <span className="value">₹{service.basePrice}</span>
                </div>
                {service.duration && (
                  <div className="detail-row">
                    <span className="label">Duration:</span>
                    <span className="value">{service.duration}</span>
                  </div>
                )}
              </div>

              <div className="products-section">
                <strong>Products:</strong>
                <div className="product-pills">
                  {service.productIds.map(pid => {
                    const prod = products.find(p => p.productId === pid)
                    return (
                      <span key={pid} className="product-pill">
                        {prod?.productName || pid}
                      </span>
                    )
                  })}
                </div>
              </div>

              {service.addons && service.addons.length > 0 && (
                <div className="addons-section">
                  <strong>Add-ons:</strong>
                  <ul>
                    {service.addons.map(addon => (
                      <li key={addon.addonId}>
                        {addon.name} (+₹{addon.additionalCost})
                        {!addon.isOptional && <span className="badge-required">Included</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="service-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setEditingService(service)
                    setShowBuilderModal(true)
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteService(service.serviceId)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBuilderModal && (
        <ServiceBuilderModal
          service={editingService}
          products={products}
          onSave={() => {
            setShowBuilderModal(false)
            setEditingService(null)
            fetchData()
          }}
          onClose={() => {
            setShowBuilderModal(false)
            setEditingService(null)
          }}
          apiBaseUrl={apiBaseUrl}
        />
      )}
    </div>
  )
}

interface ServiceBuilderModalProps {
  service?: CatalogService | null
  products: MasterProduct[]
  onSave: () => void
  onClose: () => void
  apiBaseUrl: string
}

const ServiceBuilderModal: React.FC<ServiceBuilderModalProps> = ({
  service,
  products,
  onSave,
  onClose,
  apiBaseUrl
}) => {
  const [formData, setFormData] = useState({
    serviceName: service?.serviceName || '',
    description: service?.description || '',
    category: service?.category || 'installation' as any,
    basePrice: service?.basePrice || 0,
    isAvailable: service?.isAvailable ?? true,
    isFeatured: service?.isFeatured ?? false,
    duration: service?.duration || '',
    isRecurring: service?.isRecurring ?? false,
    renewalFrequency: service?.renewalFrequency || 'monthly' as any,
    taxRate: service?.taxRate || 18,
    displayPriority: service?.displayPriority || 0,
    selectedProducts: service?.productIds || []
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const url = service
        ? `${apiBaseUrl}/catalog/services/${service.serviceId}`
        : `${apiBaseUrl}/catalog/services`

      const method = service ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        productIds: formData.selectedProducts
      }
      delete (payload as any).selectedProducts

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'Failed to save service')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{service ? 'Edit Service' : 'Create Service'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-section">
            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                required
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Basic Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Base Price *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration</label>
                <input
                  type="text"
                  placeholder="e.g., 4 weeks, 1 year"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Product Selection</h4>
            <p className="section-help">Select products to include in this service package</p>
            
            <div className="products-selector">
              {products.length === 0 ? (
                <p className="no-products">No products available. Create products first.</p>
              ) : (
                products.map(product => (
                  <label key={product.productId} className="product-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.selectedProducts.includes(product.productId)}
                      onChange={() => handleProductToggle(product.productId)}
                    />
                    <span className="product-name">{product.productName}</span>
                    <span className="product-price">₹{product.basePrice}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="form-section">
            <h4>Service Configuration</h4>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                  Available for Purchase
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  Featured Service
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  />
                  Recurring/Subscription
                </label>
              </div>
            </div>

            {formData.isRecurring && (
              <div className="form-group">
                <label>Renewal Frequency</label>
                <select
                  value={formData.renewalFrequency}
                  onChange={(e) => setFormData({ ...formData, renewalFrequency: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Display Priority</label>
              <input
                type="number"
                value={formData.displayPriority}
                onChange={(e) => setFormData({ ...formData, displayPriority: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || formData.selectedProducts.length === 0}>
              {saving ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
