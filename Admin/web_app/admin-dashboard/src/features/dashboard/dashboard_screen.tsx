import { useEffect, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { DashboardMetrics } from '@data/models/admin_models'
import './dashboard_screen.css'

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  useEffect(() => {
    const loadMetrics = async () => {
      if (!firebaseUser) {
        return
      }
      try {
        const data = await adminDatasource.getDashboardMetrics()
        setMetrics(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [firebaseUser?.uid])

  if (isLoading) {
    return <div className="dashboard-loading">Loading dashboard...</div>
  }

  if (!metrics) {
    return <div className="dashboard-error">Failed to load metrics</div>
  }

  return (
    <div className="dashboard-screen">
      <h1>Dashboard</h1>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <p className="metric-label">Total Customers</p>
            <p className="metric-value">{metrics.totalCustomers.toLocaleString()}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔧</div>
          <div className="metric-content">
            <p className="metric-label">Active Technicians</p>
            <p className="metric-value">{metrics.activeTechnicians}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <p className="metric-label">Pending Jobs</p>
            <p className="metric-value">{metrics.pendingJobs}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <p className="metric-label">Total Revenue</p>
            <p className="metric-value">₹{(metrics.totalRevenue / 100000).toFixed(1)}L</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <p className="metric-label">Completion Rate</p>
            <p className="metric-value">{metrics.completionRate}%</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <p className="metric-label">Avg Response Time</p>
            <p className="metric-value">{metrics.avgResponseTime}h</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-button">
              <span>➕</span> Add Customer
            </button>
            <button className="action-button">
              <span>➕</span> Add Technician
            </button>
            <button className="action-button">
              <span>➕</span> Create Job
            </button>
            <button className="action-button">
              <span>📊</span> View Reports
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>System Status</h2>
          <div className="status-list">
            <div className="status-item">
              <span
                className={`status-indicator ${
                  metrics.systemHealth?.firestore === 'healthy'
                    ? 'active'
                    : metrics.systemHealth?.firestore === 'degraded'
                      ? 'warning'
                      : 'error'
                }`}
              ></span>
              <span>Firestore: {metrics.systemHealth?.firestore || 'checking...'}</span>
            </div>
            <div className="status-item">
              <span
                className={`status-indicator ${
                  metrics.systemHealth?.auth === 'healthy'
                    ? 'active'
                    : metrics.systemHealth?.auth === 'degraded'
                      ? 'warning'
                      : 'error'
                }`}
              ></span>
              <span>Firebase Auth: {metrics.systemHealth?.auth || 'checking...'}</span>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <span>Payment Gateway: Active</span>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <span>Notification Service: Running</span>
            </div>
            {metrics.systemHealth?.lastCheck && (
              <div className="status-item status-timestamp">
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Last checked: {new Date(metrics.systemHealth.lastCheck).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {metrics.topPerformingTechnicians && metrics.topPerformingTechnicians.length > 0 && (
          <div className="dashboard-section">
            <h2>Top Performing Technicians</h2>
            <div className="technician-list">
              {metrics.topPerformingTechnicians.map((tech) => (
                <div key={tech.id} className="technician-card">
                  <div className="technician-info">
                    <p className="technician-name">{tech.name}</p>
                    <p className="technician-stats">{tech.jobsCompleted} jobs • ⭐ {tech.rating.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {metrics.recentBookings && metrics.recentBookings.length > 0 && (
          <div className="dashboard-section">
            <h2>Recent Bookings</h2>
            <div className="bookings-table">
              <div className="table-header">
                <div className="col-service">Service</div>
                <div className="col-amount">Amount</div>
                <div className="col-status">Status</div>
                <div className="col-date">Date</div>
              </div>
              {metrics.recentBookings.slice(0, 5).map((booking) => (
                <div key={booking.bookingId} className="table-row">
                  <div className="col-service">{booking.serviceType}</div>
                  <div className="col-amount">₹{booking.amount.toLocaleString()}</div>
                  <div className="col-status">
                    <span className={`status-badge ${booking.status.toLowerCase()}`}>{booking.status}</span>
                  </div>
                  <div className="col-date">{new Date(booking.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
