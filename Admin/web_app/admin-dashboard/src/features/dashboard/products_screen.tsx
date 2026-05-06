import React, { useEffect, useState } from 'react'
import { useCallback } from 'react'
import './products_screen.css'
import type { MasterProduct, CreateUpdateProductRequest } from '../../data/models/admin_models'

const CATEGORIES = ['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories']

interface ProductsScreenProps {
  apiBaseUrl: string
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({ apiBaseUrl }) => {
  const [products, setProducts] = useState<MasterProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${apiBaseUrl}/catalog/products`)
      if (selectedCategory !== 'all') {
        url.searchParams.append('category', selectedCategory)
      }

       const response = await fetch(url.toString(), {
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}`
         }
       })

      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, selectedCategory])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSaveProduct = async (formData: CreateUpdateProductRequest) => {
    try {
      const url = editingProduct
        ? `${apiBaseUrl}/catalog/products/${editingProduct.productId}`
        : `${apiBaseUrl}/catalog/products`

      const method = editingProduct ? 'PATCH' : 'POST'

       const response = await fetch(url, {
         method,
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}`
         },
         body: JSON.stringify(formData)
       })

      if (!response.ok) throw new Error('Failed to save product')

      setShowCreateModal(false)
      setEditingProduct(null)
      await fetchProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
       const response = await fetch(`${apiBaseUrl}/catalog/products/${productId}`, {
         method: 'DELETE',
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('safecom_admin_token') || ''}`
         }
       })

      if (!response.ok) throw new Error('Failed to delete product')
      await fetchProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="products-screen">
      <div className="products-header">
        <h1>Product Management</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Product
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="products-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            className={`filter-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
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
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>No products found</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            Create your first product
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.productId} className="product-card">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.productName} className="product-image" />
              )}
              
              <div className="product-info">
                <div className="product-header">
                  <h3>{product.productName}</h3>
                  {product.isFeatured && <span className="badge-featured">Featured</span>}
                  {!product.isAvailable && <span className="badge-unavailable">Unavailable</span>}
                </div>

                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}

                <div className="product-details">
                  <div className="detail">
                    <span className="label">Category:</span>
                    <span className="value">{product.category}</span>
                  </div>
                  {product.group && (
                    <div className="detail">
                      <span className="label">Group:</span>
                      <span className="value">{product.group}</span>
                    </div>
                  )}
                  <div className="detail">
                    <span className="label">Price:</span>
                    <span className="value">₹{product.basePrice}</span>
                  </div>
                  {product.stock !== undefined && (
                    <div className="detail">
                      <span className="label">Stock:</span>
                      <span className="value">{product.stock}</span>
                    </div>
                  )}
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div className="variants-section">
                    <strong>Variants:</strong>
                    <ul>
                      {product.variants.map((v, idx) => (
                        <li key={idx}>{v.name}: {v.options.join(', ')}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="product-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditingProduct(product)
                      setShowCreateModal(true)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteProduct(product.productId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <ProductFormModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowCreateModal(false)
            setEditingProduct(null)
          }}
        />
      )}
    </div>
  )
}

interface ProductFormModalProps {
  product?: MasterProduct | null
  onSave: (formData: CreateUpdateProductRequest) => void
  onClose: () => void
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState<CreateUpdateProductRequest>(
    product || {
      productName: '',
      category: 'installation',
      basePrice: 0,
      isAvailable: true,
      taxRate: 18
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Create Product'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Group</label>
              <input
                type="text"
                value={formData.group || ''}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
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

            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                value={formData.stock || 0}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxRate || 18}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              <label htmlFor="isAvailable">Available for Purchase</label>
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured || false}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              />
              <label htmlFor="isFeatured">Featured Product</label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
