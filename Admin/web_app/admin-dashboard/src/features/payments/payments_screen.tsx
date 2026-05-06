import { useEffect, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { getApiBaseUrl } from '@core/config/api'
import './payments_screen.css'

export interface Payment {
  id: string
  customerId: string
  customerName: string
  jobId: string
  amount: number
  paidAmount: number
  remainingAmount: number
  status: 'pending' | 'partial' | 'completed' | 'failed'
  paymentMethod: string
  transactionId: string
  createdAt: string
  updatedAt: string
}

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<keyof Payment>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'completed'>('all')
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  useEffect(() => {
    const loadPayments = async () => {
      if (!firebaseUser) {
        return
      }
      try {
        const data = await adminDatasource.getPayments()
        setPayments(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadPayments()
  }, [firebaseUser?.uid])

  const baseFiltered = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const processedPayments = baseFiltered
    .filter(p => !searchQuery || p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) || p.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (field: keyof Payment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === processedPayments.length && processedPayments.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedPayments.map(p => p.id)))
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
    if (!window.confirm(`Delete ${selectedIds.size} selected payments?`)) return
    setIsLoading(true)
    try {
      const toDelete = Array.from(selectedIds)
      for (const id of toDelete) {
        const token = await useAuthStore.getState().getIdToken()
        await fetch(`${getApiBaseUrl()}/payments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      }
      setPayments(payments.filter(p => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">Pending</span>
      case 'partial':
        return <span className="badge badge-partial">Partial</span>
      case 'completed':
        return <span className="badge badge-completed">Completed</span>
      default:
        return <span className="badge">{status}</span>
    }
  }

  const totalAmount = processedPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = processedPayments.reduce((sum, p) => sum + p.paidAmount, 0)
  const totalPending = processedPayments.reduce((sum, p) => sum + p.remainingAmount, 0)

  if (isLoading) {
    return <div className="payments-loading">Loading payments...</div>
  }

  return (
    <div className="payments-screen">
      <div className="payments-header">
        <h1>Payment Management</h1>
        <div className="payments-stats">
          <div className="stat-card">
            <p className="stat-label">Total Amount</p>
            <p className="stat-value">₹{(totalAmount / 100).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Paid</p>
            <p className="stat-value stat-positive">₹{(totalPaid / 100).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Pending</p>
            <p className="stat-value stat-warning">₹{(totalPending / 100).toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 24px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Search by ID or Customer..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '300px' }}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions" style={{ padding: '8px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedIds.size} selected</span>
          <button className="secondary-btn danger" onClick={handleBulkDelete} disabled={isLoading}>Delete Selected</button>
        </div>
      )}

      <div className="payments-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({payments.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({payments.filter(p => p.status === 'pending').length})
        </button>
        <button
          className={`filter-btn ${filter === 'partial' ? 'active' : ''}`}
          onClick={() => setFilter('partial')}
        >
          Partial ({payments.filter(p => p.status === 'partial').length})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({payments.filter(p => p.status === 'completed').length})
        </button>
      </div>

      <div className="payments-table-container">
        {processedPayments.length === 0 ? (
          <div className="payments-empty">
            <p>No payments found</p>
          </div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" checked={processedPayments.length > 0 && selectedIds.size === processedPayments.length} onChange={toggleSelectAll} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('transactionId')}>Transaction ID {sortField === 'transactionId' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customerName')}>Customer {sortField === 'customerName' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('amount')}>Amount {sortField === 'amount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('paidAmount')}>Paid {sortField === 'paidAmount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('remainingAmount')}>Remaining {sortField === 'remainingAmount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('paymentMethod')}>Payment Method {sortField === 'paymentMethod' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>Date {sortField === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedPayments.map((payment) => (
                <tr key={payment.id} className={selectedIds.has(payment.id) ? 'selected-row' : ''}>
                  <td><input type="checkbox" checked={selectedIds.has(payment.id)} onChange={() => toggleSelect(payment.id)} /></td>
                  <td className="transaction-id">{payment.transactionId}</td>
                  <td>
                    <div className="customer-info">
                      <p className="customer-name">{payment.customerName}</p>
                      <p className="customer-id">ID: {payment.customerId}</p>
                    </div>
                  </td>
                  <td>₹{(payment.amount / 100).toLocaleString()}</td>
                  <td className="amount-paid">₹{(payment.paidAmount / 100).toLocaleString()}</td>
                  <td className="amount-remaining">₹{(payment.remainingAmount / 100).toLocaleString()}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn view-btn" title="View Details">
                      👁️
                    </button>
                    {payment.status !== 'completed' && (
                      <button className="action-btn edit-btn" title="Request Payment">
                        ↗️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
