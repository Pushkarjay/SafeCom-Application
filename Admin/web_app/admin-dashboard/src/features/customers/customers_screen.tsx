import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { Customer } from '@data/models/admin_models'
import { getApiBaseUrl } from '@core/config/api'
import { useAuthenticatedData } from '@/core/hooks/useAuthenticatedData'
import './customers_screen.css'

export default function CustomersScreen() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<keyof Customer>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  
  const { data: customers, isLoading } = useAuthenticatedData<Customer[]>(
    async () => {
      const data = await adminDatasource.getCustomers(page)
      return data
    },
    [page] // Re-fetch when page changes
  )
  
  const processedCustomers = [...(customers || [])]
    .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === processedCustomers.length && processedCustomers.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedCustomers.map(c => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} selected customers?`)) return
    try {
      const toDelete = Array.from(selectedIds)
      for (const id of toDelete) {
        const token = await useAuthStore.getState().getIdToken()
        await fetch(`${getApiBaseUrl()}/customers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      }
      setSelectedIds(new Set())
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="customers-screen">
      <div className="screen-header">
        <h1>Customers Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="primary-btn" onClick={() => navigate('/customers/new')}>+ Add Customer</button>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions" style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedIds.size} selected</span>
          <button className="secondary-btn danger" onClick={handleBulkDelete} disabled={isLoading}>Delete Selected</button>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={processedCustomers.length > 0 && selectedIds.size === processedCustomers.length} onChange={toggleSelectAll} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>Email {sortField === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('phone')}>Phone {sortField === 'phone' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('totalOrders')}>Total Orders {sortField === 'totalOrders' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('totalSpent')}>Total Spent {sortField === 'totalSpent' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedCustomers.map((customer) => (
                <tr key={customer.id} className={selectedIds.has(customer.id) ? 'selected-row' : ''}>
                  <td><input type="checkbox" checked={selectedIds.has(customer.id)} onChange={() => toggleSelect(customer.id)} /></td>
                  <td className="name-cell">
                    <span>{customer.name}</span>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.totalOrders}</td>
                  <td className="amount">₹{customer.totalSpent.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${customer.status}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-link" onClick={() => customer.id && navigate(`/customers/${customer.id}`)}>
                      View
                    </button>
                    <button className="action-link" onClick={() => customer.id && navigate(`/customers/${customer.id}/edit`)}>
                      Edit
                    </button>
                    <button className="icon-btn danger" onClick={async () => {
                      if (!confirm(`Delete customer "${customer.name}"?`)) return
                      const token = await useAuthStore.getState().getIdToken()
                      await fetch(`${getApiBaseUrl()}/customers/${customer.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                      window.location.reload()
                    }} title="Delete customer">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          ← Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  )
}
