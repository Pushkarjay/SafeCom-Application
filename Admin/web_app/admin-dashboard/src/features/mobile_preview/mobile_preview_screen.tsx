import { useState, useEffect } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import './mobile_preview.css'

interface SduiComponent {
  id: string
  type: string
  data: any
  action?: any
  visibility?: any
}

export default function MobilePreviewScreen() {
  const [layouts, setLayouts] = useState<any[]>([])
  const [selectedLayoutId, setSelectedLayoutId] = useState('home')
  const [layout, setLayout] = useState<SduiComponent[]>([])
  const [meta, setMeta] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeComponentIndex, setActiveComponentIndex] = useState<number | null>(null)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  useEffect(() => {
    loadLayouts()
  }, [])

  useEffect(() => {
    if (selectedLayoutId) {
      loadLayout(selectedLayoutId)
    }
  }, [selectedLayoutId])

  const loadLayouts = async () => {
    try {
      const data = await adminDatasource.fetchSduiLayouts()
      setLayouts(data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadLayout = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminDatasource.fetchSduiLayout(id)
      setLayout(data.layout || [])
      setMeta(data.meta || {})
    } catch (err) {
      setError('Failed to load layout')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await adminDatasource.saveSduiLayout(selectedLayoutId, layout, meta)
      alert('Layout saved successfully!')
    } catch (err) {
      alert('Failed to save layout')
    } finally {
      setIsSaving(false)
    }
  }

  const updateComponentData = (index: number, newData: any) => {
    const next = [...layout]
    next[index] = { ...next[index], data: { ...next[index].data, ...newData } }
    setLayout(next)
  }

  const removeComponent = (index: number) => {
    if (!confirm('Remove this component?')) return
    setLayout(layout.filter((_, i) => i !== index))
    setActiveComponentIndex(null)
  }

  const moveComponent = (index: number, direction: 'up' | 'down') => {
    const next = [...layout]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    [next[index], next[target]] = [next[target], next[index]]
    setLayout(next)
    setActiveComponentIndex(target)
  }

  return (
    <div className="mp-container">
      <div className="mp-header">
        <div>
          <h1>Customer Mobile Preview</h1>
          <p>Real-time SDUI Layout Editor</p>
        </div>
        <div className="mp-actions">
          <select value={selectedLayoutId} onChange={(e) => setSelectedLayoutId(e.target.value)}>
            {layouts.map(l => <option key={l.id} value={l.id}>{l.id}</option>)}
            {!layouts.find(l => l.id === 'home') && <option value="home">home (default)</option>}
          </select>
          <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="mp-content">
        {/* Sidebar: Component List & Editor */}
        <div className="mp-sidebar">
          <h3>Components</h3>
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
                  <button onClick={(e) => { e.stopPropagation(); moveComponent(i, 'up') }}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); moveComponent(i, 'down') }}>↓</button>
                </div>
              </div>
            ))}
          </div>

          {activeComponentIndex !== null && layout[activeComponentIndex] && (
            <div className="mp-editor-panel slide-up">
              <div className="mp-ep-header">
                <h4>Edit {layout[activeComponentIndex].type}</h4>
                <button className="icon-btn danger" onClick={() => removeComponent(activeComponentIndex)}>Delete</button>
              </div>
              <div className="mp-ep-body">
                {Object.entries(layout[activeComponentIndex].data).map(([key, val]) => (
                  <div key={key} className="mp-field">
                    <label>{key}</label>
                    {typeof val === 'string' ? (
                      <input 
                        value={val} 
                        onChange={(e) => updateComponentData(activeComponentIndex, { [key]: e.target.value })} 
                      />
                    ) : typeof val === 'number' ? (
                      <input 
                        type="number" 
                        value={val} 
                        onChange={(e) => updateComponentData(activeComponentIndex, { [key]: Number(e.target.value) })} 
                      />
                    ) : (
                      <pre>{JSON.stringify(val, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Preview: Phone Frame */}
        <div className="mp-preview-area">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-status-bar">
                <span>9:41</span>
                <div className="phone-status-icons">📶 🔋</div>
              </div>
              <div className="phone-scroll-content">
                {layout.map((c, i) => (
                  <div 
                    key={c.id + i} 
                    className={`preview-component ${activeComponentIndex === i ? 'highlight' : ''}`}
                    onClick={() => setActiveComponentIndex(i)}
                  >
                    <ComponentRenderer component={c} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
          {[1,2,3,4,5,6].map(n => <div key={n} className="pr-grid-item"><div className="pr-gi-box" /><div className="pr-gi-label">Service {n}</div></div>)}
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
      return <div className="pr-fallback">Unknown Component: {type}</div>
  }
}
