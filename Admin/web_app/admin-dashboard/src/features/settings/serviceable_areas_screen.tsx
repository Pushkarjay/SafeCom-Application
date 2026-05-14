import { useState, useEffect, useCallback } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import './serviceable_areas_screen.css'

interface ServiceableArea {
  areaCode: string
  areaName: string
  latitude: number
  longitude: number
  radiusKm: number
  estimatedTimeToService: string
  active: boolean
}

export default function ServiceableAreasScreen() {
  const [areas, setAreas] = useState<ServiceableArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newArea, setNewArea] = useState({
    areaCode: '',
    areaName: '',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 10,
    estimatedTimeToService: '4-8 hours',
  })

  const loadAreas = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminDatasource.getServiceableAreas()
      setAreas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadAreas() }, [loadAreas])

  const handleAdd = async () => {
    if (!newArea.areaCode || !newArea.areaName) return
    setSaving(true)
    try {
      await adminDatasource.createServiceableArea(newArea)
      setShowAdd(false)
      setNewArea({ areaCode: '', areaName: '', latitude: 25.5941, longitude: 85.1376, radiusKm: 10, estimatedTimeToService: '4-8 hours' })
      await loadAreas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (area: ServiceableArea) => {
    try {
      await adminDatasource.updateServiceableArea(area.areaCode, { active: !area.active })
      await loadAreas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleDelete = async (areaCode: string) => {
    if (!confirm(`Delete area "${areaCode}"?`)) return
    try {
      await adminDatasource.deleteServiceableArea(areaCode)
      await loadAreas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="sa-screen">
      <div className="sa-header">
        <div>
          <h1>Serviceable Areas</h1>
          <p className="sa-subtitle">Manage geographic coverage zones. Customers outside these areas cannot book services.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowAdd(true)}>+ Add Area</button>
      </div>

      {error && <div className="catalog-error">{error} <button onClick={() => setError(null)}>×</button></div>}

      {isLoading ? (
        <div className="catalog-loading">Loading areas...</div>
      ) : areas.length === 0 ? (
        <div className="sa-empty">No serviceable areas configured.</div>
      ) : (
        <table className="sa-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Area Name</th>
              <th>Coordinates</th>
              <th>Radius</th>
              <th>Est. Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.areaCode} className={!area.active ? 'sa-inactive' : ''}>
                <td><code>{area.areaCode}</code></td>
                <td className="sa-name">{area.areaName}</td>
                <td className="sa-coords">{area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}</td>
                <td className="num">{area.radiusKm} km</td>
                <td>{area.estimatedTimeToService}</td>
                <td>
                  <label className="sa-toggle">
                    <input type="checkbox" checked={area.active} onChange={() => handleToggle(area)} />
                    <span className={`sa-badge ${area.active ? 'active' : 'inactive'}`}>
                      {area.active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </td>
                <td>
                  <button className="icon-btn danger" onClick={() => handleDelete(area.areaCode)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Serviceable Area</h2>
              <button className="icon-btn" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="sa-form">
                <label>
                  Area Code
                  <input value={newArea.areaCode} onChange={(e) => setNewArea({ ...newArea, areaCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} placeholder="PATNA_METRO" />
                </label>
                <label>
                  Area Name
                  <input value={newArea.areaName} onChange={(e) => setNewArea({ ...newArea, areaName: e.target.value })} placeholder="Patna Metropolitan" />
                </label>
                <label>
                  Latitude
                  <input type="number" step="0.0001" value={newArea.latitude} onChange={(e) => setNewArea({ ...newArea, latitude: Number(e.target.value) })} />
                </label>
                <label>
                  Longitude
                  <input type="number" step="0.0001" value={newArea.longitude} onChange={(e) => setNewArea({ ...newArea, longitude: Number(e.target.value) })} />
                </label>
                <label>
                  Coverage Radius (km)
                  <input type="number" value={newArea.radiusKm} onChange={(e) => setNewArea({ ...newArea, radiusKm: Number(e.target.value) })} />
                </label>
                <label>
                  Est. Time to Service
                  <input value={newArea.estimatedTimeToService} onChange={(e) => setNewArea({ ...newArea, estimatedTimeToService: e.target.value })} placeholder="4-8 hours" />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleAdd} disabled={saving || !newArea.areaCode || !newArea.areaName}>
                {saving ? 'Adding...' : 'Add Area'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}