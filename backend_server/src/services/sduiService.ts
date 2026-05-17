/**
 * SDUI Service
 *
 * Resolves dynamic screen layouts based on:
 * 1. Screen name
 * 2. User location (lat/lng) → serviceability area
 * 3. Feature flags
 *
 * Layout sources (priority order):
 * 1. Firestore `sdui_layouts` collection
 * 2. Hardcoded default layouts (fallback)
 */

import type {
  SduiComponent,
  SduiFeatureFlag,
  SduiLayoutResponse,
  SduiScreenMeta,
  SduiVisibility,
} from '../contracts/sdui_contracts.js'
import { getDb } from '../services/firestore.js'

// ============================================
// SERVICEABILITY (reuse logic from serviceability route)
// ============================================

interface ServiceArea {
  areaCode: string
  areaName: string
  latitude: number
  longitude: number
  radiusKm: number
  estimatedTimeToService: string
}

async function fetchActiveAreas(): Promise<ServiceArea[]> {
  try {
    const db = getDb()
    const snap = await db.collection('serviceable_areas').where('active', '==', true).get()
    return snap.docs.map((doc) => {
      const d = doc.data()
      return {
        areaCode: doc.id,
        areaName: d.areaName || '',
        latitude: d.latitude || 0,
        longitude: d.longitude || 0,
        radiusKm: d.radiusKm || 0,
        estimatedTimeToService: d.estimatedTimeToService || '2-4 hours',
      }
    })
  } catch {
    // Fallback defaults if Firestore fails
    return [
      { areaCode: 'PATNA_CORE', areaName: 'Patna City Core', latitude: 25.5941, longitude: 85.1376, radiusKm: 5, estimatedTimeToService: '2-4 hours' },
      { areaCode: 'PATNA_METRO', areaName: 'Patna Metropolitan', latitude: 25.5941, longitude: 85.1376, radiusKm: 15, estimatedTimeToService: '4-8 hours' },
    ]
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function resolveServiceArea(lat: number | undefined, lng: number | undefined, areas: ServiceArea[]): ServiceArea | null {
  if (lat == null || lng == null) return null
  for (const area of areas) {
    if (haversineDistance(area.latitude, area.longitude, lat, lng) <= area.radiusKm) {
      return area
    }
  }
  return null
}

// ============================================
// FEATURE FLAGS
// ============================================

async function getFeatureFlags(): Promise<SduiFeatureFlag[]> {
  try {
    const db = getDb()
    const snap = await db.collection('sdui_feature_flags').get()
    if (snap.empty) return defaultFeatureFlags()
    return snap.docs.map((doc) => ({ key: doc.id, ...doc.data() }) as SduiFeatureFlag)
  } catch {
    return defaultFeatureFlags()
  }
}

function defaultFeatureFlags(): SduiFeatureFlag[] {
  return [
    { key: 'show_promo_banner', enabled: true, description: 'Show promo banner on home screen' },
    { key: 'show_products_discovery', enabled: true, description: 'Show browse products CTA' },
  ]
}

// ============================================
// VISIBILITY RESOLUTION
// ============================================

function isComponentVisible(
  visibility: SduiVisibility | undefined,
  areaCode: string | null,
  isServiceable: boolean,
  flags: Map<string, boolean>
): boolean {
  if (!visibility) return true

  // Feature flag check
  if (visibility.featureFlag && !flags.get(visibility.featureFlag)) return false

  // Area code check
  if (visibility.areaCodes && visibility.areaCodes.length > 0) {
    if (!areaCode || !visibility.areaCodes.includes(areaCode)) return false
  }

  // Serviceability check
  if (visibility.requireServiceable && !isServiceable) return false

  // Date range check
  const now = new Date()
  if (visibility.startDate && new Date(visibility.startDate) > now) return false
  if (visibility.endDate && new Date(visibility.endDate) < now) return false

  return true
}

// ============================================
// DEFAULT LAYOUTS
// ============================================

function defaultHomeLayout(): SduiComponent[] {
  return [
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
        subtitle: 'We currently serve Patna city and nearby areas. We\'re expanding soon!',
        icon: 'info_outline',
        backgroundColor: '#FEF2F2',
        textColor: '#991B1B',
      },
      visibility: { requireServiceable: false },
    },
    {
      id: 'home_spacer_5',
      type: 'spacer',
      data: { height: 12 },
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
      id: 'home_spacer_6',
      type: 'spacer',
      data: { height: 12 },
    },
  ]
}

function defaultScreenMeta(): SduiScreenMeta {
  return {
    cacheSeconds: 300,
    fallbackScreen: 'home_fallback',
    version: 1,
  }
}

// ============================================
// PUBLIC API
// ============================================

async function fetchCmsBlocks(): Promise<SduiComponent[]> {
  try {
    const db = getDb()
    const now = new Date().toISOString()
    const snapshot = await db
      .collection('home_cms')
      .orderBy('order', 'asc')
      .get()

    if (snapshot.empty) return []

    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>
        if (data.visible === false) return null
        if (data.expiresAt && data.expiresAt <= now) return null

        const blockType = String(data.type || 'banner')
        const title = String(data.title || '')
        const subtitle = String(data.subtitle || '')
        const ctaLabel = String(data.ctaLabel || '')
        const ctaRoute = String(data.ctaRoute || '')
        const imageUrl = String(data.imageUrl || '')

        const action = ctaLabel && ctaRoute
          ? { type: 'navigate' as const, route: ctaRoute }
          : undefined

        // Convert CMS block types to native SDUI component types
        // that the Flutter SduiComponentRegistry already supports
        switch (blockType) {
          case 'banner':
            return {
              id: `cms_banner_${doc.id}`,
              type: 'banner',
              data: {
                title,
                subtitle,
                gradientColors: ['#0A84FF', '#1E40AF'],
                icon: 'arrow_forward_rounded',
              },
              action,
            } as SduiComponent

          case 'promo':
            return {
              id: `cms_promo_${doc.id}`,
              type: 'promo_banner',
              data: {
                title,
                subtitle,
                icon: 'local_offer_outlined',
                backgroundColor: '#111827',
              },
              action,
            } as SduiComponent

          case 'update':
            return {
              id: `cms_update_${doc.id}`,
              type: 'info_card',
              data: {
                title,
                subtitle,
                icon: 'info_outline',
                backgroundColor: '#FEF2F2',
                textColor: '#991B1B',
              },
              action,
            } as SduiComponent

          default:
            // category_grid and featured are data-driven from service_catalog,
            // so CMS blocks of these types are not injected into SDUI
            return null
        }
      })
      .filter((c): c is SduiComponent => c !== null)
  } catch {
    return []
  }
}

export async function getScreenLayout(
  screen: string,
  lat?: number,
  lng?: number,
  _userId?: string
): Promise<SduiLayoutResponse> {
  // 1. Resolve location from Firestore-backed areas
  const areas = await fetchActiveAreas()
  const serviceArea = resolveServiceArea(lat, lng, areas)
  const isServiceable = serviceArea !== null
  const areaCode = serviceArea?.areaCode ?? null

  // 2. Get feature flags
  const flagsList = await getFeatureFlags()
  const flagsMap = new Map<string, boolean>()
  for (const f of flagsList) {
    if (f.areaCodes && f.areaCodes.length > 0) {
      flagsMap.set(f.key, f.enabled && (areaCode !== null && f.areaCodes.includes(areaCode)))
    } else {
      flagsMap.set(f.key, f.enabled)
    }
  }

  // 3. Get layout template
  let components: SduiComponent[]
  let meta: SduiScreenMeta

  try {
    const db = getDb()
    const doc = await db.collection('sdui_layouts').doc(screen).get()
    if (doc.exists) {
      const data = doc.data()!
      components = (data.layout as SduiComponent[]) || defaultHomeLayout()
      meta = (data.meta as SduiScreenMeta) || defaultScreenMeta()
    } else {
      components = getDefaultLayout(screen)
      meta = defaultScreenMeta()
    }
  } catch {
    components = getDefaultLayout(screen)
    meta = defaultScreenMeta()
  }

  // 4. Filter components by visibility
  const visibleComponents = components.filter((c) =>
    isComponentVisible(c.visibility, areaCode, isServiceable, flagsMap)
  )

  // 5. Inject serviceability data into components that need it
  for (const c of visibleComponents) {
    if (c.type === 'location_header' && serviceArea) {
      c.data['serviceArea'] = serviceArea.areaName
      c.data['estimatedTime'] = serviceArea.estimatedTimeToService
    }
    if (c.type === 'service_grid') {
      c.data['isServiceable'] = isServiceable
      c.data['areaCode'] = areaCode
    }
  }

  // 6. Inject CMS blocks into the home layout (insert before announcements_list)
  if (screen === 'home') {
    const cmsBlocks = await fetchCmsBlocks()
    if (cmsBlocks.length > 0) {
      const annIdx = visibleComponents.findIndex((c) => c.type === 'announcements_list')
      const insertAt = annIdx >= 0 ? annIdx : visibleComponents.length
      visibleComponents.splice(insertAt, 0, ...cmsBlocks)
    }
  }

  return {
    screen,
    layout: visibleComponents,
    meta,
    timestamp: new Date().toISOString(),
  }
}

function getDefaultLayout(screen: string): SduiComponent[] {
  switch (screen) {
    case 'home':
      return defaultHomeLayout()
    default:
      return [
        {
          id: `${screen}_fallback`,
          type: 'info_card',
          data: {
            title: 'Screen not configured',
            subtitle: `Layout for "${screen}" is not available yet.`,
            icon: 'warning_amber_rounded',
            backgroundColor: '#FEF9C3',
            textColor: '#854D0E',
          },
        },
      ]
  }
}
