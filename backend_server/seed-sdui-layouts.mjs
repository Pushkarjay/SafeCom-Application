/**
 * Seed SDUI Layouts & Feature Flags to Firestore
 *
 * Usage: node seed-sdui-layouts.mjs
 *
 * Seeds:
 *   - sdui_layouts/home  → Default home screen layout
 *   - sdui_feature_flags/show_promo_banner
 *   - sdui_feature_flags/show_products_discovery
 */

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
// HOME SCREEN LAYOUT
// ============================================

const homeLayout = {
  layout: [
    {
      id: 'home_location_header',
      type: 'location_header',
      data: { showChangeButton: true },
    },
    {
      id: 'home_spacer_1',
      type: 'spacer',
      data: { height: 18 },
    },
    {
      id: 'home_section_title',
      type: 'section_title',
      data: { text: 'Book a Service' },
    },
    {
      id: 'home_spacer_2',
      type: 'spacer',
      data: { height: 12 },
    },
    {
      id: 'home_service_grid',
      type: 'service_grid',
      data: { columns: 3 },
    },
    {
      id: 'home_spacer_3',
      type: 'spacer',
      data: { height: 18 },
    },
    {
      id: 'home_products_banner',
      type: 'banner',
      data: {
        title: 'Browse All Products',
        subtitle: 'Explore our complete catalog with search & filters',
        gradientColors: ['#0A84FF', '#1E40AF'],
        icon: 'arrow_forward_rounded',
      },
      action: { type: 'navigate', route: '/products-discovery' },
      visibility: { featureFlag: 'show_products_discovery' },
    },
    {
      id: 'home_spacer_4',
      type: 'spacer',
      data: { height: 12 },
    },
    {
      id: 'home_promo_banner',
      type: 'promo_banner',
      data: {
        title: 'Get 10% OFF on your first installation',
        subtitle: 'Use code SAFECOM10 at checkout.',
        icon: 'local_offer_outlined',
        backgroundColor: '#111827',
      },
      visibility: { featureFlag: 'show_promo_banner' },
    },
    {
      id: 'home_not_serviceable_notice',
      type: 'info_card',
      data: {
        title: 'Service not available in your area',
        subtitle:
          "We currently serve Patna city and nearby areas. We're expanding soon!",
        icon: 'info_outline',
        backgroundColor: '#FEF2F2',
        textColor: '#991B1B',
      },
      visibility: { requireServiceable: false },
    },
  ],
  meta: {
    cacheSeconds: 300,
    fallbackScreen: 'home_fallback',
    version: 1,
  },
  updatedAt: new Date().toISOString(),
}

// ============================================
// FEATURE FLAGS
// ============================================

const featureFlags = [
  {
    key: 'show_promo_banner',
    enabled: true,
    description: 'Show promotional banner on home screen',
  },
  {
    key: 'show_products_discovery',
    enabled: true,
    description: 'Show browse all products CTA on home screen',
  },
]

// ============================================
// SEED
// ============================================

async function seed() {
  console.log('🌱 Seeding SDUI layouts and feature flags...\n')

  // Seed home layout
  await db.collection('sdui_layouts').doc('home').set(homeLayout)
  console.log('  ✅ sdui_layouts/home')

  // Seed feature flags
  for (const flag of featureFlags) {
    await db
      .collection('sdui_feature_flags')
      .doc(flag.key)
      .set(flag)
    console.log(`  ✅ sdui_feature_flags/${flag.key}`)
  }

  console.log('\n🎉 SDUI seed complete!')
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
