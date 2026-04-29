import { useMemo, useState } from 'react'
import './catalog_screen.css'

type ProductStatus = 'active' | 'inactive'

type Product = {
  id: string
  name: string
  category: string
  group: string
  unit: string
  price: number
  status: ProductStatus
  updatedAt: string
}

const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'NVR Setup Box (4 Channel)',
    category: 'Recording',
    group: 'Package Base',
    unit: 'unit',
    price: 4000,
    status: 'active',
    updatedAt: '2026-04-20'
  },
  {
    id: 'prod-002',
    name: 'NVR Setup Box (8 Channel)',
    category: 'Recording',
    group: 'Package Base',
    unit: 'unit',
    price: 6500,
    status: 'active',
    updatedAt: '2026-04-18'
  },
  {
    id: 'prod-003',
    name: 'IP Camera 2MP',
    category: 'Cameras',
    group: 'Core',
    unit: 'unit',
    price: 1800,
    status: 'active',
    updatedAt: '2026-04-16'
  },
  {
    id: 'prod-004',
    name: 'IP Camera 5MP',
    category: 'Cameras',
    group: 'Core',
    unit: 'unit',
    price: 2800,
    status: 'active',
    updatedAt: '2026-04-16'
  },
  {
    id: 'prod-005',
    name: 'Hard Disk 1TB',
    category: 'Storage',
    group: 'Core',
    unit: 'unit',
    price: 3200,
    status: 'active',
    updatedAt: '2026-04-15'
  },
  {
    id: 'prod-006',
    name: 'Hard Disk 2TB',
    category: 'Storage',
    group: 'Core',
    unit: 'unit',
    price: 5200,
    status: 'active',
    updatedAt: '2026-04-15'
  },
  {
    id: 'prod-007',
    name: 'Cable (per meter)',
    category: 'Wiring',
    group: 'Installation',
    unit: 'meter',
    price: 40,
    status: 'active',
    updatedAt: '2026-04-14'
  },
  {
    id: 'prod-008',
    name: 'Junction Box',
    category: 'Accessories',
    group: 'Recommendations',
    unit: 'unit',
    price: 150,
    status: 'active',
    updatedAt: '2026-04-12'
  },
  {
    id: 'prod-009',
    name: 'POE Switch',
    category: 'Accessories',
    group: 'Recommendations',
    unit: 'unit',
    price: 500,
    status: 'active',
    updatedAt: '2026-04-12'
  }
]

const categories = ['All', 'Cameras', 'Storage', 'Recording', 'Wiring', 'Accessories']
const groups = ['All', 'Core', 'Package Base', 'Installation', 'Recommendations']

export default function CatalogScreen() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [group, setGroup] = useState('All')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return mockProducts.filter((product) => {
      const matchesQuery = !query ||
        product.name.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)
      const matchesCategory = category === 'All' || product.category === category
      const matchesGroup = group === 'All' || product.group === group
      return matchesQuery && matchesCategory && matchesGroup
    })
  }, [search, category, group])

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div>
          <h1>Accessories & Catalog</h1>
          <p className="catalog-subtitle">
            Manage products, pricing, and recommendation items shown in customer flows.
          </p>
        </div>
        <div className="catalog-actions">
          <button className="primary-btn">+ Add Product</button>
          <button className="secondary-btn">Import CSV</button>
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="toolbar-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          <label htmlFor="group">Group</label>
          <select
            id="group"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
          >
            {groups.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-group search">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            placeholder="Search product, ID, or keyword"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="toolbar-group">
          <label htmlFor="status">Status</label>
          <select id="status" defaultValue="All">
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      <div className="catalog-table-wrapper">
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Group</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  No products found. Try changing filters or add a new item.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-main">
                      <span className="product-name">{product.name}</span>
                      <span className="product-id">{product.id}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>{product.group}</td>
                  <td>{product.unit}</td>
                  <td>Rs {product.price.toLocaleString()}</td>
                  <td>
                    <span className={`status ${product.status}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>{product.updatedAt}</td>
                  <td>
                    <button className="icon-btn" title="Edit">Edit</button>
                    <button className="icon-btn danger" title="Disable">Disable</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
