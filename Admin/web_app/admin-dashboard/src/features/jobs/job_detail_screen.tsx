import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { Job } from '@data/models/admin_models'
import { useAuthStore } from '@core/services/auth_service'
import { getApiBaseUrl } from '@core/config/api'
import InvoiceGeneratorModal from './InvoiceGeneratorModal'
import '../styles/detail_screen.css'

export default function JobDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false)

  const isNewJob = id === 'new'
  const isEditMode = location.pathname.endsWith('/edit')

  const [formData, setFormData] = useState({
    customerId: '',
    serviceType: '',
    amount: '',
    scheduledDate: '',
    technicianId: '',
    notes: '',
    address: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isNewJob) {
          setFormData({
            customerId: '',
            serviceType: '',
            amount: '',
            scheduledDate: new Date().toISOString().split('T')[0],
            technicianId: '',
            notes: '',
            address: ''
          })
        } else if (id) {
          const found = await adminDatasource.getJob(id)
          if (found) setJob(found)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return

    setIsUpdating(true)
    try {
      await adminDatasource.updateJob(job.id, {
        status: newStatus as any,
        ...(newStatus === 'completed' && { completedDate: new Date().toISOString().split('T')[0] })
      })

      setJob({
        ...job,
        status: newStatus as any,
        completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : job.completedDate
      })
    } catch (error) {
      console.error('Error updating job:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreateJob = async () => {
    if (!formData.customerId || !formData.serviceType || !formData.amount) {
      alert('Please fill in Customer ID, Service Type, and Amount')
      return
    }
    setIsUpdating(true)
    try {
      const token = await useAuthStore.getState().getIdToken()
      const response = await fetch(`${getApiBaseUrl()}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          serviceType: formData.serviceType,
          amount: parseFloat(formData.amount),
          scheduledDate: formData.scheduledDate || new Date().toISOString(),
          technicianId: formData.technicianId || undefined,
          notes: formData.notes || undefined,
          address: formData.address || undefined,
          status: 'pending'
        })
      })
      if (response.ok) {
        navigate('/jobs')
      } else {
        const err = await response.json()
        alert('Failed to create job: ' + (err.message || 'Unknown error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error creating job')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateJob = async () => {
    if (!job) return
    if (!formData.serviceType || !formData.amount) {
      alert('Please fill in Service Type and Amount')
      return
    }
    setIsUpdating(true)
    try {
      await adminDatasource.updateJob(job.id, {
        customerId: formData.customerId || job.customerId,
        serviceType: formData.serviceType as Job['serviceType'],
        amount: parseFloat(formData.amount),
        scheduledDate: formData.scheduledDate || job.scheduledDate,
        technicianId: formData.technicianId || job.technicianId || undefined,
        notes: formData.notes || undefined,
        address: formData.address || undefined
      })
      alert('Job updated successfully!')
      navigate('/jobs')
    } catch (err) {
      console.error(err)
      alert('Error updating job')
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    if (isEditMode && job) {
      setFormData({
        customerId: job.customerId,
        serviceType: job.serviceType,
        amount: String(job.amount),
        scheduledDate: job.scheduledDate?.split('T')[0] || '',
        technicianId: job.technicianId || '',
        notes: job.notes || '',
        address: job.address || ''
      })
    }
  }, [isEditMode, job])

  if (isLoading) {
    return <div className="detail-screen"><div className="loading">Loading job details...</div></div>
  }

  if (!job && !isNewJob) {
    return (
      <div className="detail-screen">
        <div className="error-message">Job not found</div>
        <button onClick={() => navigate('/jobs')}>Back to Jobs</button>
      </div>
    )
  }

  if (isEditMode && job) {
    return (
      <div className="detail-screen">
        <div className="detail-header">
          <div className="header-top">
            <button className="back-button" onClick={() => navigate('/jobs')}>← Back</button>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={handleUpdateJob} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
        <div className="job-card">
          <div className="card-section">
            <h1>Edit Job: {job.id}</h1>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Customer ID</label>
              <input type="text" value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Service Type</label>
              <input type="text" value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Scheduled Date</label>
              <input type="date" value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Technician ID (optional)</label>
              <input type="text" value={formData.technicianId} onChange={e => setFormData({ ...formData, technicianId: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Address (optional)</label>
              <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isNewJob) {
    return (
      <div className="detail-screen">
        <div className="detail-header">
          <div className="header-top">
            <button className="back-button" onClick={() => navigate('/jobs')}>← Back</button>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={handleCreateJob} disabled={isUpdating}>
                {isUpdating ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>

        <div className="job-card">
          <div className="card-section">
            <h1>New Job</h1>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Customer ID</label>
              <input type="text" value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} placeholder="e.g. CUST-001" />
            </div>
            <div className="form-group">
              <label>Service Type</label>
              <input type="text" value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })} placeholder="e.g. Installation" />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g. 2500" />
            </div>
            <div className="form-group">
              <label>Scheduled Date</label>
              <input type="date" value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Technician ID (optional)</label>
              <input type="text" value={formData.technicianId} onChange={e => setFormData({ ...formData, technicianId: e.target.value })} placeholder="e.g. TECH-001" />
            </div>
            <div className="form-group">
              <label>Address (optional)</label>
              <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Service address..." />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Job notes..." />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusOptions = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled']
  const isCompleted = job!.status === 'completed'

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/jobs')}>← Back</button>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowInvoiceGenerator(true)} style={{ marginRight: '8px' }}>
              Generate Invoice
            </button>
            {!isCompleted && (
              <button className="btn btn-secondary" onClick={() => navigate(`/jobs/${id}/edit`)}>
                Edit Job
              </button>
            )}
          </div>
        </div>

        {showInvoiceGenerator && (
          <InvoiceGeneratorModal job={job!} onClose={() => setShowInvoiceGenerator(false)} />
        )}

        <div className="job-card">
          <div className="card-section">
            <h1>{job!.id}</h1>
            <p className="service-type">{job!.serviceType.toUpperCase()}</p>
            <span className={`status-badge ${job!.status}`}>{job!.status}</span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Customer ID</label>
              <p className="link-text" onClick={() => job!.customerId && navigate(`/customers/${job!.customerId}`)}>
                {job!.customerId}
              </p>
            </div>
            <div className="info-item">
              <label>Technician ID</label>
              <p className="link-text" onClick={() => job!.technicianId && navigate(`/technicians/${job!.technicianId}`)}>
                {job!.technicianId || '—'}
              </p>
            </div>
            <div className="info-item">
              <label>Service Type</label>
              <p>{job!.serviceType}</p>
            </div>
            <div className="info-item">
              <label>Amount</label>
              <p className="amount">₹{job!.amount.toLocaleString()}</p>
            </div>
            <div className="info-item">
              <label>Scheduled Date</label>
              <p>{new Date(job!.scheduledDate).toLocaleDateString()}</p>
            </div>
            {job!.completedDate && (
              <div className="info-item">
                <label>Completed Date</label>
                <p>{new Date(job!.completedDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <div className="status-section">
            <h3>Job Status</h3>
            <p className={`status-badge ${job!.status}`}>{job!.status.toUpperCase()}</p>

            <div className="status-actions">
              <label>Update Status:</label>
              <div className="status-buttons">
                {statusOptions.map(status => (
                  <button
                    key={status}
                    className={`status-btn ${status} ${job!.status === status ? 'active' : ''}`}
                    onClick={() => handleStatusChange(status)}
                    disabled={isUpdating || job!.status === status}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {job!.notes && (
            <div className="notes-section">
              <h3>Notes</h3>
              <p className="notes-text">{job!.notes}</p>
            </div>
          )}

          {(job!.address || job!.customerName) && (
            <div className="detail-section">
              <h3>Service Location</h3>
              {job!.customerName && (
                <div className="detail-row">
                  <label>Customer</label>
                  <p>{job!.customerName}</p>
                </div>
              )}
              {job!.customerPhone && (
                <div className="detail-row">
                  <label>Phone</label>
                  <p>{job!.customerPhone}</p>
                </div>
              )}
              {job!.address && (
                <div className="detail-row">
                  <label>Address</label>
                  <p>{job!.address}</p>
                </div>
              )}
              {job!.latitude && job!.longitude && (
                <div className="detail-row">
                  <label>Coordinates</label>
                  <p>{job!.latitude}, {job!.longitude}</p>
                </div>
              )}
              {job!.latitude && job!.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${job!.latitude},${job!.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  View on Google Maps
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="job-timeline">
        <h3>Job Timeline</h3>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-marker pending"></div>
            <div className="timeline-content">
              <p className="timeline-status">Pending</p>
              <p className="timeline-date">Initial status</p>
            </div>
          </div>

          {['assigned', 'in-progress', 'completed'].map(status => {
            const isActive = statusOptions.indexOf(status) <= statusOptions.indexOf(job!.status)
            return (
              <div key={status} className="timeline-item">
                <div className={`timeline-marker ${isActive ? status : 'inactive'}`}></div>
                <div className="timeline-content">
                  <p className="timeline-status">{status}</p>
                  <p className="timeline-date">
                    {isActive
                      ? (status === 'completed' && job!.completedDate
                        ? new Date(job!.completedDate).toLocaleDateString()
                        : 'In progress')
                      : 'Pending'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}