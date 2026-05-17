import { useState, useEffect } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import './mobile_preview.css'

interface SduiComponent {
  id: string
  type: string
  data: any
  action?: any
  visibility?: any
}

interface CmsBlock {
  id: string
  type: string
  order: number
  visible: boolean
  title: string
  subtitle: string
  imageUrl: string
  ctaLabel: string
  ctaRoute: string
  expiresAt: string
}

const CMS_TYPES = [
  { value: 'banner', label: 'Banner', icon: '📋' },
  { value: 'promo', label: 'Promo Card', icon: '🏷️' },
  { value: 'update', label: 'Update/News', icon: '📢' },
  { value: 'category_grid', label: 'Category Grid', icon: '📱' },
  { value: 'featured', label: 'Featured Products', icon: '⭐' },
]

const ICON_OPTIONS = [
  { value: 'engineering_outlined', label: '🛠️ Engineering' },
  { value: 'map_outlined', label: '📍 Map' },
  { value: 'card_giftcard_outlined', label: '🎁 Gift Card' },
  { value: 'info_outline', label: 'ℹ️ Info' },
  { value: 'warning_amber_rounded', label: '⚠️ Warning' },
  { value: 'campaign_outlined', label: '📢 Campaign' },
  { value: 'celebration_outlined', label: '🎉 Celebration' },
  { value: 'local_offer_outlined', label: '🏷️ Offer' },
  { value: 'star_outline', label: '⭐ Star' },
]

const blankBlock = () => ({
  type: 'banner', order: 0, visible: true, title: '', subtitle: '', imageUrl: '', ctaLabel: '', ctaRoute: '', expiresAt: '',
})

export default function MobilePreviewScreen() {
  const [layouts, setLayouts] = useState<any[]>([])
  const [selectedLayoutId, setSelectedLayoutId] = useState('home')
  const [layout, setLayout] = useState<SduiComponent[]>([])
  const [meta, setMeta] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeComponentIndex, setActiveComponentIndex] = useState<number | null>(null)

  const [cmsRawBlocks, setCmsRawBlocks] = useState<CmsBlock[]>([])
  const [cmsComponents, setCmsComponents] = useState<SduiComponent[]>([])
  const [mergedComponents, setMergedComponents] = useState<SduiComponent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBlock, setNewBlock] = useState(blankBlock())

  const [editingBlock, setEditingBlock] = useState<CmsBlock | null>(null)

  const [customerView, setCustomerView] = useState<SduiComponent[]>([])
  const [customerViewLoading, setCustomerViewLoading] = useState(false)

  useEffect(() => { loadLayouts() }, [])

  useEffect(() => {
    if (selectedLayoutId) {
      loadLayout(selectedLayoutId)
      fetchCustomerView()
    }
  }, [selectedLayoutId])

  useEffect(() => {
    const merged = [...layout]
    if (cmsComponents.length > 0) {
      const annIdx = merged.findIndex((c) => c.type === 'announcements_list')
      const insertAt = annIdx >= 0 ? annIdx : merged.length
      merged.splice(insertAt, 0, ...cmsComponents)
    }
    setMergedComponents(merged)
  }, [layout, cmsComponents])

  const isCmsId = (id: string) => id.startsWith('cms_')

  const cmsToSduiComponents = (blocks: CmsBlock[]): SduiComponent[] => {
    return blocks
      .filter((b) => b.visible !== false)
      .map((b) => {
        const action = b.ctaLabel && b.ctaRoute
          ? { type: 'navigate' as const, route: b.ctaRoute }
          : undefined
        switch (b.type) {
          case 'banner':
            return {
              id: `cms_banner_${b.id}`,
              type: 'banner',
              data: { title: b.title || '', subtitle: b.subtitle || '', gradientColors: ['#0A84FF', '#1E40AF'], icon: 'arrow_forward_rounded' },
              action,
            }
          case 'promo':
            return {
              id: `cms_promo_${b.id}`,
              type: 'promo_banner',
              data: { title: b.title || '', subtitle: b.subtitle || '', icon: 'local_offer_outlined', backgroundColor: '#111827' },
              action,
            }
          case 'update':
            return {
              id: `cms_update_${b.id}`,
              type: 'info_card',
              data: { title: b.title || '', subtitle: b.subtitle || '', icon: 'info_outline', backgroundColor: '#FEF2F2', textColor: '#991B1B' },
              action,
            }
          default:
            return null
        }
      })
      .filter(Boolean) as SduiComponent[]
  }

  const loadLayouts = async () => {
    try { setLayouts(await adminDatasource.fetchSduiLayouts()) }
    catch { /* ignore */ }
  }

  const loadLayout = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [layoutData, cmsData] = await Promise.all([
        adminDatasource.fetchSduiLayout(id),
        adminDatasource.getHomeCmsBlocks().catch((): any[] => []),
      ])
      setLayout(layoutData.layout || [])
      setMeta(layoutData.meta || {})
      setCmsRawBlocks(cmsData)
      setCmsComponents(cmsToSduiComponents(cmsData))
    } catch {
      setError('Failed to load layout')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomerView = async () => {
    setCustomerViewLoading(true)
    try {
      const data = await adminDatasource.fetchCustomerSduiView(selectedLayoutId)
      setCustomerView(data.layout || [])
    } catch {
      /* fall back to merged view */
    } finally {
      setCustomerViewLoading(false)
    }
  }

  const reloadCms = async () => {
    try {
      const data = await adminDatasource.getHomeCmsBlocks()
      setCmsRawBlocks(data)
      setCmsComponents(cmsToSduiComponents(data))
    } catch { /* ignore */ }
  }

  const handleSaveLayout = async () => {
    setIsSaving(true)
    try {
      await adminDatasource.saveSduiLayout(selectedLayoutId, layout, meta)
      alert('Layout saved!')
    } catch {
      alert('Failed to save layout')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetLayout = async () => {
    if (!confirm('Reset this layout to the default template? CMS blocks will not be affected.')) return
    setIsSaving(true)
    try {
      await adminDatasource.resetSduiLayout(selectedLayoutId)
      await loadLayout(selectedLayoutId)
    } catch {
      alert('Failed to reset layout')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSduiComponent = (index: number, newData: any) => {
    const next = [...layout]
    next[index] = { ...next[index], data: { ...next[index].data, ...newData } }
    setLayout(next)
  }

  const removeSduiComponent = (index: number) => {
    if (!confirm('Remove this component?')) return
    setLayout(layout.filter((_, i) => i !== index))
    setActiveComponentIndex(null)
  }

  const moveSduiComponent = (index: number, direction: 'up' | 'down') => {
    const next = [...layout]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    [next[index], next[target]] = [next[target], next[index]]
    setLayout(next)
    setActiveComponentIndex(target)
  }

  const addCmsBlock = async () => {
    setIsSaving(true)
    try {
      await adminDatasource.createHomeCmsBlock(newBlock)
      setShowAddModal(false)
      setNewBlock(blankBlock())
      await reloadCms()
      await fetchCustomerView()
    } catch {
      alert('Failed to add block')
    } finally {
      setIsSaving(false)
    }
  }

  const saveEditedBlock = async () => {
    if (!editingBlock) return
    setIsSaving(true)
    try {
      await adminDatasource.updateHomeCmsBlock(editingBlock.id, {
        title: editingBlock.title,
        subtitle: editingBlock.subtitle,
        imageUrl: editingBlock.imageUrl,
        ctaLabel: editingBlock.ctaLabel,
        ctaRoute: editingBlock.ctaRoute,
        expiresAt: editingBlock.expiresAt,
        visible: editingBlock.visible,
      })
      setEditingBlock(null)
      await reloadCms()
      await fetchCustomerView()
    } catch {
      alert('Failed to update block')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCmsVisibility = async (block: CmsBlock) => {
    try {
      await adminDatasource.updateHomeCmsBlock(block.id, { visible: !block.visible })
      await reloadCms()
      await fetchCustomerView()
    } catch { /* ignore */ }
  }

  const deleteCmsBlock = async (id: string) => {
    if (!confirm('Delete this CMS block?')) return
    try {
      await adminDatasource.deleteHomeCmsBlock(id)
      await reloadCms()
      await fetchCustomerView()
    } catch { /* ignore */ }
  }

  const moveCmsBlock = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= cmsRawBlocks.length) return
    const next = [...cmsRawBlocks]
    const temp = next[index].order
    next[index] = { ...next[index], order: next[target].order }
    next[target] = { ...next[target], order: temp }
    setCmsRawBlocks(next)
    setCmsComponents(cmsToSduiComponents(next))
    try {
      await adminDatasource.updateHomeCmsBlock(next[index].id, { order: next[index].order })
      await adminDatasource.updateHomeCmsBlock(next[target].id, { order: next[target].order })
      await reloadCms()
    } catch {
      await reloadCms()
    }
  }

  const cmsTypeIcon: Record<string, string> = {
    banner: '📋', promo: '🏷️', update: '📢', category_grid: '📱', featured: '⭐',
  }

  function TextField({ label, value, onChange, type, placeholder }: any) {
    return (
      <div className="mp-field">
        <label>{label}</label>
        <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    )
  }

  function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
      <div className="mp-field mp-field-color">
        <label>{label}</label>
        <div className="mp-color-row">
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      </div>
    )
  }

  function AnnouncementsEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
    const items: any[] = data.items || []
    const updateItem = (idx: number, field: string, value: any) => {
      const next = [...items]
      next[idx] = { ...next[idx], [field]: value }
      onChange({ items: next })
    }
    const addItem = () => {
      onChange({ items: [...items, { title: '', body: '', icon: 'info_outline', color: '#8B5CF6' }] })
    }
    const removeItem = (idx: number) => {
      onChange({ items: items.filter((_, i) => i !== idx) })
    }
    return (
      <div className="mp-ann-editor">
        <TextField label="Section Title" value={data.title || ''} onChange={(v: string) => onChange({ title: v })} />
        <TextField label="Max Items" type="number" value={data.maxItems ?? 3} onChange={(v: string) => onChange({ maxItems: Number(v) })} />
        <div className="mp-ann-hint">Announcements ({items.length})</div>
        {items.map((item, idx) => (
          <div key={idx} className="mp-ann-card">
            <div className="mp-ann-card-header">
              <span className="mp-ann-card-num">#{idx + 1}</span>
              <button className="icon-btn danger" onClick={() => removeItem(idx)} title="Remove">✕</button>
            </div>
            <TextField label="Title" value={item.title || ''} onChange={(v: string) => updateItem(idx, 'title', v)} placeholder="Announcement title" />
            <TextField label="Body" value={item.body || ''} onChange={(v: string) => updateItem(idx, 'body', v)} placeholder="Announcement body text" />
            <div className="mp-field">
              <label>Icon</label>
              <select value={item.icon || 'info_outline'} onChange={(e) => updateItem(idx, 'icon', e.target.value)}>
                {ICON_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <ColorField label="Color" value={item.color || '#8B5CF6'} onChange={(v: string) => updateItem(idx, 'color', v)} />
          </div>
        ))}
        <button className="secondary-btn mp-ann-add-btn" onClick={addItem}>+ Add Announcement</button>
      </div>
    )
  }

  function ComponentEditor() {
    if (activeComponentIndex === null || !layout[activeComponentIndex]) return null
    const comp = layout[activeComponentIndex]
    const update = (newData: any) => updateSduiComponent(activeComponentIndex, newData)
    const data = comp.data || {}

    return (
      <div className="mp-editor-panel slide-up">
        <div className="mp-ep-header">
          <h4>Edit {comp.type}</h4>
          <button className="icon-btn danger" onClick={() => removeSduiComponent(activeComponentIndex)}>Delete</button>
        </div>
        <div className="mp-ep-body">
          {comp.type === 'section_title' && (
            <TextField label="Heading Text" value={data.text || ''} onChange={(v: string) => update({ text: v })} placeholder="e.g. Book a Service" />
          )}
          {comp.type === 'banner' && (
            <>
              <TextField label="Title" value={data.title || ''} onChange={(v: string) => update({ title: v })} placeholder="e.g. Browse All Products" />
              <TextField label="Subtitle" value={data.subtitle || ''} onChange={(v: string) => update({ subtitle: v })} placeholder="e.g. Explore our catalog" />
              <ColorField label="Gradient Start" value={data.gradientColors?.[0] || '#0A84FF'} onChange={(v: string) => update({ gradientColors: [v, data.gradientColors?.[1] || '#1E40AF'] })} />
              <ColorField label="Gradient End" value={data.gradientColors?.[1] || '#1E40AF'} onChange={(v: string) => update({ gradientColors: [data.gradientColors?.[0] || '#0A84FF', v] })} />
            </>
          )}
          {comp.type === 'promo_banner' && (
            <>
              <TextField label="Title" value={data.title || ''} onChange={(v: string) => update({ title: v })} placeholder="e.g. 10% OFF Installation" />
              <TextField label="Subtitle" value={data.subtitle || ''} onChange={(v: string) => update({ subtitle: v })} placeholder="e.g. Use code SAFECOM10" />
              <ColorField label="Background Color" value={data.backgroundColor || '#111827'} onChange={(v: string) => update({ backgroundColor: v })} />
            </>
          )}
          {comp.type === 'info_card' && (
            <>
              <TextField label="Title" value={data.title || ''} onChange={(v: string) => update({ title: v })} placeholder="e.g. Service not available" />
              <TextField label="Subtitle" value={data.subtitle || ''} onChange={(v: string) => update({ subtitle: v })} placeholder="e.g. We currently serve..." />
              <ColorField label="Background Color" value={data.backgroundColor || '#FEF2F2'} onChange={(v: string) => update({ backgroundColor: v })} />
              <ColorField label="Text Color" value={data.textColor || '#991B1B'} onChange={(v: string) => update({ textColor: v })} />
            </>
          )}
          {comp.type === 'service_grid' && (
            <TextField label="Columns" type="number" value={data.columns ?? 3} onChange={(v: string) => update({ columns: Number(v) })} />
          )}
          {comp.type === 'spacer' && (
            <TextField label="Height (px)" type="number" value={data.height ?? 10} onChange={(v: string) => update({ height: Number(v) })} />
          )}
          {comp.type === 'location_header' && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Location header is automatically resolved from user GPS. Not editable here.</p>
          )}
          {comp.type === 'announcements_list' && (
            <AnnouncementsEditor data={data} onChange={update} />
          )}
          {['horizontal_recommendations', 'horizontal_services', 'horizontal_products'].includes(comp.type) && (
            <TextField label="Title" value={data.title || ''} onChange={(v: string) => update({ title: v })} />
          )}
          {!['section_title', 'banner', 'promo_banner', 'info_card', 'service_grid', 'spacer', 'location_header', 'announcements_list', 'horizontal_recommendations', 'horizontal_services', 'horizontal_products'].includes(comp.type) && (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Fields for: {comp.type}</p>
              {Object.entries(data).map(([key, val]) => (
                <div key={key} className="mp-field">
                  <label>{key}</label>
                  {typeof val === 'string' ? (
                    <input value={val as string} onChange={(e) => update({ [key]: e.target.value })} />
                  ) : typeof val === 'number' ? (
                    <input type="number" value={val as number} onChange={(e) => update({ [key]: Number(e.target.value) })} />
                  ) : typeof val === 'boolean' ? (
                    <input type="checkbox" checked={val as boolean} onChange={(e) => update({ [key]: e.target.checked })} />
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mp-container">
      <div className="mp-header">
        <div>
          <h1>Customer Mobile Preview</h1>
          <p>SDUI Layout + CMS Content <span className="mp-injected-badge">Live preview</span></p>
        </div>
        <div className="mp-actions">
          <select value={selectedLayoutId} onChange={(e) => setSelectedLayoutId(e.target.value)}>
            {layouts.map(l => <option key={l.id} value={l.id}>{l.id}</option>)}
            {!layouts.find(l => l.id === 'home') && <option value="home">home (default)</option>}
          </select>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>+ Add CMS Block</button>
          <button className="primary-btn" onClick={handleSaveLayout} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save SDUI Layout'}
          </button>
          <button className="secondary-btn danger" onClick={handleResetLayout}>Reset SDUI</button>
        </div>
      </div>

      {error && <div className="catalog-error" style={{ margin: '8px 32px' }}>{error} <button onClick={() => setError(null)}>×</button></div>}

      <div className="mp-content">
        <div className="mp-sidebar">
          <div className="mp-cms-section">
            <h3>CMS Content <span className="mp-cms-badge">{cmsRawBlocks.length}</span></h3>
            <p className="mp-cms-hint">Click ✏️ to edit, ↑↓ to reorder</p>
            <div className="mp-component-list">
              {cmsRawBlocks.map((block, idx) => (
                <div key={block.id} className="mp-component-item mp-cms-item">
                  <div className="mp-ci-info">
                    <span className="mp-ci-type">{cmsTypeIcon[block.type] || '📄'} {block.type}</span>
                    <span className="mp-ci-id">{block.title || '(no title)'}</span>
                  </div>
                  <div className="mp-ci-actions" style={{ gap: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingBlock({ ...block }) }} title="Edit">✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); moveCmsBlock(idx, 'up') }} disabled={idx === 0} title="Move up">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveCmsBlock(idx, 'down') }} disabled={idx === cmsRawBlocks.length - 1} title="Move down">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); toggleCmsVisibility(block) }} title="Toggle visibility">
                      {block.visible ? '👁️' : '🚫'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteCmsBlock(block.id) }} title="Delete" className="icon-btn danger">🗑️</button>
                  </div>
                </div>
              ))}
              {cmsRawBlocks.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>No CMS blocks yet. Click "+ Add CMS Block" to add banners, promos, or updates.</p>
              )}
            </div>
          </div>

          <hr className="mp-cms-divider" />

          <h3>SDUI Components</h3>
          <div className="mp-component-list">
            {layout.map((c, i) => (
              <div 
                key={c.id + i} 
                className={`mp-component-item ${activeComponentIndex === i ? 'active' : ''}`}
                onClick={() => setActiveComponentIndex(i)}
              >
                <div className="mp-ci-info">
                  <span className="mp-ci-type">{c.type}</span>
                  <span className="mp-ci-id">{c.id}</span>
                </div>
                <div className="mp-ci-actions">
                  <button onClick={(e) => { e.stopPropagation(); moveSduiComponent(i, 'up') }}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); moveSduiComponent(i, 'down') }}>↓</button>
                </div>
              </div>
            ))}
          </div>

          <ComponentEditor />
        </div>

        <div className="mp-preview-area">
          {isLoading ? (
            <div className="catalog-loading">Loading...</div>
          ) : (
            <div className="mp-frames-container">
              <div className="mp-frame-wrapper">
                <div className="mp-frame-label">
                  <span>📱 Customer View</span>
                  <span className="mp-frame-sub-label">What the app renders</span>
                </div>
                <div className="phone-frame">
                  <div className="phone-screen">
                    <div className="phone-status-bar">
                      <span>9:41</span>
                      <div className="phone-status-icons">📶 🔋</div>
                    </div>
                    <div className="phone-scroll-content">
                      {customerViewLoading ? (
                        <p style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading customer view...</p>
                      ) : customerView.length > 0 ? (
                        customerView.map((c, i) => (
                          <div key={c.id + i} className="preview-component">
                            <ComponentRenderer component={c} />
                          </div>
                        ))
                      ) : (
                        <p style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No components</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mp-frame-wrapper">
                <div className="mp-frame-label">
                  <span>✏️ Edit Preview</span>
                  <span className="mp-frame-sub-label">CMS injected | Click to select</span>
                </div>
                <div className="phone-frame">
                  <div className="phone-screen">
                    <div className="phone-status-bar">
                      <span>9:41</span>
                      <div className="phone-status-icons">📶 🔋</div>
                    </div>
                    <div className="phone-scroll-content">
                      {mergedComponents.map((c, i) => (
                        <div 
                          key={c.id + i} 
                          className={`preview-component ${isCmsId(c.id) ? 'preview-cms' : ''} ${activeComponentIndex !== null && layout[activeComponentIndex]?.id === c.id ? 'highlight' : ''}`}
                          onClick={() => {
                            const layoutIdx = layout.findIndex((lc) => lc.id === c.id)
                            if (layoutIdx >= 0) setActiveComponentIndex(layoutIdx)
                          }}
                        >
                          <ComponentRenderer component={c} />
                          {isCmsId(c.id) && (
                            <div className="preview-cms-tag">CMS Block</div>
                          )}
                        </div>
                      ))}
                      {mergedComponents.length === 0 && (
                        <p style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No components to preview</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add CMS Block</h2>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="cms-form-grid">
                <label>
                  Type
                  <select value={newBlock.type} onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}>
                    {CMS_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}
                  </select>
                </label>
                <label>
                  Display Order
                  <input type="number" value={newBlock.order} onChange={(e) => setNewBlock({ ...newBlock, order: Number(e.target.value) })} />
                </label>
                <label className="cms-full">
                  Title
                  <input type="text" value={newBlock.title} onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })} placeholder="e.g. 10% Off Installation" />
                </label>
                <label className="cms-full">
                  Subtitle / Description
                  <input type="text" value={newBlock.subtitle} onChange={(e) => setNewBlock({ ...newBlock, subtitle: e.target.value })} placeholder="Optional description" />
                </label>
                <label className="cms-full">
                  Image URL
                  <input type="url" value={newBlock.imageUrl} onChange={(e) => setNewBlock({ ...newBlock, imageUrl: e.target.value })} placeholder="https://..." />
                </label>
                <label>
                  CTA Label
                  <input type="text" value={newBlock.ctaLabel} onChange={(e) => setNewBlock({ ...newBlock, ctaLabel: e.target.value })} placeholder="Book Now" />
                </label>
                <label>
                  CTA Route
                  <input type="text" value={newBlock.ctaRoute} onChange={(e) => setNewBlock({ ...newBlock, ctaRoute: e.target.value })} placeholder="/service-types" />
                </label>
                <label>
                  Expires At
                  <input type="datetime-local" value={newBlock.expiresAt} onChange={(e) => setNewBlock({ ...newBlock, expiresAt: e.target.value })} />
                </label>
                <label className="cms-toggle-row">
                  <input type="checkbox" checked={newBlock.visible} onChange={(e) => setNewBlock({ ...newBlock, visible: e.target.checked })} />
                  Visible immediately
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={addCmsBlock} disabled={isSaving}>
                {isSaving ? 'Adding...' : 'Add Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingBlock && (
        <div className="modal-overlay" onClick={() => setEditingBlock(null)}>
          <div className="modal-card cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit CMS Block</h2>
              <button className="icon-btn" onClick={() => setEditingBlock(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="cms-form-grid">
                <label>
                  Type
                  <select value={editingBlock.type} onChange={(e) => setEditingBlock({ ...editingBlock, type: e.target.value })}>
                    {CMS_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}
                  </select>
                </label>
                <label>
                  Display Order
                  <input type="number" value={editingBlock.order} onChange={(e) => setEditingBlock({ ...editingBlock, order: Number(e.target.value) })} />
                </label>
                <label className="cms-full">
                  Title
                  <input type="text" value={editingBlock.title} onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })} placeholder="e.g. 10% Off Installation" />
                </label>
                <label className="cms-full">
                  Subtitle / Description
                  <input type="text" value={editingBlock.subtitle} onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })} placeholder="Optional description" />
                </label>
                <label className="cms-full">
                  Image URL
                  <input type="url" value={editingBlock.imageUrl} onChange={(e) => setEditingBlock({ ...editingBlock, imageUrl: e.target.value })} placeholder="https://..." />
                </label>
                <label>
                  CTA Label
                  <input type="text" value={editingBlock.ctaLabel} onChange={(e) => setEditingBlock({ ...editingBlock, ctaLabel: e.target.value })} placeholder="Book Now" />
                </label>
                <label>
                  CTA Route
                  <input type="text" value={editingBlock.ctaRoute} onChange={(e) => setEditingBlock({ ...editingBlock, ctaRoute: e.target.value })} placeholder="/service-types" />
                </label>
                <label>
                  Expires At
                  <input type="datetime-local" value={editingBlock.expiresAt} onChange={(e) => setEditingBlock({ ...editingBlock, expiresAt: e.target.value })} />
                </label>
                <label className="cms-toggle-row">
                  <input type="checkbox" checked={editingBlock.visible} onChange={(e) => setEditingBlock({ ...editingBlock, visible: e.target.checked })} />
                  Visible
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setEditingBlock(null)}>Cancel</button>
              <button className="primary-btn" onClick={saveEditedBlock} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ComponentRenderer({ component }: { component: SduiComponent }) {
  const { type, data } = component
  switch (type) {
    case 'location_header':
      return (
        <div className="pr-location">
          <div className="pr-loc-icon">📍</div>
          <div className="pr-loc-text">
            <div className="pr-loc-title">Serviceable at {data.serviceArea || 'Patna'}</div>
            <div className="pr-loc-sub">Est. time: {data.estimatedTime || '2-4 hours'}</div>
          </div>
        </div>
      )
    case 'section_title':
      return <h2 className="pr-section-title">{data.text}</h2>
    case 'banner':
      return (
        <div className="pr-banner" style={{ background: `linear-gradient(135deg, ${data.gradientColors?.[0] || '#0A84FF'}, ${data.gradientColors?.[1] || '#000'})` }}>
          <div className="pr-banner-content">
            <h3>{data.title}</h3>
            <p>{data.subtitle}</p>
          </div>
          <div className="pr-banner-icon">→</div>
        </div>
      )
    case 'promo_banner':
      return (
        <div className="pr-promo" style={{ backgroundColor: data.backgroundColor || '#111827' }}>
          <div className="pr-promo-icon">🏷️</div>
          <div className="pr-promo-text">
            <strong>{data.title}</strong>
            <p>{data.subtitle}</p>
          </div>
        </div>
      )
    case 'service_grid':
      return (
        <div className="pr-grid" style={{ gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)` }}>
          {data.items?.length
            ? data.items.map((item: any, i: number) => (
                <div key={i} className="pr-grid-item">
                  <div className="pr-gi-box" style={item.icon ? { backgroundImage: `url(${item.icon})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : undefined} />
                  <div className="pr-gi-label">{item.title || `Service ${i + 1}`}</div>
                </div>
              ))
            : [1,2,3,4,5,6].map(n => <div key={n} className="pr-grid-item"><div className="pr-gi-box" /><div className="pr-gi-label">Service {n}</div></div>)
          }
        </div>
      )
    case 'horizontal_recommendations':
    case 'horizontal_services':
    case 'horizontal_products':
      return (
        <div className="pr-h-list">
          <div className="pr-h-header"><span>{data.title || type}</span> <button>See all</button></div>
          <div className="pr-h-scroll">
             {[1,2,3].map(n => <div key={n} className="pr-h-card" />)}
          </div>
        </div>
      )
    case 'announcements_list':
      return (
        <div className="pr-announcements">
          <h4>{data.title}</h4>
          {data.items?.map((item: any, idx: number) => (
            <div key={idx} className="pr-ann-item">
              <div className="pr-ann-icon" style={{ backgroundColor: item.color }}>!</div>
              <div className="pr-ann-text"><strong>{item.title}</strong><p>{item.body}</p></div>
            </div>
          ))}
        </div>
      )
    case 'info_card':
      return (
        <div className="pr-info-card" style={{ backgroundColor: data.backgroundColor || '#F8FAFC', color: data.textColor || '#334155' }}>
          {data.icon && <span className="pr-ic-icon">{data.icon === 'info_outline' ? 'ℹ️' : data.icon === 'warning_amber_rounded' ? '⚠️' : data.icon === 'info' ? 'ℹ️' : '📌'}</span>}
          <div className="pr-ic-text">
            <strong>{data.title}</strong>
            {data.subtitle && <p>{data.subtitle}</p>}
          </div>
        </div>
      )
    case 'spacer':
      return <div style={{ height: data.height || 10 }} />
    default:
      return <div className="pr-fallback">Unknown: {type}</div>
  }
}
