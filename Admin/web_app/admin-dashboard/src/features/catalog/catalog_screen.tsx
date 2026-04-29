import { useEffect, useMemo, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { CatalogProduct } from '@data/models/admin_models'
import './catalog_screen.css'

const categories = ['All', 'Cameras', 'Storage', 'Recording', 'Wiring', 'Accessories']
const groups = ['All', 'Core', 'Package Base', 'Installation', 'Recommendations']

export default function CatalogScreen() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [group, setGroup] = useState('All')
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null)
  const [formState, setFormState] = useState({
    name: '',
    category: 'Cameras',
    group: 'Core',
    unit: 'unit',
    price: 0,
    status: 'active' as CatalogProduct['status']
  })
  const [activeTab, setActiveTab] = useState<'products' | 'packages' | 'addons' | 'taxes' | 'recommendations' | 'invoices'>('products')

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await adminDatasource.getCatalogProducts()
        setProducts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchesQuery = !query ||
        product.name.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)
      const matchesCategory = category === 'All' || product.category === category
      const matchesGroup = group === 'All' || product.group === group
      return matchesQuery && matchesCategory && matchesGroup
    })
  }, [search, category, group, products])

  const openCreateForm = () => {
    setEditingProduct(null)
    setFormState({
      name: '',
      category: 'Cameras',
      group: 'Core',
      unit: 'unit',
      price: 0,
      status: 'active'
    })
    setIsFormOpen(true)
  }

  const openEditForm = (product: CatalogProduct) => {
    setEditingProduct(product)
    setFormState({
      name: product.name,
      category: product.category,
      group: product.group,
      unit: product.unit,
      price: product.price,
      status: product.status
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!formState.name.trim()) {
      setError('Product name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (editingProduct) {
        const updated = await adminDatasource.updateCatalogProduct(editingProduct.id, formState)
        setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        const created = await adminDatasource.createCatalogProduct(formState)
        setProducts((prev) => [created, ...prev])
      }
      setIsFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save catalog item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (product: CatalogProduct) => {
    if (!window.confirm(`Disable ${product.name}?`)) return

    try {
      await adminDatasource.deleteCatalogProduct(product.id)
      setProducts((prev) => prev.filter((item) => item.id !== product.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete catalog item')
    }
  }

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div>
          <h1>Accessories & Catalog</h1>
          <p className="catalog-subtitle">
            Manage products, pricing, and recommendation items shown in customer flows.
          </p>
        </div>
        <div className="catalog-actions">
          <button className="primary-btn" onClick={openCreateForm}>+ Add Product</button>
          <button className="secondary-btn">Import CSV</button>
        </div>
      </div>

      <div className="catalog-tabs">
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          Packages
        </button>
        <button
          className={`tab-btn ${activeTab === 'addons' ? 'active' : ''}`}
          onClick={() => setActiveTab('addons')}
        >
          Add-ons
        </button>
        <button
          className={`tab-btn ${activeTab === 'taxes' ? 'active' : ''}`}
          onClick={() => setActiveTab('taxes')}
        >
          Taxes
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoice Templates
        </button>
      </div>

      {error && (
        <div className="catalog-error">
          {error}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="catalog-toolbar">
        <div className="toolbar-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          <label htmlFor="group">Group</label>
          <select
            id="group"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
          >
            {groups.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-group search">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            placeholder="Search product, ID, or keyword"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="toolbar-group">
          <label htmlFor="status">Status</label>
          <select id="status" defaultValue="All">
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        </div>
      )}

      {activeTab !== 'products' && (
        <div className="catalog-placeholder">
          <div className="placeholder-card">
            <h3>Setup {activeTab === 'packages' ? 'Packages' : activeTab === 'addons' ? 'Add-ons' : activeTab === 'taxes' ? 'Taxes' : activeTab === 'recommendations' ? 'Recommendations' : 'Invoice Templates'}</h3>
            <p>
              This section will be wired to backend collections in the next phase.
              You can add, edit, and reorder items once data models are finalized.
            </p>
            <div className="placeholder-actions">
              <button className="primary-btn">Add Item</button>
              <button className="secondary-btn">View Drafts</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="catalog-table-wrapper">
        {isLoading ? (
          <div className="catalog-loading">Loading catalog...</div>
        ) : null}
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Group</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  No products found. Try changing filters or add a new item.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-main">
                      <span className="product-name">{product.name}</span>
                      <span className="product-id">{product.id}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>{product.group}</td>
                  <td>{product.unit}</td>
                  <td>Rs {product.price.toLocaleString()}</td>
                  <td>
                    <span className={`status ${product.status}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>{product.updatedAt}</td>
                  <td>
                    <button className="icon-btn" title="Edit" onClick={() => openEditForm(product)}>Edit</button>
                    <button className="icon-btn danger" title="Disable" onClick={() => handleDelete(product)}>Disable</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      )}

      {isFormOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Name
                  <input
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label>
                  Category
                  <input
                    value={formState.category}
                    onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
                  />
                </label>
                <label>
                  Group
                  <input
                    value={formState.group}
                    onChange={(event) => setFormState((prev) => ({ ...prev, group: event.target.value }))}
                  />
                </label>
                <label>
                  Unit
                  <input
                    value={formState.unit}
                    onChange={(event) => setFormState((prev) => ({ ...prev, unit: event.target.value }))}
                  />
                </label>
                <label>
                  Price (Rs)
                  <input
                    type="number"
                    min="0"
                    value={formState.price}
                    onChange={(event) => setFormState((prev) => ({ ...prev, price: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as CatalogProduct['status'] }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Cancel</button>
              <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
