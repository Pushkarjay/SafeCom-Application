import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { useServicesStore } from '@core/services/services_store'
import './catalog_screen.css'
import './installation_builder.css'

// ─── Types (match backend recursive tree response) ─────────
interface TreeNode {
  key: string
  isLeaf: boolean
  isField?: boolean
  fieldType?: 'string' | 'number' | 'boolean' | 'reference' | 'map'
  fieldValue?: any
  // Leaf fields
  productId: string
  productName: string
  price: number
  category: string
  defaultQty: number
  minQty: number
  maxQty: number
  available: boolean
  rigid: boolean
  // Branch fields — recursive children
  children: TreeNode[]
  // Render control (Phase 1.2)
  renderType?: 'option' | 'list'
  selectionType?: 'single' | 'multi'
  collectiveValidation?: boolean
  displayLabel?: string
  mandatory?: boolean
  // Dependency engine (Phase 1.5) — auto-map quantity from another product
  dependsOn?: string | null
  // Order field
  _order?: number
}

interface ProductSlot {
  key: string
  options: TreeNode[]
  isClubbed: boolean
  order?: number
  _order?: number
}

interface Setup {
  key: string
  name: string
  products: ProductSlot[]
  active?: boolean
}

interface Category {
  key: string
  name: string
  setups: Setup[]
  active?: boolean
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

/** Replace chars that break URL paths / Firestore document IDs */
function safeKey(s: string): string {
  // Allow dots (for decimals like "2.0 MP") and colons (for MAC addresses).
  // The backend handles dotted keys correctly via setNested()/deleteNested().
  return s.replace(/[\/#?&=%+]+/g, '-').replace(/\s+/g, ' ').trim()
}

function setupTotal(s: Setup): number {
  return s.products.reduce((sum, p) => {
    const opt = p.options[0]
    return sum + (opt ? opt.price * opt.defaultQty : 0)
  }, 0)
}

function categoryTotal(c: Category): number {
  return c.setups.reduce((sum, s) => sum + setupTotal(s), 0)
}

// ─── Product Search Modal (multi-select) ────────────────────
function ProductSearchModal({ onSelect, onSelectMultiple, onClose }: {
  onSelect?: (product: CatalogProduct) => void
  onSelectMultiple?: (products: CatalogProduct[]) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CatalogProduct[]>([])
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    adminDatasource.fetchMasterProducts('').then((products) => {
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

  const visibleResults = results.slice(0, 30)

  const toggleProduct = (id: string) => {
    setSelected(prev => {
      if (!onSelectMultiple) {
        return new Set(prev.has(id) ? [] : [id])
      }
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === visibleResults.length && visibleResults.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visibleResults.map(p => p.id)))
    }
  }

  const handleAddSelected = () => {
    const products = allProducts.filter(p => selected.has(p.id))
    if (products.length === 0) return
    if (onSelectMultiple) {
      onSelectMultiple(products)
    } else if (onSelect && products.length >= 1) {
      onSelect(products[0])
    }
    onClose()
  }

  const handleRowClick = (p: CatalogProduct) => {
    toggleProduct(p.id)
  }

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
            <>
              <div className="ib-search-select-all">
                <label className="ib-select-all-label">
                  <input
                    type="checkbox"
                    checked={visibleResults.length > 0 && selected.size === visibleResults.length}
                    onChange={toggleSelectAll}
                  />
                  <span>Select all {visibleResults.length} shown</span>
                </label>
                <span className="ib-search-count">{selected.size} selected</span>
              </div>
              {visibleResults.map((p) => (
                <div key={p.id} className={`ib-search-result ${selected.has(p.id) ? 'selected' : ''}`} onClick={() => handleRowClick(p)}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginRight: 8 }}
                  />
                  <div className="ib-sr-left">
                    <span className="ib-sr-name">{p.name}</span>
                    <span className="ib-sr-meta">{p.id} · {p.category} · {p.group}</span>
                  </div>
                  <span className="ib-sr-price">{fmt(p.price)}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleAddSelected} disabled={selected.size === 0}>
            Add Selected ({selected.size})
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pending edit type ──────────────────────────────────────
interface PendingEdit {
  type: 'qty' | 'price' | 'renderConfig' | 'dependency' | 'dependency-remove'
  categoryKey: string
  setupKey: string
  nodePath: string[]
  updates?: Record<string, unknown>
}

// ─── Recursive tree update helper ──────────────────────────
function updateNodeInTree(
  nodes: TreeNode[],
  path: string[],
  updater: (node: TreeNode) => TreeNode
): TreeNode[] {
  if (path.length === 0) return nodes
  const [key, ...rest] = path
  return nodes.map(node => {
    if (node.key !== key) return node
    if (rest.length === 0) return updater(node)
    return { ...node, children: updateNodeInTree(node.children, rest, updater) }
  })
}

function updateProductSlot(
  slots: ProductSlot[],
  slotKey: string,
  subPath: string[],
  updater: (node: TreeNode) => TreeNode
): ProductSlot[] {
  return slots.map(slot => {
    if (slot.key !== slotKey) return slot
    return { ...slot, options: updateNodeInTree(slot.options, subPath, updater) }
  })
}

// ─── Main Screen ────────────────────────────────────────────
export default function ServiceTreeBuilderScreen() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [expandedSetups, setExpandedSetups] = useState<Set<string>>(new Set())
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set())
  const firebaseUser = useAuthStore((state) => state.firebaseUser)
  const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([])
  const hasUnsavedChanges = pendingEdits.length > 0

  // Clipboard for copy-paste — stores source keys for deep Firestore-level clone
  const [clipboard, setClipboard] = useState<{
    type: 'setup';
    label: string;
    data: { sourceCategoryKey: string; sourceSetupKey: string };
  } | {
    type: 'node';
    label: string;
    data: { sourceCategoryKey: string; sourceSetupKey: string; sourceNodePath: string[] };
  } | null>(null)

  /** Collect all leaf product IDs from a setup's product slots */
  const collectLeafIds = useCallback((slots: ProductSlot[]): string[] => {
    const ids: string[] = []
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.isLeaf && n.productId) ids.push(n.productId)
        else walk(n.children)
      }
    }
    for (const s of slots) walk(s.options)
    return ids
  }, [])

  // Modals
  const [showProductSearch, setShowProductSearch] = useState<{ categoryKey: string; setupKey: string } | null>(null)
  const [showClubSearch, setShowClubSearch] = useState<{ categoryKey: string; setupKey: string; nodePath: string[] } | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSetup, setShowAddSetup] = useState<string | null>(null) // categoryKey
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedForClubbing, setSelectedForClubbing] = useState<Record<string, Set<string>>>({})
  const [selectedNested, setSelectedNested] = useState<Record<string, Set<string>>>({})
  const [sortField, setSortField] = useState<'productName' | 'price' | 'defaultQty' | 'key'>('key')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  // Dependency engine modal
  const [showDepModal, setShowDepModal] = useState<{
    categoryKey: string
    setupKey: string
    nodePath: string[]
    node: TreeNode
    allSlots: ProductSlot[]
  } | null>(null)
  // Category edit modal for rename + service mapping
  const [showCategoryEdit, setShowCategoryEdit] = useState<{ key: string; currentMapping: string[] } | null>(null)
  const servicesList = useServicesStore((state) => state.services)

  const loadData = useCallback(async () => {
    if (!firebaseUser || !serviceId) return
    setIsLoading(true)
    setError(null)
    try {
      // Save current order so ⬆⬇ arrangement survives reload
      const catOrder = categories.map(c => c.key)
      const setupOrder: Record<string, string[]> = {}
      categories.forEach(c => { setupOrder[c.key] = c.setups.map(s => s.key) })

      const data = await adminDatasource.getServiceConfig(serviceId)
      // Normalize: category-level branches (from +Branch with empty setupKey)
      // are stored as setup entries with `children` instead of `products`.
      // Wrap them as a single clubbed ProductSlot so the tree renders correctly.
      let normalized = (data.categories as any[]).map((cat: any) => ({
        ...cat,
        setups: (cat.setups || []).map((s: any) => {
          if (!Array.isArray(s.products) && Array.isArray(s.children)) {
            return { ...s, products: [{ key: s.key, isClubbed: true, options: s.children }] }
          }
          if (!Array.isArray(s.products)) {
            return { ...s, products: [] }
          }
          return s
        })
      }))
      // Restore previous category order (new ones appended at bottom)
      if (catOrder.length > 0) {
        normalized.sort((a, b) => {
          const ai = catOrder.indexOf(a.key)
          const bi = catOrder.indexOf(b.key)
          if (ai === -1 && bi === -1) return 0
          if (ai === -1) return 1
          if (bi === -1) return -1
          return ai - bi
        })
        // Restore setup order within each category
        normalized = normalized.map((cat: any) => {
          const saved = setupOrder[cat.key]
          if (!saved || saved.length === 0) return cat
          return {
            ...cat,
            setups: [...cat.setups].sort((a: any, b: any) => {
              const ai = saved.indexOf(a.key)
              const bi = saved.indexOf(b.key)
              if (ai === -1 && bi === -1) return 0
              if (ai === -1) return 1
              if (bi === -1) return -1
              return ai - bi
            })
          }
        })
      }
      setCategories(normalized as Category[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser, serviceId])

  useEffect(() => { loadData() }, [loadData])

  // Fetch services list for service mapping dropdown
  const { fetchServices } = useServicesStore()
  useEffect(() => { fetchServices() }, [fetchServices])

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
    if (!newName.trim() || !serviceId) return
    const name = safeKey(newName.trim())
    const optimistic: Category = { key: name, name, setups: [] }
    setCategories(prev => [...prev, optimistic])
    setShowAddCategory(false)
    setNewName('')
    setSaving(true)
    try {
      await adminDatasource.serviceAddCategory(serviceId, name)
      await loadData()
    } catch (err) {
      setCategories(prev => prev.filter(c => c.key !== name))
      setError(err instanceof Error ? err.message : 'Failed')
    }
    finally { setSaving(false) }
  }

  const deleteCategory = async (key: string) => {
    if (!serviceId) return
    if (!confirm(`Delete category "${key}" and ALL its setups/products?`)) return
    setSaving(true)
    try {
      await adminDatasource.serviceDeleteCategory(serviceId, key)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const addSetup = async (categoryKey: string) => {
    if (!newName.trim() || !serviceId) return
    const name = safeKey(newName.trim())
    const optimistic: Setup = { key: name, name, products: [] }
    setCategories(prev => prev.map(cat =>
      cat.key === categoryKey ? { ...cat, setups: [...cat.setups, optimistic] } : cat
    ))
    setShowAddSetup(null)
    setNewName('')
    setSaving(true)
    try {
      await adminDatasource.serviceAddSetup(serviceId, categoryKey, name)
      await loadData()
    } catch (err) {
      setCategories(prev => prev.map(cat =>
        cat.key === categoryKey ? { ...cat, setups: cat.setups.filter(s => s.key !== name) } : cat
      ))
      setError(err instanceof Error ? err.message : 'Failed')
    }
    finally { setSaving(false) }
  }

  const deleteSetup = async (categoryKey: string, setupKey: string) => {
    if (!serviceId) return
    if (!confirm(`Delete setup "${setupKey}" and all its products?`)) return
    setSaving(true)
    try {
      await adminDatasource.serviceDeleteSetup(serviceId, categoryKey, setupKey)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const addProducts = async (categoryKey: string, setupKey: string, products: CatalogProduct[]) => {
    if (!serviceId || products.length === 0) return
    setSaving(true)
    setError(null)
    try {
      for (const product of products) {
        await adminDatasource.serviceAddProduct(serviceId, categoryKey, setupKey, product.id)
      }
      setShowProductSearch(null)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add products') }
    finally { setSaving(false) }
  }

  const deleteProduct = async (categoryKey: string, setupKey: string, productKey: string) => {
    if (!serviceId) return
    if (!confirm(`Remove "${productKey}" from this setup?`)) return
    setSaving(true)
    try {
      await adminDatasource.serviceDeleteProduct(serviceId, categoryKey, setupKey, productKey)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const bulkDeleteProducts = async (categoryKey: string, setupKey: string) => {
    if (!serviceId) return
    const setupId = `${categoryKey}::${setupKey}`
    const selected = Array.from(selectedForClubbing[setupId] || [])
    if (selected.length === 0) return
    if (!confirm(`Remove ${selected.length} products from this setup?`)) return
    setSaving(true)
    try {
      for (const productKey of selected) {
        await adminDatasource.serviceDeleteProduct(serviceId, categoryKey, setupKey, productKey)
      }
      setSelectedForClubbing(prev => ({ ...prev, [setupId]: new Set() }))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const clubSelected = async (categoryKey: string, setupKey: string, nodePath?: string[]) => {
    if (!serviceId) return
    const setupId = `${categoryKey}::${setupKey}`
    let selected: string[]
    if (nodePath && nodePath.length > 0) {
      const parentKey = `${setupId}::${nodePath.join('::')}`
      selected = Array.from(selectedNested[parentKey] || [])
    } else {
      selected = Array.from(selectedForClubbing[setupId] || [])
    }
    if (selected.length < 2) return
    const groupName = prompt(`Enter group name for ${selected.length} items:`, 'Product Group')
    if (!groupName?.trim()) return
    setSaving(true)
    try {
      await adminDatasource.serviceClubProducts(serviceId, categoryKey, setupKey, safeKey(groupName.trim()), selected, nodePath)
      setSelectedForClubbing(prev => ({ ...prev, [setupId]: new Set() }))
      setSelectedNested(prev => {
        const parentKey = `${setupId}::${(nodePath || []).join('::')}`
        return { ...prev, [parentKey]: new Set() }
      })
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const addClubOption = async (categoryKey: string, setupKey: string, nodePath: string[], product: CatalogProduct) => {
    if (!serviceId) return
    setSaving(true)
    try {
      await adminDatasource.serviceAddNode(serviceId, categoryKey, setupKey, nodePath, product.id)
      setShowClubSearch(null)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const deleteClubOption = async (categoryKey: string, setupKey: string, nodePath: string[]) => {
    if (!serviceId) return
    const nodeName = nodePath[nodePath.length - 1]
    if (!confirm(`Remove option "${nodeName}" from club?`)) return
    setSaving(true)
    try {
      await adminDatasource.serviceDeleteNode(serviceId, categoryKey, setupKey, nodePath)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const addBranch = async (categoryKey: string, setupKey: string, nodePath: string[]) => {
    if (!serviceId) return
    const name = prompt('Enter branch/group name (e.g. "2.4 MP", "Colour", "Indoor"):')
    if (!name?.trim()) return
    setSaving(true)
    try {
      await adminDatasource.serviceAddBranch(serviceId, categoryKey, setupKey, nodePath, safeKey(name.trim()))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const renameNode = async (categoryKey: string, setupKey: string, nodePath: string[]) => {
    if (!serviceId) return
    const oldName = nodePath[nodePath.length - 1]
    const newName = prompt(`Enter new name for "${oldName}":`, oldName)
    if (!newName?.trim() || newName === oldName) return
    setSaving(true)
    try {
      await adminDatasource.serviceRenameNode(serviceId, categoryKey, setupKey, nodePath, safeKey(newName.trim()))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const renameCategory = async (oldName: string) => {
    if (!serviceId) return
    const newName = prompt(`Rename category "${oldName}" to:`, oldName)
    if (!newName?.trim() || newName === oldName) return
    setSaving(true)
    try {
      await adminDatasource.serviceRenameCategory(serviceId, oldName, safeKey(newName.trim()))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const openCategoryEdit = async (categoryKey: string) => {
    // Fetch current service mapping for this category
    try {
      const config = await adminDatasource.getServiceConfig(serviceId!)
      const cat = config.categories.find((c: any) => c.key === categoryKey)
      const mapping = Array.isArray((cat as any)?._serviceMapping) ? (cat as any)._serviceMapping : []
      setShowCategoryEdit({ key: categoryKey, currentMapping: mapping })
    } catch {
      setShowCategoryEdit({ key: categoryKey, currentMapping: [] })
    }
  }

  const saveServiceMapping = async (categoryKey: string, serviceTypes: string[]) => {
    if (!serviceId) return
    setSaving(true)
    try {
      await adminDatasource.serviceSetCategoryServiceMapping(serviceId, categoryKey, serviceTypes)
      setShowCategoryEdit(null)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const renameSetup = async (catKey: string, oldName: string) => {
    if (!serviceId) return
    const newName = prompt(`Rename setup "${oldName}" to:`, oldName)
    if (!newName?.trim() || newName === oldName) return
    setSaving(true)
    try {
      await adminDatasource.serviceRenameSetup(serviceId, catKey, oldName, safeKey(newName.trim()))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const editQty = async (catKey: string, setupKey: string, nodePath: string[], type: 'defaultQty'|'minQty'|'maxQty', current: number) => {
    if (!serviceId) return
    const v = prompt(`Enter new ${type}:`, String(current))
    if (v === null) return
    const num = Number(v)
    if (isNaN(num) || num < 0) return
    // Update local state immediately
    setCategories(prev => {
      const slotKey = nodePath[0]
      const subPath = nodePath.slice(1)
      return prev.map(cat => {
        if (cat.key !== catKey) return cat
        if (!setupKey) return cat
        return {
          ...cat,
          setups: cat.setups.map(setup => {
            if (setup.key !== setupKey) return setup
            return {
              ...setup,
              products: updateProductSlot(setup.products, slotKey, subPath, node => ({
                ...node,
                [type]: num
              }))
            }
          })
        }
      })
    })
    // Track pending change
    setPendingEdits(prev => {
      const filtered = prev.filter(e =>
        !(e.type === 'qty' && e.categoryKey === catKey && e.setupKey === setupKey && JSON.stringify(e.nodePath) === JSON.stringify(nodePath))
      )
      return [...filtered, { type: 'qty', categoryKey: catKey, setupKey, nodePath, updates: { [type]: num } }]
    })
  }

  const editRenderConfig = async (catKey: string, setupKey: string, nodePath: string[], node: TreeNode) => {
    if (!serviceId) return
    const currentRenderType = node.renderType || 'option'
    const currentSelectionType = node.selectionType || 'single'
    const currentCollective = node.collectiveValidation || false
    const currentMandatory = node.mandatory !== false

    const renderTypeMap: Record<string, 'option' | 'list'> = { option: 'option', list: 'list' }
    const selectionTypeMap: Record<string, 'single' | 'multi'> = { single: 'single', multi: 'multi' }

    const renderOpts = Object.keys(renderTypeMap).join(', ')
    const selOpts = Object.keys(selectionTypeMap).join(', ')

    const choice = prompt(`Configure "${node.key}":\n1 = Render Type (current: ${currentRenderType}, options: ${renderOpts})\n2 = Selection Type (current: ${currentSelectionType}, options: ${selOpts})\n3 = Collective Validation (current: ${currentCollective})\n4 = Mandatory (current: ${currentMandatory})\n\nEnter 1, 2, 3, 4 or cancel:`)
    if (choice === null) return

    const updates: { renderType?: 'option' | 'list'; selectionType?: 'single' | 'multi'; collectiveValidation?: boolean; mandatory?: boolean } = {}
    if (choice.includes('1')) {
      const rt = prompt(`Render Type (${renderOpts}):`, currentRenderType)
      if (rt && (rt === 'option' || rt === 'list')) updates.renderType = rt
    }
    if (choice.includes('2')) {
      const st = prompt(`Selection Type (${selOpts}):`, currentSelectionType)
      if (st && (st === 'single' || st === 'multi')) updates.selectionType = st
    }
    if (choice.includes('3')) {
      const cv = prompt(`Collective Validation (true/false):`, String(currentCollective))
      if (cv === 'true') updates.collectiveValidation = true
      else if (cv === 'false') updates.collectiveValidation = false
    }
    if (choice.includes('4')) {
      const m = prompt(`Mandatory (true/false):`, String(currentMandatory))
      if (m === 'true') updates.mandatory = true
      else if (m === 'false') updates.mandatory = false
    }

    if (Object.keys(updates).length === 0) return
    // Update local state immediately
    setCategories(prev => {
      const slotKey = nodePath[0]
      const subPath = nodePath.slice(1)
      return prev.map(cat => {
        if (cat.key !== catKey) return cat
        if (!setupKey) return cat
        return {
          ...cat,
          setups: cat.setups.map(setup => {
            if (setup.key !== setupKey) return setup
            return {
              ...setup,
              products: updateProductSlot(setup.products, slotKey, subPath, node => ({
                ...node,
                ...updates
              }))
            }
          })
        }
      })
    })
    // Track pending
    setPendingEdits(prev => {
      const filtered = prev.filter(e =>
        !(e.type === 'renderConfig' && e.categoryKey === catKey && e.setupKey === setupKey && JSON.stringify(e.nodePath) === JSON.stringify(nodePath))
      )
      return [...filtered, { type: 'renderConfig', categoryKey: catKey, setupKey, nodePath, updates }]
    })
  }

  const editDependency = (catKey: string, setupKey: string, nodePath: string[], node: TreeNode, allSlots: ProductSlot[]) => {
    setShowDepModal({ categoryKey: catKey, setupKey, nodePath, node, allSlots })
  }

  const saveDependency = async (targetKey: string) => {
    if (!showDepModal || !serviceId) return
    // Update local state immediately
    setCategories(prev => {
      const slotKey = showDepModal.nodePath[0]
      const subPath = showDepModal.nodePath.slice(1)
      return prev.map(cat => {
        if (cat.key !== showDepModal.categoryKey) return cat
        if (!showDepModal.setupKey) return cat
        return {
          ...cat,
          setups: cat.setups.map(setup => {
            if (setup.key !== showDepModal.setupKey) return setup
            return {
              ...setup,
              products: updateProductSlot(setup.products, slotKey, subPath, node => ({
                ...node,
                dependsOn: targetKey
              }))
            }
          })
        }
      })
    })
    setShowDepModal(null)
    // Track pending
    setPendingEdits(prev => {
      const filtered = prev.filter(e =>
        !(e.type === 'dependency' && e.categoryKey === showDepModal.categoryKey && e.setupKey === showDepModal.setupKey && JSON.stringify(e.nodePath) === JSON.stringify(showDepModal.nodePath))
      )
      return [...filtered, { type: 'dependency', categoryKey: showDepModal.categoryKey, setupKey: showDepModal.setupKey, nodePath: showDepModal.nodePath, updates: { dependsOn: targetKey } }]
    })
  }

  const removeDependency = async (catKey: string, setupKey: string, nodePath: string[]) => {
    if (!serviceId || !confirm('Remove this product\'s dependency mapping?')) return
    // Update local state immediately
    setCategories(prev => {
      const slotKey = nodePath[0]
      const subPath = nodePath.slice(1)
      return prev.map(cat => {
        if (cat.key !== catKey) return cat
        if (!setupKey) return cat
        return {
          ...cat,
          setups: cat.setups.map(setup => {
            if (setup.key !== setupKey) return setup
            return {
              ...setup,
              products: updateProductSlot(setup.products, slotKey, subPath, node => ({
                ...node,
                dependsOn: null
              }))
            }
          })
        }
      })
    })
    // Track pending
    setPendingEdits(prev => {
      const filtered = prev.filter(e =>
        !(e.type === 'dependency' && e.categoryKey === catKey && e.setupKey === setupKey && JSON.stringify(e.nodePath) === JSON.stringify(nodePath))
      )
      return [...filtered, { type: 'dependency-remove', categoryKey: catKey, setupKey, nodePath }]
    })
  }

  const editPrice = async (productId: string, current: number) => {
    const v = prompt(`Edit price for ${productId} in master catalog:`, String(current))
    if (v === null) return
    const num = Number(v)
    if (isNaN(num) || num < 0) return
    // Update local state immediately (find all occurrences of this productId across the tree)
    setCategories(prev => prev.map(cat => ({
      ...cat,
      setups: cat.setups.map(setup => ({
        ...setup,
        products: setup.products.map(slot => ({
          ...slot,
          options: updateNodeInTree(slot.options, [], node =>
            node.productId === productId ? { ...node, price: num } : node
          )
        }))
      }))
    })))
    // Track pending (mark all occurrences)
    setPendingEdits(prev => [...prev, { type: 'price', categoryKey: '', setupKey: '', nodePath: [productId], updates: { price: num } }])
  }

  // ─── Save all pending changes to backend ────────────────
  const saveAllChanges = async () => {
    if (!serviceId || pendingEdits.length === 0) return
    setSaving(true)
    setError(null)
    let success = true
    for (const edit of pendingEdits) {
      try {
        switch (edit.type) {
          case 'qty':
            await adminDatasource.serviceUpdateQuantities(serviceId, edit.categoryKey, edit.setupKey, edit.nodePath, edit.updates as any)
            break
          case 'renderConfig':
            await adminDatasource.serviceUpdateRenderConfig(serviceId, edit.categoryKey, edit.setupKey, edit.nodePath, edit.updates as any)
            break
          case 'dependency':
            await adminDatasource.serviceUpdateDependency(serviceId, edit.categoryKey, edit.setupKey, edit.nodePath, String(edit.updates?.dependsOn))
            break
          case 'dependency-remove':
            await adminDatasource.serviceRemoveDependency(serviceId, edit.categoryKey, edit.setupKey, edit.nodePath)
            break
          case 'price':
            await adminDatasource.installationUpdateProductPrice(edit.nodePath[0], edit.updates?.price as number)
            break
        }
      } catch (err) {
        console.error('Save failed for', edit, err)
        success = false
        setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    if (success) {
      setPendingEdits([])
    }
    setSaving(false)
  }

  // ─── Copy / Paste ────────────────────────────────────────
  const copySetup = (catKey: string, setup: Setup) => {
    setClipboard({ type: 'setup', label: setup.name, data: { sourceCategoryKey: catKey, sourceSetupKey: setup.key } })
  }

  const copyNode = (catKey: string, setupKey: string, nodePath: string[]) => {
    const label = nodePath[nodePath.length - 1]
    setClipboard({ type: 'node', label, data: { sourceCategoryKey: catKey, sourceSetupKey: setupKey, sourceNodePath: nodePath } })
  }

  const pasteSetup = async (categoryKey: string) => {
    if (!clipboard || !serviceId) return
    const src = clipboard.data
    const newName = prompt(`Enter name for pasted setup (source: "${clipboard.label}"):`, clipboard.label + ' (Copy)')
    if (!newName?.trim()) return
    setSaving(true)
    setError(null)
    try {
      await adminDatasource.serviceCloneSetup(serviceId, src.sourceCategoryKey, src.sourceSetupKey, categoryKey, newName.trim())
      setClipboard(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to paste')
    } finally {
      setSaving(false)
    }
  }

  const pasteNode = async (categoryKey: string, setupKey: string, destNodePath: string[]) => {
    if (!clipboard || clipboard.type !== 'node' || !serviceId) return
    const src = clipboard.data
    const defaultKey = clipboard.label
    const newKey = prompt(`Enter name for pasted node (source: "${clipboard.label}"):`, safeKey(`Copy of ${defaultKey}`))
    if (!newKey?.trim()) return
    setSaving(true)
    setError(null)
    try {
      await adminDatasource.serviceCloneNode(serviceId, categoryKey, setupKey, src.sourceNodePath, destNodePath, safeKey(newKey.trim()), src.sourceCategoryKey, src.sourceSetupKey)
      setClipboard(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to paste')
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle active status ─────────────────────────────────
  const toggleCategoryActive = async (catKey: string, currentActive: boolean) => {
    if (!serviceId) return
    const newActive = !currentActive
    // Optimistic update
    setCategories(prev => prev.map(c => c.key === catKey ? { ...c, active: newActive } : c))
    setSaving(true)
    try {
      await adminDatasource.serviceToggleActive(serviceId, catKey, null, newActive)
    } catch (err) {
      setCategories(prev => prev.map(c => c.key === catKey ? { ...c, active: currentActive } : c))
      setError(err instanceof Error ? err.message : 'Failed')
    } finally { setSaving(false) }
  }

  const toggleSetupActive = async (catKey: string, setupKey: string, currentActive: boolean) => {
    if (!serviceId) return
    const newActive = !currentActive
    // Optimistic update
    setCategories(prev => prev.map(c => {
      if (c.key !== catKey) return c
      return { ...c, setups: c.setups.map(s => s.key === setupKey ? { ...s, active: newActive } : s) }
    }))
    setSaving(true)
    try {
      await adminDatasource.serviceToggleActive(serviceId, catKey, setupKey, newActive)
    } catch (err) {
      setCategories(prev => prev.map(c => {
        if (c.key !== catKey) return c
        return { ...c, setups: c.setups.map(s => s.key === setupKey ? { ...s, active: currentActive } : s) }
      }))
      setError(err instanceof Error ? err.message : 'Failed')
    } finally { setSaving(false) }
  }

  // ─── Reorder helpers ─────────────────────────────────────
  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    setCategories(prev => {
      const arr = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= arr.length) return prev
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return arr
    })
    // Persist new order to Firestore
    const arr = [...categories]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    try {
      await adminDatasource.serviceReorderBulk(serviceId, arr.map((cat, i) => ({
        categoryKey: cat.key,
        order: i
      })))
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save order') }
  }

  const moveSetup = async (catKey: string, index: number, direction: 'up' | 'down') => {
    setCategories(prev => prev.map(cat => {
      if (cat.key !== catKey) return cat
      const arr = [...cat.setups]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= arr.length) return cat
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return { ...cat, setups: arr }
    }))
    // Persist new order to Firestore
    const cat = categories.find(c => c.key === catKey)
    if (!cat) return
    const arr = [...cat.setups]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    try {
      await adminDatasource.serviceReorderBulk(serviceId, arr.map((setup, i) => ({
        categoryKey: catKey,
        setupKey: setup.key,
        order: i
      })))
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save order') }
  }

  const moveProduct = async (catKey: string, setupKey: string, index: number, direction: 'up' | 'down') => {
    // Get the original (unsorted) array to find correct indices
    const cat = categories.find(c => c.key === catKey)
    if (!cat) return
    const setup = cat.setups.find(s => s.key === setupKey)
    if (!setup) return
    const arr = [...setup.products]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    // Optimistic update
    setCategories(prev => prev.map(c => {
      if (c.key !== catKey) return c
      return { ...c, setups: c.setups.map(s => {
        if (s.key !== setupKey) return s
        const a = [...s.products]
        const t = direction === 'up' ? index - 1 : index + 1
        ;[a[index], a[t]] = [a[t], a[index]]
        return { ...s, products: a }
      })}
    }))
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    try {
      await adminDatasource.serviceReorderBulk(serviceId, arr.map((p, i) => ({
        categoryKey: catKey,
        setupKey,
        productKey: p.key,
        order: i
      })))
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save order') }
  }

  const moveNode = async (catKey: string, setupKey: string, parentPath: string[], siblings: TreeNode[], index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= siblings.length) return
    const nodeA = siblings[index]
    const nodeB = siblings[target]
    const orderA = nodeB._order ?? target
    const orderB = nodeA._order ?? index
    try {
      const pathA = [...parentPath, nodeA.key]
      const pathB = [...parentPath, nodeB.key]
      await Promise.all([
        adminDatasource.serviceSetNodeOrder(serviceId, catKey, setupKey, pathA, orderA),
        adminDatasource.serviceSetNodeOrder(serviceId, catKey, setupKey, pathB, orderB),
      ])
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save order') }
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

  // ─── Recursive tree helpers ─────────────────────────────
  function countLeaves(nodes: TreeNode[]): number {
    return nodes.reduce((sum, n) => n.isLeaf ? sum + 1 : sum + countLeaves(n.children), 0)
  }

  function countRealLeaves(nodes: TreeNode[]): number {
    return nodes.reduce((sum, n) => {
      if (n.isLeaf && n.productId) return sum + 1
      if (!n.isLeaf && !n.isField) return sum + countRealLeaves(n.children)
      return sum
    }, 0)
  }

  function countBranches(nodes: TreeNode[]): number {
    return nodes.filter(n => !n.isLeaf && !n.isField).length
  }

  /** Validate that sum of leaf maxQty >= branch maxQty for LIST render groups */
  function getProductSlotWarnings(slot: ProductSlot): string[] {
    const warnings: string[] = []
    function checkBranch(nodes: TreeNode[], parentMaxQty: number) {
      const leaves = nodes.filter(n => n.isLeaf)
      if (leaves.length > 0 && parentMaxQty > 0) {
        const sumMax = leaves.reduce((s, l) => s + l.maxQty, 0)
        if (sumMax < parentMaxQty) {
          warnings.push(`Leaf max total (${sumMax}) < group max (${parentMaxQty}) — collective limit unattainable`)
        }
      }
      for (const n of nodes) {
        if (!n.isLeaf && !n.isField) {
          checkBranch(n.children, n.maxQty)
        }
      }
    }
    checkBranch(slot.options, slot.options[0]?.maxQty || 999)
    return warnings
  }

  /// Collect all leaf-level product nodes from a setup's product slots
  function collectAllProducts(products: ProductSlot[]): TreeNode[] {
    const result: TreeNode[] = []
    for (const slot of products) {
      if (!slot.isClubbed && slot.options[0]) {
        result.push(slot.options[0])
      } else {
        collectLeaves(slot.options, result)
      }
    }
    return result
  }

  function collectLeaves(nodes: TreeNode[], out: TreeNode[]) {
    for (const n of nodes) {
      if (n.isLeaf) out.push(n)
      else collectLeaves(n.children, out)
    }
  }

  function toggleNested(parentKey: string, nodeKey: string) {
    setSelectedNested(prev => {
      const set = new Set(prev[parentKey] || [])
      set.has(nodeKey) ? set.delete(nodeKey) : set.add(nodeKey)
      return { ...prev, [parentKey]: set }
    })
  }

  /** Render tree nodes recursively as table rows with indentation */
  function renderTreeNodes(
    nodes: TreeNode[],
    depth: number,
    catKey: string,
    setupKey: string,
    currentPath: string[],
    allSlots: ProductSlot[] = []
  ): JSX.Element[] {
    const rows: JSX.Element[] = []
    const indent = depth * 24
    const sortedNodes = [...nodes].sort((a, b) => ((a as any)._order ?? Infinity) - ((b as any)._order ?? Infinity))

    for (const node of sortedNodes) {
      const nodePath = [...currentPath, node.key]
      const nodeId = `${catKey}::${setupKey}::${nodePath.join('::')}::d${depth}`
      const nestedParentKey = `${catKey}::${setupKey}::${currentPath.join('::')}`
      const isNestedSelected = selectedNested[nestedParentKey]?.has(node.key)

      if (node.isLeaf && !node.isField) {
        // ── LEAF ROW: shows product details ──
        const depthClass = depth <= 4 ? `depth-${depth}` : 'depth-4'
        rows.push(
          <tr key={nodeId} className={`ib-product-row ib-club-option-row ${depthClass}`}>
            <td>
              <input type="checkbox" checked={isNestedSelected || false} onChange={() => toggleNested(nestedParentKey, node.key)} />
            </td>
            <td>
              <div className="product-main" style={{ paddingLeft: indent }}>
                <span className="product-name">
                  {'│ '.repeat(Math.max(0, depth - 1))}↳ {node.productName || node.productId || node.key}
                </span>
                <span className="product-id">{node.productId} · {node.key}</span>
              </div>
            </td>
            <td className="num"><button className="link-btn" onClick={() => editPrice(node.productId, node.price)}>{fmt(node.price)}</button></td>
            <td className="num"><button className="link-btn" onClick={() => editQty(catKey, setupKey, nodePath, 'defaultQty', node.defaultQty)}>{node.defaultQty}</button></td>
            <td className="num"><button className="link-btn" onClick={() => editQty(catKey, setupKey, nodePath, 'minQty', node.minQty)}>{node.minQty}</button></td>
            <td className="num"><button className="link-btn" onClick={() => editQty(catKey, setupKey, nodePath, 'maxQty', node.maxQty)}>{node.maxQty}</button></td>
            <td className="num total">{fmt(node.price * node.defaultQty)}</td>
            <td>
              <div className="ib-actions">
                {node.renderType === 'list' ? (
                  <span className="ib-badge primary" title="LIST render mode — qty steppers with collective validation">LIST</span>
                ) : (
                  <span className="ib-badge secondary" title="OPT render mode — modal selection">OPT</span>
                )}
                {node.dependsOn && (
                  <span className="ib-badge" style={{ background: '#fef3c7', color: '#92400e' }} title={`Depends on: ${node.dependsOn}`}>
                    🔗 {node.dependsOn}
                  </span>
                )}
                <button className="secondary-btn small" onClick={() => setShowClubSearch({ categoryKey: catKey, setupKey, nodePath })} title="Add product from catalog" style={{ fontSize: '11px', padding: '4px 8px' }}>+ Product</button>
                <button className="link-btn" onClick={() => addBranch(catKey, setupKey, nodePath)} title="Add nested branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                {clipboard?.type === 'node' && (
                  <button className="link-btn" onClick={() => pasteNode(catKey, setupKey, nodePath)} disabled={saving} style={{ color: '#6366f1' }}>📄 Paste</button>
                )}
                <button className="link-btn" onClick={() => editDependency(catKey, setupKey, nodePath, node, allSlots)} title="Map this product's quantity to another product" style={{ color: '#d97706' }}>🔗 Depends On</button>
                <button className="icon-btn" onClick={() => editRenderConfig(catKey, setupKey, nodePath, node)} title="Configure render type" style={{ color: '#10b981' }}>⚙️</button>
                <button className="icon-btn" onClick={() => renameNode(catKey, setupKey, nodePath)} title="Rename">✏️</button>
                <button className="icon-btn" onClick={() => copyNode(catKey, setupKey, nodePath)} title="Copy to clipboard">📋</button>
                <button className="icon-btn" onClick={() => moveNode(catKey, setupKey, currentPath, nodes, nodes.indexOf(node), 'up')} disabled={nodes.indexOf(node) === 0} title="Move Up">↑</button>
                <button className="icon-btn" onClick={() => moveNode(catKey, setupKey, currentPath, nodes, nodes.indexOf(node), 'down')} disabled={nodes.indexOf(node) === nodes.length - 1} title="Move Down">↓</button>
                <button className="icon-btn danger" onClick={() => deleteClubOption(catKey, setupKey, nodePath)} title="Remove this option">✕</button>
              </div>
            </td>
          </tr>
        )
      } else if (node.isField) {
        // ── FIELD ROW: shows arbitrary primitive data ──
        rows.push(
          <tr key={nodeId} className="ib-product-row ib-club-option-row">
            <td></td>
            <td>
              <div className="product-main" style={{ paddingLeft: indent }}>
                <span className="product-name">
                  {'│ '.repeat(Math.max(0, depth - 1))}↳ {node.key}
                </span>
                <span className="product-id">Field ({node.fieldType})</span>
              </div>
            </td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num">
              {node.fieldType === 'boolean' 
                 ? (node.fieldValue ? 'true' : 'false') 
                 : String(node.fieldValue)}
            </td>
            <td>
              <div className="ib-actions">
                <button className="link-btn" onClick={() => {
                   const val = prompt(`Enter new value for ${node.key} (${node.fieldType}):`, String(node.fieldValue))
                   if (val !== null && serviceId) {
                      let parsed: any = val;
                      if (node.fieldType === 'number') parsed = Number(val);
                      if (node.fieldType === 'boolean') parsed = val === 'true';
                      adminDatasource.serviceUpdateDynamicField(serviceId, catKey, setupKey, nodePath, parsed).then(() => {
                        loadData();
                      })
                   }
                }}>Edit</button>
                <button className="icon-btn danger" onClick={() => deleteClubOption(catKey, setupKey, nodePath)} title="Remove this field">✕</button>
              </div>
            </td>
          </tr>
        )
      } else {
        // ── BRANCH ROW: expandable, shows children count ──
        const branchOpen = expandedClubs.has(nodeId)
        const depthClass = depth <= 4 ? `depth-${depth}` : 'depth-4'
        rows.push(
          <tr key={nodeId} className={`ib-product-row ib-club-option-row ${depthClass}`}>
            <td>
              <input type="checkbox" checked={isNestedSelected || false} onChange={() => toggleNested(nestedParentKey, node.key)} />
            </td>
            <td>
              <button className="ib-club-toggle" onClick={() => toggle(expandedClubs, nodeId, setExpandedClubs)} type="button">
                <div className="product-main" style={{ paddingLeft: indent }}>
                  <span className="product-name">
                    <span className={`ib-chevron ${branchOpen ? 'open' : ''}`} style={{ fontSize: '10px', marginRight: '6px' }}>▶</span>
                    📂 {node.key}
                    {node.renderType === 'list' && <span className="ib-badge primary" style={{ marginLeft: 4, fontSize: '10px' }}>LIST</span>}
                    <span className="ib-badge" style={{ fontSize: '10px', marginLeft: 4 }}>{countRealLeaves(node.children)} cameras</span>
                    {node.dependsOn && <span className="ib-badge" style={{ background: '#fef3c7', color: '#92400e', marginLeft: 4, fontSize: '10px' }}>🔗 {node.dependsOn}</span>}
                  </span>
                  <span className="product-id">{countBranches(node.children) > 0 ? `${countBranches(node.children)} branches` : 'Branch'}</span>
                </div>
              </button>
            </td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td className="num">—</td>
            <td>
              <div className="ib-actions">
                <button className="secondary-btn small" onClick={() => setShowClubSearch({ categoryKey: catKey, setupKey, nodePath })} title="Add product from catalog" style={{ fontSize: '11px', padding: '4px 8px' }}>+ Product</button>
                <button className="link-btn" onClick={() => addBranch(catKey, setupKey, nodePath)} title="Add nested branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                {clipboard?.type === 'node' && (
                  <button className="link-btn" onClick={() => pasteNode(catKey, setupKey, nodePath)} disabled={saving} style={{ color: '#6366f1' }}>📄 Paste</button>
                )}
                {selectedNested[`${catKey}::${setupKey}::${currentPath.join('::')}`]?.size >= 2 && (
                  <button className="link-btn club-btn" onClick={() => clubSelected(catKey, setupKey, currentPath)} title="Group selected items" style={{ color: '#8b5cf6' }}>📁 Group</button>
                )}
                <button className="icon-btn" onClick={() => renameNode(catKey, setupKey, nodePath)} title="Rename branch">✏️</button>
                <button className="icon-btn" onClick={() => copyNode(catKey, setupKey, nodePath)} title="Copy branch to clipboard">📋</button>
                <button className="icon-btn" onClick={() => editRenderConfig(catKey, setupKey, nodePath, node)} title="Configure render type" style={{ color: '#10b981' }}>⚙️</button>
                <button className="icon-btn" onClick={() => moveNode(catKey, setupKey, currentPath, nodes, nodes.indexOf(node), 'up')} disabled={nodes.indexOf(node) === 0} title="Move Up">↑</button>
                <button className="icon-btn" onClick={() => moveNode(catKey, setupKey, currentPath, nodes, nodes.indexOf(node), 'down')} disabled={nodes.indexOf(node) === nodes.length - 1} title="Move Down">↓</button>
                <button className="link-btn" onClick={() => {
                   const fieldName = prompt('Enter new field name:')
                   if (!fieldName || !serviceId) return;
                   const type = prompt('Enter type (string, number, boolean, map):', 'string')
                   if (!type) return;
                   let val: any = '';
                   if (type === 'number') val = 0;
                   if (type === 'boolean') val = false;
                   if (type === 'map') val = {};
                   
                   adminDatasource.serviceUpdateDynamicField(serviceId, catKey, setupKey, [...nodePath, fieldName], val).then(() => {
                     loadData();
                   })
                }} title="Add dynamic field">+ Field</button>
                {depth > 0 && <button className="icon-btn danger" onClick={() => deleteClubOption(catKey, setupKey, nodePath)} title="Remove this branch">✕</button>}
              </div>
            </td>
          </tr>
        )

        if (branchOpen) {
          rows.push(...renderTreeNodes(node.children, depth + 1, catKey, setupKey, nodePath, allSlots))
        }
      }
    }

    return rows
  }

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="icon-btn" onClick={() => navigate('/catalog/services')} title="Back to Services">←</button>
          <div>
            <h1>{serviceId} Builder</h1>
            <p className="catalog-subtitle">Recursive tree configuration for {serviceId}. Add categories, setups, and products with infinite nesting.</p>
          </div>
        </div>
        <div className="catalog-actions">
          <button className="primary-btn" onClick={() => { setShowAddCategory(true); setNewName('') }}>+ Add Category</button>
          <button className="primary-btn" onClick={saveAllChanges} disabled={saving || pendingEdits.length === 0} style={{ background: '#d97706', marginLeft: 8 }}>
            {saving ? 'Saving...' : `💾 Save Changes (${pendingEdits.length})`}
          </button>
          <button className="secondary-btn" onClick={async () => {
            if (!confirm('Assign stable order numbers to all categories, setups, and products based on their current display order?')) return
            setSaving(true)
            try {
              const items: Array<{ categoryKey?: string; setupKey?: string; productKey?: string; order: number }> = []
              categories.forEach((cat, catIdx) => {
                items.push({ categoryKey: cat.key, order: catIdx })
                cat.setups.forEach((setup, setupIdx) => {
                  items.push({ categoryKey: cat.key, setupKey: setup.key, order: setupIdx })
                  setup.products.forEach((prod, prodIdx) => {
                    items.push({ categoryKey: cat.key, setupKey: setup.key, productKey: prod.key, order: prodIdx })
                  })
                })
              })
              await adminDatasource.serviceReorderBulk(serviceId, items)
              await loadData()
            } catch (err) { setError(err instanceof Error ? err.message : 'Failed to seed order') }
            finally { setSaving(false) }
          }} disabled={saving} style={{ marginLeft: 8 }} title="Assign order numbers based on current display position">🔢 Seed Order</button>
          {clipboard && (
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
              📋 {clipboard.label}
              <button className="icon-btn" onClick={() => setClipboard(null)} title="Clear clipboard" style={{ fontSize: 12 }}>✕</button>
            </span>
          )}
        </div>
      </div>

      {error && <div className="catalog-error">{error} <button className="icon-btn" onClick={() => setError(null)}>×</button></div>}

      {isLoading ? (
        <div className="catalog-loading">Loading {serviceId} configuration...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="ib-stats-bar">
            <div className="ib-stat"><span className="ib-stat-value">{stats.cats}</span><span className="ib-stat-label">Categories</span></div>
            <div className="ib-stat"><span className="ib-stat-value">{stats.setups}</span><span className="ib-stat-label">Setups</span></div>
            <div className="ib-stat"><span className="ib-stat-value">{stats.products}</span><span className="ib-stat-label">Products</span></div>
            <div className="ib-stat"><span className="ib-stat-value">{stats.clubs}</span><span className="ib-stat-label">Option Groups</span></div>
            <div className="ib-stat highlight"><span className="ib-stat-value">{fmt(stats.totalValue)}</span><span className="ib-stat-label">Estimated Base</span></div>
          </div>

          {/* Tree */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <button className="secondary-btn small" onClick={() => {
          const allCats = new Set(categories.map(c => c.key))
          setExpandedCats(allCats)
          const allSetups = new Set<string>()
          const allClubs = new Set<string>()
          categories.forEach(c => c.setups.forEach(su => {
            const sKey = `${c.key}::${su.key}`
            allSetups.add(sKey)
            su.products.forEach(p => allClubs.add(`${sKey}::${p.key}`))
          }))
          setExpandedSetups(allSetups)
          setExpandedClubs(allClubs)
        }} title="Expand all categories, setups, groups, and nested options">▼ Expand All</button>
        <button className="secondary-btn small" onClick={() => { setExpandedCats(new Set()); setExpandedSetups(new Set()); setExpandedClubs(new Set()) }} title="Collapse everything">▲ Collapse All</button>
        <span style={{ color: '#9ca3af', fontSize: 12 }}>— click ▶ on any row to expand below</span>
      </div>
      <div className="ib-tree">
            {categories.length === 0 ? (
              <div className="ib-empty-state"><p>No categories found for {serviceId}. Click "+ Add Category" to create one.</p></div>
            ) : categories.map((cat, catIdx) => {
              const catOpen = expandedCats.has(cat.key)
              return (
                <div key={cat.key} className={`ib-category-card ${catOpen ? 'open' : ''} ${cat.active === false ? 'inactive' : ''}`}>
                  <div className="ib-category-header">
                    <button className="ib-category-toggle" onClick={() => toggle(expandedCats, cat.key, setExpandedCats)} type="button">
                      <span className={`ib-chevron ${catOpen ? 'open' : ''}`}>▶</span>
                      <span className="ib-category-name">{cat.name}</span>
                      <span className="ib-badge secondary">{cat.setups.length} setup{cat.setups.length !== 1 ? 's' : ''}</span>
                    </button>
                    <div className="ib-header-actions">
                      <button className="secondary-btn small" onClick={() => { setShowAddSetup(cat.key); setNewName('') }} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px' }}>+ Add Setup</button>
                      {clipboard?.type === 'setup' && (
                        <button className="secondary-btn small" onClick={() => pasteSetup(cat.key)} disabled={saving} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px', background: '#6366f1', color: '#fff' }}>📄 Paste "{clipboard.label}"</button>
                      )}
                      <button className="secondary-btn small" onClick={() => { setShowProductSearch({ categoryKey: cat.key, setupKey: '' }); }} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px' }}>+ Product</button>
                      <button className="secondary-btn small" onClick={async () => {
                        const name = prompt('Enter category-level section name:');
                        if (!name?.trim()) return;
                        const catKey = cat.key;
                        const safeName = safeKey(name.trim());
                        const optimistic: Setup = { key: safeName, name: safeName, products: [] };
                        setCategories(prev => prev.map(c =>
                          c.key === catKey ? { ...c, setups: [...c.setups, optimistic] } : c
                        ));
                        try {
                          await adminDatasource.serviceAddSetup(serviceId, cat.key, safeName);
                          await loadData();
                        } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
                      }} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px', background: '#8b5cf6', color: '#fff' }}>+ Branch</button>
                      <button className="icon-btn" onClick={() => openCategoryEdit(cat.key)} title="Edit Category (rename + service mapping)" style={{ marginRight: '4px' }}>✏️</button>
                      <button
                        className={`icon-btn ${cat.active === false ? 'danger' : ''}`}
                        onClick={() => toggleCategoryActive(cat.key, cat.active !== false)}
                        title={cat.active === false ? 'Activate category (show in customer app)' : 'Deactivate category (hide from customer app)'}
                        style={{ marginRight: '4px', fontSize: '13px', color: cat.active === false ? '#ef4444' : '#10b981' }}
                      >
                        {cat.active === false ? '🔴' : '🟢'}
                      </button>
                      <button className="icon-btn" onClick={() => moveCategory(catIdx, 'up')} disabled={catIdx === 0} title="Move Up" style={{ marginRight: '2px', fontSize: '14px' }}>↑</button>
                      <button className="icon-btn" onClick={() => moveCategory(catIdx, 'down')} disabled={catIdx === categories.length - 1} title="Move Down" style={{ marginRight: '4px', fontSize: '14px' }}>↓</button>
                      <span className="ib-category-price">{fmt(categoryTotal(cat))}</span>
                      <button className="icon-btn danger" onClick={() => deleteCategory(cat.key)} title="Delete category">🗑️</button>
                    </div>
                  </div>

                  {catOpen && (
                    <div className="ib-category-body">
                      {cat.setups.length === 0 ? (
                        <p className="ib-empty">No setups. Click "+ Add Setup" to create one.</p>
                      ) : cat.setups.map((setup, setupIdx) => {
                        const sKey = `${cat.key}::${setup.key}`
                        const setupOpen = expandedSetups.has(sKey)
                        return (
                          <div key={setup.key} className={`ib-setup-card ${setupOpen ? 'open' : ''} ${setup.active === false ? 'inactive' : ''}`}>
                            <div className="ib-setup-header">
                              <button className="ib-setup-toggle" onClick={() => toggle(expandedSetups, sKey, setExpandedSetups)} type="button">
                                <span className={`ib-chevron ${setupOpen ? 'open' : ''}`}>▶</span>
                                <span className="ib-setup-name">{setup.name}</span>
                                <span className="ib-badge">{setup.products.length} product{setup.products.length !== 1 ? 's' : ''}</span>
                              </button>
                              <div className="ib-header-actions">
                                <button className="secondary-btn small" onClick={() => setShowProductSearch({ categoryKey: cat.key, setupKey: setup.key })} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px' }}>+ Product</button>
                                <button className="secondary-btn small" onClick={() => addBranch(cat.key, setup.key, [])} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px', background: '#8b5cf6', color: '#fff' }}>+ Branch</button>
                                {clipboard?.type === 'node' && (
                                  <button className="secondary-btn small" onClick={() => pasteNode(cat.key, setup.key, [])} disabled={saving} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px', background: '#6366f1', color: '#fff' }}>📄 Paste</button>
                                )}
                                <button className="icon-btn" onClick={() => renameSetup(cat.key, setup.key)} title="Rename Setup" style={{ marginRight: '4px' }}>✏️</button>
                                <button
                                  className={`icon-btn ${setup.active === false ? 'danger' : ''}`}
                                  onClick={() => toggleSetupActive(cat.key, setup.key, setup.active !== false)}
                                  title={setup.active === false ? 'Activate setup (show in customer app)' : 'Deactivate setup (hide from customer app)'}
                                  style={{ marginRight: '4px', fontSize: '13px', color: setup.active === false ? '#ef4444' : '#10b981' }}
                                >
                                  {setup.active === false ? '🔴' : '🟢'}
                                </button>
                                <button className="icon-btn" onClick={() => copySetup(cat.key, setup)} title="Copy setup to clipboard" style={{ marginRight: '4px', fontSize: '13px' }}>📋</button>
                                <button className="icon-btn" onClick={() => moveSetup(cat.key, setupIdx, 'up')} disabled={setupIdx === 0} title="Move Up" style={{ marginRight: '2px', fontSize: '14px' }}>↑</button>
                                <button className="icon-btn" onClick={() => moveSetup(cat.key, setupIdx, 'down')} disabled={setupIdx === cat.setups.length - 1} title="Move Down" style={{ marginRight: '4px', fontSize: '14px' }}>↓</button>
                                <span className="ib-setup-price">{fmt(setupTotal(setup))}</span>
                                <button className="icon-btn danger" onClick={() => deleteSetup(cat.key, setup.key)} title="Delete setup">🗑️</button>
                              </div>
                            </div>

                            {setupOpen && (
                              <div className="ib-setup-body">
                                <div className="ib-section-actions">
                                  <button className="secondary-btn small" onClick={() => {
                                    const allClubKeys = new Set(expandedClubs)
                                    setup.products.forEach(p => allClubKeys.add(`${cat.key}::${setup.key}::${p.key}`))
                                    setExpandedClubs(allClubKeys)
                                  }} title="Expand all groups and nested options">▼ Expand Below</button>
                                  <button className="secondary-btn small" onClick={() => {
                                    const filtered = new Set(Array.from(expandedClubs).filter(k => !k.startsWith(`${cat.key}::${setup.key}::`)))
                                    setExpandedClubs(filtered)
                                  }} title="Collapse all nested options">▲ Collapse Below</button>
                                  {(selectedForClubbing[sKey]?.size || 0) > 0 && (
                                    <>
                                      <span style={{ marginRight: 8, fontSize: 11, color: '#666' }}>({selectedForClubbing[sKey]?.size || 0} selected)</span>
                                      {(selectedForClubbing[sKey]?.size || 0) >= 2 && (
                                        <button className="secondary-btn" onClick={() => clubSelected(cat.key, setup.key)} style={{ background: '#8b5cf6', color: '#fff', marginRight: 6 }}>📁 Club Selected</button>
                                      )}
                                      <button className="secondary-btn danger" onClick={() => bulkDeleteProducts(cat.key, setup.key)}>🗑️ Delete Selected</button>
                                    </>
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
                                    if (!sortField) {
                                      // No sort active — use order field from Firestore
                                      return (a.order ?? a._order ?? Infinity) - (b.order ?? b._order ?? Infinity)
                                    }
                                    const optA = (a.options[0] || {}) as TreeNode
                                    const optB = (b.options[0] || {}) as TreeNode
                                    let aVal: string | number = sortField === 'productName' ? (optA.productName || optA.productId || a.key) : (optA as any)[sortField] ?? a.key
                                    let bVal: string | number = sortField === 'productName' ? (optB.productName || optB.productId || b.key) : (optB as any)[sortField] ?? b.key
                                    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
                                    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
                                    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
                                    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
                                    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
                                  }).map((slot) => {
                                    const originalIdx = setup.products.findIndex(p => p.key === slot.key)
                                    if (!slot.isClubbed) {
                                          // Regular product row (single leaf option)
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
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, [slot.key, opt.key], 'defaultQty', opt.defaultQty)}>{opt.defaultQty}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, [slot.key, opt.key], 'minQty', opt.minQty)}>{opt.minQty}</button></td>
                                              <td className="num"><button className="link-btn" onClick={() => editQty(cat.key, setup.key, [slot.key, opt.key], 'maxQty', opt.maxQty)}>{opt.maxQty}</button></td>
<td className="num total">{fmt(opt.price * opt.defaultQty)}</td>
                                              <td>
                                                <div className="ib-actions">
                                                  {opt.renderType && (
                                                    <span className={`ib-badge ${opt.renderType === 'list' ? 'primary' : 'secondary'}`}>{opt.renderType === 'list' ? 'LIST' : 'OPT'}</span>
                                                  )}
                                                  {opt.dependsOn && (
                                                    <span className="ib-badge" style={{ background: '#fef3c7', color: '#92400e' }} title={`Depends on: ${opt.dependsOn}`}>🔗 {opt.dependsOn}</span>
                                                  )}
                                                  <button className="secondary-btn small" onClick={() => setShowClubSearch({ categoryKey: cat.key, setupKey: setup.key, nodePath: [slot.key] })} title="Add product from catalog" style={{ fontSize: '11px', padding: '4px 8px' }}>+ Product</button>
                                                  <button className="icon-btn" onClick={() => addBranch(cat.key, setup.key, [slot.key])} title="Add nested branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                                                  {clipboard?.type === 'node' && (
                                                    <button className="icon-btn" onClick={() => pasteNode(cat.key, setup.key, [slot.key])} disabled={saving} style={{ color: '#6366f1' }} title="Paste from clipboard">📄</button>
                                                  )}
                                                  <button className="icon-btn" onClick={() => editDependency(cat.key, setup.key, [slot.key], opt, setup.products)} title="Map this product's quantity to another product" style={{ color: '#d97706' }}>🔗 Depends On</button>
                                                  <button className="icon-btn" onClick={() => editRenderConfig(cat.key, setup.key, [slot.key], opt)} title="Configure render type (OPT/LIST)" style={{ color: '#10b981' }}>⚙️</button>
                                                  <button className="icon-btn" onClick={() => renameNode(cat.key, setup.key, [slot.key])} title="Rename">✏️</button>
                                                  <button className="icon-btn" onClick={() => copyNode(cat.key, setup.key, [slot.key])} title="Copy to clipboard">📋</button>
                                                  <button className="icon-btn" onClick={() => moveProduct(cat.key, setup.key, originalIdx, 'up')} disabled={originalIdx === 0} title="Move Up">↑</button>
                                                  <button className="icon-btn" onClick={() => moveProduct(cat.key, setup.key, originalIdx, 'down')} disabled={originalIdx === setup.products.length - 1} title="Move Down">↓</button>
                                                  <button className="icon-btn danger" onClick={() => deleteProduct(cat.key, setup.key, slot.key)} title="Remove entire product">🗑️</button>
                                                </div>
                                              </td>
                                            </tr>
  )}

                                        // Clubbed product — render recursive tree
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
                                                    {slot.key} <span className="ib-badge club">🔗 {countLeaves(slot.options)} options</span>
                                                    {getProductSlotWarnings(slot).map((w, i) => (
                                                      <span key={i} className="ib-badge" style={{ background: '#fef3c7', color: '#92400e', marginLeft: 6 }} title={w}>⚠️ MaxQty</span>
                                                    ))}
                                                  </span>
                                                  <span className="product-id">Group — contains selectable options</span>
                                                </div>
                                              </button>
                                            </td>
                                             <td className="num">—</td>
                                             <td className="num">—</td>
                                             <td className="num">—</td>
                                             <td className="num">—</td>
                                             <td className="num total">{fmt(slot.options[0]?.price * (slot.options[0]?.defaultQty || 1) || 0)}</td>
                                               <td>
                                                 <div className="ib-actions">
                                                     <button className="secondary-btn small" onClick={() => setShowClubSearch({ categoryKey: cat.key, setupKey: setup.key, nodePath: [slot.key] })} title="Add product from catalog" style={{ fontSize: '11px', padding: '4px 8px' }}>+ Product</button>
                                                     <button className="icon-btn" onClick={() => addBranch(cat.key, setup.key, [slot.key])} title="Add nested branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                                                    {clipboard?.type === 'node' && (
                                                      <button className="icon-btn" onClick={() => pasteNode(cat.key, setup.key, [slot.key])} disabled={saving} style={{ color: '#6366f1' }} title="Paste from clipboard">📄</button>
                                                    )}
                                                    <button className="icon-btn" onClick={() => editDependency(cat.key, setup.key, [slot.key], slot.options[0], setup.products)} title="Map dependency" style={{ color: '#d97706' }}>🔗 Depends On</button>
                                                   <button className="icon-btn" onClick={() => editRenderConfig(cat.key, setup.key, [slot.key], { ...slot.options[0], key: slot.key })} title="Configure render type (OPT/LIST)" style={{ color: '#10b981' }}>⚙️</button>
                                                   {selectedNested[`${cat.key}::${setup.key}::${slot.key}`]?.size >= 2 && (
                                                     <button className="icon-btn club-btn" onClick={() => clubSelected(cat.key, setup.key, [slot.key])} title="Group selected items">📁 Group</button>
                                                   )}
                                                    <button className="icon-btn" onClick={() => renameNode(cat.key, setup.key, [slot.key])} title="Edit name">✏️</button>
                                                    <button className="icon-btn" onClick={() => copyNode(cat.key, setup.key, [slot.key])} title="Copy club to clipboard">📋</button>
                                                    <button className="icon-btn" onClick={() => moveProduct(cat.key, setup.key, originalIdx, 'up')} disabled={originalIdx === 0} title="Move Up">↑</button>
                                                    <button className="icon-btn" onClick={() => moveProduct(cat.key, setup.key, originalIdx, 'down')} disabled={originalIdx === setup.products.length - 1} title="Move Down">↓</button>
                                                    <button className="icon-btn danger" onClick={() => deleteProduct(cat.key, setup.key, slot.key)} title="Remove entire club">🗑️</button>
                                                 </div>
                                               </td>
                                             </tr>,
                                          ...(clubOpen ? renderTreeNodes(slot.options, 1, cat.key, setup.key, [slot.key], setup.products) : [])
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

      {/* Product Search (add product to setup) — multi-select */}
      {showProductSearch && (
        <ProductSearchModal
          onClose={() => setShowProductSearch(null)}
          onSelectMultiple={(products) => addProducts(showProductSearch.categoryKey, showProductSearch.setupKey, products)}
        />
      )}

      {/* Club Search (add product to club/branch) */}
      {showClubSearch && (
        <ProductSearchModal
          onClose={() => setShowClubSearch(null)}
          onSelect={(p) => addClubOption(showClubSearch.categoryKey, showClubSearch.setupKey, showClubSearch.nodePath, p)}
        />
      )}

      {/* Dependency Modal — map this product's qty to another product's qty */}
      {showDepModal && (
        <div className="modal-overlay" onClick={() => setShowDepModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔗 Depends On — "{showDepModal.node.displayLabel || showDepModal.node.productName || showDepModal.node.key}"</h2>
              <button className="icon-btn" onClick={() => setShowDepModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="hint-text">Select a product slot whose total quantity this product should auto-map from:</p>
              {showDepModal.node.dependsOn && (
                <div className="dependency-current">
                  Currently depends on: <strong>{showDepModal.node.dependsOn}</strong>
                  <button className="secondary-btn" style={{ marginLeft: 8 }} onClick={() => { const m = showDepModal; setShowDepModal(null); removeDependency(m.categoryKey, m.setupKey, m.nodePath) }}>Remove</button>
                </div>
              )}
              <div className="dep-product-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
                {showDepModal.allSlots.filter(s => s.key !== showDepModal.nodePath[0]).map(slot => {
                  const firstOpt = slot.options.find(o => o.isLeaf && !o.isField)
                  return (
                    <label key={slot.key} className="dep-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                      <input type="radio" name="dep-target" value={slot.key}
                        checked={showDepModal.node.dependsOn === slot.key}
                        onChange={() => saveDependency(slot.key)} />
                      <span style={{ fontWeight: 600, flex: 1 }}>{firstOpt?.displayLabel || firstOpt?.productName || slot.key}</span>
                      <span style={{ color: '#64748b', fontSize: 11 }}>PID: {firstOpt?.productId || '—'} · SLOT: {slot.key}</span>
                    </label>
                  )
                })}
                {showDepModal.allSlots.filter(s => s.key !== showDepModal.nodePath[0]).length === 0 && (
                  <p className="hint-text" style={{ padding: 16 }}>No other product slots available in this setup to depend on.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowDepModal(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal — rename + service mapping */}
      {showCategoryEdit && (
        <div className="modal-overlay" onClick={() => setShowCategoryEdit(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Edit Category — "{showCategoryEdit.key}"</h2>
              <button className="icon-btn" onClick={() => setShowCategoryEdit(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Rename</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="ib-search-input"
                    style={{ flex: 1 }}
                    defaultValue={showCategoryEdit.key}
                    id="cat-rename-input"
                    placeholder="New category name"
                  />
                  <button className="secondary-btn" onClick={() => {
                    const inp = document.getElementById('cat-rename-input') as HTMLInputElement
                    if (inp?.value?.trim() && inp.value.trim() !== showCategoryEdit.key) {
                      renameCategory(showCategoryEdit.key)
                    }
                  }}>Rename</button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Service Mapping — which services should see this category's recommendations?
                </label>
                <p className="hint-text" style={{ fontSize: 11, marginBottom: 8, color: '#666' }}>
                  Select one or more services. Leave empty to show in all contexts.
                </p>
                <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                  {servicesList.length === 0 ? (
                    <p className="hint-text" style={{ padding: 8 }}>Loading services...</p>
                  ) : (
                    servicesList.map(svc => {
                      const isChecked = showCategoryEdit.currentMapping.includes(svc.id)
                      return (
                        <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 6, background: isChecked ? '#f0fdf4' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const next = new Set(showCategoryEdit.currentMapping)
                              isChecked ? next.delete(svc.id) : next.add(svc.id)
                              setShowCategoryEdit({ ...showCategoryEdit, currentMapping: Array.from(next) })
                            }}
                          />
                          <span>{svc.icon} {svc.title}</span>
                          <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 'auto' }}>{svc.id}</span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="secondary-btn" onClick={() => setShowCategoryEdit(null)}>Cancel</button>
              <button className="primary-btn" onClick={() => saveServiceMapping(showCategoryEdit.key, showCategoryEdit.currentMapping)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
