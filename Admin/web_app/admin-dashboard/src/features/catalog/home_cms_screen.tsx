import { useState, useEffect, useCallback } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import './home_cms_screen.css'

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

const TYPE_ICONS: Record<string, string> = {
  banner: '📋', promo: '🏷️', update: '📢', category_grid: '📱', featured: '⭐',
}

export default function HomeCmsScreen() {
  const [blocks, setBlocks] = useState<CmsBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<CmsBlock>>({})
  const [newBlock, setNewBlock] = useState({
    type: 'banner', order: 0, visible: true, title: '', subtitle: '', imageUrl: '', ctaLabel: '', ctaRoute: '', expiresAt: '',
  })

  const loadBlocks = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminDatasource.getHomeCmsBlocks()
      setBlocks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  const startEdit = (block: CmsBlock) => {
    setEditingId(block.id)
    setEditForm({ ...block })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleEditChange = (key: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveEdit = async () => {
    if (!editingId || !editForm) return
    setSaving(true)
    try {
      await adminDatasource.updateHomeCmsBlock(editingId, editForm)
      setEditingId(null)
      setEditForm({})
      await loadBlocks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    setSaving(true)
    try {
      await adminDatasource.createHomeCmsBlock(newBlock)
      setShowAdd(false)
      setNewBlock({ type: 'banner', order: 0, visible: true, title: '', subtitle: '', imageUrl: '', ctaLabel: '', ctaRoute: '', expiresAt: '' })
      await loadBlocks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVisible = async (block: CmsBlock) => {
    try {
      await adminDatasource.updateHomeCmsBlock(block.id, { visible: !block.visible })
      await loadBlocks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this block?')) return
    try {
      await adminDatasource.deleteHomeCmsBlock(id)
      await loadBlocks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const moveBlock = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    const temp = next[index].order
    next[index] = { ...next[index], order: next[target].order }
    next[target] = { ...next[target], order: temp }
    setBlocks(next)
    try {
      await adminDatasource.updateHomeCmsBlock(next[index].id, { order: next[index].order })
      await adminDatasource.updateHomeCmsBlock(next[target].id, { order: next[target].order })
      await loadBlocks()
    } catch {
      await loadBlocks()
    }
  }

  return (
    <div className="cms-screen">
      <div className="cms-header">
        <div>
          <h1>Home CMS</h1>
          <p className="cms-subtitle">Manage banners, promos, and updates shown on the customer home page. These auto-inject into the SDUI home layout.</p>
        </div>
        <div className="cms-header-actions">
          <button className="secondary-btn" onClick={() => window.open('/mobile-preview', '_blank')}>📱 Preview</button>
          <button className="primary-btn" onClick={() => setShowAdd(true)}>+ Add Block</button>
        </div>
      </div>

      {error && <div className="catalog-error">{error} <button onClick={() => setError(null)}>×</button></div>}

      {isLoading ? (
        <div className="catalog-loading">Loading CMS blocks...</div>
      ) : blocks.length === 0 ? (
        <div className="cms-empty">
          <p>No CMS blocks found. Click "+ Add Block" to create your first home page content.</p>
        </div>
      ) : (
        <div className="cms-table-wrapper">
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Type</th>
                <th>Content</th>
                <th style={{ width: 140 }}>CTA</th>
                <th style={{ width: 90 }}>Visible</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, idx) => (
                <tr key={block.id} className={editingId === block.id ? 'editing-row' : ''}>
                  {editingId === block.id ? (
                    <>
                      <td className="num">{block.order}</td>
                      <td>
                        <select value={editForm.type || block.type} onChange={(e) => handleEditChange('type', e.target.value)}>
                          {CMS_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                        </select>
                      </td>
                      <td>
                        <div className="cms-inline-fields">
                          <input value={editForm.title ?? block.title} onChange={(e) => handleEditChange('title', e.target.value)} placeholder="Title" />
                          <input value={editForm.subtitle ?? block.subtitle} onChange={(e) => handleEditChange('subtitle', e.target.value)} placeholder="Subtitle / description" />
                          <input value={editForm.imageUrl ?? block.imageUrl} onChange={(e) => handleEditChange('imageUrl', e.target.value)} placeholder="Image URL (https://...)" />
                        </div>
                      </td>
                      <td>
                        <div className="cms-inline-cta">
                          <input value={editForm.ctaLabel ?? block.ctaLabel} onChange={(e) => handleEditChange('ctaLabel', e.target.value)} placeholder="Label" />
                          <input value={editForm.ctaRoute ?? block.ctaRoute} onChange={(e) => handleEditChange('ctaRoute', e.target.value)} placeholder="/route" />
                        </div>
                      </td>
                      <td>
                        <label className="cms-toggle">
                          <input type="checkbox" checked={editForm.visible ?? block.visible} onChange={(e) => handleEditChange('visible', e.target.checked)} />
                          <span className={`cms-status ${editForm.visible ?? block.visible ? 'active' : 'inactive'}`}>
                            {(editForm.visible ?? block.visible) ? 'Active' : 'Hidden'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div className="cms-inline-actions">
                          <button className="primary-btn small" onClick={saveEdit} disabled={saving}>Save</button>
                          <button className="secondary-btn small" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="num">
                        <div className="cms-order-controls">
                          <span>{block.order}</span>
                          <div className="cms-order-btns">
                            <button disabled={idx === 0} onClick={() => moveBlock(idx, 'up')} title="Move up">↑</button>
                            <button disabled={idx === blocks.length - 1} onClick={() => moveBlock(idx, 'down')} title="Move down">↓</button>
                          </div>
                        </div>
                      </td>
                      <td><span className="cms-type-badge">{TYPE_ICONS[block.type] || '📄'} {block.type}</span></td>
                      <td>
                        <div className="cms-title-cell">
                          <span className="cms-title">{block.title || '(no title)'}</span>
                          {block.subtitle && <span className="cms-subtitle-small">{block.subtitle}</span>}
                          {block.imageUrl && <span className="cms-url-small">🖼️ {block.imageUrl.length > 40 ? block.imageUrl.slice(0, 40) + '...' : block.imageUrl}</span>}
                        </div>
                      </td>
                      <td>{block.ctaLabel ? <span className="cms-cta-badge">{block.ctaLabel} →</span> : '—'}</td>
                      <td>
                        <label className="cms-toggle">
                          <input type="checkbox" checked={block.visible} onChange={() => handleToggleVisible(block)} />
                          <span className={`cms-status ${block.visible ? 'active' : 'inactive'}`}>
                            {block.visible ? 'Active' : 'Hidden'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div className="cms-action-btns">
                          <button className="action-btn" onClick={() => startEdit(block)} title="Edit">✏️</button>
                          <button className="action-btn danger" onClick={() => handleDelete(block.id)} title="Delete">🗑️</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add CMS Block</h2>
              <button className="icon-btn" onClick={() => setShowAdd(false)}>×</button>
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
                  Expires At (optional)
                  <input type="datetime-local" value={newBlock.expiresAt} onChange={(e) => setNewBlock({ ...newBlock, expiresAt: e.target.value })} />
                </label>
                <label className="cms-toggle-row">
                  <input type="checkbox" checked={newBlock.visible} onChange={(e) => setNewBlock({ ...newBlock, visible: e.target.checked })} />
                  Visible immediately
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding...' : 'Add Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
