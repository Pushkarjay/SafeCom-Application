import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { DashboardMetrics } from '@data/models/admin_models'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { usePollingData } from '@/core/hooks/usePollingData'
import { useCounter } from '@/core/hooks/useCounter'
import './dashboard_screen.css'

function AnimatedMetric({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useCounter(value, 1200)
  return <>{count.toLocaleString()}{suffix}</>
}

function LastUpdatedIndicator({ lastUpdated }: { lastUpdated: Date | null }) {
  if (!lastUpdated) return null
  
  const now = new Date()
  const diffMs = now.getTime() - lastUpdated.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  
  let timeAgo: string
  if (diffSecs < 60) {
    timeAgo = `${diffSecs}s ago`
  } else if (diffSecs < 3600) {
    timeAgo = `${Math.floor(diffSecs / 60)}m ago`
  } else {
    timeAgo = `${Math.floor(diffSecs / 3600)}h ago`
  }
  
  return (
    <div className="last-updated-indicator">
      <span className="update-dot" />
      <span>Updated {timeAgo}</span>
    </div>
  )
}

function RefreshButton({ 
  onRefresh, 
  isLoading, 
  isPolling 
}: { 
  onRefresh: () => Promise<void>
  isLoading: boolean
  isPolling: boolean
}) {
  return (
    <button 
      className={`refresh-button ${isPolling ? 'polling' : ''}`}
      onClick={onRefresh}
      disabled={isLoading}
      title={isPolling ? 'Auto-refresh active (30s)' : 'Click to refresh'}
    >
      <span className={`refresh-icon ${isLoading ? 'spinning' : ''}`} />
      {isPolling && <span className="pulse-ring" />}
    </button>
  )
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-screen">
      <div className="skeleton-title" />
      <div className="metrics-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-metric">
            <div className="skeleton-metric-icon" />
            <div className="skeleton-metric-content">
              <div className="skeleton-text-sm" />
              <div className="skeleton-title" style={{ height: 26, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="skeleton-card" style={{ height: 200 }} />
        <div className="skeleton-card" style={{ height: 200 }} />
      </div>
    </div>
  )
}

export default function DashboardScreen() {
  const navigate = useNavigate()
  const [showReports, setShowReports] = useState(false)

  const {
    data: metrics,
    isLoading,
    error,
    lastUpdated,
    isPolling,
    refresh,
  } = usePollingData<DashboardMetrics | null>({
    fetchFn: async () => {
      const data = await adminDatasource.getDashboardMetrics()
      return data
    },
    intervalMs: 30000,
    enabled: true,
  })

  const handleRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="dashboard-screen">
        <div className="dashboard-error">
          <p>Failed to load metrics</p>
          <button className="retry-button" onClick={handleRefresh}>Retry</button>
        </div>
      </div>
    )
  }

  const getChartData = useCallback(() => {
    if (!metrics?.recentBookings) return []
    const grouped = metrics.recentBookings.reduce((acc, booking) => {
      const date = new Date(booking.createdAt).toLocaleDateString()
      if (!acc[date]) acc[date] = 0
      acc[date] += booking.amount
      return acc
    }, {} as Record<string, number>)

    return Object.keys(grouped).slice(0, 7).map(date => ({
      date,
      revenue: grouped[date]
    })).reverse()
  }, [metrics?.recentBookings])

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <h1 className="slide-up">Dashboard</h1>
        <div className="header-actions">
          <LastUpdatedIndicator lastUpdated={lastUpdated} />
          <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} isPolling={isPolling} />
        </div>
      </header>

      <div className="metrics-grid stagger">
        <div className="metric-card">
          <div className="metric-icon breathe">👥</div>
          <div className="metric-content">
            <p className="metric-label">Total Customers</p>
            <p className="metric-value">
              <AnimatedMetric value={metrics?.totalCustomers ?? 0} />
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon breathe" style={{ animationDelay: '0.3s' }}>🔧</div>
          <div className="metric-content">
            <p className="metric-label">Active Technicians</p>
            <p className="metric-value">
              <AnimatedMetric value={metrics?.activeTechnicians ?? 0} />
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon breathe" style={{ animationDelay: '0.6s' }}>⏳</div>
          <div className="metric-content">
            <p className="metric-label">Pending Jobs</p>
            <p className="metric-value">
              <AnimatedMetric value={metrics?.pendingJobs ?? 0} />
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon breathe" style={{ animationDelay: '0.9s' }}>💰</div>
          <div className="metric-content">
            <p className="metric-label">Total Revenue</p>
            <p className="metric-value">
              ₹<AnimatedMetric value={Math.floor((metrics?.totalRevenue ?? 0) / 100000)} />L
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon breathe" style={{ animationDelay: '1.2s' }}>✅</div>
          <div className="metric-content">
            <p className="metric-label">Completion Rate</p>
            <p className="metric-value">
              <AnimatedMetric value={metrics?.completionRate ?? 0} suffix="%" />
            </p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon breathe" style={{ animationDelay: '1.5s' }}>⏱️</div>
          <div className="metric-content">
            <p className="metric-label">Avg Response Time</p>
            <p className="metric-value">
              <AnimatedMetric value={metrics?.avgResponseTime ?? 0} suffix="h" />
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections slide-up">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-button" onClick={() => navigate('/technicians/new')}>
              <span>➕</span> Add Technician
            </button>
            <button className="action-button" onClick={() => navigate('/jobs/new')}>
              <span>➕</span> Create Job
            </button>
            <button className="action-button" onClick={() => setShowReports(!showReports)}>
              <span>📊</span> {showReports ? 'Hide Reports' : 'View Reports'}
            </button>
          </div>
        </div>

        {showReports && (
          <div className="dashboard-section slide-in-right">
            <h2>Revenue Trend</h2>
            <div style={{ width: '100%', height: 300, background: 'white', padding: 16, borderRadius: 8 }}>
              <ResponsiveContainer>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716c' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="dashboard-section">
          <h2>System Status</h2>
          <div className="status-list">
            <div className="status-item">
              <span
                className={`status-indicator ${
                  metrics?.systemHealth?.firestore === 'healthy'
                    ? 'active'
                    : metrics?.systemHealth?.firestore === 'degraded'
                      ? 'warning'
                      : 'error'
                }`}
              ></span>
              <span>Firestore: {metrics?.systemHealth?.firestore || 'checking...'}</span>
            </div>
            <div className="status-item">
              <span
                className={`status-indicator ${
                  metrics?.systemHealth?.auth === 'healthy'
                    ? 'active'
                    : metrics?.systemHealth?.auth === 'degraded'
                      ? 'warning'
                      : 'error'
                }`}
              ></span>
              <span>Firebase Auth: {metrics?.systemHealth?.auth || 'checking...'}</span>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <span>Payment Gateway: Active</span>
            </div>
            <div className="status-item">
              <span className="status-indicator active"></span>
              <span>Notification Service: Running</span>
            </div>
            {metrics?.systemHealth?.lastCheck && (
              <div className="status-item">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Last checked: {new Date(metrics.systemHealth.lastCheck).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {metrics?.topPerformingTechnicians && metrics.topPerformingTechnicians.length > 0 && (
          <div className="dashboard-section">
            <h2>Top Performing Technicians</h2>
            <div className="technician-list">
              {metrics.topPerformingTechnicians.map((tech) => (
                <div key={tech.id} className="technician-card hover-lift">
                  <div className="technician-info">
                    <p className="technician-name">{tech.name}</p>
                    <p className="technician-stats">{tech.jobsCompleted} jobs • ⭐ {tech.rating.toFixed(1)}</p>
                  </div>
                  <div className="progress-bar" style={{ width: 100 }}>
                    <div className="progress-bar-fill" style={{ width: `${Math.min(tech.rating / 5 * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {metrics?.recentBookings && metrics.recentBookings.length > 0 && (
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