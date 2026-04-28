import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@data/auth.store'
import LoginScreen from '@features/auth/login_screen'
import DashboardScreen from '@features/dashboard/dashboard_screen'
import CustomersScreen from '@features/customers/customers_screen'
import TechniciansScreen from '@features/technicians/technicians_screen'
import JobsScreen from '@features/jobs/jobs_screen'
import MainLayout from '@widgets/common/main_layout'
import './App.css'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginScreen />} 
        />
        
        {isAuthenticated ? (
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/customers" element={<CustomersScreen />} />
            <Route path="/technicians" element={<TechniciansScreen />} />
            <Route path="/jobs" element={<JobsScreen />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
