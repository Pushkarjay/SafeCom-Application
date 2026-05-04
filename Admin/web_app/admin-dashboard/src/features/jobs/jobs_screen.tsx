import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { Job } from '@data/models/admin_models'
import './jobs_screen.css'

export default function JobsScreen() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
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
        <button className="add-button" onClick={() => navigate('/jobs/new')}>➕ Create Job</button>
      </div>

      {isLoading ? (
        <div className="loading">Loading jobs...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Service Type</th>
                <th>Amount</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
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
