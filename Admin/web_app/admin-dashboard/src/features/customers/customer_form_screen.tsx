import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminDatasource } from '@data/datasources/admin_datasource'
import '../styles/form_screen.css'

interface FormData {
  name: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive'
}

interface FormErrors {
  [key: string]: string
}

export default function CustomerFormScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      const loadCustomer = async () => {
        try {
          const customers = await adminDatasource.getCustomers(1)
          const customer = customers.find(c => c.id === id)
          if (customer) {
            setFormData({
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              status: customer.status,
            })
          }
        } finally {
          setIsLoading(false)
        }
      }
      loadCustomer()
    }
  }, [id, isEdit])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        totalOrders: 0,
        totalSpent: 0,
      }

      if (isEdit && id) {
        // Update customer
        await adminDatasource.updateCustomer(id, payload)
      } else {
        // Create customer
        await adminDatasource.createCustomer(payload as any)
      }

      navigate('/customers')
    } catch (error) {
      console.error('Error saving customer:', error)
      setErrors({ submit: 'Failed to save customer. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/customers')
  }

  if (isLoading) {
    return <div className="form-screen"><div className="loading">Loading customer...</div></div>
  }

  return (
    <div className="form-screen">
      <div className="form-header">
        <button className="back-button" onClick={handleCancel}>← Back</button>
        <h1>{isEdit ? 'Edit Customer' : 'Add New Customer'}</h1>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        {errors.submit && <div className="form-error">{errors.submit}</div>}

        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter customer name"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="customer@example.com"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 XXXXX XXXXX"
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="address">Address *</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter full address"
            rows={4}
            className={errors.address ? 'error' : ''}
          />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer')}
          </button>
        </div>
      </form>
    </div>
  )
}
