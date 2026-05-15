import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@core/services/auth_service'
import './main_layout.css'

const SERVICE_ITEMS = [
  { key: 'Installation', label: 'Installation', icon: '🔧', builder: true },
  { key: 'Maintenance', label: 'Maintenance', icon: '⚙️', builder: true },
  { key: 'Camera_Repair', label: 'Camera Repair', icon: '📷', builder: true },
  { key: 'AMC', label: 'AMC Plans', icon: '📋', builder: true },
  { key: 'accessories', label: 'Accessories', icon: '🔌', builder: false, path: '/catalog/accessories' },
  { key: 'Camera_System_Upgrade', label: 'Upgrade', icon: '⬆️', builder: true },
  { key: 'Recommendation_Addons', label: 'Recommendations', icon: '💡', builder: true },
  { key: 'services', label: 'Services', icon: '📦', builder: false, path: '/catalog/services' },
]

const CATALOG_ITEMS = [
  { key: 'products', label: 'Products', icon: '📦', path: '/catalog/products' },
  { key: 'services', label: 'Services', icon: '🛠️', path: '/catalog/services' },
  { key: 'home-cms', label: 'Home CMS', icon: '🏠', path: '/catalog/home-cms' },
]

const SETTINGS_ITEMS = [
  { key: 'serviceable-areas', label: 'Serviceable Areas', icon: '📍', path: '/settings/serviceable-areas' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = useAuthStore((state) => state.admin)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)

  const getServicePath = (item: typeof SERVICE_ITEMS[0]) => {
    if (item.builder) {
      return `/catalog/builder/${item.key}`
    }
    return item.path
  }

  const isServiceActive = (item: typeof SERVICE_ITEMS[0]) => {
    if (item.builder) {
      return location.pathname === `/catalog/builder/${item.key}`
    }
    return location.pathname === item.path
  }

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

          {/* Services Section */}
          <div className="nav-section services">
            <p className="section-title">SERVICES</p>
            {SERVICE_ITEMS.map(item => (
              <button
                key={item.key}
                className={`nav-item service-item ${isServiceActive(item) ? 'active' : ''}`}
                onClick={() => navigate(getServicePath(item))}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="service-label">{item.label}</span>
                <span className="nav-arrow">→</span>
              </button>
            ))}
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
        <Outlet />
      </main>
    </div>
  )
}