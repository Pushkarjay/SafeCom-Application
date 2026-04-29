import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface FirebaseConfig {
  tokens?: {
    refresh_token: string
  }
}

interface TokenResponse {
  access_token: string
  expires_in: number
}

async function getAccessToken(): Promise<string> {
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.config/configstore/firebase-tools.json')
  const config: FirebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  if (!config.tokens?.refresh_token) {
    throw new Error('No refresh token found in Firebase CLI config. Run "firebase login" first.')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9ivanstgwicf7_a5dT1wDzG',
      refresh_token: config.tokens.refresh_token,
      grant_type: 'refresh_token'
    }).toString()
  })

  if (!response.ok) throw new Error(`Token refresh failed: ${response.statusText}`)
  const data: TokenResponse = await response.json()
  return data.access_token
}

async function seedCatalogTabs() {
  const projectId = 'safecom-application-01'
  const databaseId = 'default'

  try {
    const token = await getAccessToken()
    console.log('✓ Token acquired')

    // Sample data for each collection
    const packages = [
      { name: '4 Channel Package', description: 'Basic 4-channel CCTV system', productIds: ['PROD001', 'PROD003'], totalPrice: 8000, discountPercent: 5, finalPrice: 7600 },
      { name: '8 Channel Package', description: 'Advanced 8-channel CCTV system', productIds: ['PROD002', 'PROD004'], totalPrice: 12000, discountPercent: 10, finalPrice: 10800 }
    ]

    const addons = [
      { name: 'Remote Monitoring', description: 'Cloud-based remote monitoring service', category: 'Services', price: 500 },
      { name: 'Installation Service', description: 'Professional installation', category: 'Services', price: 1500 },
      { name: 'Extended Warranty', description: '2-year extended warranty', category: 'Warranty', price: 2000 }
    ]

    const taxes = [
      { name: 'GST 18%', description: 'Goods and Service Tax', rate: 18 },
      { name: 'GST 5%', description: 'Reduced GST rate', rate: 5 }
    ]

    const recommendations = [
      { name: 'Complete Monitoring Setup', description: 'Full CCTV system with accessories', productIds: ['PROD001', 'PROD003', 'PROD007', 'PROD008'], priority: 1 },
      { name: 'Storage Upgrade', description: 'Additional storage devices', productIds: ['PROD005', 'PROD006'], priority: 2 }
    ]

    const invoices = [
      { name: 'Standard Invoice', description: 'Standard invoice template', terms: 'Payment due within 30 days', notes: 'Thank you for your business', showTax: true },
      { name: 'GST Invoice', description: 'GST-compliant invoice', terms: 'Payment due within 15 days', notes: 'Invoice issued as per GST regulations', showTax: true }
    ]

    // Seed each collection
    const collections = [
      { name: 'catalog_packages', data: packages },
      { name: 'catalog_addons', data: addons },
      { name: 'catalog_taxes', data: taxes },
      { name: 'catalog_recommendations', data: recommendations },
      { name: 'catalog_invoices', data: invoices }
    ]

    for (const { name: collectionName, data: items } of collections) {
      console.log(`\nSeeding ${collectionName}...`)
      for (const item of items) {
        const docId = `${collectionName.split('_')[1].toUpperCase().slice(0, 3)}${String(items.indexOf(item) + 1).padStart(3, '0')}`
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionName}?documentId=${docId}`

        const payload = {
          fields: {
            ...Object.entries(item).reduce((acc, [key, value]) => {
              if (typeof value === 'string') acc[key] = { stringValue: value }
              else if (typeof value === 'number') acc[key] = { doubleValue: value }
              else if (typeof value === 'boolean') acc[key] = { booleanValue: value }
              else if (Array.isArray(value)) acc[key] = { arrayValue: { values: value.map(v => ({ stringValue: v })) } }
              return acc
            }, {} as Record<string, any>),
            status: { stringValue: 'active' },
            updatedAt: { timestampValue: new Date().toISOString() }
          }
        }

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          console.log(`  ✓ Seeded ${docId}`)
        } else {
          const error = await response.text()
          console.error(`  ✗ Failed to seed ${docId}: ${error}`)
        }
      }
    }

    console.log('\n✓ Done. Seeded all catalog tabs.')
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

seedCatalogTabs()
