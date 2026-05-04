import { Job } from '@data/models/admin_models'
import { useState } from 'react'

interface InvoiceGeneratorModalProps {
  job: Job
  onClose: () => void
}

export default function InvoiceGeneratorModal({ job, onClose }: InvoiceGeneratorModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      // In a real application, this would download a PDF or print the HTML
      alert('Invoice PDF generated successfully! (Mocked)')
      onClose()
    }, 1500)
  }

  // Generate a mocked canonical invoice view based on the job details
  const taxAmount = job.amount * 0.18
  const subtotal = job.amount - taxAmount

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ width: '600px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h2>Invoice Generator</h2>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '24px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>SafeCom Services</h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>123 Tech Park, Sector 4</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>New Delhi, India</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>INVOICE</h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>#INV-{job.id.substring(0, 8).toUpperCase()}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Bill To:</p>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#334155' }}>Customer ID: {job.customerId}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '8px 4px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 4px', color: '#334155' }}>
                  <div style={{ fontWeight: '500' }}>{job.serviceType.charAt(0).toUpperCase() + job.serviceType.slice(1)} Service</div>
                  {job.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{job.notes}</div>}
                </td>
                <td style={{ padding: '12px 4px', color: '#334155', textAlign: 'right' }}>₹{subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748b' }}>
                <span>Tax (18% GST)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: '12px', fontWeight: 'bold', color: '#1e293b', fontSize: '18px' }}>
                <span>Total</span>
                <span>₹{job.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
