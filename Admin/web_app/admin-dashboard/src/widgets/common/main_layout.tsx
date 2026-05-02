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

  const isActive = (path: string) => location.pathname === path

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
          <button
            className={`nav-item ${isActive('/accessories') ? 'active' : ''}`}
            onClick={() => navigate('/accessories')}
          >
            🧰 Accessories
          </button>
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
