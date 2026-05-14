/**
 * Canonical Booking & Invoice Contracts (2026-05-04)
 * 
 * These types are the single source of truth for:
 * - Customer Mobile App
 * - Employee Mobile App  
 * - Admin Web Dashboard
 * 
 * Backend APIs must serialize to these contracts.
 * Clients must deserialize and use identically.
 */

// ============================================
// CANONICAL INVOICE CONTRACT
// ============================================

export interface InvoiceLineItem {
  /** Unique product ID from master product collection */
  productId: string
  
  /** Display name of product */
  productName: string
  
  /** Category/group this product belongs to (for invoice context) */
  category?: string
  
  /** Quantity ordered */
  quantity: number
  
  /** Unit price of product */
  unitPrice: number
  
  /** Total for this line (quantity * unitPrice) */
  lineTotal: number
  
  /** Optional: any modifiers/variants applied (e.g., "2MP", "1TB") */
  variants?: Record<string, string>
}

export interface InvoiceTaxBreakdown {
  /** Tax type name (e.g., "CGST", "SGST", "IGST", "GST") */
  taxName: string
  
  /** Tax rate as percentage (e.g., 9 for 9%) */
  taxRate: number
  
  /** Amount before tax */
  baseAmount: number
  
  /** Calculated tax amount */
  taxAmount: number
}

export interface CanonicalInvoice {
  /** Unique invoice ID (format: INV-{timestamp}-{randomId}) */
  invoiceId: string
  
  /** Reference to the booking this invoice is for */
  bookingId: string
  
  /** Type of service this invoice covers */
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'
  
  /** Customer who placed the booking */
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  
  /** Service location (may differ from customer address) */
  serviceLocation: string
  serviceLatitude: number
  servicelongitude: number
  
  /** All line items in invoice */
  lineItems: InvoiceLineItem[]
  
  /** Subtotal before taxes/discounts */
  subtotal: number
  
  /** Any discount applied (amount or percentage) */
  discount?: {
    type: 'amount' | 'percentage'
    value: number
    reason?: string
  }
  
  /** Amount after discount */
  subtotalAfterDiscount: number
  
  /** Tax breakdown */
  taxes: InvoiceTaxBreakdown[]
  
  /** Total tax amount */
  totalTax: number
  
  /** Final total (subtotal + tax - discount) */
  grandTotal: number
  
  /** Scheduled service date */
  scheduledDate: string
  scheduledTimeSlot: string
  
  /** Payment information */
  paymentStatus: 'pending' | 'partial' | 'completed' | 'failed'
  advanceAmount: number
  remainingAmount: number
  
  /** Invoice generation timestamp */
  generatedAt: string
  
  /** Any notes or terms */
  notes?: string
}

// ============================================
// CANONICAL BOOKING CONTRACT
// ============================================

export interface CanonicalBooking {
  /** Unique booking ID */
  bookingId: string
  
  /** Customer who placed booking */
  customerId: string
  
  /** Type of service booked */
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'
  
  /** Service configuration (varies by type) */
  serviceConfig: ServiceConfig
  
  /** Service location */
  location: {
    address: string
    latitude: number
    longitude: number
    areaCode?: string
  }
  
  /** Scheduled details */
  scheduledDate: string
  scheduledTimeSlot: string // "08:00-09:00", "09:00-10:00", etc.
  
  /** Associated invoice */
  invoice: CanonicalInvoice
  
  /** Booking status lifecycle */
  status: BookingStatus
  
  /** Assigned employee (once assigned) */
  assignedEmployeeId?: string
  assignedEmployeeName?: string
  
  /** Timestamps */
  createdAt: string
  updatedAt: string
  completedAt?: string
  
  /** Any special requests or notes */
  notes?: string

  /** Total estimated amount for the booking */
  totalAmount?: number

  /** Amount actually paid by the customer */
  amountPaid?: number

  /** Payment gateway payment ID */
  paymentId?: string

  /** Payment gateway order ID */
  orderId?: string
}

export type BookingStatus = 
  | 'draft'           // Customer is still customizing
  | 'pending'         // Waiting for payment confirmation
  | 'confirmed'       // Payment received, awaiting assignment
  | 'assigned'        // Employee assigned, awaiting execution
  | 'in_progress'     // Employee has started work
  | 'completed'       // Service completed
  | 'cancelled'       // Booking cancelled
  | 'on_hold'         // Temporarily paused

export interface ServiceConfig {
  /** Installation-specific config */
  installation?: {
    category: string // "IP Camera", "DVR Camera", etc.
    group: string    // "4 camera", "8 camera", etc.
  }
  
  /** Maintenance-specific config */
  maintenance?: {
    planType: string // "Silver", "Gold", etc.
    planDuration: string // "3 months", "1 year", etc.
  }
  
  /** Repair-specific config */
  repair?: {
    issueType: string // "Not working", "Poor quality", etc.
  }
  
  /** Any other service-specific data */
  [key: string]: any
}

// ============================================
// JOB CONTRACT (for Employee App)
// ============================================

export interface CanonicalJob {
  /** Unique job ID (same as booking ID) */
  jobId: string
  
  /** Reference to booking */
  bookingId: string
  
  /** Customer details */
  customer: {
    customerId: string
    name: string
    phone: string
    address: string
  }
  
  /** Service location */
  location: {
    address: string
    latitude: number
    longitude: number
  }
  
  /** What needs to be done */
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'
  
  /** Invoice details (abbreviated for job card view) */
  invoice: {
    invoiceId: string
    grandTotal: number
    lineItems: InvoiceLineItem[]
  }
  
  /** Job status */
  status: BookingStatus
  
  /** Assigned employee */
  assignedTo: {
    employeeId: string
    name: string
    phone: string
  }
  
  /** Scheduled details */
  scheduledDate: string
  scheduledTimeSlot: string
  
  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ============================================
// BOOKING CREATION REQUEST (from Customer App)
// ============================================

export interface CreateBookingRequest {
  customerId: string
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'
  serviceConfig: ServiceConfig
  location: {
    address: string
    latitude: number
    longitude: number
  }
  scheduledDate: string
  scheduledTimeSlot: string
  lineItems: InvoiceLineItem[]
  totalAmount?: number
  amountPaid?: number
  paymentId?: string
  orderId?: string
  notes?: string
}

export interface CreateBookingResponse {
  bookingId: string
  invoice: CanonicalInvoice
  paymentRequired: {
    amount: number
    orderId: string
  }
}

// ============================================
// API RESPONSE ENVELOPE
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  timestamp: string
}

export interface ApiListResponse<T> {
  success: boolean
  data?: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: {
    code: string
    message: string
  }
  timestamp: string
}

// ============================================
// SERVICEABILITY CONTRACT
// ============================================

export interface ServiceabilityCheckRequest {
  latitude: number
  longitude: number
  serviceType?: string
}

export interface ServiceabilityCheckResponse {
  isServiceable: boolean
  message: string
  serviceArea?: {
    areaCode: string
    areaName: string
    estimatedTimeToService: string
  }
}

// ============================================
// NOTIFICATION CONTRACT
// ============================================

export interface BookingNotification {
  type: 'new_booking' | 'booking_updated' | 'booking_cancelled'
  bookingId: string
  employeeIds: string[] // List of eligible employees to notify
  title: string
  body: string
  data: {
    bookingId: string
    serviceType: string
    customerName: string
    location: string
    scheduledDate: string
    scheduledTimeSlot: string
    amount: number
  }
  timestamp: string
}

// ============================================
// MASTER PRODUCT CATALOG CONTRACT
// ============================================

/**
 * Variant option for a product (e.g., "2MP", "1TB", "White")
 * Used to customize products in service packages
 */
export interface ProductVariant {
  /** Unique ID for this variant option */
  variantId: string
  
  /** Display name (e.g., "Resolution", "Storage", "Color") */
  name: string
  
  /** List of available options for this variant */
  options: string[]
  
  /** Whether customer can select multiple options */
  allowMultiple: boolean
  
  /** Whether this variant is required */
  required: boolean
}

/**
 * Pricing structure for product (base + bulk discounts)
 */
export interface ProductPricingTier {
  /** Minimum quantity for this tier */
  minQuantity: number
  
  /** Price per unit at this tier */
  unitPrice: number
}

/**
 * Master product in service catalog
 * Shared across all service types (installation, maintenance, AMC, repair, etc.)
 */
export interface MasterProduct {
  /** Unique product ID in master catalog */
  productId: string
  
  /** Display name */
  productName: string
  
  /** Detailed product description */
  description?: string
  
  /** Product category (installation, maintenance, amc, repair, upgrade, accessories) */
  category: string
  
  /** Product group/type (e.g., "CCTV", "Access Control", "Networking") */
  group?: string

  /** Unit of measure (e.g., unit, per_camera, bundle) */
  unit?: string
  
  /** Base unit price (for single quantity) */
  basePrice: number
  
  /** Pricing tiers for bulk orders */
  pricingTiers?: ProductPricingTier[]
  
  /** Available variants (colors, sizes, specs) */
  variants?: ProductVariant[]
  
  /** Current stock level */
  stock?: number
  
  /** Whether product is available for purchase */
  isAvailable: boolean
  
  /** Whether product is recommended/featured */
  isFeatured?: boolean
  
  /** Product image URL */
  imageUrl?: string
  
  /** Tax applicable (usually 18% GST for services) */
  taxRate: number
  
  /** Creation timestamp */
  createdAt: string
  
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Response envelope for product list queries
 */
export interface ProductListResponse {
  products: MasterProduct[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Request to create/update a product
 */
export interface CreateUpdateProductRequest {
  productName: string
  description?: string
  category: string
  group?: string
  unit?: string
  basePrice: number
  pricingTiers?: ProductPricingTier[]
  variants?: ProductVariant[]
  stock?: number
  isAvailable: boolean
  isFeatured?: boolean
  imageUrl?: string
  taxRate?: number // defaults to 18
}

// ============================================
// SERVICE PACKAGE CATALOG CONTRACT
// ============================================

/**
 * Service addon (additional service beyond base products)
 * E.g., "24/7 monitoring", "Cloud storage upgrade", "Priority support"
 */
export interface ServiceAddon {
  /** Unique addon ID */
  addonId: string
  
  /** Display name */
  name: string
  
  /** Description of addon */
  description: string
  
  /** Additional cost for this addon */
  additionalCost: number
  
  /** Whether addon is optional or included */
  isOptional: boolean
}

/**
 * Discount rule for service package (e.g., 10% off for annual contract)
 */
export interface DiscountRule {
  /** Unique rule ID */
  ruleId: string
  
  /** Rule name (e.g., "Annual Discount", "Bulk Purchase") */
  name: string
  
  /** Discount type: percentage or fixed amount */
  type: 'percentage' | 'fixed'
  
  /** Discount value (e.g., 10 for 10%, or 5000 for ₹5000 off) */
  value: number
  
  /** Minimum quantity/amount required */
  minimumQuantity?: number
}

/**
 * Service package in service catalog
 * Combines multiple products with addons and pricing
 */
export interface CatalogService {
  /** Unique service ID */
  serviceId: string
  
  /** Display name */
  serviceName: string
  
  /** Detailed description */
  description?: string
  
  /** Service category (installation, maintenance, amc, etc.) */
  category: string
  
  /** List of product IDs included in this service */
  productIds: string[]
  
  /** Optional addons available for this service */
  addons?: ServiceAddon[]
  
  /** Discount rules applicable */
  discountRules?: DiscountRule[]
  
  /** Base price for the service package */
  basePrice: number
  
  /** Whether service is currently available */
  isAvailable: boolean
  
  /** Whether service is featured/recommended */
  isFeatured?: boolean
  
  /** Service duration (e.g., "4 weeks", "1 year") */
  duration?: string
  
  /** Whether service is recurring/subscription */
  isRecurring: boolean
  
  /** Renewal frequency if recurring (e.g., "monthly", "quarterly") */
  renewalFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually'
  
  /** Number of instances (e.g., "4 Cameras + 1 Recorder") */
  serviceConfig?: Record<string, unknown>
  
  /** Tax rate for this service */
  taxRate: number
  
  /** Display priority (for ordering in UI) */
  displayPriority: number
  
  /** Creation timestamp */
  createdAt: string
  
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Service list response
 */
export interface ServiceListResponse {
  services: CatalogService[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Request to create/update service
 */
export interface CreateUpdateServiceRequest {
  serviceName: string
  description?: string
  category: string
  productIds: string[]
  addons?: ServiceAddon[]
  discountRules?: DiscountRule[]
  basePrice: number
  isAvailable: boolean
  isFeatured?: boolean
  duration?: string
  isRecurring: boolean
  renewalFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually'
  serviceConfig?: Record<string, unknown>
  taxRate?: number
  displayPriority?: number
}

// ============================================
// ACCESSORIES CATALOG CONTRACT
// ============================================

/**
 * Accessory compatibility info
 * E.g., which products/services this accessory works with
 */
export interface AccessoryCompatibility {
  /** Compatible product IDs */
  compatibleProductIds?: string[]
  
  /** Compatible service IDs */
  compatibleServiceIds?: string[]
  
  /** Free text compatibility notes */
  notes?: string
}

/**
 * Accessory in catalog
 * Add-on items like cables, connectors, adapters, installation kits
 */
export interface CatalogAccessory {
  /** Unique accessory ID */
  accessoryId: string
  
  /** Display name */
  name: string
  
  /** Detailed description */
  description?: string
  
  /** Accessory type (installation, upgrades, warranty, support, other) */
  type: 'installation' | 'upgrades' | 'warranty' | 'support' | 'other'
  
  /** Category/group */
  category: string
  
  /** Unit price */
  price: number
  
  /** Stock level */
  stock: number
  
  /** Whether item is available */
  isAvailable: boolean
  
  /** Whether item is featured */
  isFeatured?: boolean
  
  /** Accessory image URL */
  imageUrl?: string
  
  /** Compatibility information */
  compatibility?: AccessoryCompatibility
  
  /** Tax rate (usually 18% GST) */
  taxRate: number
  
  /** Display priority */
  displayPriority: number
  
  /** Creation timestamp */
  createdAt: string
  
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Accessory list response
 */
export interface AccessoryListResponse {
  accessories: CatalogAccessory[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Request to create/update accessory
 */
export interface CreateUpdateAccessoryRequest {
  name: string
  description?: string
  type: 'installation' | 'upgrades' | 'warranty' | 'support' | 'other'
  category: string
  price: number
  stock: number
  isAvailable: boolean
  isFeatured?: boolean
  imageUrl?: string
  compatibility?: AccessoryCompatibility
  taxRate?: number
  displayPriority?: number
}

// ============================================
// RECOMMENDATIONS CONTRACT
// ============================================

export type RecommendationPlacement = 'checkout' | 'cart' | 'service' | 'general'

export interface CatalogRecommendationRule {
  /** Unique recommendation ID */
  recommendationId: string

  /** Display name */
  name: string

  /** Optional description */
  description?: string

  /** Products to recommend */
  productIds: string[]

  /** Where this recommendation appears */
  placement: RecommendationPlacement

  /** Optional service-type targeting */
  serviceTypes?: Array<'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'>

  /** Whether recommendation is active */
  isAvailable: boolean

  /** Display priority for ordering */
  displayPriority: number

  /** Creation timestamp */
  createdAt: string

  /** Last update timestamp */
  updatedAt: string
}

export interface RecommendationListResponse {
  recommendations: CatalogRecommendationRule[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface CreateUpdateRecommendationRequest {
  name: string
  description?: string
  productIds: string[]
  placement: RecommendationPlacement
  serviceTypes?: Array<'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'>
  isAvailable: boolean
  displayPriority?: number
}

// ============================================
// MAINTENANCE PLAN INTERFACES
// ============================================

/**
 * Maintenance plan item (service within plan)
 */
export interface MaintenancePlanItem {
  serviceId: string
  serviceName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

/**
 * Maintenance plan - recurring service bundle
 */
export interface MaintenancePlan {
  planId: string
  planName: string
  description?: string
  category: string
  planItems: MaintenancePlanItem[]
  basePrice: number
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
  durationMonths: number
  renewalPrice?: number
  isAvailable: boolean
  isFeatured?: boolean
  imageUrl?: string
  taxRate: number
  displayPriority: number
  createdAt: string
  updatedAt: string
}

/**
 * Maintenance plan list response
 */
export interface MaintenancePlanListResponse {
  plans: MaintenancePlan[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Request to create/update maintenance plan
 */
export interface CreateUpdateMaintenancePlanRequest {
  planName: string
  description?: string
  category: string
  planItems: MaintenancePlanItem[]
  basePrice: number
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
  durationMonths: number
  renewalPrice?: number
  isAvailable: boolean
  isFeatured?: boolean
  imageUrl?: string
  taxRate?: number
  displayPriority?: number
}
