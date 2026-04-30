import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { catalogProducts } from '../src/data/mock-data.ts'

type FirebaseToolsConfig = {
  tokens?: {
    access_token?: string
    refresh_token?: string
    expires_at?: number
  }
}

const FIREBASE_TOOLS_CONFIG = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json')
const PROJECT_ID = 'safecom-application-01'
const DATABASE_ID = 'default'

function toField(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { nullValue: null }
  }

  if (typeof value === 'string') {
    return { stringValue: value }
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value }
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value }
  }

  return { stringValue: String(value) }
}

async function getAccessToken(config: FirebaseToolsConfig): Promise<string> {
  const accessToken = config.tokens?.access_token
  const expiresAt = config.tokens?.expires_at ?? 0

  if (accessToken && Date.now() < expiresAt - 60_000) {
    return accessToken
  }

  const refreshToken = config.tokens?.refresh_token
  if (!refreshToken) {
    throw new Error('No usable Firebase token found in firebase-tools config.')
  }

  const body = new URLSearchParams({
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iW0hM7f7L8iY6g6VyljL5J',
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh Firebase token: ${response.status} ${await response.text()}`)
  }

  const refreshed = (await response.json()) as {
    access_token: string
    expires_in: number
  }

  config.tokens = {
    ...(config.tokens ?? {}),
    access_token: refreshed.access_token,
    expires_at: Date.now() + refreshed.expires_in * 1000
  }

  fs.writeFileSync(FIREBASE_TOOLS_CONFIG, JSON.stringify(config, null, 2))

  return refreshed.access_token
}

async function upsertProduct(accessToken: string, product: (typeof catalogProducts)[number]): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/catalog_products/${encodeURIComponent(product.id)}`

  const payload = {
    fields: {
      id: toField(product.id),
      name: toField(product.name),
      category: toField(product.category),
      group: toField(product.group),
      unit: toField(product.unit),
      price: toField(product.price),
      status: toField(product.status),
      updatedAt: toField(new Date().toISOString())
    }
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`${product.id}: ${response.status} ${await response.text()}`)
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(FIREBASE_TOOLS_CONFIG)) {
    throw new Error(`Firebase CLI config not found at ${FIREBASE_TOOLS_CONFIG}`)
  }

  const config = JSON.parse(fs.readFileSync(FIREBASE_TOOLS_CONFIG, 'utf8')) as FirebaseToolsConfig
  const accessToken = await getAccessToken(config)

  for (const product of catalogProducts) {
    await upsertProduct(accessToken, product)
    console.log(`Seeded ${product.id}`)
  }

  console.log(`Done. Seeded ${catalogProducts.length} products into catalog_products.`)
}

main().catch((error) => {
  console.error('Firestore token seed failed:', error)
  process.exit(1)
})
