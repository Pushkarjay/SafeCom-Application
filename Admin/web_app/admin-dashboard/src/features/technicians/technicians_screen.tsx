import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { Technician } from '@data/models/admin_models'
import { getApiBaseUrl } from '@core/config/api'
import './technicians_screen.css'

export default function TechniciansScreen() {
  const navigate = useNavigate()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<keyof Technician>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  useEffect(() => {
    const loadTechnicians = async () => {
      if (!firebaseUser) {
        return
      }
      try {
        const data = await adminDatasource.getTechnicians(page)
        setTechnicians(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadTechnicians()
  }, [page, firebaseUser?.uid])
  const processedTechnicians = [...technicians]
    .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (field: keyof Technician) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === processedTechnicians.length && processedTechnicians.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedTechnicians.map(t => t.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} selected technicians?`)) return
    setIsLoading(true)
    try {
      const toDelete = Array.from(selectedIds)
      for (const id of toDelete) {
        const token = await useAuthStore.getState().getIdToken()
        await fetch(`${getApiBaseUrl()}/technicians/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      }
      setTechnicians(technicians.filter(t => !selectedIds.has(t.id)))
      setSelectedIds(new Set())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="technicians-screen">
      <div className="screen-header">
        <h1>Technicians Management</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search technicians..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
          <button className="add-button" onClick={() => navigate('/technicians/new')}>➕ Add Technician</button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions" style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedIds.size} selected</span>
          <button className="secondary-btn danger" onClick={handleBulkDelete} disabled={isLoading}>Delete Selected</button>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading technicians...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={processedTechnicians.length > 0 && selectedIds.size === processedTechnicians.length} onChange={toggleSelectAll} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>Email {sortField === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('location')}>Location {sortField === 'location' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('totalJobs')}>Total Jobs {sortField === 'totalJobs' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('rating')}>Rating {sortField === 'rating' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedTechnicians.map((tech) => (
                <tr key={tech.id} className={selectedIds.has(tech.id) ? 'selected-row' : ''}>
                  <td><input type="checkbox" checked={selectedIds.has(tech.id)} onChange={() => toggleSelect(tech.id)} /></td>
                  <td className="name-cell">{tech.name}</td>
                  <td>{tech.email}</td>
                  <td>{tech.location}</td>
                  <td>{tech.totalJobs}</td>
                  <td>
                    <span className="rating">
                      ⭐ {tech.rating.toFixed(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${tech.status}`}>
                      {tech.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-link" onClick={() => navigate(`/technicians/${tech.id}`)}>
                      View
                    </button>
                    <button className="action-link" onClick={() => navigate(`/technicians/${tech.id}/edit`)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          ← Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  )
}
