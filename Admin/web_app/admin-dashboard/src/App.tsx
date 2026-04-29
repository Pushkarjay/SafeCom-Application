import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@data/auth.store'
import LoginScreen from '@features/auth/login_screen'
import DashboardScreen from '@features/dashboard/dashboard_screen'
import CustomersScreen from '@features/customers/customers_screen'
import CustomerDetailScreen from '@features/customers/customer_detail_screen'
import CustomerFormScreen from '@features/customers/customer_form_screen'
import TechniciansScreen from '@features/technicians/technicians_screen'
import TechnicianDetailScreen from '@features/technicians/technician_detail_screen'
import JobsScreen from '@features/jobs/jobs_screen'
import JobDetailScreen from '@features/jobs/job_detail_screen'
import PaymentsScreen from '@features/payments/payments_screen'
import CatalogScreen from '@features/catalog/catalog_screen'
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
            <Route path="/customers/new" element={<CustomerFormScreen />} />
            <Route path="/customers/:id" element={<CustomerDetailScreen />} />
            <Route path="/customers/:id/edit" element={<CustomerFormScreen />} />
            <Route path="/technicians" element={<TechniciansScreen />} />
            <Route path="/technicians/:id" element={<TechnicianDetailScreen />} />
            <Route path="/jobs" element={<JobsScreen />} />
            <Route path="/jobs/:id" element={<JobDetailScreen />} />
            <Route path="/payments" element={<PaymentsScreen />} />
            <Route path="/accessories" element={<CatalogScreen />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
