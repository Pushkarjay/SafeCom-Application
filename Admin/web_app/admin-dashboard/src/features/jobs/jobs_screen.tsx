import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { Job } from '@data/models/admin_models'
import { getApiBaseUrl } from '@core/config/api'
import './jobs_screen.css'

export default function JobsScreen() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<keyof Job>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  useEffect(() => {
    const loadJobs = async () => {
      if (!firebaseUser) {
        return
      }
      try {
        const data = await adminDatasource.getJobs(null, page)
        setJobs(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadJobs()
  }, [page, firebaseUser?.uid])

  const processedJobs = [...jobs]
    .filter(j => !searchQuery || j.id.toLowerCase().includes(searchQuery.toLowerCase()) || j.serviceType.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (field: keyof Job) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === processedJobs.length && processedJobs.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedJobs.map(j => j.id)))
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
    if (!window.confirm(`Delete ${selectedIds.size} selected jobs?`)) return
    setIsLoading(true)
    try {
      const toDelete = Array.from(selectedIds)
      for (const id of toDelete) {
        const token = await useAuthStore.getState().getIdToken()
        await fetch(`${getApiBaseUrl()}/jobs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      }
      setJobs(jobs.filter(j => !selectedIds.has(j.id)))
      setSelectedIds(new Set())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in-progress':
        return 'warning'
      case 'pending':
        return 'info'
      case 'cancelled':
        return 'error'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="jobs-screen">
      <div className="screen-header">
        <h1>Jobs Management</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search jobs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
          <button className="add-button" onClick={() => navigate('/jobs/new')}>➕ Create Job</button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions" style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedIds.size} selected</span>
          <button className="secondary-btn danger" onClick={handleBulkDelete} disabled={isLoading}>Delete Selected</button>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading jobs...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={processedJobs.length > 0 && selectedIds.size === processedJobs.length} onChange={toggleSelectAll} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>Job ID {sortField === 'id' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('serviceType')}>Service Type {sortField === 'serviceType' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('amount')}>Amount {sortField === 'amount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('scheduledDate')}>Scheduled Date {sortField === 'scheduledDate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('technicianId')}>Technician {sortField === 'technicianId' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedJobs.map((job) => (
                <tr key={job.id} className={selectedIds.has(job.id) ? 'selected-row' : ''}>
                  <td><input type="checkbox" checked={selectedIds.has(job.id)} onChange={() => toggleSelect(job.id)} /></td>
                  <td className="job-id">{job.id}</td>
                  <td>
                    <span className="service-type">{job.serviceType}</span>
                  </td>
                  <td className="amount">₹{job.amount.toLocaleString()}</td>
                  <td>{new Date(job.scheduledDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.technicianId ? job.technicianId : '—'}</td>
                  <td className="actions-cell">
                    <button className="action-link" onClick={() => navigate(`/jobs/${job.id}`)}>
                      View
                    </button>
                    {job.status === 'pending' && (
                      <button className="action-link" onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                        Edit
                      </button>
                    )}
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
