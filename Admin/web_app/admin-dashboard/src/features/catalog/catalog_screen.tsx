import { useEffect, useMemo, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { CatalogProduct } from '@data/models/admin_models'
import './catalog_screen.css'

const CATEGORIES_KEY = 'All'
const GROUPS_KEY = 'All'

export default function CatalogScreen() {
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMetadataLoading, setIsMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  // Data States
  const [products, setProducts] = useState<CatalogProduct[]>([])

  // Metadata for dynamic dropdowns
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [groupOptions, setGroupOptions] = useState<string[]>([])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [newGroupInput, setNewGroupInput] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

  // UI States
  const [searchProduct, setSearchProduct] = useState('')
  const [category, setCategory] = useState(CATEGORIES_KEY)
  const [group, setGroup] = useState(GROUPS_KEY)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' })

  // Form States
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null)
  const [productForm, setProductForm] = useState({ name: '', category: 'Cameras', group: 'Core', unit: 'unit', price: 0, status: 'active' as 'active' | 'inactive' })

  // Data Loading
  useEffect(() => {
    const fetchData = async () => {
      if (!firebaseUser) return
      setIsLoading(true)
      setError(null)
      setSelectedItems(new Set())
      try {
        setProducts(await adminDatasource.getCatalogProducts())
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data') }
      finally { setIsLoading(false) }
    }
    fetchData()
  }, [category, group, firebaseUser])

  // Load metadata (categories and groups) for dynamic dropdowns
  useEffect(() => {
    const loadMetadata = async () => {
      if (!firebaseUser) return
      setIsMetadataLoading(true)
      try {
        const meta = await adminDatasource.getCatalogMetadata()
        setCategoryOptions([CATEGORIES_KEY, ...(meta.categories || [])])
        setGroupOptions([GROUPS_KEY, ...(meta.groups || [])])
      } catch (err) {
        console.error('Failed to load metadata:', err)
        setCategoryOptions([CATEGORIES_KEY])
        setGroupOptions([GROUPS_KEY])
      } finally {
        setIsMetadataLoading(false)
      }
    }
    loadMetadata()
  }, [firebaseUser, products.length])

  // Handler to create new category
  const handleCreateCategory = async () => {
    const trimmed = newCategoryInput.trim()
    if (!trimmed) return
    setIsCreatingCategory(true)
    try {
      await adminDatasource.createCatalogMetadata('category', trimmed)
      setNewCategoryInput('')
      const meta = await adminDatasource.getCatalogMetadata()
      setCategoryOptions([CATEGORIES_KEY, ...(meta.categories || [])])
    } catch (err) {
      console.error('Failed to create category:', err)
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // Handler to create new group
  const handleCreateGroup = async () => {
    const trimmed = newGroupInput.trim()
    if (!trimmed) return
    setIsCreatingGroup(true)
    try {
      await adminDatasource.createCatalogMetadata('group', trimmed)
      setNewGroupInput('')
      const meta = await adminDatasource.getCatalogMetadata()
      setGroupOptions([GROUPS_KEY, ...(meta.groups || [])])
    } catch (err) {
      console.error('Failed to create group:', err)
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setIsCreatingGroup(false)
    }
  }

  // Sorting & Selection Helpers
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))
  }

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (items: any[], idField: string) => {
    if (selectedItems.size === items.length && items.length > 0) setSelectedItems(new Set())
    else setSelectedItems(new Set(items.map((i) => i[idField])))
  }

  const filteredProducts = useMemo(() => {
    const query = searchProduct.trim().toLowerCase()
    let result = products.filter((p) => {
      const matchesQuery = !query || p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
      const matchesCategory = category === 'All' || p.category === category
      const matchesGroup = group === 'All' || p.group === group
      return matchesQuery && matchesCategory && matchesGroup
    })
    result.sort((a, b) => {
      let aVal = (a as any)[sortConfig.field] || ''
      let bVal = (b as any)[sortConfig.field] || ''
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [searchProduct, category, group, products, sortConfig])

  // CRUD Handlers
  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { setError('Product name is required'); return }
    setIsSaving(true)
    try {
      if (editingProduct) {
        const updated = await adminDatasource.updateCatalogProduct(editingProduct.id, productForm)
        setProducts((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogProduct(productForm)
        setProducts((p) => [created, ...p])
      }
      setIsProductFormOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setIsSaving(false) }
  }

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      await adminDatasource.deleteCatalogProduct(id)
      setProducts(p => p.filter(i => i.id !== id))
    } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed') }
  }

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div className="fade-in">
          <h1>Products</h1>
          <p className="catalog-subtitle">Manage your product inventory.</p>
        </div>
        <div className="catalog-actions slide-up">
          {selectedItems.size > 0 && (
            <button className="primary-btn danger glass-panel" onClick={async () => {
              if (!window.confirm(`Delete ${selectedItems.size} selected items?`)) return
              setIsSaving(true)
              try {
                const ids = Array.from(selectedItems)
                for (const id of ids) {
                  await adminDatasource.deleteCatalogProduct(id)
                }
                setSelectedItems(new Set())
                setProducts(p => p.filter(i => !ids.includes(i.id)))
              } catch (err) { setError(err instanceof Error ? err.message : 'Bulk delete failed') }
              finally { setIsSaving(false) }
            }}>🗑️ Delete {selectedItems.size} Items</button>
          )}
          <button className="primary-btn" onClick={() => {
            setEditingProduct(null); setProductForm({ name: '', category: 'Cameras', group: 'Core', unit: 'unit', price: 0, status: 'active' }); setIsProductFormOpen(true);
          }}>+ Add New Product</button>
        </div>
      </div>

      {error && <div className="catalog-error slide-up">{error}</div>}

      <div className="slide-up">
        <div className="catalog-toolbar">
          <div className="toolbar-group">
            <label>Category</label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isMetadataLoading}>
                {categoryOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <input
                type="text"
                placeholder="New category..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                style={{ width: '100px', fontSize: '11px' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } }}
              />
              <button onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryInput.trim()} style={{ padding: '2px 6px', fontSize: '10px' }}>
                {isCreatingCategory ? '...' : '+'}
              </button>
            </div>
          </div>
          <div className="toolbar-group">
            <label>Group</label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <select value={group} onChange={(e) => setGroup(e.target.value)} disabled={isMetadataLoading}>
                {groupOptions.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
              <input
                type="text"
                placeholder="New group..."
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                style={{ width: '100px', fontSize: '11px' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateGroup() } }}
              />
              <button onClick={handleCreateGroup} disabled={isCreatingGroup || !newGroupInput.trim()} style={{ padding: '2px 6px', fontSize: '10px' }}>
                {isCreatingGroup ? '...' : '+'}
              </button>
            </div>
          </div>
          <div className="toolbar-group search">
            <label>Search Inventory</label>
            <input placeholder="Search product name or ID..." value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} />
          </div>
        </div>
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Syncing products...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" checked={filteredProducts.length > 0 && selectedItems.size === filteredProducts.length} onChange={() => toggleSelectAll(filteredProducts, 'id')} /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Product {sortConfig.field === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>Category {sortConfig.field === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th className="num" style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>Price {sortConfig.field === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {sortConfig.field === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className={selectedItems.has(p.id) ? 'selected' : ''}>
                    <td><input type="checkbox" checked={selectedItems.has(p.id)} onChange={() => toggleSelection(p.id)} /></td>
                    <td><div className="product-main"><span className="product-name">{p.name}</span><span className="product-id">{p.id}</span></div></td>
                    <td>{p.category}</td>
                    <td className="num">Rs {p.price.toLocaleString()}</td>
                    <td><span className={`status ${p.status}`}>{p.status}</span></td>
                    <td>
                      <button className="icon-btn" onClick={() => { setEditingProduct(p); setProductForm(p); setIsProductFormOpen(true); }}>Edit</button>
                      <button className="icon-btn danger" onClick={() => handleDeleteItem(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {isProductFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingProduct ? 'Update Product' : 'Create New Product'}</h2>
              <button className="icon-btn" onClick={() => setIsProductFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>Category 
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})}>
                      {categoryOptions.filter(c => c !== CATEGORIES_KEY).map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    <input 
                      placeholder="New..." 
                      list="new-cat-opt" 
                      value={newCategoryInput} 
                      onChange={(e) => { setNewCategoryInput(e.target.value); if (e.target.value && !categoryOptions.includes(e.target.value)) setProductForm({...productForm, category: e.target.value }) }} 
                      style={{ width: '80px' }}
                    />
                  </div>
                </label>
                <label>Group 
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select value={productForm.group} onChange={(e) => setProductForm({...productForm, group: e.target.value})}>
                      {groupOptions.filter(g => g !== GROUPS_KEY).map((g) => (<option key={g} value={g}>{g}</option>))}
                    </select>
                    <input 
                      placeholder="New..." 
                      list="new-group-opt" 
                      value={newGroupInput} 
                      onChange={(e) => { setNewGroupInput(e.target.value); if (e.target.value && !groupOptions.includes(e.target.value)) setProductForm({...productForm, group: e.target.value }) }} 
                      style={{ width: '80px' }}
                    />
                  </div>
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>Unit <input value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} /></label>
                <label>Price <input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})} /></label>
              </div>
              <label>Status <select value={productForm.status} onChange={(e) => setProductForm({...productForm, status: e.target.value as 'active' | 'inactive'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsProductFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveProduct} disabled={isSaving}>Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
