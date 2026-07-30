import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@core/services/auth_service'
import { useTheme } from '@core/services/theme_service'
import { useServicesStore } from '@core/services/services_store'
import './main_layout.css'

const CATALOG_ITEMS = [
  { key: 'products', label: 'Products', icon: '📦', path: '/catalog/products' },
]

const SETTINGS_ITEMS = [
  { key: 'serviceable-areas', label: 'Serviceable Areas', icon: '📍', path: '/settings/serviceable-areas' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = useAuthStore((state) => state.admin)
  const logout = useAuthStore((state) => state.logout)

  const { theme, toggleTheme } = useTheme()

  const dbServices = useServicesStore((s) => s.services)
  const servicesLoading = useServicesStore((s) => s.loading)
  const fetchServices = useServicesStore((s) => s.fetchServices)

  // Fetch services on mount (store prevents duplicate fetches)
  useEffect(() => {
    fetchServices()
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)

  const isServiceActive = (id: string) => location.pathname === `/catalog/builder/${id}`

  return (
    <div className="main-layout">
      <div className="grain-overlay" />
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-box">
            <img src="/logo-visual.jpeg" alt="SafeCom" className="logo-img" />
          </div>
          <div className="logo-text">
            <h2>SafeCom</h2>
            <p>Admin</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Main Nav */}
          <div className="nav-section">
            <button
              className={`nav-item main ${isActive('/') ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-item main ${isActive('/mobile-preview') ? 'active' : ''}`}
              onClick={() => navigate('/mobile-preview')}
            >
              <span className="nav-icon">📱</span>
              <span>Customer Mobile</span>
            </button>
          </div>

          {/* Management Section */}
          <div className="nav-section">
            <p className="section-title">MANAGEMENT</p>
            <button
              className={`nav-item ${isActive('/customers') ? 'active' : ''}`}
              onClick={() => navigate('/customers')}
            >
              <span className="nav-icon">👥</span>
              <span>Customers</span>
            </button>
            <button
              className={`nav-item ${isActive('/technicians') ? 'active' : ''}`}
              onClick={() => navigate('/technicians')}
            >
              <span className="nav-icon">🔧</span>
              <span>Technicians</span>
            </button>
            <button
              className={`nav-item ${isActive('/jobs') ? 'active' : ''}`}
              onClick={() => navigate('/jobs')}
            >
              <span className="nav-icon">📋</span>
              <span>Jobs</span>
            </button>
            <button
              className={`nav-item ${isActive('/payments') ? 'active' : ''}`}
              onClick={() => navigate('/payments')}
            >
              <span className="nav-icon">💳</span>
              <span>Payments</span>
            </button>
          </div>

          {/* Catalog Section */}
          <div className="nav-section">
            <p className="section-title">CATALOG</p>
            {CATALOG_ITEMS.map(item => (
              <button
                key={item.key}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path!)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Services Section — Dynamic from Database */}
          <div className="nav-section services">
            <p className="section-title">SERVICES</p>
            {servicesLoading ? (
              <div className="sidebar-loading">
                <span className="sidebar-spinner" />
                <span className="sidebar-loading-text">Loading...</span>
              </div>
            ) : (
              dbServices.filter(s => s.enabled !== false).map(service => (
                <button
                  key={service.id}
                  className={`nav-item service-item ${isServiceActive(service.id) ? 'active' : ''}`}
                  onClick={() => navigate(`/catalog/builder/${service.id}`)}
                >
                  <span className="nav-icon">{service.icon || '🔧'}</span>
                  <span className="service-label">{service.title || service.id}</span>
                  <span className="nav-arrow">→</span>
                </button>
              ))
            )}
            {/* Static link to Service Creator — always visible */}
            <button
              key="services-creator"
              className={`nav-item service-item ${location.pathname === '/catalog/services' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/services')}
            >
              <span className="nav-icon">📦</span>
              <span className="service-label">Services</span>
              <span className="nav-arrow">→</span>
            </button>
          </div>

          {/* Settings Section */}
          <div className="nav-section services">
            <p className="section-title">SETTINGS</p>
            {SETTINGS_ITEMS.map(item => (
              <button
                key={item.key}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="service-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">{(admin?.name || 'A')[0].toUpperCase()}</div>
            <div className="admin-details">
              <p className="admin-name">{admin?.name || 'Admin'}</p>
              <p className="admin-email">{admin?.email || 'admin@safecom.com'}</p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="theme-toggle">
          <button onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}