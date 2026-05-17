import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@core/services/auth_service'
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
import ServiceTreeBuilderScreen from '@features/catalog/service_tree_builder_screen'
import ServiceCreatorScreen from '@features/catalog/service_creator_screen'
import ServiceableAreasScreen from '@features/settings/serviceable_areas_screen'
import MobilePreviewScreen from '@features/mobile_preview/mobile_preview_screen'
import MainLayout from '@widgets/common/main_layout'
import './App.css'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const CatalogRoute = () => {
    const params = useParams()
    return <CatalogScreen key={params.tab} />
  }

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
            <Route path="/technicians/new" element={<TechnicianDetailScreen />} />
            <Route path="/technicians/:id" element={<TechnicianDetailScreen />} />
            <Route path="/technicians/:id/edit" element={<TechnicianDetailScreen />} />
            <Route path="/jobs" element={<JobsScreen />} />
            <Route path="/jobs/new" element={<JobDetailScreen />} />
            <Route path="/jobs/:id" element={<JobDetailScreen />} />
            <Route path="/jobs/:id/edit" element={<JobDetailScreen />} />
            <Route path="/payments" element={<PaymentsScreen />} />
            <Route path="/catalog/builder/:serviceId" element={<ServiceTreeBuilderScreen />} />
            <Route path="/catalog/services" element={<ServiceCreatorScreen />} />
            <Route path="/catalog/:tab" element={<CatalogRoute />} />
            <Route path="/catalog/home-cms" element={<Navigate to="/mobile-preview" replace />} />
            <Route path="/settings/serviceable-areas" element={<ServiceableAreasScreen />} />
            <Route path="/mobile-preview" element={<MobilePreviewScreen />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
