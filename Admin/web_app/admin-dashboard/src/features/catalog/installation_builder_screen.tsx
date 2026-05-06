import { useState, useEffect, useMemo, useCallback } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import './catalog_screen.css'
import './installation_builder.css'

// ─── Types (match backend response) ────────────────────────
interface ProductOption {
  key: string
  productId: string
  productName: string
  price: number
  category: string
  defaultQty: number
  minQty: number
  maxQty: number
  available: boolean
  rigid: boolean
}

interface ProductSlot {
  key: string
  options: ProductOption[]
  isClubbed: boolean
}

interface Setup {
  key: string
  name: string
  products: ProductSlot[]
}

interface Category {
  key: string
  name: string
  setups: Setup[]
}

interface CatalogProduct {
  id: string
  name: string
  category: string
  group: string
  price: number
  status: string
}

// ─── Helpers ────────────────────────────────────────────────
function fmt(n: number): string { return `₹${n.toLocaleString('en-IN')}` }

function setupTotal(s: Setup): number {
  return s.products.reduce((sum, p) => {
    const opt = p.options[0]
    return sum + (opt ? opt.price * opt.defaultQty : 0)
  }, 0)
}

function categoryTotal(c: Category): number {
  return c.setups.reduce((sum, s) => sum + setupTotal(s), 0)
}

// ─── Product Search Modal ───────────────────────────────────
function ProductSearchModal({ onSelect, onClose }: {
  onSelect: (product: CatalogProduct) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogProduct[]>([])
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminDatasource.fetchInstallationProducts('').then((products) => {
      setAllProducts(products)
      setResults(products)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults(allProducts)
    } else {
      const q = query.toLowerCase()
      setResults(allProducts.filter(p =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      ))
    }
  }, [query, allProducts])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card ib-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Product from Catalog</h2>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="ib-search-input-wrap">
          <input
            autoFocus
            placeholder="Search by name, ID, or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ib-search-input"
          />
        </div>
        <div className="ib-search-results">
          {loading ? (
            <p className="ib-empty">Loading products...</p>
          ) : results.length === 0 ? (
            <p className="ib-empty">No products found</p>
          ) : (
            results.slice(0, 30).map((p) => (
              <button key={p.id} className="ib-search-result" onClick={() => onSelect(p)}>
                <div className="ib-sr-left">
                  <span className="ib-sr-name">{p.name}</span>
                  <span className="ib-sr-meta">{p.id} · {p.category} · {p.group}</span>
                </div>
                <span className="ib-sr-price">{fmt(p.price)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Screen ────────────────────────────────────────────
export default function InstallationBuilderScreen() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [expandedSetups, setExpandedSetups] = useState<Set<string>>(new Set())
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set())
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  // Modals
  const [showProductSearch, setShowProductSearch] = useState<{ categoryKey: string; setupKey: string } | null>(null)
  const [showClubSearch, setShowClubSearch] = useState<{ categoryKey: string; setupKey: string; productKey: string } | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSetup, setShowAddSetup] = useState<string | null>(null) // categoryKey
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedForClubbing, setSelectedForClubbing] = useState<Record<string, Set<string>>>({})
  const [sortField, setSortField] = useState<'productName' | 'price' | 'defaultQty' | 'key'>('key')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const loadData = useCallback(async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminDatasource.getInstallationAdminConfig()
      setCategories(data.categories as Category[])
      if (data.categories.length > 0 && expandedCats.size === 0) {
        setExpandedCats(new Set([String(data.categories[0].key)]))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => { loadData() }, [loadData])

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set)
    next.has(key) ? next.delete(key) : next.add(key)
    setter(next)
  }

  const toggleSelection = (setupId: string, productKey: string) => {
    setSelectedForClubbing(prev => {
      const set = new Set(prev[setupId] || [])
      set.has(productKey) ? set.delete(productKey) : set.add(productKey)
      return { ...prev, [setupId]: set }
    })
  }

  const toggleSelectAll = (setupId: string, products: ProductSlot[]) => {
    setSelectedForClubbing(prev => {
      const current = prev[setupId] || new Set()
      if (current.size === products.length && products.length > 0) {
        return { ...prev, [setupId]: new Set() }
      }
      return { ...prev, [setupId]: new Set(products.map(p => p.key)) }
    })
  }

  const handleSort = (field: 'productName' | 'price' | 'defaultQty' | 'key') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // ─── CRUD Handlers ───────────────────────────────────────
  const addCategory = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await adminDatasource.installationAddCategory(newName.trim())
      setShowAddCategory(false)
      setNewName('')
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const deleteCategory = async (key: string) => {
    if (!confirm(`Delete category "${key}" and ALL its setups/products?`)) return
    setSaving(true)
    try {
      await adminDatasource.installationDeleteCategory(key)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const addSetup = async (categoryKey: string) => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await adminDatasource.installationAddSetup(categoryKey, newName.trim())
      setShowAddSetup(null)
      setNewName('')
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const deleteSetup = async (categoryKey: string, setupKey: string) => {
    if (!confirm(`Delete setup "${setupKey}" and all its products?`)) return
    setSaving(true)
    try {
      await adminDatasource.installationDeleteSetup(categoryKey, setupKey)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const addProduct = async (categoryKey: string, setupKey: string, product: CatalogProduct) => {
    setSaving(true)
    try {
      await adminDatasource.installationAddProduct(categoryKey, setupKey, product.id)
      setShowProductSearch(null)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const deleteProduct = async (categoryKey: string, setupKey: string, productKey: string) => {
    if (!confirm(`Remove "${productKey}" from this setup?`)) return
    setSaving(true)
    try {
      await adminDatasource.installationDeleteProduct(categoryKey, setupKey, productKey)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const bulkDeleteProducts = async (categoryKey: string, setupKey: string) => {
    const setupId = `${categoryKey}::${setupKey}`
    const selected = Array.from(selectedForClubbing[setupId] || [])
    if (selected.length === 0) return
    if (!confirm(`Remove ${selected.length} products from this setup?`)) return
    setSaving(true)
    try {
      for (const productKey of selected) {
        await adminDatasource.installationDeleteProduct(categoryKey, setupKey, productKey)
      }
      setSelectedForClubbing(prev => ({ ...prev, [setupId]: new Set() }))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const addClubOption = async (categoryKey: string, setupKey: string, productKey: string, product: CatalogProduct) => {
    setSaving(true)
    try {
      await adminDatasource.installationAddClubOption(categoryKey, setupKey, productKey, product.id)
      setShowClubSearch(null)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const deleteClubOption = async (categoryKey: string, setupKey: string, productKey: string, optionKey: string) => {
    if (!confirm(`Remove option "${optionKey}" from club?`)) return
    setSaving(true)
    try {
      await adminDatasource.installationDeleteClubOption(categoryKey, setupKey, productKey, optionKey)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handleClubSelected = async (categoryKey: string, setupKey: string) => {
    const setupId = `${categoryKey}::${setupKey}`
    const selected = Array.from(selectedForClubbing[setupId] || [])
    if (selected.length < 2) {
      setError('Select at least 2 products to club')
      return
    }
    setSaving(true)
    try {
      await adminDatasource.installationClubExisting(categoryKey, setupKey, selected)
      setSelectedForClubbing(prev => ({ ...prev, [setupId]: new Set() }))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const editQty = async (catKey: string, setupKey: string, prodKey: string, optKey: string, type: 'defaultQty'|'minQty'|'maxQty', current: number) => {
    const v = prompt(`Enter new ${type}:`, String(current))
    if (v === null) return
    const num = Number(v)
    if (isNaN(num) || num < 0) return
    setSaving(true)
    try {
       await adminDatasource.installationUpdateQuantities(catKey, setupKey, prodKey, optKey, { [type]: num })
       await loadData()
    } catch(err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const editPrice = async (productId: string, current: number) => {
    const v = prompt(`Edit price for ${productId} in master catalog:`, String(current))
    if (v === null) return
    const num = Number(v)
    if (isNaN(num) || num < 0) return
    setSaving(true)
    try {
       await adminDatasource.installationUpdateProductPrice(productId, num)
       await loadData()
    } catch(err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  // ─── Stats ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const cats = categories.length
    const setups = categories.reduce((s, c) => s + c.setups.length, 0)
    const products = categories.reduce((s, c) => c.setups.reduce((s2, g) => s2 + g.products.length, s), 0)
    const clubs = categories.reduce((s, c) => c.setups.reduce((s2, g) => s2 + g.products.filter(p => p.isClubbed).length, s), 0)
    const totalValue = categories.reduce((s, c) => s + categoryTotal(c), 0)
    return { cats, setups, products, clubs, totalValue }
  }, [categories])

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div>
          <h1>Installation Builder</h1>
          <p className="catalog-subtitle">Manage installation categories, setups, product mappings, and clubbed options — all synced to your database.</p>
        </div>
        <div className="catalog-actions">
          <button className="primary-btn" onClick={() => { setShowAddCategory(true); setNewName('') }}>+ Add Category</button>
        </div>
      </div>

      {error && <div className="catalog-error">{error} <button className="icon-btn" onClick={() => setError(null)}>×</button></div>}

      {isLoading ? (
        <div className="catalog-loading">Loading installation configuration from database...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="ib-stats-bar">
            <div className="ib-stat"><span className="ib-stat-value">{stats.cats}</span><span className="ib-stat-label">Categories</span></div>
            <div className="ib-stat"><span className="ib-stat-value">{stats.setups}</span><span className="ib-stat-label">Setups</span></div>
            <div className="ib-stat"><span className="ib-stat-value">{stats.products}</span><span className="ib-stat-label">Products</span></div>
            <div className="ib-stat"><span className="ib-stat-value">{stats.clubs}</span><span className="ib-stat-label">Clubbed</span></div>
            <div className="ib-stat highlight"><span className="ib-stat-value">{fmt(stats.totalValue)}</span><span className="ib-stat-label">Total Value</span></div>
          </div>

          {/* Tree */}
          <div className="ib-tree">
            {categories.length === 0 ? (
              <div className="ib-empty-state"><p>No installation categories found. Click "+ Add Category" to create one.</p></div>
            ) : categories.map((cat) => {
              const catOpen = expandedCats.has(cat.key)
              return (
                <div key={cat.key} className={`ib-category-card ${catOpen ? 'open' : ''}`}>
                  <div className="ib-category-header">
                    <button className="ib-category-toggle" onClick={() => toggle(expandedCats, cat.key, setExpandedCats)} type="button">
                      <span className={`ib-chevron ${catOpen ? 'open' : ''}`}>▶</span>
                      <span className="ib-category-name">{cat.name}</span>
                      <span className="ib-badge secondary">{cat.setups.length} setup{cat.setups.length !== 1 ? 's' : ''}</span>
                    </button>
                    <div className="ib-header-actions">
                      <span className="ib-category-price">{fmt(categoryTotal(cat))}</span>
                      <button className="icon-btn danger" onClick={() => deleteCategory(cat.key)} title="Delete category">🗑️</button>
                    </div>
                  </div>

                  {catOpen && (
                    <div className="ib-category-body">
                      <div className="ib-section-actions">
                        <button className="secondary-btn" onClick={() => { setShowAddSetup(cat.key); setNewName('') }}>+ Add Setup</button>
                      </div>

                      {cat.setups.length === 0 ? (
                        <p className="ib-empty">No setups. Click "+ Add Setup" to create one.</p>
                      ) : cat.setups.map((setup) => {
                        const sKey = `${cat.key}::${setup.key}`
                        const setupOpen = expandedSetups.has(sKey)
                        return (
                          <div key={setup.key} className={`ib-setup-card ${setupOpen ? 'open' : ''}`}>
                            <div className="ib-setup-header">
                              <button className="ib-setup-toggle" onClick={() => toggle(expandedSetups, sKey, setExpandedSetups)} type="button">
                                <span className={`ib-chevron ${setupOpen ? 'open' : ''}`}>▶</span>
                                <span className="ib-setup-name">{setup.name}</span>
                                <span className="ib-badge">{setup.products.length} product{setup.products.length !== 1 ? 's' : ''}</span>
                              </button>
                              <div className="ib-header-actions">
                                <span className="ib-setup-price">{fmt(setupTotal(setup))}</span>
                                <button className="icon-btn danger" onClick={() => deleteSetup(cat.key, setup.key)} title="Delete setup">🗑️</button>
                              </div>
                            </div>

                            {setupOpen && (
                              <div className="ib-setup-body">
                                <div className="ib-section-actions">
                                  <button className="secondary-btn" onClick={() => setShowProductSearch({ categoryKey: cat.key, setupKey: setup.key })}>+ Add Product</button>
                                  {(selectedForClubbing[sKey]?.size || 0) >= 2 && (
                                    <button className="secondary-btn" onClick={() => handleClubSelected(cat.key, setup.key)}>🔗 Club Selected</button>
                                  )}
                                  {(selectedForClubbing[sKey]?.size || 0) > 0 && (
                                    <button className="secondary-btn danger" onClick={() => bulkDeleteProducts(cat.key, setup.key)}>🗑️ Delete Selected</button>
                                  )}
                                </div>

                                {setup.products.length === 0 ? (
                                  <p className="ib-empty">No products. Click "+ Add Product" to add from catalog.</p>
                                ) : (
                                  <table className="catalog-table ib-product-table">
                                    <thead>
                                      <tr>
                                        <th style={{ width: '40px' }}>
                                          <input 
                                            type="checkbox" 
                                            checked={setup.products.length > 0 && (selectedForClubbing[sKey]?.size || 0) === setup.products.length} 
                                            onChange={() => toggleSelectAll(sKey, setup.products)} 
                                          />
                                        </th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('productName')}>Product {sortField === 'productName' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="num" style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>Price {sortField === 'price' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="num" style={{ cursor: 'pointer' }} onClick={() => handleSort('defaultQty')}>Def Qty {sortField === 'defaultQty' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                                        <th className="num">Min</th>
                                        <th className="num">Max</th>
                                        <th className="num">Amount</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...setup.products].sort((a, b) => {
                                        const optA = a.options[0] || {}
                                        const optB = b.options[0] || {}
                                        let aVal = sortField === 'productName' ? (optA.productName || optA.productId || a.key) : optA[sortField as keyof ProductOption] || a.key
                                        let bVal = sortField === 'productName' ? (optB.productName || optB.productId || b.key) : optB[sortField as keyof ProductOption] || b.key
                                        
                                        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
                                        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
                                        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
                                        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
                                        return 0
                                      }).map((slot) => {
                                        if (!slot.isClubbed) {
                                          // Regular product row
                                          const opt = slot.options[0]
                                          if (!opt) return null
                                          return (
                                            <tr key={slot.key} className="ib-product-row">
                                              <td>
                                                <input type="checkbox" checked={selectedForClubbing[sKey]?.has(slot.key) || false} onChange={() => toggleSelection(sKey, slot.key)} />
                                              </td>
                                              <td>
                                                <div className="product-main">
                                                  <span className="product-name">{opt.productName || opt.productId}</span>
                                                  <span className="product-id">{opt.productId} · {slot.key}</span>
                                                </div>
                                              </td>
                                              <td className="num"><button className="link-btn" onClick={() => editPrice(opt.productId, opt.price)}>{fmt(opt.price)}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, slot.key, opt.key, 'defaultQty', opt.defaultQty)}>{opt.defaultQty}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, slot.key, opt.key, 'minQty', opt.minQty)}>{opt.minQty}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, slot.key, opt.key, 'maxQty', opt.maxQty)}>{opt.maxQty}</button></td>
                                              <td className="num total">{fmt(opt.price * opt.defaultQty)}</td>
                                              <td>
                                                <button className="icon-btn danger" onClick={() => deleteProduct(cat.key, setup.key, slot.key)} title="Remove product">🗑️</button>
                                              </td>
                                            </tr>
                                          )
                                        }

                                        // Clubbed product
                                        const clubId = `${cat.key}::${setup.key}::${slot.key}`
                                        const clubOpen = expandedClubs.has(clubId)
                                        return [
                                          <tr key={slot.key} className="ib-product-row ib-clubbed-header-row">
                                            <td>
                                              <input type="checkbox" checked={selectedForClubbing[sKey]?.has(slot.key) || false} onChange={() => toggleSelection(sKey, slot.key)} />
                                            </td>
                                            <td>
                                              <button className="ib-club-toggle" onClick={() => toggle(expandedClubs, clubId, setExpandedClubs)} type="button">
                                                <span className={`ib-chevron ${clubOpen ? 'open' : ''}`}>▶</span>
                                                <div className="product-main">
                                                  <span className="product-name">
                                                    {slot.key} <span className="ib-badge club">🔗 {slot.options.length} options</span>
                                                  </span>
                                                  <span className="product-id">Clubbed — customer selects one</span>
                                                </div>
                                              </button>
                                            </td>
                                            <td className="num">—</td>
                                            <td className="num">—</td>
                                            <td className="num">—</td>
                                            <td className="num">—</td>
                                            <td className="num total">{fmt(slot.options[0]?.price * (slot.options[0]?.defaultQty || 1) || 0)}</td>
                                            <td>
                                              <button className="icon-btn" onClick={() => setShowClubSearch({ categoryKey: cat.key, setupKey: setup.key, productKey: slot.key })} title="Add option">+ Option</button>
                                              <button className="icon-btn danger" onClick={() => deleteProduct(cat.key, setup.key, slot.key)} title="Remove entire club">🗑️</button>
                                            </td>
                                          </tr>,
                                          ...(clubOpen ? slot.options.map((opt) => (
                                            <tr key={`${slot.key}-${opt.key}`} className="ib-product-row ib-club-option-row">
                                              <td></td>
                                              <td>
                                                <div className="product-main" style={{ paddingLeft: 32 }}>
                                                  <span className="product-name">↳ {opt.productName || opt.productId}</span>
                                                  <span className="product-id">{opt.productId} · {opt.key}</span>
                                                </div>
                                              </td>
                                              <td className="num"><button className="link-btn" onClick={() => editPrice(opt.productId, opt.price)}>{fmt(opt.price)}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, slot.key, opt.key, 'defaultQty', opt.defaultQty)}>{opt.defaultQty}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, slot.key, opt.key, 'minQty', opt.minQty)}>{opt.minQty}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, slot.key, opt.key, 'maxQty', opt.maxQty)}>{opt.maxQty}</button></td>
                                              <td className="num">{fmt(opt.price * opt.defaultQty)}</td>
                                              <td>
                                                <button className="icon-btn danger" onClick={() => deleteClubOption(cat.key, setup.key, slot.key, opt.key)} title="Remove this option">✕</button>
                                              </td>
                                            </tr>
                                          )) : [])
                                        ]
                                      })}
                                    </tbody>
                                    <tfoot>
                                      <tr className="ib-total-row">
                                        <td colSpan={6}><strong>Setup Total</strong></td>
                                        <td className="num total"><strong>{fmt(setupTotal(setup))}</strong></td>
                                        <td></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Category</h2><button className="icon-btn" onClick={() => setShowAddCategory(false)}>×</button></div>
            <div className="modal-body">
              <label>Category Name <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. IP Camera" onKeyDown={(e) => e.key === 'Enter' && addCategory()} /></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddCategory(false)}>Cancel</button>
              <button className="primary-btn" onClick={addCategory} disabled={saving}>{saving ? 'Creating...' : 'Create Category'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Setup Modal */}
      {showAddSetup && (
        <div className="modal-overlay" onClick={() => setShowAddSetup(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Setup to "{showAddSetup}"</h2><button className="icon-btn" onClick={() => setShowAddSetup(null)}>×</button></div>
            <div className="modal-body">
              <label>Setup Name <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. 4 Camera Set" onKeyDown={(e) => e.key === 'Enter' && addSetup(showAddSetup)} /></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddSetup(null)}>Cancel</button>
              <button className="primary-btn" onClick={() => addSetup(showAddSetup)} disabled={saving}>{saving ? 'Creating...' : 'Create Setup'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Search (add product to setup) */}
      {showProductSearch && (
        <ProductSearchModal
          onClose={() => setShowProductSearch(null)}
          onSelect={(p) => addProduct(showProductSearch.categoryKey, showProductSearch.setupKey, p)}
        />
      )}

      {/* Club Search (add option to existing product) */}
      {showClubSearch && (
        <ProductSearchModal
          onClose={() => setShowClubSearch(null)}
          onSelect={(p) => addClubOption(showClubSearch.categoryKey, showClubSearch.setupKey, showClubSearch.productKey, p)}
        />
      )}
    </div>
  )
}
