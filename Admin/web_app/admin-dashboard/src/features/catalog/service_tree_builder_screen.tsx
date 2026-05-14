import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
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
}

interface ProductSlot {
  key: string
  options: TreeNode[]
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

  // Modals
  const [showProductSearch, setShowProductSearch] = useState<{ categoryKey: string; setupKey: string } | null>(null)
  const [showClubSearch, setShowClubSearch] = useState<{ categoryKey: string; setupKey: string; nodePath: string[] } | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSetup, setShowAddSetup] = useState<string | null>(null) // categoryKey
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedForClubbing, setSelectedForClubbing] = useState<Record<string, Set<string>>>({})
  const [sortField, setSortField] = useState<'productName' | 'price' | 'defaultQty' | 'key'>('key')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  // Dependency engine modal
  const [showDepModal, setShowDepModal] = useState<{
    categoryKey: string
    setupKey: string
    nodePath: string[]
    node: TreeNode
    siblings: TreeNode[]
  } | null>(null)

  const loadData = useCallback(async () => {
    if (!firebaseUser || !serviceId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminDatasource.getServiceConfig(serviceId)
      setCategories(data.categories as Category[])
      if (data.categories.length > 0 && expandedCats.size === 0) {
        setExpandedCats(new Set([String(data.categories[0].key)]))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser, serviceId])

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
    if (!newName.trim() || !serviceId) return
    setSaving(true)
    try {
      await adminDatasource.serviceAddCategory(serviceId, newName.trim())
      setShowAddCategory(false)
      setNewName('')
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
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
    setSaving(true)
    try {
      await adminDatasource.serviceAddSetup(serviceId, categoryKey, newName.trim())
      setShowAddSetup(null)
      setNewName('')
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
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

  const addProduct = async (categoryKey: string, setupKey: string, product: CatalogProduct) => {
    if (!serviceId) return
    setSaving(true)
    try {
      await adminDatasource.serviceAddProduct(serviceId, categoryKey, setupKey, product.id)
      setShowProductSearch(null)
      await loadData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed') }
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
    const name = prompt('Enter branch name (e.g. "2.4 MP", "colour", "indoor"):')
    if (!name?.trim()) return
    setSaving(true)
    try {
      await adminDatasource.serviceAddBranch(serviceId, categoryKey, setupKey, nodePath, name.trim())
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
      await adminDatasource.serviceRenameNode(serviceId, categoryKey, setupKey, nodePath, newName.trim())
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
      await adminDatasource.serviceRenameCategory(serviceId, oldName, newName.trim())
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
      await adminDatasource.serviceRenameSetup(serviceId, catKey, oldName, newName.trim())
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
    setSaving(true)
    try {
       await adminDatasource.serviceUpdateQuantities(serviceId, catKey, setupKey, nodePath, { [type]: num })
       await loadData()
    } catch(err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
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
    setSaving(true)
    try {
      await adminDatasource.serviceUpdateRenderConfig(serviceId, catKey, setupKey, nodePath, updates)
      await loadData()
    } catch(err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const editDependency = (catKey: string, setupKey: string, nodePath: string[], node: TreeNode, siblings: TreeNode[]) => {
    setShowDepModal({ categoryKey: catKey, setupKey, nodePath, node, siblings })
  }

  const saveDependency = async (targetKey: string) => {
    if (!showDepModal || !serviceId) return
    setSaving(true)
    try {
      await adminDatasource.serviceUpdateDependency(serviceId, showDepModal.categoryKey, showDepModal.setupKey, showDepModal.nodePath, targetKey)
      setShowDepModal(null)
      await loadData()
    } catch(err) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setSaving(false) }
  }

  const removeDependency = async (catKey: string, setupKey: string, nodePath: string[]) => {
    if (!serviceId || !confirm('Remove this product\'s dependency mapping?')) return
    setSaving(true)
    try {
      await adminDatasource.serviceRemoveDependency(serviceId, catKey, setupKey, nodePath)
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

  /** Render tree nodes recursively as table rows with indentation */
  function renderTreeNodes(
    nodes: TreeNode[],
    depth: number,
    catKey: string,
    setupKey: string,
    currentPath: string[]
  ): JSX.Element[] {
    const rows: JSX.Element[] = []
    const indent = depth * 24

    for (const node of nodes) {
      const nodePath = [...currentPath, node.key]
      const nodeId = `${catKey}::${setupKey}::${nodePath.join('::')}::d${depth}`

      if (node.isLeaf && !node.isField) {
        // ── LEAF ROW: shows product details ──
        const depthClass = depth <= 4 ? `depth-${depth}` : 'depth-4'
        rows.push(
          <tr key={nodeId} className={`ib-product-row ib-club-option-row ${depthClass}`}>
            <td></td>
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
            <td className="num">{fmt(node.price * node.defaultQty)}</td>
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
                <button className="link-btn" onClick={() => setShowClubSearch({ categoryKey: catKey, setupKey: setupKey, nodePath })} title="Add product option">+ Option</button>
                <button className="link-btn" onClick={() => addBranch(catKey, setupKey, nodePath)} title="Add sub-branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                <button className="link-btn" onClick={() => editDependency(catKey, setupKey, nodePath, node, nodes)} title="Map this product's quantity to another product" style={{ color: '#d97706' }}>🔗 Depends On</button>
                <button className="icon-btn" onClick={() => editRenderConfig(catKey, setupKey, nodePath, node)} title="Configure render type" style={{ color: '#10b981' }}>⚙️</button>
                <button className="icon-btn" onClick={() => renameNode(catKey, setupKey, nodePath)} title="Rename">✏️</button>
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
          <tr key={nodeId} className={`ib-product-row ib-club-option-row ${depthClass}`} style={{ background: `rgba(10,132,255,${0.02 * depth})` }}>
            <td></td>
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
                <button className="link-btn" onClick={() => setShowClubSearch({ categoryKey: catKey, setupKey, nodePath })} title="Add product option">+ Option</button>
                <button className="link-btn" onClick={() => addBranch(catKey, setupKey, nodePath)} title="Add sub-branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                <button className="icon-btn" onClick={() => renameNode(catKey, setupKey, nodePath)} title="Rename branch">✏️</button>
                <button className="icon-btn" onClick={() => editRenderConfig(catKey, setupKey, nodePath, node)} title="Configure render type" style={{ color: '#10b981' }}>⚙️</button>
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
          rows.push(...renderTreeNodes(node.children, depth + 1, catKey, setupKey, nodePath))
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
                      <button className="secondary-btn small" onClick={() => { setShowAddSetup(cat.key); setNewName('') }} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px' }}>+ Add Setup</button>
                      <button className="secondary-btn small" onClick={() => { setShowProductSearch({ categoryKey: cat.key, setupKey: '' }); }} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px', background: '#10b981' }}>+ Product</button>
                      <button className="secondary-btn small" onClick={() => addBranch(cat.key, '', [])} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px', background: '#8b5cf6', color: '#fff' }}>+ Branch</button>
                      <button className="icon-btn" onClick={() => renameCategory(cat.key)} title="Rename Category" style={{ marginRight: '4px' }}>✏️</button>
                      <span className="ib-category-price">{fmt(categoryTotal(cat))}</span>
                      <button className="icon-btn danger" onClick={() => deleteCategory(cat.key)} title="Delete category">🗑️</button>
                    </div>
                  </div>

                  {catOpen && (
                    <div className="ib-category-body">
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
                                <button className="secondary-btn small" onClick={() => setShowProductSearch({ categoryKey: cat.key, setupKey: setup.key })} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px' }}>+ Product</button>
                                <button className="secondary-btn small" onClick={() => addBranch(cat.key, setup.key, [])} style={{ marginRight: '6px', fontSize: '11px', padding: '4px 8px', background: '#8b5cf6', color: '#fff' }}>+ Branch</button>
                                <button className="icon-btn" onClick={() => renameSetup(cat.key, setup.key)} title="Rename Setup" style={{ marginRight: '4px' }}>✏️</button>
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
                                        const optA = (a.options[0] || {}) as TreeNode
                                        const optB = (b.options[0] || {}) as TreeNode
                                        let aVal: string | number = sortField === 'productName' ? (optA.productName || optA.productId || a.key) : (optA as any)[sortField] ?? a.key
                                        let bVal: string | number = sortField === 'productName' ? (optB.productName || optB.productId || b.key) : (optB as any)[sortField] ?? b.key
                                        
                                        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
                                        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
                                        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
                                        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
                                        return 0
                                      }).map((slot) => {
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
                                                  <button className="icon-btn" onClick={() => setShowClubSearch({ categoryKey: cat.key, setupKey: setup.key, nodePath: [slot.key] })} title="Add product option">+ Option</button>
                                                  <button className="icon-btn" onClick={() => addBranch(cat.key, setup.key, [slot.key])} title="Add sub-branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                                                  <button className="icon-btn" onClick={() => editDependency(cat.key, setup.key, [slot.key], opt, collectAllProducts(setup.products))} title="Map this product's quantity to another product" style={{ color: '#d97706' }}>🔗 Depends On</button>
                                                  <button className="icon-btn" onClick={() => editRenderConfig(cat.key, setup.key, [slot.key], opt)} title="Configure render type (OPT/LIST)" style={{ color: '#10b981' }}>⚙️</button>
                                                  <button className="icon-btn" onClick={() => renameNode(cat.key, setup.key, [slot.key])} title="Rename">✏️</button>
                                                  <button className="icon-btn danger" onClick={() => deleteProduct(cat.key, setup.key, slot.key)} title="Remove entire product">🗑️</button>
                                                </div>
                                              </td>
                                            </tr>
                                          )
                                        }

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
                                                  </span>
                                                  <span className="product-id">Clubbed — customer drills down to select</span>
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
                                                  <button className="icon-btn" onClick={() => setShowClubSearch({ categoryKey: cat.key, setupKey: setup.key, nodePath: [slot.key] })} title="Add product option">+ Option</button>
                                                  <button className="icon-btn" onClick={() => addBranch(cat.key, setup.key, [slot.key])} title="Add sub-branch" style={{ color: '#8b5cf6' }}>+ Branch</button>
                                                  <button className="icon-btn" onClick={() => editDependency(cat.key, setup.key, [slot.key], slot.options[0], collectAllProducts(setup.products))} title="Map dependency" style={{ color: '#d97706' }}>🔗 Depends On</button>
                                                  <button className="icon-btn" onClick={() => editRenderConfig(cat.key, setup.key, [slot.key], { ...slot.options[0], key: slot.key })} title="Configure render type (OPT/LIST)" style={{ color: '#10b981' }}>⚙️</button>
                                                  <button className="icon-btn" onClick={() => renameNode(cat.key, setup.key, [slot.key])} title="Edit name">✏️</button>
                                                  <button className="icon-btn danger" onClick={() => deleteProduct(cat.key, setup.key, slot.key)} title="Remove entire club">🗑️</button>
                                                </div>
                                              </td>
                                            </tr>,
                                          ...(clubOpen ? renderTreeNodes(slot.options, 1, cat.key, setup.key, [slot.key]) : [])
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
              <p className="hint-text">Select a product whose quantity this product should auto-map from:</p>
              {showDepModal.node.dependsOn && (
                <div className="dependency-current">
                  Currently depends on KEY: <strong>{showDepModal.node.dependsOn}</strong>
                  <button className="secondary-btn" style={{ marginLeft: 8 }} onClick={() => { const m = showDepModal; setShowDepModal(null); removeDependency(m.categoryKey, m.setupKey, m.nodePath) }}>Remove</button>
                </div>
              )}
              <div className="dep-product-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
                {showDepModal.siblings.filter(s => s.key !== showDepModal.node.key && s.isLeaf && !s.isField && s.productId).map(sib => (
                  <label key={sib.key} className="dep-item" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                    <input type="radio" name="dep-target" value={sib.key}
                      checked={showDepModal.node.dependsOn === sib.key}
                      onChange={() => saveDependency(sib.key)} />
                    <span style={{ fontWeight: 600, flex: 1 }}>{sib.displayLabel || sib.productName || sib.key}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>PID: {sib.productId} · KEY: {sib.key}</span>
                  </label>
                ))}
                {showDepModal.siblings.filter(s => s.key !== showDepModal.node.key && s.isLeaf && !s.isField && s.productId).length === 0 && (
                  <p className="hint-text" style={{ padding: 16 }}>No other products available in this scope to depend on.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowDepModal(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
