import { useEffect, useMemo, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { CatalogProduct, CatalogPackage, CatalogAddon, CatalogTax, CatalogRecommendation, InvoiceTemplate, UpgradeBundle, PricingSet, CatalogService } from '@data/models/admin_models'
import './catalog_screen.css'
import { useParams, useNavigate } from 'react-router-dom'

const CATEGORIES_KEY = 'All'
const GROUPS_KEY = 'All'

type TabType = 'products' | 'packages' | 'addons' | 'taxes' | 'recommendations' | 'invoices' | 'services' | 'upgrade' | 'pricing'

export default function CatalogScreen() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMetadataLoading, setIsMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  // Data States
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [packages, setPackages] = useState<CatalogPackage[]>([])
  const [addons, setAddons] = useState<CatalogAddon[]>([])
  const [taxes, setTaxes] = useState<CatalogTax[]>([])
  const [recommendations, setRecommendations] = useState<CatalogRecommendation[]>([])
  const [invoices, setInvoices] = useState<InvoiceTemplate[]>([])
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([])
  const [upgradeBundles, setUpgradeBundles] = useState<UpgradeBundle[]>([])
  const [pricingData, setPricingData] = useState<PricingSet>({})

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
  const [pricingSection, setPricingSection] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'name', direction: 'asc' })

  // Form States
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null)
  const [productForm, setProductForm] = useState({ name: '', category: 'Cameras', group: 'Core', unit: 'unit', price: 0, status: 'active' as 'active' | 'inactive' })

  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<CatalogPackage | null>(null)
  const [packageForm, setPackageForm] = useState({ name: '', description: '', productIds: [] as string[], totalPrice: 0, discountPercent: 0, finalPrice: 0, status: 'active' as 'active' | 'inactive' })

  const [isAddonFormOpen, setIsAddonFormOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<CatalogAddon | null>(null)
  const [addonForm, setAddonForm] = useState({ name: '', description: '', category: 'Services', price: 0, status: 'active' as 'active' | 'inactive' })

  const [isTaxFormOpen, setIsTaxFormOpen] = useState(false)
  const [editingTax, setEditingTax] = useState<CatalogTax | null>(null)
  const [taxForm, setTaxForm] = useState({ name: '', description: '', rate: 0, status: 'active' as 'active' | 'inactive' })

  const [isRecFormOpen, setIsRecFormOpen] = useState(false)
  const [editingRec, setEditingRec] = useState<CatalogRecommendation | null>(null)
  const [recForm, setRecForm] = useState<Partial<CatalogRecommendation> & { name: string, productIds: string[], placement: CatalogRecommendation['placement'], isAvailable: boolean, displayPriority: number }>({ name: '', description: '', productIds: [] as string[], placement: 'checkout' as CatalogRecommendation['placement'], serviceTypes: [] as CatalogRecommendation['serviceTypes'], isAvailable: true, displayPriority: 0 })

  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceTemplate | null>(null)
  const [invoiceForm, setInvoiceForm] = useState({ name: '', description: '', terms: '', notes: '', showTax: true, status: 'active' as 'active' | 'inactive' })

  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false)
  const [editingCatalogService, setEditingCatalogService] = useState<CatalogService | null>(null)
  const [serviceForm, setServiceForm] = useState<Partial<CatalogService>>({ serviceName: '', description: '', category: 'installation', basePrice: 0, isAvailable: true, productIds: [] })

  // Route Handling
  useEffect(() => {
    if (tab) {
      const normalized = tab.toLowerCase()
      const validTabs = ['products', 'packages', 'addons', 'taxes', 'recommendations', 'invoices', 'services', 'upgrade', 'pricing', 'accessories', 'maintenance', 'repair', 'amc', 'installation']
      if (validTabs.includes(normalized)) {
        if (normalized === 'accessories') { setActiveTab('products'); setCategory('All'); setGroup('Accessories'); }
        else if (['installation', 'maintenance', 'repair', 'amc'].includes(normalized)) { setActiveTab('pricing'); setPricingSection(normalized); }
        else { setActiveTab(normalized as TabType); setPricingSection(null); }
      }
    }
  }, [tab])

  // Data Loading
  useEffect(() => {
    const fetchData = async () => {
      if (!firebaseUser) return
      setIsLoading(true)
      setError(null)
      setSelectedItems(new Set())
      try {
        if (activeTab === 'products') setProducts(group === 'Accessories' ? await adminDatasource.getCatalogAccessories() : await adminDatasource.getCatalogProducts())
        else if (activeTab === 'packages') setPackages(await adminDatasource.getCatalogPackages())
        else if (activeTab === 'addons') setAddons(await adminDatasource.getCatalogAddons())
        else if (activeTab === 'taxes') setTaxes(await adminDatasource.getCatalogTaxes())
        else if (activeTab === 'recommendations') setRecommendations(await adminDatasource.getCatalogRecommendations())
        else if (activeTab === 'invoices') setInvoices(await adminDatasource.getInvoiceTemplates())
        else if (activeTab === 'services') setCatalogServices(await adminDatasource.getCatalogServices())
        else if (activeTab === 'upgrade') setUpgradeBundles(await adminDatasource.getUpgradeBundles())
        else if (activeTab === 'pricing') setPricingData(await adminDatasource.getPricingData())
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data') }
      finally { setIsLoading(false) }
    }
    fetchData()
  }, [activeTab, category, group, firebaseUser])

  // Load metadata (categories and groups) for dynamic dropdowns
  useEffect(() => {
    const loadMetadata = async () => {
      if (!firebaseUser) return
      setIsMetadataLoading(true)
      setMetadataError(null)
      try {
        const meta = await adminDatasource.getCatalogMetadata()
        // Prepend 'All' options
        setCategoryOptions([CATEGORIES_KEY, ...(meta.categories || [])])
        setGroupOptions([GROUPS_KEY, ...(meta.groups || [])])
      } catch (err) {
        console.error('Failed to load metadata:', err)
        setMetadataError(err instanceof Error ? err.message : 'Failed to load metadata')
        // Fallback to basic options on error
        setCategoryOptions([CATEGORIES_KEY])
        setGroupOptions([GROUPS_KEY])
      } finally {
        setIsMetadataLoading(false)
      }
    }
    loadMetadata()
  }, [firebaseUser, products.length]) // Re-fetch when products change

  // Handler to create new category
  const handleCreateCategory = async () => {
    const trimmed = newCategoryInput.trim()
    if (!trimmed) return
    setIsCreatingCategory(true)
    try {
      await adminDatasource.createCatalogMetadata('category', trimmed)
      setNewCategoryInput('')
      // Refresh metadata
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
      // Refresh metadata
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

  const handleSavePackage = async () => {
    if (!packageForm.name.trim()) { setError('Package name is required'); return }
    setIsSaving(true)
    try {
      if (editingPackage) {
        const updated = await adminDatasource.updateCatalogPackage(editingPackage.id, packageForm)
        setPackages((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogPackage(packageForm)
        setPackages((p) => [created, ...p])
      }
      setIsPackageFormOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setIsSaving(false) }
  }

  const handleSaveAddon = async () => {
    if (!addonForm.name.trim()) { setError('Add-on name is required'); return }
    setIsSaving(true)
    try {
      if (editingAddon) {
        const updated = await adminDatasource.updateCatalogAddon(editingAddon.id, addonForm)
        setAddons((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogAddon(addonForm)
        setAddons((p) => [created, ...p])
      }
      setIsAddonFormOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setIsSaving(false) }
  }

  const handleSaveTax = async () => {
    if (!taxForm.name.trim()) { setError('Tax name is required'); return }
    setIsSaving(true)
    try {
      if (editingTax) {
        const updated = await adminDatasource.updateCatalogTax(editingTax.id, taxForm)
        setTaxes((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogTax(taxForm)
        setTaxes((p) => [created, ...p])
      }
      setIsTaxFormOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setIsSaving(false) }
  }

  const handleSaveRec = async () => {
    if (!recForm.name.trim()) { setError('Name is required'); return }
    setIsSaving(true)
    try {
      if (editingRec) {
        const updated = await adminDatasource.updateCatalogRecommendation(editingRec.recommendationId, recForm)
        setRecommendations((p) => p.map((i) => (i.recommendationId === updated.recommendationId ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogRecommendation(recForm)
        setRecommendations((p) => [created, ...p])
      }
      setIsRecFormOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setIsSaving(false) }
  }

  const handleSaveInvoice = async () => {
    if (!invoiceForm.name.trim()) { setError('Name is required'); return }
    setIsSaving(true)
    try {
      if (editingInvoice) {
        const updated = await adminDatasource.updateInvoiceTemplate(editingInvoice.id, invoiceForm)
        setInvoices((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createInvoiceTemplate(invoiceForm)
        setInvoices((p) => [created, ...p])
      }
      setIsInvoiceFormOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setIsSaving(false) }
  }

  const handleSaveService = async () => {
    if (!serviceForm.serviceName?.trim()) { setError('Service name is required'); return }
    setIsSaving(true)
    try {
      if (editingCatalogService) {
        const updated = await adminDatasource.updateCatalogService(editingCatalogService.serviceId, serviceForm)
        setCatalogServices((p) => p.map((i) => (i.serviceId === updated.serviceId ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogService(serviceForm)
        setCatalogServices((p) => [created, ...p])
      }
      setIsServiceFormOpen(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed') }
    finally { setIsSaving(false) }
  }

  const handleDeleteItem = async (id: string, activeTab: TabType) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      if (activeTab === 'products') await adminDatasource.deleteCatalogProduct(id)
      else if (activeTab === 'packages') await adminDatasource.deleteCatalogPackage(id)
      else if (activeTab === 'addons') await adminDatasource.deleteCatalogAddon(id)
      else if (activeTab === 'taxes') await adminDatasource.deleteCatalogTax(id)
      else if (activeTab === 'recommendations') await adminDatasource.deleteCatalogRecommendation(id)
      else if (activeTab === 'invoices') await adminDatasource.deleteInvoiceTemplate(id)
      else if (activeTab === 'services') await adminDatasource.deleteCatalogService(id)
      
      // Update state locally
      if (activeTab === 'products') setProducts(p => p.filter(i => i.id !== id))
      else if (activeTab === 'packages') setPackages(p => p.filter(i => i.id !== id))
      else if (activeTab === 'addons') setAddons(p => p.filter(i => i.id !== id))
      else if (activeTab === 'taxes') setTaxes(p => p.filter(i => i.id !== id))
      else if (activeTab === 'recommendations') setRecommendations(p => p.filter(i => i.recommendationId !== id))
      else if (activeTab === 'invoices') setInvoices(p => p.filter(i => i.id !== id))
      else if (activeTab === 'services') setCatalogServices(p => p.filter(i => i.serviceId !== id))
    } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed') }
  }

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div className="fade-in">
          <h1>{tab ? tab.replace(/-/g, ' ') : 'Catalog'}</h1>
          <p className="catalog-subtitle">Manage your product inventory, service packages, and pricing rules.</p>
        </div>
        <div className="catalog-actions slide-up">
          {selectedItems.size > 0 && (
            <button className="primary-btn danger glass-panel" onClick={async () => {
              if (!window.confirm(`Delete ${selectedItems.size} selected items?`)) return
              setIsSaving(true)
              try {
                const ids = Array.from(selectedItems)
                for (const id of ids) {
                  if (activeTab === 'products') await adminDatasource.deleteCatalogProduct(id)
                  else if (activeTab === 'packages') await adminDatasource.deleteCatalogPackage(id)
                  else if (activeTab === 'addons') await adminDatasource.deleteCatalogAddon(id)
                  else if (activeTab === 'taxes') await adminDatasource.deleteCatalogTax(id)
                  else if (activeTab === 'recommendations') await adminDatasource.deleteCatalogRecommendation(id)
                  else if (activeTab === 'invoices') await adminDatasource.deleteInvoiceTemplate(id)
                  else if (activeTab === 'services') await adminDatasource.deleteCatalogService(id)
                }
                setSelectedItems(new Set())
                // Refresh all relevant states
                if (activeTab === 'products') setProducts(p => p.filter(i => !ids.includes(i.id)))
                else if (activeTab === 'packages') setPackages(p => p.filter(i => !ids.includes(i.id)))
                else if (activeTab === 'addons') setAddons(p => p.filter(i => !ids.includes(i.id)))
                else if (activeTab === 'taxes') setTaxes(p => p.filter(i => !ids.includes(i.id)))
                else if (activeTab === 'recommendations') setRecommendations(p => p.filter(i => !ids.includes(i.recommendationId)))
                else if (activeTab === 'invoices') setInvoices(p => p.filter(i => !ids.includes(i.id)))
                else if (activeTab === 'services') setCatalogServices(p => p.filter(i => !ids.includes(i.serviceId)))
              } catch (err) { setError(err instanceof Error ? err.message : 'Bulk delete failed') }
              finally { setIsSaving(false) }
            }}>🗑️ Delete {selectedItems.size} Items</button>
          )}
          {['products', 'packages', 'addons', 'taxes', 'recommendations', 'invoices', 'services'].includes(activeTab) && (
            <button className="primary-btn" onClick={() => {
              if (activeTab === 'products') { setEditingProduct(null); setProductForm({ name: '', category: 'Cameras', group: 'Core', unit: 'unit', price: 0, status: 'active' }); setIsProductFormOpen(true); }
              else if (activeTab === 'packages') { setEditingPackage(null); setPackageForm({ name: '', description: '', productIds: [], totalPrice: 0, discountPercent: 0, finalPrice: 0, status: 'active' }); setIsPackageFormOpen(true); }
              else if (activeTab === 'addons') { setEditingAddon(null); setAddonForm({ name: '', description: '', category: 'Services', price: 0, status: 'active' }); setIsAddonFormOpen(true); }
              else if (activeTab === 'taxes') { setEditingTax(null); setTaxForm({ name: '', description: '', rate: 0, status: 'active' }); setIsTaxFormOpen(true); }
              else if (activeTab === 'recommendations') { setEditingRec(null); setRecForm({ name: '', description: '', productIds: [], placement: 'checkout', serviceTypes: [], isAvailable: true, displayPriority: 0 }); setIsRecFormOpen(true); }
              else if (activeTab === 'invoices') { setEditingInvoice(null); setInvoiceForm({ name: '', description: '', terms: '', notes: '', showTax: true, status: 'active' }); setIsInvoiceFormOpen(true); }
              else if (activeTab === 'services') { setEditingCatalogService(null); setServiceForm({ serviceName: '', description: '', category: 'installation', basePrice: 0, isAvailable: true, productIds: [] }); setIsServiceFormOpen(true); }
            }}>+ Add New Item</button>
          )}
        </div>
      </div>

      <div className="catalog-tabs fade-in">
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
      </div>

      {error && <div className="catalog-error slide-up">{error}</div>}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
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
                        <button className="icon-btn danger" onClick={() => handleDeleteItem(p.id, 'products')}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* PACKAGES TAB */}
      {activeTab === 'packages' && (
        <div className="catalog-table-wrapper slide-up">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={packages.length > 0 && selectedItems.size === packages.length} onChange={() => toggleSelectAll(packages, 'id')} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Package Name</th>
                <th className="num">Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className={selectedItems.has(pkg.id) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selectedItems.has(pkg.id)} onChange={() => toggleSelection(pkg.id)} /></td>
                  <td>{pkg.name}</td>
                  <td className="num">Rs {pkg.finalPrice.toLocaleString()}</td>
                  <td><span className={`status ${pkg.status}`}>{pkg.status}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingPackage(pkg); setPackageForm(pkg); setIsPackageFormOpen(true); }}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteItem(pkg.id, 'packages')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD-ONS TAB */}
      {activeTab === 'addons' && (
        <div className="catalog-table-wrapper slide-up">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={addons.length > 0 && selectedItems.size === addons.length} onChange={() => toggleSelectAll(addons, 'id')} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Add-on Name</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((a) => (
                <tr key={a.id} className={selectedItems.has(a.id) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selectedItems.has(a.id)} onChange={() => toggleSelection(a.id)} /></td>
                  <td>{a.name}</td>
                  <td>{a.category}</td>
                  <td className="num">Rs {a.price.toLocaleString()}</td>
                  <td><span className={`status ${a.status}`}>{a.status}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingAddon(a); setAddonForm(a); setIsAddonFormOpen(true); }}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteItem(a.id, 'addons')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="catalog-table-wrapper slide-up">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={catalogServices.length > 0 && selectedItems.size === catalogServices.length} onChange={() => toggleSelectAll(catalogServices, 'serviceId')} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('serviceName')}>Service Package</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalogServices.map((s) => (
                <tr key={s.serviceId} className={selectedItems.has(s.serviceId) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selectedItems.has(s.serviceId)} onChange={() => toggleSelection(s.serviceId)} /></td>
                  <td>{s.serviceName}</td>
                  <td style={{ textTransform: 'capitalize' }}>{s.category}</td>
                  <td className="num">Rs {s.basePrice.toLocaleString()}</td>
                  <td><span className={`status ${s.isAvailable ? 'active' : 'inactive'}`}>{s.isAvailable ? 'active' : 'inactive'}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingCatalogService(s); setServiceForm(s); setIsServiceFormOpen(true); }}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteItem(s.serviceId, 'services')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PRICING TAB */}
      {activeTab === 'pricing' && (
        <div className="slide-up">
          <div className="pricing-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {['installation', 'maintenance', 'repair', 'amc'].filter(s => !pricingSection || s === pricingSection).map((section) => (
              <div key={section} className="catalog-table-wrapper" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{section} Pricing</h3>
                  <button className="icon-btn" onClick={() => navigate(`/catalog/builder/${section === 'installation' ? 'Installation' : section.charAt(0).toUpperCase() + section.slice(1)}`)}>Configure Tree</button>
                </div>
                <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', maxHeight: '400px', overflowY: 'auto' }}>
                  <pre style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{JSON.stringify(pricingData[section as keyof PricingSet] || { message: 'Data loading...' }, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAXES TAB */}
      {activeTab === 'taxes' && (
        <div className="catalog-table-wrapper slide-up">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={taxes.length > 0 && selectedItems.size === taxes.length} onChange={() => toggleSelectAll(taxes, 'id')} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Tax Name</th>
                <th>Rate %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t) => (
                <tr key={t.id} className={selectedItems.has(t.id) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selectedItems.has(t.id)} onChange={() => toggleSelection(t.id)} /></td>
                  <td>{t.name}</td>
                  <td>{t.rate}%</td>
                  <td><span className={`status ${t.status}`}>{t.status}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingTax(t); setTaxForm(t); setIsTaxFormOpen(true); }}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteItem(t.id, 'taxes')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RECOMMENDATIONS TAB */}
      {activeTab === 'recommendations' && (
        <div className="catalog-table-wrapper slide-up">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={recommendations.length > 0 && selectedItems.size === recommendations.length} onChange={() => toggleSelectAll(recommendations, 'recommendationId')} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Recommendation</th>
                <th>Placement</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => (
                <tr key={r.recommendationId} className={selectedItems.has(r.recommendationId) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selectedItems.has(r.recommendationId)} onChange={() => toggleSelection(r.recommendationId)} /></td>
                  <td>{r.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.placement}</td>
                  <td><span className={`status ${r.isAvailable ? 'active' : 'inactive'}`}>{r.isAvailable ? 'active' : 'inactive'}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingRec(r); setRecForm(r); setIsRecFormOpen(true); }}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteItem(r.recommendationId, 'recommendations')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* UPGRADE TAB */}
      {activeTab === 'upgrade' && (
        <div className="catalog-table-wrapper slide-up">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th className="num">Price</th>
              </tr>
            </thead>
            <tbody>
              {upgradeBundles.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.name}</td>
                  <td>{b.description}</td>
                  <td className="num">Rs {b.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="catalog-table-wrapper slide-up">
          <table className="catalog-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={invoices.length > 0 && selectedItems.size === invoices.length} onChange={() => toggleSelectAll(invoices, 'id')} /></th>
                <th>Template Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className={selectedItems.has(i.id) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selectedItems.has(i.id)} onChange={() => toggleSelection(i.id)} /></td>
                  <td>{i.name}</td>
                  <td><span className={`status ${i.status}`}>{i.status}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => { setEditingInvoice(i); setInvoiceForm(i); setIsInvoiceFormOpen(true); }}>Edit</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteItem(i.id, 'invoices')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
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

      {isPackageFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingPackage ? 'Update Package' : 'Create Package'}</h2>
              <button className="icon-btn" onClick={() => setIsPackageFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={packageForm.name} onChange={(e) => setPackageForm({...packageForm, name: e.target.value})} /></label>
              <label>Description <textarea value={packageForm.description} onChange={(e) => setPackageForm({...packageForm, description: e.target.value})} /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>Final Price <input type="number" value={packageForm.finalPrice} onChange={(e) => setPackageForm({...packageForm, finalPrice: Number(e.target.value)})} /></label>
                <label>Status <select value={packageForm.status} onChange={(e) => setPackageForm({...packageForm, status: e.target.value as 'active' | 'inactive'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsPackageFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSavePackage} disabled={isSaving}>Save Package</button>
            </div>
          </div>
        </div>
      )}

      {isAddonFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingAddon ? 'Update Add-on' : 'Create Add-on'}</h2>
              <button className="icon-btn" onClick={() => setIsAddonFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={addonForm.name} onChange={(e) => setAddonForm({...addonForm, name: e.target.value})} /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>Category <input value={addonForm.category} onChange={(e) => setAddonForm({...addonForm, category: e.target.value})} /></label>
                <label>Price <input type="number" value={addonForm.price} onChange={(e) => setAddonForm({...addonForm, price: Number(e.target.value)})} /></label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsAddonFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveAddon} disabled={isSaving}>Save Add-on</button>
            </div>
          </div>
        </div>
      )}

      {isTaxFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingTax ? 'Update Tax' : 'Create Tax Rule'}</h2>
              <button className="icon-btn" onClick={() => setIsTaxFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Tax Name <input value={taxForm.name} onChange={(e) => setTaxForm({...taxForm, name: e.target.value})} /></label>
              <label>Rate (%) <input type="number" value={taxForm.rate} onChange={(e) => setTaxForm({...taxForm, rate: Number(e.target.value)})} /></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsTaxFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveTax} disabled={isSaving}>Save Tax</button>
            </div>
          </div>
        </div>
      )}

      {isRecFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingRec ? 'Update Recommendation' : 'Create Recommendation'}</h2>
              <button className="icon-btn" onClick={() => setIsRecFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={recForm.name} onChange={(e) => setRecForm({...recForm, name: e.target.value})} /></label>
              <label>Placement
                <select value={recForm.placement} onChange={(e) => setRecForm({...recForm, placement: e.target.value as any})}>
                  <option value="checkout">Checkout</option>
                  <option value="cart">Cart</option>
                  <option value="service">Service</option>
                </select>
              </label>
              <label>Display Priority <input type="number" value={recForm.displayPriority} onChange={(e) => setRecForm({...recForm, displayPriority: Number(e.target.value)})} /></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsRecFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveRec} disabled={isSaving}>Save Recommendation</button>
            </div>
          </div>
        </div>
      )}

      {isInvoiceFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingInvoice ? 'Update Template' : 'Create Template'}</h2>
              <button className="icon-btn" onClick={() => setIsInvoiceFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={invoiceForm.name} onChange={(e) => setInvoiceForm({...invoiceForm, name: e.target.value})} /></label>
              <label>Notes <textarea rows={3} value={invoiceForm.notes} onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})} /></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsInvoiceFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveInvoice} disabled={isSaving}>Save Template</button>
            </div>
          </div>
        </div>
      )}

      {isServiceFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingCatalogService ? 'Update Service' : 'Create Service'}</h2>
              <button className="icon-btn" onClick={() => setIsServiceFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Service Name <input value={serviceForm.serviceName} onChange={(e) => setServiceForm({...serviceForm, serviceName: e.target.value})} /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>Category
                  <select value={serviceForm.category} onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}>
                    <option value="installation">Installation</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="amc">AMC</option>
                    <option value="repair">Repair</option>
                  </select>
                </label>
                <label>Price <input type="number" value={serviceForm.basePrice} onChange={(e) => setServiceForm({...serviceForm, basePrice: Number(e.target.value)})} /></label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsServiceFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveService} disabled={isSaving}>Save Service</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
