import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'
const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backend_server', 'service-account-key.json'), 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'safecom-application-01',
})
const db = getFirestore('safecom-database-nosql')

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
      id: 'home_services_horizontal',
      type: 'horizontal_services',
      data: { title: 'Book a Service' },
    },
    {
      id: 'home_spacer_2',
      type: 'spacer',
      data: { height: 24 },
    },
    {
      id: 'home_recommendations_horizontal',
      type: 'horizontal_recommendations',
      data: { title: 'Recommended for You' },
    },
    {
      id: 'home_spacer_3',
      type: 'spacer',
      data: { height: 24 },
    },
    {
      id: 'home_products_horizontal',
      type: 'horizontal_products',
      data: { title: 'Popular Products' },
    },
    {
      id: 'home_spacer_4',
      type: 'spacer',
      data: { height: 18 },
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
      id: 'home_spacer_5',
      type: 'spacer',
      data: { height: 18 },
    },
    {
      id: 'home_announcements',
      type: 'announcements_list',
      data: {
        title: 'Latest Updates',
        maxItems: 3,
        items: [
          {
            title: 'Free Installation Consultation',
            body: 'Book a free site survey with our experts this weekend.',
            icon: 'engineering_outlined',
            color: '#8B5CF6'
          },
          {
            title: 'Expanded Service Areas',
            body: 'We now serve Danapur, Hajipur, and Bihta regions.',
            icon: 'map_outlined',
            color: '#10B981'
          },
          {
            title: 'Referral Program Live',
            body: 'Refer a friend and earn Rs 500 in service credits.',
            icon: 'card_giftcard_outlined',
            color: '#F59E0B'
          }
        ]
      },
    },
    {
      id: 'home_not_serviceable_notice',
      type: 'info_card',
      data: {
        title: 'Service not available in your area',
        subtitle: 'We currently serve Patna city and nearby areas. We\'re expanding soon!',
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
  }
}

async function seed() {
  await db.collection('sdui_layouts').doc('home').set(homeLayout)
  console.log('Successfully seeded SDUI layout to sdui_layouts/home')
  process.exit(0)
}
seed()
