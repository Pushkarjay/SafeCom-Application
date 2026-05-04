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
// MASTER PRODUCTS DATA
// ============================================

const masterProducts = [
  // ------------------------------------------
  // Cameras
  // ------------------------------------------
  {
    productId: "prod_ip_cam_basic",
    productName: "Basic IP Camera",
    description: "Standard 2MP IP Camera for indoor/outdoor use",
    category: "installation",
    group: "Cameras",
    basePrice: 1500,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18,
    variants: [
      {
        variantId: "res",
        name: "Resolution",
        options: ["2MP", "5MP", "8MP"],
        allowMultiple: false,
        required: true
      }
    ]
  },
  {
    productId: "prod_ip_cam_advanced",
    productName: "Advanced IP Camera",
    description: "High-resolution 5MP/8MP IP Camera with night vision",
    category: "installation",
    group: "Cameras",
    basePrice: 3500,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18,
    variants: [
      {
        variantId: "res",
        name: "Resolution",
        options: ["5MP", "8MP"],
        allowMultiple: false,
        required: true
      }
    ]
  },
  {
    productId: "prod_dvr_cam_basic",
    productName: "Basic DVR Camera",
    description: "Standard 2MP Analog/DVR Camera",
    category: "installation",
    group: "Cameras",
    basePrice: 1200,
    isAvailable: true,
    isFeatured: false,
    taxRate: 18,
    variants: [
      {
        variantId: "res",
        name: "Resolution",
        options: ["2MP", "5MP"],
        allowMultiple: false,
        required: true
      }
    ]
  },
  {
    productId: "prod_wifi_cam",
    productName: "Wi-Fi Camera",
    description: "Wireless Pan/Tilt IP Camera",
    category: "installation",
    group: "Cameras",
    basePrice: 2500,
    isAvailable: true,
    isFeatured: true,
    taxRate: 18,
    variants: [
      {
        variantId: "res",
        name: "Resolution",
        options: ["2MP", "3MP"],
        allowMultiple: false,
        required: true
      }
    ]
  },
  
  // ------------------------------------------
  // NVR / DVR Units
  // ------------------------------------------
  {
    productId: "prod_nvr_4ch",
    productName: "4 Channel NVR",
    description: "Network Video Recorder supports up to 4 IP cameras",
    category: "installation",
    group: "Recorders",
    basePrice: 3000,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_nvr_8ch",
    productName: "8 Channel NVR",
    description: "Network Video Recorder supports up to 8 IP cameras",
    category: "installation",
    group: "Recorders",
    basePrice: 4500,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_nvr_16ch",
    productName: "16 Channel NVR",
    description: "Network Video Recorder supports up to 16 IP cameras",
    category: "installation",
    group: "Recorders",
    basePrice: 8000,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_nvr_32ch",
    productName: "32 Channel NVR",
    description: "Network Video Recorder supports up to 32 IP cameras",
    category: "installation",
    group: "Recorders",
    basePrice: 15000,
    isAvailable: true,
    taxRate: 18
  },
  
  // ------------------------------------------
  // Storage (Hard Disks)
  // ------------------------------------------
  {
    productId: "prod_hdd_1tb",
    productName: "1TB Surveillance HDD",
    description: "1 Terabyte Hard Disk Drive optimized for 24/7 recording",
    category: "installation",
    group: "Storage",
    basePrice: 3500,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_hdd_2tb",
    productName: "2TB Surveillance HDD",
    description: "2 Terabyte Hard Disk Drive optimized for 24/7 recording",
    category: "installation",
    group: "Storage",
    basePrice: 5000,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_hdd_4tb",
    productName: "4TB Surveillance HDD",
    description: "4 Terabyte Hard Disk Drive optimized for 24/7 recording",
    category: "installation",
    group: "Storage",
    basePrice: 9000,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_hdd_8tb",
    productName: "8TB Surveillance HDD",
    description: "8 Terabyte Hard Disk Drive optimized for 24/7 recording",
    category: "installation",
    group: "Storage",
    basePrice: 16000,
    isAvailable: true,
    taxRate: 18
  },

  // ------------------------------------------
  // Cables & Wiring
  // ------------------------------------------
  {
    productId: "prod_cable_cat6",
    productName: "CAT6 Cable (per roll/90m)",
    description: "High-quality CAT6 networking cable",
    category: "installation",
    group: "Wiring",
    basePrice: 1800,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_cable_3plus1",
    productName: "3+1 CCTV Cable (per roll/90m)",
    description: "Standard analog camera wiring cable",
    category: "installation",
    group: "Wiring",
    basePrice: 1200,
    isAvailable: true,
    taxRate: 18
  },

  // ------------------------------------------
  // Accessories & Power
  // ------------------------------------------
  {
    productId: "prod_poe_switch_4ch",
    productName: "4-Port PoE Switch",
    description: "Power over Ethernet switch for 4 cameras",
    category: "accessories",
    group: "Power",
    basePrice: 1200,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_poe_switch_8ch",
    productName: "8-Port PoE Switch",
    description: "Power over Ethernet switch for 8 cameras",
    category: "accessories",
    group: "Power",
    basePrice: 2200,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_power_supply_4ch",
    productName: "4-Channel Power Supply",
    description: "12V DC SMPS for analog cameras",
    category: "accessories",
    group: "Power",
    basePrice: 500,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_power_supply_8ch",
    productName: "8-Channel Power Supply",
    description: "12V DC SMPS for analog cameras",
    category: "accessories",
    group: "Power",
    basePrice: 800,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_junction_box",
    productName: "Camera Junction Box",
    description: "Weatherproof junction box for camera connections",
    category: "accessories",
    group: "Hardware",
    basePrice: 150,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "prod_connectors_pack",
    productName: "Connectors Pack (BNC/DC/RJ45)",
    description: "Pack of standard connectors for camera installation",
    category: "accessories",
    group: "Hardware",
    basePrice: 250,
    isAvailable: true,
    taxRate: 18
  },
  
  // ------------------------------------------
  // Services
  // ------------------------------------------
  {
    productId: "srv_installation_charge_per_cam",
    productName: "Installation & Setup (per camera)",
    description: "Professional installation and configuration per camera unit",
    category: "installation",
    group: "Services",
    basePrice: 500,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "srv_maintenance_visit",
    productName: "One-Time Maintenance Visit",
    description: "Comprehensive system check, cleaning, and reconfiguration",
    category: "maintenance",
    group: "Services",
    basePrice: 999,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "srv_repair_visit",
    productName: "Repair Visit (Base Charge)",
    description: "Diagnostic and repair visit (parts extra)",
    category: "repair",
    group: "Services",
    basePrice: 499,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "srv_amc_silver",
    productName: "Silver AMC Plan (1 Year)",
    description: "2 Preventive Visits + Unlimited Breakdown Calls",
    category: "amc",
    group: "Services",
    basePrice: 3000,
    isAvailable: true,
    taxRate: 18
  },
  {
    productId: "srv_amc_gold",
    productName: "Gold AMC Plan (1 Year)",
    description: "4 Preventive Visits + Unlimited Breakdown Calls + Priority Support",
    category: "amc",
    group: "Services",
    basePrice: 5000,
    isAvailable: true,
    taxRate: 18
  }
]

// ============================================
// SEED
// ============================================

async function seed() {
  console.log('🌱 Seeding Master Products...\n')

  const now = new Date().toISOString()
  let count = 0

  for (const product of masterProducts) {
    const { productId, ...data } = product
    
    await db.collection('master_products').doc(productId).set({
      productId,
      ...data,
      createdAt: now,
      updatedAt: now
    })
    
    count++
    console.log(`  ✅ master_products/${productId}`)
  }

  console.log(`\n🎉 Seed complete! Added ${count} master products.`)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
