import { Job } from '@data/models/admin_models'
import { useState } from 'react'

interface InvoiceGeneratorModalProps {
  job: Job
  onClose: () => void
}

export default function InvoiceGeneratorModal({ job, onClose }: InvoiceGeneratorModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePrint = () => {
    setIsGenerating(true)
    const taxAmount = job.amount * 0.18
    const subtotal = job.amount - taxAmount
    const invoiceNo = `INV-${job.id.substring(0, 8).toUpperCase()}`

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to print the invoice.')
      setIsGenerating(false)
      return
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>Invoice ${invoiceNo}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company h1 { margin: 0; font-size: 24px; color: #1e293b; }
          .company p { margin: 4px 0; color: #64748b; font-size: 14px; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { margin: 0; font-size: 20px; color: #1e293b; }
          .invoice-title p { margin: 4px 0; color: #64748b; font-size: 14px; }
          .bill-to { margin-bottom: 32px; }
          .bill-to p { margin: 2px 0; font-size: 14px; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          th { border-bottom: 2px solid #e2e8f0; padding: 10px 8px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase; }
          td { border-bottom: 1px solid #e2e8f0; padding: 12px 8px; font-size: 14px; color: #334155; }
          td:last-child, th:last-child { text-align: right; }
          .totals { width: 300px; margin-left: auto; }
          .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #64748b; }
          .totals .row.total { border-top: 2px solid #1e293b; padding-top: 12px; font-weight: bold; font-size: 18px; color: #1e293b; }
          .footer { text-align: center; margin-top: 48px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          hr { border: none; border-top: 1px dashed #cbd5e1; margin: 32px 0; }
          .print-info { text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h1>IT & Security Solutions</h1>
            <p>123 Tech Park, Sector 4</p>
            <p>New Delhi, India</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p>#${invoiceNo}</p>
            <p>Date: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div class="bill-to">
          <p><strong>Bill To:</strong></p>
          <p>Customer ID: ${job.customerId}</p>
        </div>

        <table>
          <thead>
            <tr><th>#</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${job.serviceType.charAt(0).toUpperCase() + job.serviceType.slice(1)} Service${job.notes ? ' — ' + job.notes : ''}</td>
              <td>1</td>
              <td>₹${subtotal.toFixed(2)}</td>
              <td>₹${subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
          <div class="row"><span>Tax (18% GST)</span><span>₹${taxAmount.toFixed(2)}</span></div>
          <div class="row total"><span>Total</span><span>₹${job.amount.toFixed(2)}</span></div>
        </div>

        <hr>
        <div class="print-info">This is a computer-generated invoice.</div>
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      setIsGenerating(false)
      onClose()
    }, 500)
  }

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
              <h3 style={{ margin: 0, color: '#1e293b' }}>IT & Security Solutions</h3>
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
          <button className="primary-btn" onClick={handlePrint} disabled={isGenerating}>
            {isGenerating ? 'Opening Print Dialog...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
