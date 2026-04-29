import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { Technician, Job } from '@data/models/admin_models'
import '../styles/detail_screen.css'

export default function TechnicianDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'jobs'>('info')

  useEffect(() => {
    const loadData = async () => {
      try {
        if (id === 'new') {
          // Initialize empty technician for new record
          setTechnician({
            id: `TECH-${Date.now()}`,
            name: '',
            email: '',
            phone: '',
            location: '',
            totalJobs: 0,
            rating: 0,
            status: 'available',
            joiningDate: new Date().toISOString(),
            skills: []
          })
        } else if (id) {
          const allTechnicians = await adminDatasource.getTechnicians(1)
          const found = allTechnicians.find(t => t.id === id)
          if (found) setTechnician(found)

          const allJobs = await adminDatasource.getJobs('all', 1)
          const techJobs = allJobs.filter(j => j.technicianId === id)
          setJobs(techJobs)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  if (isLoading) {
    return <div className="detail-screen"><div className="loading">Loading technician details...</div></div>
  }

  if (!technician) {
    return (
      <div className="detail-screen">
        <div className="error-message">Technician not found</div>
        <button onClick={() => navigate('/technicians')}>Back to Technicians</button>
      </div>
    )
  }

  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const totalEarnings = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + j.amount, 0)
  const isNewTechnician = id === 'new'

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/technicians')}>← Back</button>
          <div className="header-actions">
            {!isNewTechnician && (
              <button className="btn btn-secondary" onClick={() => navigate(`/technicians/${id}/edit`)}>
                Edit Technician
              </button>
            )}
          </div>
        </div>

        <div className="technician-card">
          <div className="card-section">
            <h1>{technician.name}</h1>
            <div className="rating">
              {'⭐'.repeat(Math.floor(technician.rating))}
              <span className="rating-value">{technician.rating.toFixed(1)}</span>
            </div>
            <span className={`status-badge ${technician.status}`}>{technician.status}</span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <p>{technician.email}</p>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <p>{technician.phone}</p>
            </div>
            <div className="info-item">
              <label>Location</label>
              <p>{technician.location}</p>
            </div>
            <div className="info-item">
              <label>Total Jobs</label>
              <p className="amount">{technician.totalJobs}</p>
            </div>
            <div className="info-item">
              <label>Joining Date</label>
              <p>{new Date(technician.joiningDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat">
              <span className="stat-value">{completedJobs}</span>
              <span className="stat-label">Completed Jobs</span>
            </div>
            <div className="stat">
              <span className="stat-value">₹{totalEarnings.toLocaleString()}</span>
              <span className="stat-label">Earnings</span>
            </div>
            <div className="stat">
              <span className="stat-value">{technician.skills.length}</span>
              <span className="stat-label">Skills</span>
            </div>
          </div>

          {technician.skills.length > 0 && (
            <div className="skills-section">
              <h3>Skills</h3>
              <div className="skills-list">
                {technician.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button 
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs ({jobs.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-section">
              <h3>Contact Information</h3>
              <div className="info-pair">
                <span>Email:</span>
                <a href={`mailto:${technician.email}`}>{technician.email}</a>
              </div>
              <div className="info-pair">
                <span>Phone:</span>
                <a href={`tel:${technician.phone}`}>{technician.phone}</a>
              </div>
              <div className="info-pair">
                <span>Location:</span>
                <p>{technician.location}</p>
              </div>
            </div>

            <div className="info-section">
              <h3>Professional Information</h3>
              <div className="info-pair">
                <span>Status:</span>
                <span className={`status-badge ${technician.status}`}>{technician.status}</span>
              </div>
              <div className="info-pair">
                <span>Joining Date:</span>
                <p>{new Date(technician.joiningDate).toLocaleDateString()}</p>
              </div>
              <div className="info-pair">
                <span>Rating:</span>
                <p>
                  {'⭐'.repeat(Math.floor(technician.rating))}
                  <span className="rating-value">{technician.rating.toFixed(1)}/5</span>
                </p>
              </div>
              <div className="info-pair">
                <span>Total Jobs Completed:</span>
                <p>{technician.totalJobs}</p>
              </div>
            </div>

            <div className="info-section">
              <h3>Skills</h3>
              <div className="skills-list">
                {technician.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-tab">
            {jobs.length === 0 ? (
              <p className="empty-message">No jobs assigned to this technician</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Customer</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Scheduled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="job-id">{job.id}</td>
                      <td>{job.customerId}</td>
                      <td>{job.serviceType}</td>
                      <td><span className={`status-badge ${job.status}`}>{job.status}</span></td>
                      <td className="amount">₹{job.amount.toLocaleString()}</td>
                      <td>{new Date(job.scheduledDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
