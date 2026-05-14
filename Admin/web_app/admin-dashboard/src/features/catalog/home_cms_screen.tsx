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
  { value: 'banner', label: 'Banner' },
  { value: 'promo', label: 'Promo Card' },
  { value: 'update', label: 'Update/News' },
  { value: 'category_grid', label: 'Category Grid' },
  { value: 'featured', label: 'Featured Products' },
]

export default function HomeCmsScreen() {
  const [blocks, setBlocks] = useState<CmsBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newBlock, setNewBlock] = useState({
    type: 'banner',
    order: 0,
    visible: true,
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaLabel: '',
    ctaRoute: '',
    expiresAt: '',
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

  return (
    <div className="cms-screen">
      <div className="cms-header">
        <div>
          <h1>Home CMS</h1>
          <p className="cms-subtitle">Manage banners, promos, and updates shown on the customer home page.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowAdd(true)}>+ Add Block</button>
      </div>

      {error && <div className="catalog-error">{error} <button onClick={() => setError(null)}>×</button></div>}

      {isLoading ? (
        <div className="catalog-loading">Loading CMS blocks...</div>
      ) : blocks.length === 0 ? (
        <div className="cms-empty">
          <p>No CMS blocks found. Click "+ Add Block" to create your first home page content.</p>
        </div>
      ) : (
        <table className="cms-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Type</th>
              <th>Title</th>
              <th>CTA</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.id}>
                <td className="num">{block.order}</td>
                <td><span className="cms-type-badge">{block.type}</span></td>
                <td>
                  <div className="cms-title-cell">
                    <span className="cms-title">{block.title || '(no title)'}</span>
                    {block.subtitle && <span className="cms-subtitle-small">{block.subtitle}</span>}
                  </div>
                </td>
                <td>{block.ctaLabel ? `${block.ctaLabel} → ${block.ctaRoute}` : '—'}</td>
                <td>
                  <label className="cms-toggle">
                    <input
                      type="checkbox"
                      checked={block.visible}
                      onChange={() => handleToggleVisible(block)}
                    />
                    <span className={`cms-status ${block.visible ? 'active' : 'inactive'}`}>
                      {block.visible ? 'Active' : 'Hidden'}
                    </span>
                  </label>
                </td>
                <td>
                  <button className="icon-btn danger" onClick={() => handleDelete(block.id)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Block Modal */}
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
                  <select
                    value={newBlock.type}
                    onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
                  >
                    {CMS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Display Order
                  <input
                    type="number"
                    value={newBlock.order}
                    onChange={(e) => setNewBlock({ ...newBlock, order: Number(e.target.value) })}
                  />
                </label>
                <label className="cms-full">
                  Title
                  <input
                    type="text"
                    value={newBlock.title}
                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                    placeholder="e.g. 10% Off Installation"
                  />
                </label>
                <label className="cms-full">
                  Subtitle / Description
                  <input
                    type="text"
                    value={newBlock.subtitle}
                    onChange={(e) => setNewBlock({ ...newBlock, subtitle: e.target.value })}
                    placeholder="Optional description"
                  />
                </label>
                <label className="cms-full">
                  Image URL
                  <input
                    type="url"
                    value={newBlock.imageUrl}
                    onChange={(e) => setNewBlock({ ...newBlock, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  CTA Label
                  <input
                    type="text"
                    value={newBlock.ctaLabel}
                    onChange={(e) => setNewBlock({ ...newBlock, ctaLabel: e.target.value })}
                    placeholder="Book Now"
                  />
                </label>
                <label>
                  CTA Route
                  <input
                    type="text"
                    value={newBlock.ctaRoute}
                    onChange={(e) => setNewBlock({ ...newBlock, ctaRoute: e.target.value })}
                    placeholder="/service-types"
                  />
                </label>
                <label>
                  Expires At (optional)
                  <input
                    type="datetime-local"
                    value={newBlock.expiresAt}
                    onChange={(e) => setNewBlock({ ...newBlock, expiresAt: e.target.value })}
                  />
                </label>
                <label className="cms-toggle-row">
                  <input
                    type="checkbox"
                    checked={newBlock.visible}
                    onChange={(e) => setNewBlock({ ...newBlock, visible: e.target.checked })}
                  />
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