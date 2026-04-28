import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { Job } from '@data/models/admin_models'
import '../styles/detail_screen.css'

export default function JobDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (id) {
          const allJobs = await adminDatasource.getJobs('all', 1)
          const found = allJobs.find(j => j.id === id)
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

  if (isLoading) {
    return <div className="detail-screen"><div className="loading">Loading job details...</div></div>
  }

  if (!job) {
    return (
      <div className="detail-screen">
        <div className="error-message">Job not found</div>
        <button onClick={() => navigate('/jobs')}>Back to Jobs</button>
      </div>
    )
  }

  const statusOptions = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled']
  const isCompleted = job.status === 'completed'

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/jobs')}>← Back</button>
          <div className="header-actions">
            {!isCompleted && (
              <button className="btn btn-secondary" onClick={() => navigate(`/jobs/${id}/edit`)}>
                Edit Job
              </button>
            )}
          </div>
        </div>

        <div className="job-card">
          <div className="card-section">
            <h1>{job.id}</h1>
            <p className="service-type">{job.serviceType.toUpperCase()}</p>
            <span className={`status-badge ${job.status}`}>{job.status}</span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Customer ID</label>
              <p className="link-text" onClick={() => navigate(`/customers/${job.customerId}`)}>
                {job.customerId}
              </p>
            </div>
            <div className="info-item">
              <label>Technician ID</label>
              <p className="link-text" onClick={() => job.technicianId && navigate(`/technicians/${job.technicianId}`)}>
                {job.technicianId || '—'}
              </p>
            </div>
            <div className="info-item">
              <label>Service Type</label>
              <p>{job.serviceType}</p>
            </div>
            <div className="info-item">
              <label>Amount</label>
              <p className="amount">₹{job.amount.toLocaleString()}</p>
            </div>
            <div className="info-item">
              <label>Scheduled Date</label>
              <p>{new Date(job.scheduledDate).toLocaleDateString()}</p>
            </div>
            {job.completedDate && (
              <div className="info-item">
                <label>Completed Date</label>
                <p>{new Date(job.completedDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <div className="status-section">
            <h3>Job Status</h3>
            <p className={`status-badge ${job.status}`}>{job.status.toUpperCase()}</p>
            
            <div className="status-actions">
              <label>Update Status:</label>
              <div className="status-buttons">
                {statusOptions.map(status => (
                  <button
                    key={status}
                    className={`status-btn ${status} ${job.status === status ? 'active' : ''}`}
                    onClick={() => handleStatusChange(status)}
                    disabled={isUpdating || job.status === status}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {job.notes && (
            <div className="notes-section">
              <h3>Notes</h3>
              <p className="notes-text">{job.notes}</p>
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
            const isActive = statusOptions.indexOf(status) <= statusOptions.indexOf(job.status)
            return (
              <div key={status} className="timeline-item">
                <div className={`timeline-marker ${isActive ? status : 'inactive'}`}></div>
                <div className="timeline-content">
                  <p className="timeline-status">{status}</p>
                  <p className="timeline-date">
                    {isActive 
                      ? (status === 'completed' && job.completedDate 
                        ? new Date(job.completedDate).toLocaleDateString()
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
