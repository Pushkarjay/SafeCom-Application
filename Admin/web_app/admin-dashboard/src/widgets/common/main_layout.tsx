import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@core/services/auth_service'
import './main_layout.css'

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

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SafeCom</h2>
          <p>Admin</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-item ${isActive('/customers') ? 'active' : ''}`}
            onClick={() => navigate('/customers')}
          >
            👥 Customers
          </button>
          <button
            className={`nav-item ${isActive('/technicians') ? 'active' : ''}`}
            onClick={() => navigate('/technicians')}
          >
            🔧 Technicians
          </button>
          <button
            className={`nav-item ${isActive('/jobs') ? 'active' : ''}`}
            onClick={() => navigate('/jobs')}
          >
            📋 Jobs
          </button>
          <button
            className={`nav-item ${isActive('/payments') ? 'active' : ''}`}
            onClick={() => navigate('/payments')}
          >
            💳 Payments
          </button>

          <div className="sidebar-section">
            <p className="sidebar-section-title" style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '16px', marginBottom: '8px', paddingLeft: '16px' }}>CATALOG & SERVICES</p>
            <button
              className={`nav-item ${location.pathname === '/catalog/products' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/products')}
            >
              📦 Products
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/installation' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/installation')}
            >
              🛠️ Installation
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/accessories' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/accessories')}
            >
              🧰 Accessories
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/maintenance' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/maintenance')}
            >
              🧹 Maintenance
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/repair' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/repair')}
            >
              📷 Camera Repair
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/amc' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/amc')}
            >
              📋 AMC Plans
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/upgrade' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/upgrade')}
            >
              ⭐ Upgrade
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/recommendations' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/recommendations')}
            >
              💡 Recommendations
            </button>
            <button
              className={`nav-item ${location.pathname === '/catalog/services' ? 'active' : ''}`}
              onClick={() => navigate('/catalog/services')}
            >
              ⚡ Services
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <p className="admin-name">{admin?.name}</p>
            <p className="admin-email">{admin?.email}</p>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
