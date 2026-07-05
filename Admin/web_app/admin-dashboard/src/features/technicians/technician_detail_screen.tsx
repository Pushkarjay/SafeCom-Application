import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { Technician, Job } from '@data/models/admin_models'
import { useAuthStore } from '@core/services/auth_service'
import { getApiBaseUrl } from '@core/config/api'
import '../styles/detail_screen.css'

const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('91') ? '+' + digits : '+91' + digits
}

export default function TechnicianDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'jobs'>('info')

  const isNewTechnician = id === 'new' || location.pathname.endsWith('/new')

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isNewTechnician) {
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
          setIsLoading(false)
        } else if (id) {
          const allTechnicians = await adminDatasource.getTechnicians(1)
          const found = allTechnicians.find(t => t.id === id)
          if (found) {
            setTechnician(found)
            if (found.lastPassword) setPassword(found.lastPassword)
            const allJobs = await adminDatasource.getJobs('all', 1)
            const techJobs = allJobs.filter(j => j.technicianId === id)
            setJobs(techJobs)
          }
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading technician:', error)
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
  const totalEarnings = jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + j.amount, 0)

  const handleSave = async () => {
    if (!technician.name || !technician.email || !technician.phone || !technician.location) {
      alert('Please fill in Name, Email, Phone, and Location')
      return
    }
    if (!password || password.length < 6) {
      alert('Please set a password (minimum 6 characters) for the technician')
      return
    }
    try {
      const token = await useAuthStore.getState().getIdToken()
      const response = await fetch(`${getApiBaseUrl()}/technicians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: technician.name,
          email: technician.email,
          phone: normalizePhone(technician.phone),
          password,
          location: technician.location,
          skills: technician.skills,
          status: technician.status === 'available' || technician.status === 'on-job' ? 'active' : technician.status
        })
      })
      if (response.ok) {
        alert(`Technician created successfully!\n\nPhone: ${normalizePhone(technician.phone)}\nPassword: ${password}\n\nShare these credentials with the employee for Employee App login.`)
        navigate('/technicians')
      } else {
        const err = await response.json()
        alert('Failed: ' + (err.message || 'Unknown error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error creating technician')
    }
  }

  const handleUpdate = async () => {
    if (!technician.name || !technician.email || !technician.phone) {
      alert('Please fill in Name, Email, and Phone')
      return
    }
    try {
      const token = await useAuthStore.getState().getIdToken()
      const response = await fetch(`${getApiBaseUrl()}/technicians/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: technician.name,
          email: technician.email,
          phone: technician.phone,
          location: technician.location,
          skills: technician.skills,
          status: technician.status
        })
      })
      if (response.ok) {
        alert('Technician updated successfully!')
      } else {
        const err = await response.json()
        alert('Failed: ' + (err.message || 'Unknown error'))
      }
    } catch (err) {
      console.error(err)
      alert('Error updating technician')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete technician ${technician.name}? This cannot be undone.`)) return
    try {
      const token = await useAuthStore.getState().getIdToken()
      const response = await fetch(`${getApiBaseUrl()}/technicians/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        alert('Technician deleted')
        navigate('/technicians')
      } else {
        alert('Failed to delete technician')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting technician')
    }
  }

  const handleSkillAdd = (skill: string) => {
    if (skill && !technician.skills.includes(skill)) {
      setTechnician({ ...technician, skills: [...technician.skills, skill] })
    }
  }

  const isEditMode = location.pathname.endsWith('/edit')

  if (isNewTechnician || isEditMode) {
    return (
      <div className="detail-screen">
        <div className="detail-header">
          <div className="header-top">
            <button className="back-button" onClick={() => navigate('/technicians')}>← Back</button>
            <div className="header-actions">
              {isNewTechnician ? (
                <button className="btn btn-primary" onClick={handleSave}>Create Technician</button>
              ) : (
                <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
              )}
              {isEditMode && (
                <button className="btn btn-danger" onClick={handleDelete} style={{ marginLeft: 8, background: 'var(--error)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
              )}
              {isEditMode && password && (
                <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={async () => {
                  try {
                    const token = await useAuthStore.getState().getIdToken()
                    const resp = await fetch(`${getApiBaseUrl()}/technicians/${id}/password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ password })
                    })
                    if (resp.ok) { alert('Password updated!'); setPassword('') }
                    else { const e = await resp.json(); alert('Failed: ' + (e.message || '')) }
                  } catch { alert('Error updating password') }
                }}>Set Password</button>
              )}
            </div>
          </div>
        </div>
        <div className="technician-card">
          <div className="card-section">
            <h1>{isNewTechnician ? 'New Technician' : `Edit: ${technician.name}`}</h1>
          </div>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={technician.name} onChange={e => setTechnician({ ...technician, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={technician.email} onChange={e => setTechnician({ ...technician, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={technician.phone} onChange={e => setTechnician({ ...technician, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={technician.location} onChange={e => setTechnician({ ...technician, location: e.target.value })} placeholder="City, State" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={technician.status} onChange={e => setTechnician({ ...technician, status: e.target.value as any })}>
                <option value="available">Available</option>
                <option value="on-job">On Job</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Skills</label>
              <input type="text" placeholder="Installation, Repair, Maintenance" onKeyDown={e => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement
                  handleSkillAdd(input.value.trim())
                  input.value = ''
                }
              }} onBlur={e => {
                if (e.target.value.trim()) {
                  handleSkillAdd(e.target.value.trim())
                  e.target.value = ''
                }
              }} />
              {technician.skills.length > 0 && (
                <div className="skills-list" style={{ marginTop: 8 }}>
                  {technician.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag" style={{ cursor: 'pointer' }} onClick={() => setTechnician({ ...technician, skills: technician.skills.filter((_, i) => i !== idx) })}>
                      {skill} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Password (for employee app login)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isNewTechnician ? 'Minimum 6 characters' : 'Leave blank to keep current'} />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 4, display: 'block' }}>
                {isNewTechnician ? 'Employee will login via Employee App using phone + this password' : 'Enter new password only if you want to reset it'}
              </small>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/technicians')}>← Back</button>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/technicians/${id}/edit`)}>Edit Technician</button>
            <button className="btn btn-danger" onClick={handleDelete} style={{ marginLeft: 8, background: 'var(--error)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
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
            <div className="info-item"><label>Email</label><p>{technician.email}</p></div>
            <div className="info-item"><label>Phone</label><p>{technician.phone}</p></div>
            <div className="info-item"><label>Location</label><p>{technician.location}</p></div>
            <div className="info-item"><label>Total Jobs</label><p className="amount">{technician.totalJobs}</p></div>
            <div className="info-item"><label>Joining Date</label><p>{new Date(technician.joiningDate).toLocaleDateString()}</p></div>
            {technician.lastPassword && (
              <div className="info-item"><label>Password</label><p style={{ fontFamily: 'monospace' }}>{technician.lastPassword}</p></div>
            )}
          </div>
          <div className="stats-row">
            <div className="stat"><span className="stat-value">{completedJobs}</span><span className="stat-label">Completed Jobs</span></div>
            <div className="stat"><span className="stat-value">₹{totalEarnings.toLocaleString()}</span><span className="stat-label">Earnings</span></div>
            <div className="stat"><span className="stat-value">{technician.skills.length}</span><span className="stat-label">Skills</span></div>
          </div>
          {technician.skills.length > 0 && (
            <div className="skills-section"><h3>Skills</h3><div className="skills-list">{technician.skills.map((skill, idx) => (<span key={idx} className="skill-tag">{skill}</span>))}</div></div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Info</button>
        <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Jobs ({jobs.length})</button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-section">
              <h3>Contact Information</h3>
              <div className="info-pair"><span>Email:</span><a href={`mailto:${technician.email}`}>{technician.email}</a></div>
              <div className="info-pair"><span>Phone:</span><a href={`tel:${technician.phone}`}>{technician.phone}</a></div>
              <div className="info-pair"><span>Location:</span><p>{technician.location}</p></div>
            </div>
            <div className="info-section">
              <h3>Professional Information</h3>
              <div className="info-pair"><span>Status:</span><span className={`status-badge ${technician.status}`}>{technician.status}</span></div>
              <div className="info-pair"><span>Joining Date:</span><p>{new Date(technician.joiningDate).toLocaleDateString()}</p></div>
              <div className="info-pair"><span>Rating:</span><p>{'⭐'.repeat(Math.floor(technician.rating))} <span className="rating-value">{technician.rating.toFixed(1)}/5</span></p></div>
              <div className="info-pair"><span>Total Jobs Completed:</span><p>{technician.totalJobs}</p></div>
            </div>
            <div className="info-section"><h3>Skills</h3><div className="skills-list">{technician.skills.map((skill, idx) => (<span key={idx} className="skill-tag">{skill}</span>))}</div></div>
          </div>
        )}
        {activeTab === 'jobs' && (
          <div className="jobs-tab">
            {jobs.length === 0 ? <p className="empty-message">No jobs assigned</p> : (
              <table className="data-table">
                <thead><tr><th>Job ID</th><th>Customer</th><th>Service Type</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>{jobs.map(job => (
                  <tr key={job.id}>
                    <td className="job-id">{job.id}</td>
                    <td>{job.customerId}</td>
                    <td>{job.serviceType}</td>
                    <td><span className={`status-badge ${job.status}`}>{job.status}</span></td>
                    <td className="amount">₹{job.amount.toLocaleString()}</td>
                    <td>{new Date(job.scheduledDate).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
