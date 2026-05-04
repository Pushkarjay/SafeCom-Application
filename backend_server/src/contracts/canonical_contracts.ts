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
  basePrice: number
  pricingTiers?: ProductPricingTier[]
  variants?: ProductVariant[]
  stock?: number
  isAvailable: boolean
  isFeatured?: boolean
  imageUrl?: string
  taxRate?: number // defaults to 18
}
