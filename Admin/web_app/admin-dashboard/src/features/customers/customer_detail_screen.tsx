import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { Customer, Job, Payment } from '@data/models/admin_models'
import '../styles/detail_screen.css'

export default function CustomerDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'jobs' | 'payments'>('info')

  useEffect(() => {
    const loadData = async () => {
      try {
        if (id === 'new') {
          // Initialize empty customer for new record
          setCustomer({
            id: `CUST-${Date.now()}`,
            name: '',
            email: '',
            phone: '',
            address: '',
            totalOrders: 0,
            totalSpent: 0,
            status: 'active',
            registeredDate: new Date().toISOString()
          })
        } else if (id) {
          // Try to get customer from list
          const allCustomers = await adminDatasource.getCustomers(1)
          const found = allCustomers.find(c => c.id === id)
          if (found) setCustomer(found)

          // Get customer's jobs
          const allJobs = await adminDatasource.getJobs('all', 1)
          const customerJobs = allJobs.filter(j => j.customerId === id)
          setJobs(customerJobs)

          // Get payments
          const allPayments = await adminDatasource.getPayments(1)
          const customerPayments = allPayments.filter(p => p.customerId === id)
          setPayments(customerPayments)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  if (isLoading) {
    return <div className="detail-screen"><div className="loading">Loading customer details...</div></div>
  }

  if (!customer) {
    return (
      <div className="detail-screen">
        <div className="error-message">Customer not found</div>
        <button onClick={() => navigate('/customers')}>Back to Customers</button>
      </div>
    )
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const completedJobs = jobs.filter(j => j.status === 'completed').length

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/customers')}>← Back</button>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/customers/${id}/edit`)}>
              Edit Customer
            </button>
          </div>
        </div>

        <div className="customer-card">
          <div className="card-section">
            <h1>{customer.name}</h1>
            <span className={`status-badge ${customer.status}`}>{customer.status}</span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <p>{customer.email}</p>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <p>{customer.phone}</p>
            </div>
            <div className="info-item">
              <label>Address</label>
              <p>{customer.address}</p>
            </div>
            <div className="info-item">
              <label>Total Orders</label>
              <p className="amount">{customer.totalOrders}</p>
            </div>
            <div className="info-item">
              <label>Total Spent</label>
              <p className="amount">₹{customer.totalSpent.toLocaleString()}</p>
            </div>
            <div className="info-item">
              <label>Registered Date</label>
              <p>{new Date(customer.registeredDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat">
              <span className="stat-value">{completedJobs}</span>
              <span className="stat-label">Completed Jobs</span>
            </div>
            <div className="stat">
              <span className="stat-value">₹{totalAmount.toLocaleString()}</span>
              <span className="stat-label">Total Paid</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button 
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs ({jobs.length})
        </button>
        <button 
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments ({payments.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-section">
              <h3>Contact Information</h3>
              <div className="info-pair">
                <span>Email:</span>
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </div>
              <div className="info-pair">
                <span>Phone:</span>
                <a href={`tel:${customer.phone}`}>{customer.phone}</a>
              </div>
              <div className="info-pair">
                <span>Address:</span>
                <p>{customer.address}</p>
              </div>
            </div>

            <div className="info-section">
              <h3>Account Statistics</h3>
              <div className="info-pair">
                <span>Account Status:</span>
                <span className={`status-badge ${customer.status}`}>{customer.status}</span>
              </div>
              <div className="info-pair">
                <span>Member Since:</span>
                <p>{new Date(customer.registeredDate).toLocaleDateString()}</p>
              </div>
              <div className="info-pair">
                <span>Total Orders:</span>
                <p>{customer.totalOrders}</p>
              </div>
              <div className="info-pair">
                <span>Lifetime Value:</span>
                <p className="amount">₹{customer.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-tab">
            {jobs.length === 0 ? (
              <p className="empty-message">No jobs assigned to this customer</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Service Type</th>
                    <th>Technician</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Scheduled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="job-id">{job.id}</td>
                      <td>{job.serviceType}</td>
                      <td>{job.technicianId || '—'}</td>
                      <td><span className={`status-badge ${job.status}`}>{job.status}</span></td>
                      <td className="amount">₹{job.amount.toLocaleString()}</td>
                      <td>{new Date(job.scheduledDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-tab">
            {payments.length === 0 ? (
              <p className="empty-message">No payments recorded</p>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Job ID</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td className="payment-id">{payment.id}</td>
                        <td>{payment.jobId}</td>
                        <td className="amount">₹{payment.amount.toLocaleString()}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="payment-summary">
                  <strong>Total Paid: </strong>
                  <span className="amount">₹{totalAmount.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
