import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { Service } from '@data/models/admin_models'
import './catalog_screen.css' // Reuse catalog styling

export default function ServiceCreatorScreen() {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  
  const [form, setForm] = useState({
    id: '',
    title: '',
    icon: '',
    enabled: true
  })

  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  const loadData = async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    try {
      const data = await adminDatasource.getServicesList()
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [firebaseUser?.uid])

  const openForm = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setForm({
        id: service.id,
        title: service.title,
        icon: service.icon,
        enabled: service.enabled
      })
    } else {
      setEditingService(null)
      setForm({
        id: `srv_${Date.now()}`,
        title: '',
        icon: '🔧',
        enabled: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    const normalizedId = form.id.trim().replace(/\s+/g, '_')
    setIsSaving(true)
    setError(null)
    try {
      await adminDatasource.createService(normalizedId, form.title, form.icon)
      await loadData()
      setIsModalOpen(false)
    } catch (err) {
      setError('Failed to save service: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return
    setIsSaving(true)
    try {
      await adminDatasource.deleteService(id)
      await loadData()
    } catch (err) {
      setError('Failed to delete service')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div>
          <h1>Dynamic Service Creator</h1>
          <p className="catalog-subtitle">Manage service categories and main offerings.</p>
        </div>
        <div className="catalog-actions">
          <button className="primary-btn" onClick={() => openForm()}>+ Add Service</button>
        </div>
      </div>

      {error && <div className="catalog-error">{error}</div>}

      <div className="catalog-table-wrapper" style={{ marginTop: '20px' }}>
        {isLoading ? <div className="catalog-loading">Loading services...</div> : (
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Service ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={5} className="empty-cell">No services defined. Add one!</td></tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontSize: '24px' }}>{s.icon}</td>
                    <td>{s.id}</td>
                    <td>{s.title}</td>
                    <td>
                      <span className={`status ${s.enabled ? 'active' : 'inactive'}`}>
                        {s.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => s.id && navigate(`/catalog/builder/${s.id}`)}>Builder</button>
                      <button className="icon-btn" onClick={() => openForm(s)}>Edit Meta</button>
                      <button className="icon-btn danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Service ID
                <input 
                  value={form.id} 
                  disabled={!!editingService} 
                  onChange={(e) => setForm({...form, id: e.target.value})} 
                />
              </label>
              <label>Title
                <input 
                  value={form.title} 
                  onChange={(e) => setForm({...form, title: e.target.value})} 
                  placeholder="e.g. Home Automation" 
                />
              </label>
              <label>Icon (Emoji or URL)
                <input 
                  value={form.icon} 
                  onChange={(e) => setForm({...form, icon: e.target.value})} 
                  placeholder="e.g. 🏠" 
                />
              </label>
              <label>Status
                <select 
                  value={form.enabled ? 'active' : 'inactive'} 
                  onChange={(e) => setForm({...form, enabled: e.target.value === 'active'})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Disabled</option>
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
