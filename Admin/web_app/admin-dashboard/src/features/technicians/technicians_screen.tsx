import { useEffect, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { Technician } from '@data/models/admin_models'
import './technicians_screen.css'

export default function TechniciansScreen() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const data = await adminDatasource.getTechnicians(page)
        setTechnicians(data)
      } finally {
        setIsLoading(false)
      }
    }

    loadTechnicians()
  }, [page])

  return (
    <div className="technicians-screen">
      <div className="screen-header">
        <h1>Technicians Management</h1>
        <button className="add-button">➕ Add Technician</button>
      </div>

      {isLoading ? (
        <div className="loading">Loading technicians...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Total Jobs</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => (
                <tr key={tech.id}>
                  <td className="name-cell">{tech.name}</td>
                  <td>{tech.email}</td>
                  <td>{tech.location}</td>
                  <td>{tech.totalJobs}</td>
                  <td>
                    <span className="rating">
                      ⭐ {tech.rating.toFixed(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${tech.status}`}>
                      {tech.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-link">View</button>
                    <button className="action-link">Assign</button>
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
