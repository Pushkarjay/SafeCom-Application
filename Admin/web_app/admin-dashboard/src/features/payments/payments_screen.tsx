import { useEffect, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
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

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.status === filter)

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

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.paidAmount, 0)
  const totalPending = filteredPayments.reduce((sum, p) => sum + p.remainingAmount, 0)

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
        {filteredPayments.length === 0 ? (
          <div className="payments-empty">
            <p>No payments found</p>
          </div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
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
