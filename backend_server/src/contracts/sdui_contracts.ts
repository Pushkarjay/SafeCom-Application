/**
 * Server-Driven UI (SDUI) Contracts
 *
 * These types define the JSON schema for dynamic screen layouts.
 * Backend composes layouts using these types; the Flutter client
 * parses and renders them via SduiRenderer.
 */

// ============================================
// COMPONENT VISIBILITY
// ============================================

/**
 * Conditional visibility rules for a component.
 * All conditions are AND-ed together.
 */
export interface SduiVisibility {
  /** Only show if this feature flag is enabled */
  featureFlag?: string

  /** Only show in these service area codes */
  areaCodes?: string[]

  /** Only show if user location is serviceable */
  requireServiceable?: boolean

  /** Hide when user location is serviceable (show only in non-serviceable areas) */
  hideWhenServiceable?: boolean

  /** Only show for these user roles */
  roles?: string[]

  /** Start date/time (ISO 8601) — component visible after this */
  startDate?: string

  /** End date/time (ISO 8601) — component hidden after this */
  endDate?: string
}

// ============================================
// ACTION
// ============================================

/**
 * Action to perform when a component is tapped / interacted with.
 */
export interface SduiAction {
  /** Action type */
  type: 'navigate' | 'deeplink' | 'url' | 'none'

  /** Route path for navigation (e.g., "/service-types") */
  route?: string

  /** Deep link or external URL */
  url?: string

  /** Extra payload to pass to the destination */
  payload?: Record<string, unknown>
}

// ============================================
// COMPONENT
// ============================================

/**
 * A single UI component in the layout.
 * The `type` field maps to a widget builder on the client.
 */
export interface SduiComponent {
  /** Unique ID for this component instance */
  id: string

  /** Component type — maps to a registered builder on the client.
   * Built-in types:
   *   location_header, section_title, service_grid, banner,
   *   promo_banner, spacer, divider, carousel, info_card
   */
  type: string

  /** Arbitrary data payload consumed by the builder */
  data: Record<string, unknown>

  /** Optional action on tap */
  action?: SduiAction

  /** Conditional visibility rules */
  visibility?: SduiVisibility

  /** Nested children (for container components like carousel) */
  children?: SduiComponent[]
}

// ============================================
// SCREEN META
// ============================================

/**
 * Metadata about the screen layout response.
 */
export interface SduiScreenMeta {
  /** How long the client should cache this layout (seconds) */
  cacheSeconds: number

  /** Fallback screen key if this layout cannot render */
  fallbackScreen: string

  /** Layout version — bump to force client refresh */
  version: number
}

// ============================================
// LAYOUT RESPONSE
// ============================================

/**
 * Full layout response returned by GET /api/sdui/layout
 */
export interface SduiLayoutResponse {
  /** Screen identifier (e.g., "home", "services", "profile") */
  screen: string

  /** Ordered list of components to render */
  layout: SduiComponent[]

  /** Screen-level metadata */
  meta: SduiScreenMeta

  /** Timestamp of layout generation */
  timestamp: string
}

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * A feature flag entry stored in Firestore or config.
 */
export interface SduiFeatureFlag {
  /** Flag key (e.g., "show_promo_banner") */
  key: string

  /** Whether the flag is enabled */
  enabled: boolean

  /** Optional description */
  description?: string

  /** Optional: only enable for these area codes */
  areaCodes?: string[]
}
