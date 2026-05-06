import { useState, useEffect } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import './catalog_screen.css' // Reuse the same styles

interface Mapping {
  id: string
  category: string
  group: string
  productId: string
  minQty: number
  maxQty: number
}

export default function InstallationBuilderScreen() {
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      if (!firebaseUser) return
      setIsLoading(true)
      try {
        const data = await adminDatasource.getPricingData()
        // Here we assume installation pricing data might contain an array of mappings
        if (data.installation && Array.isArray(data.installation.mappings)) {
          setMappings(data.installation.mappings as Mapping[])
        } else {
          // Initialize empty or mock mapping for demonstration
          setMappings([
            { id: '1', category: 'Cameras', group: 'Core', productId: 'PROD-CAM-01', minQty: 1, maxQty: 16 }
          ])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load installation config')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [firebaseUser?.uid])

  const handleAddMapping = () => {
    setMappings([
      ...mappings,
      { id: Date.now().toString(), category: '', group: '', productId: '', minQty: 1, maxQty: 1 }
    ])
  }

  const handleUpdateMapping = (id: string, field: keyof Mapping, value: string | number) => {
    setMappings(mappings.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const handleDeleteMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await adminDatasource.updatePricingData({
        installation: {
          mappings
        }
      })
      alert('Installation configuration saved successfully!')
    } catch (err) {
      setError('Failed to save configuration: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div>
          <h1>Installation Builder</h1>
          <p className="catalog-subtitle">Define category, group, and product mappings with quantity constraints.</p>
        </div>
        <div className="catalog-actions">
          <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {error && <div className="catalog-error">{error}</div>}

      <div className="catalog-table-wrapper" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Product Mappings</h2>
          <button className="primary-btn" onClick={handleAddMapping}>+ Add Mapping</button>
        </div>
        
        {isLoading ? <div className="catalog-loading">Loading...</div> : (
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Group</th>
                <th>Product ID</th>
                <th>Min Qty</th>
                <th>Max Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr><td colSpan={6} className="empty-cell">No mappings defined</td></tr>
              ) : (
                mappings.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <input 
                        value={m.category} 
                        onChange={(e) => handleUpdateMapping(m.id, 'category', e.target.value)} 
                        placeholder="e.g. Cameras"
                        style={{ width: '100%', padding: '8px' }}
                      />
                    </td>
                    <td>
                      <input 
                        value={m.group} 
                        onChange={(e) => handleUpdateMapping(m.id, 'group', e.target.value)} 
                        placeholder="e.g. Core"
                        style={{ width: '100%', padding: '8px' }}
                      />
                    </td>
                    <td>
                      <input 
                        value={m.productId} 
                        onChange={(e) => handleUpdateMapping(m.id, 'productId', e.target.value)} 
                        placeholder="e.g. PROD-001"
                        style={{ width: '100%', padding: '8px' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        value={m.minQty} 
                        onChange={(e) => handleUpdateMapping(m.id, 'minQty', Number(e.target.value))} 
                        style={{ width: '60px', padding: '8px' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        value={m.maxQty} 
                        onChange={(e) => handleUpdateMapping(m.id, 'maxQty', Number(e.target.value))} 
                        style={{ width: '60px', padding: '8px' }}
                      />
                    </td>
                    <td>
                      <button className="icon-btn danger" onClick={() => handleDeleteMapping(m.id)}>Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
