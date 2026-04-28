import { useEffect, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { DashboardMetrics } from '@data/models/admin_models'
import './dashboard_screen.css'

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await adminDatasource.getDashboardMetrics()
        setMetrics(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [])

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
              <span className="status-indicator active"></span>
              <span>API Server: Online</span>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <span>Database: Connected</span>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <span>Payment Gateway: Active</span>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <span>Notification Service: Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
