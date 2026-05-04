import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./service-account-key.json', 'utf8')
)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ============================================
// SERVICE CONFIGS DATA
// ============================================

const installationCategories = [
  {
    categoryId: "ip_camera",
    name: "IP Camera Setup",
    description: "High-definition digital IP cameras",
    imageUrl: "https://via.placeholder.com/150",
    order: 1
  },
  {
    categoryId: "dvr_camera",
    name: "Analog/DVR Camera Setup",
    description: "Traditional analog cameras with DVR",
    imageUrl: "https://via.placeholder.com/150",
    order: 2
  },
  {
    categoryId: "wifi_camera",
    name: "Wi-Fi Camera Setup",
    description: "Wireless cameras for easy installation",
    imageUrl: "https://via.placeholder.com/150",
    order: 3
  }
]

// Common components for IP camera setups
const ipCamMappings = (cameraQty) => [
  { productId: "prod_ip_cam_basic", defaultQty: cameraQty, minQty: 1, maxQty: cameraQty }, // Max prevents over-selection before next tier
  { productId: "prod_nvr_" + (cameraQty <= 4 ? "4ch" : cameraQty <= 8 ? "8ch" : cameraQty <= 16 ? "16ch" : "32ch"), defaultQty: 1, minQty: 1, maxQty: 1 },
  { productId: "prod_poe_switch_" + (cameraQty <= 4 ? "4ch" : "8ch"), defaultQty: cameraQty <= 4 ? 1 : Math.ceil(cameraQty/8), minQty: 1, maxQty: 4 },
  { productId: "prod_hdd_" + (cameraQty <= 4 ? "1tb" : cameraQty <= 8 ? "2tb" : cameraQty <= 16 ? "4tb" : "8tb"), defaultQty: 1, minQty: 0, maxQty: 4 },
  { productId: "prod_cable_cat6", defaultQty: Math.ceil(cameraQty/2), minQty: 1, maxQty: 10 },
  { productId: "prod_junction_box", defaultQty: cameraQty, minQty: 0, maxQty: cameraQty * 2 },
  { productId: "prod_connectors_pack", defaultQty: Math.ceil(cameraQty/4), minQty: 1, maxQty: 10 },
  { productId: "srv_installation_charge_per_cam", defaultQty: cameraQty, minQty: 1, maxQty: cameraQty }
]

const dvrCamMappings = (cameraQty) => [
  { productId: "prod_dvr_cam_basic", defaultQty: cameraQty, minQty: 1, maxQty: cameraQty },
  // using NVR ids as placeholders for DVR for simplicity in seed
  { productId: "prod_nvr_" + (cameraQty <= 4 ? "4ch" : cameraQty <= 8 ? "8ch" : cameraQty <= 16 ? "16ch" : "32ch"), defaultQty: 1, minQty: 1, maxQty: 1 },
  { productId: "prod_power_supply_" + (cameraQty <= 4 ? "4ch" : "8ch"), defaultQty: Math.ceil(cameraQty/8) || 1, minQty: 1, maxQty: 4 },
  { productId: "prod_hdd_" + (cameraQty <= 4 ? "1tb" : cameraQty <= 8 ? "2tb" : cameraQty <= 16 ? "4tb" : "8tb"), defaultQty: 1, minQty: 0, maxQty: 4 },
  { productId: "prod_cable_3plus1", defaultQty: Math.ceil(cameraQty/2), minQty: 1, maxQty: 10 },
  { productId: "prod_junction_box", defaultQty: cameraQty, minQty: 0, maxQty: cameraQty * 2 },
  { productId: "prod_connectors_pack", defaultQty: Math.ceil(cameraQty/4), minQty: 1, maxQty: 10 },
  { productId: "srv_installation_charge_per_cam", defaultQty: cameraQty, minQty: 1, maxQty: cameraQty }
]

const installationGroups = {
  "ip_camera": [
    { groupId: "setup_4cam", name: "4 Camera Setup", description: "Ideal for small homes", order: 1, mappings: ipCamMappings(4), overflowRule: { targetGroupId: "setup_8cam", threshold: 4 } },
    { groupId: "setup_8cam", name: "8 Camera Setup", description: "Ideal for large homes", order: 2, mappings: ipCamMappings(8), overflowRule: { targetGroupId: "setup_16cam", threshold: 8 } },
    { groupId: "setup_16cam", name: "16 Camera Setup", description: "Ideal for small business", order: 3, mappings: ipCamMappings(16), overflowRule: { targetGroupId: "setup_32cam", threshold: 16 } },
    { groupId: "setup_32cam", name: "32 Camera Setup", description: "Ideal for large business", order: 4, mappings: ipCamMappings(32) }
  ],
  "dvr_camera": [
    { groupId: "setup_4cam", name: "4 Camera Setup", description: "Ideal for small homes", order: 1, mappings: dvrCamMappings(4), overflowRule: { targetGroupId: "setup_8cam", threshold: 4 } },
    { groupId: "setup_8cam", name: "8 Camera Setup", description: "Ideal for large homes", order: 2, mappings: dvrCamMappings(8), overflowRule: { targetGroupId: "setup_16cam", threshold: 8 } },
    { groupId: "setup_16cam", name: "16 Camera Setup", description: "Ideal for small business", order: 3, mappings: dvrCamMappings(16), overflowRule: { targetGroupId: "setup_32cam", threshold: 16 } },
    { groupId: "setup_32cam", name: "32 Camera Setup", description: "Ideal for large business", order: 4, mappings: dvrCamMappings(32) }
  ],
  "wifi_camera": [
    { 
      groupId: "setup_wifi_custom", 
      name: "Custom Wi-Fi Setup", 
      description: "Select number of cameras", 
      order: 1, 
      mappings: [
        { productId: "prod_wifi_cam", defaultQty: 1, minQty: 1, maxQty: 10 },
        { productId: "srv_installation_charge_per_cam", defaultQty: 1, minQty: 1, maxQty: 10 }
      ]
    }
  ]
}

const recommendations = [
  {
    recId: "rec_junction_box",
    placement: "checkout",
    priority: 1,
    serviceTypes: ["installation", "repair"],
    productId: "prod_junction_box"
  },
  {
    recId: "rec_upsell_hdd",
    placement: "cart",
    priority: 2,
    serviceTypes: ["installation"],
    productId: "prod_hdd_4tb"
  }
]

// ============================================
// SEED
// ============================================

async function seed() {
  console.log('🌱 Seeding Service Configs...\n')
  
  const now = new Date().toISOString()
  let count = 0

  // Seed installation categories and groups
  const installationRef = db.collection('catalog_pricing').doc('installation')
  await installationRef.set({ name: "Installation Config", updatedAt: now })
  
  for (const cat of installationCategories) {
    const catRef = installationRef.collection('categories').doc(cat.categoryId)
    await catRef.set({ ...cat, updatedAt: now })
    count++
    console.log(`  ✅ catalog_pricing/installation/categories/${cat.categoryId}`)

    const groups = installationGroups[cat.categoryId]
    if (groups) {
      for (const group of groups) {
        const groupRef = catRef.collection('groups').doc(group.groupId)
        await groupRef.set({ ...group, updatedAt: now })
        count++
        console.log(`    ✅ .../groups/${group.groupId}`)
      }
    }
  }

  // Seed Recommendations
  for (const rec of recommendations) {
    await db.collection('catalog_recommendations').doc(rec.recId).set({ ...rec, updatedAt: now })
    count++
    console.log(`  ✅ catalog_recommendations/${rec.recId}`)
  }

  console.log(`\n🎉 Seed complete! Added ${count} service config documents.`)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
