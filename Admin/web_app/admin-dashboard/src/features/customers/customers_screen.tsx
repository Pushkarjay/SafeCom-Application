import { useEffect, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { Customer } from '@data/models/admin_models'
import './customers_screen.css'

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await adminDatasource.getCustomers(page)
        setCustomers(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [page])

  return (
    <div className="customers-screen">
      <div className="screen-header">
        <h1>Customers Management</h1>
        <button className="add-button">➕ Add Customer</button>
      </div>

      {isLoading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
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
                    <button className="action-link">View</button>
                    <button className="action-link">Edit</button>
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
