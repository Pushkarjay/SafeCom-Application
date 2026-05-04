/**
 * Seed Script: Master Products Catalog
 * 
 * This script creates the initial master products collection in Firestore.
 * Run with: node dist/scripts/seed-master-products.mjs
 * 
 * Products seeded:
 * - CCTV cameras (2MP, 4MP, 5MP)
 * - Recorders (4-channel, 8-channel, 16-channel)
 * - Access Control systems
 * - Networking equipment
 * - Installation services
 * - Maintenance packages
 * - AMC plans
 */

import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs } from 'firebase-admin/firestore'
import { initializeApp, cert } from 'firebase-admin/app'
import * as fs from 'fs'
import * as path from 'path'

// Initialize Firebase
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.cwd(), 'service-account-key.json')
const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))
initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()
const productsCollection = collection(db, 'master_products')

const MASTER_PRODUCTS = [
  // CCTV Cameras
  {
    productId: 'cam-2mp-full-hd',
    productName: '2MP Full HD CCTV Camera',
    description: 'High-quality 2MP (1920x1080) CCTV camera with 3.6mm lens',
    category: 'installation',
    group: 'CCTV',
    basePrice: 3500,
    stock: 50,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18,
    variants: [
      {
        variantId: 'dome-type',
        name: 'Type',
        options: ['Dome', 'Bullet', 'Turret'],
        allowMultiple: false,
        required: true
      },
      {
        variantId: 'color-opt',
        name: 'Color',
        options: ['White', 'Black', 'Gray'],
        allowMultiple: false,
        required: false
      }
    ]
  },
  {
    productId: 'cam-4mp-4k',
    productName: '4MP Ultra HD CCTV Camera',
    description: 'Premium 4MP (2560x1440) CCTV camera with excellent night vision',
    category: 'installation',
    group: 'CCTV',
    basePrice: 6500,
    stock: 30,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18
  },
  {
    productId: 'cam-5mp-pro',
    productName: '5MP Pro CCTV Camera',
    description: 'Professional 5MP camera with advanced motion detection',
    category: 'installation',
    group: 'CCTV',
    basePrice: 8500,
    stock: 20,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  // Recorders
  {
    productId: 'rec-4ch-1tb',
    productName: '4-Channel DVR Recorder 1TB',
    description: 'Compact 4-channel digital video recorder with 1TB storage',
    category: 'installation',
    group: 'Recording',
    basePrice: 5000,
    stock: 25,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18
  },
  {
    productId: 'rec-8ch-2tb',
    productName: '8-Channel NVR Recorder 2TB',
    description: 'Professional 8-channel NVR with 2TB HDD, supports 4MP cameras',
    category: 'installation',
    group: 'Recording',
    basePrice: 12000,
    stock: 15,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18
  },
  {
    productId: 'rec-16ch-4tb',
    productName: '16-Channel NVR Recorder 4TB',
    description: 'Enterprise 16-channel NVR with 4TB storage, supports 5MP cameras',
    category: 'installation',
    group: 'Recording',
    basePrice: 25000,
    stock: 10,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  // Access Control
  {
    productId: 'ac-card-reader',
    productName: 'RFID Card Reader',
    description: '13.56MHz RFID reader for card-based access control',
    category: 'accessories',
    group: 'Access Control',
    basePrice: 2500,
    stock: 40,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  {
    productId: 'ac-biometric-reader',
    productName: 'Biometric Fingerprint Reader',
    description: 'High-security biometric fingerprint scanner with relay control',
    category: 'accessories',
    group: 'Access Control',
    basePrice: 8000,
    stock: 15,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18
  },
  {
    productId: 'ac-lock-electric',
    productName: 'Electric Door Lock (12V)',
    description: 'Fail-safe electric door lock compatible with all readers',
    category: 'accessories',
    group: 'Access Control',
    basePrice: 3500,
    stock: 30,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  // Networking
  {
    productId: 'net-poe-switch-8',
    productName: '8-Port PoE Network Switch',
    description: 'Managed PoE switch with 8 ports, 120W total power',
    category: 'accessories',
    group: 'Networking',
    basePrice: 4500,
    stock: 20,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  {
    productId: 'net-cable-cat6-100m',
    productName: 'CAT6 Network Cable 100m',
    description: 'High-speed CAT6 network cable, 100m spool',
    category: 'accessories',
    group: 'Networking',
    basePrice: 2000,
    stock: 50,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  // Services
  {
    productId: 'svc-installation',
    productName: 'Professional Installation Service',
    description: 'Full installation of CCTV system including wiring and setup',
    category: 'installation',
    group: 'Services',
    basePrice: 5000,
    stock: 999,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18,
    pricingTiers: [
      { minQuantity: 1, unitPrice: 5000 },
      { minQuantity: 5, unitPrice: 4500 },
      { minQuantity: 10, unitPrice: 4000 }
    ]
  },
  {
    productId: 'svc-maintenance-quarterly',
    productName: 'Quarterly Maintenance Service',
    description: 'Quarterly system check, cleaning, and performance optimization',
    category: 'maintenance',
    group: 'Services',
    basePrice: 1500,
    stock: 999,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18
  },
  {
    productId: 'svc-amc-annual',
    productName: 'Annual AMC Plan',
    description: 'Complete Annual Maintenance Contract including 24/7 support',
    category: 'amc',
    group: 'Services',
    basePrice: 8000,
    stock: 999,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18
  },
  // Repair Services
  {
    productId: 'svc-repair-camera',
    productName: 'Camera Repair Service',
    description: 'Diagnosis and repair of CCTV cameras',
    category: 'repair',
    group: 'Services',
    basePrice: 2000,
    stock: 999,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  {
    productId: 'svc-repair-recorder',
    productName: 'Recorder Repair Service',
    description: 'DVR/NVR diagnosis, troubleshooting, and repair',
    category: 'repair',
    group: 'Services',
    basePrice: 3000,
    stock: 999,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  },
  // Upgrade Services
  {
    productId: 'svc-upgrade-storage',
    productName: 'Storage Upgrade Service',
    description: 'Upgrade recorder HDD capacity and installation',
    category: 'upgrade',
    group: 'Services',
    basePrice: 3500,
    stock: 999,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18
  }
]

async function seedProducts() {
  try {
    console.log('🌱 Starting product catalog seeding...')

    // Clear existing products (optional, uncomment to reset)
    // console.log('Clearing existing products...')
    // const existing = await getDocs(productsCollection)
    // for (const docSnapshot of existing.docs) {
    //   await deleteDoc(doc(productsCollection, docSnapshot.id))
    // }
    // console.log('✅ Cleared existing products')

    // Add new products
    let created = 0
    for (const product of MASTER_PRODUCTS) {
      const now = new Date().toISOString()
      const docData = {
        ...product,
        createdAt: product.createdAt || now,
        updatedAt: product.updatedAt || now
      }

      await setDoc(doc(productsCollection, product.productId), docData)
      created++
      console.log(`✓ Created: ${product.productName}`)
    }

    console.log(`\n✅ Successfully seeded ${created} products!`)
    console.log('\nProducts by category:')
    const categories = [...new Set(MASTER_PRODUCTS.map(p => p.category))]
    for (const cat of categories) {
      const count = MASTER_PRODUCTS.filter(p => p.category === cat).length
      console.log(`  - ${cat}: ${count} products`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run seeding
seedProducts()
