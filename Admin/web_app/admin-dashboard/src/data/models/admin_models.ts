export interface SystemHealth {
  firestore: 'healthy' | 'degraded' | 'down'
  auth: 'healthy' | 'degraded' | 'down'
  lastCheck: string
}

export interface TopTechnician {
  id: string
  name: string
  jobsCompleted: number
  rating: number
}

export interface RecentBooking {
  bookingId: string
  customerId: string
  serviceType: string
  amount: number
  status: string
  createdAt: string
}

export interface DashboardMetrics {
  totalCustomers: number
  activeTechnicians: number
  pendingJobs: number
  totalRevenue: number
  completionRate: number
  avgResponseTime: number
  systemHealth?: SystemHealth
  topPerformingTechnicians?: TopTechnician[]
  recentBookings?: RecentBooking[]
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  registeredDate: string
  totalOrders: number
  totalSpent: number
  status: 'active' | 'inactive'
}

export interface Technician {
  id: string
  name: string
  email: string
  phone: string
  skills: string[]
  location: string
  totalJobs: number
  rating: number
  status: 'available' | 'on-job' | 'inactive'
  joiningDate: string
  lastPassword?: string
  lastPasswordUpdatedAt?: string
}

export interface Job {
  id: string
  customerId: string
  technicianId: string | null
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  amount: number
  scheduledDate: string
  completedDate: string | null
  notes: string
  address?: string
  latitude?: number
  longitude?: number
  customerName?: string
  customerPhone?: string
}

export interface Payment {
  id: string
  jobId: string
  customerId: string
  customerName: string
  amount: number
  paidAmount: number
  remainingAmount: number
  status: 'pending' | 'partial' | 'completed' | 'failed'
  paymentMethod: string
  transactionId: string
  createdAt: string
  updatedAt: string
}

export interface CatalogProduct {
  id: string
  name: string
  category: string
  group: string
  unit: string
  price: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface Service {
  id: string
  title: string
  icon: string
  enabled: boolean
}

export interface UpgradeBundle {
  id: string
  name: string
  description: string
  price: number
}

export interface PricingSet {
  installation?: Record<string, unknown>
  maintenance?: Record<string, unknown>
  repair?: Record<string, unknown>
  amc?: Record<string, unknown>
}

export interface CatalogPackage {
  id: string
  name: string
  description: string
  productIds: string[]
  totalPrice: number
  discountPercent: number
  finalPrice: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogAddon {
  id: string
  name: string
  description: string
  category: string
  price: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogTax {
  id: string
  name: string
  description: string
  rate: number // percentage
  status: 'active' | 'inactive'
  updatedAt: string
}

export type RecommendationPlacement = 'checkout' | 'cart' | 'service' | 'general'

export interface CatalogRecommendation {
  recommendationId: string
  name: string
  description?: string
  productIds: string[]
  placement: RecommendationPlacement
  serviceTypes?: Array<'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'>
  isAvailable: boolean
  displayPriority: number
  createdAt: string
  updatedAt: string
}

// ============================================
// INSTALLATION BUILDER INTERFACES
// ============================================

export interface InstallationMappedProduct {
  productId: string
  defaultQty: number
  minQty: number
  maxQty: number
  product: {
    id: string
    productName: string
    description: string
    category: string
    group?: string
    basePrice: number
    isAvailable: boolean
  }
}

export interface InstallationSetup {
  id: string
  name: string
  description: string
  mappedProducts: InstallationMappedProduct[]
}

export interface InstallationCategory {
  id: string
  name: string
  description: string
  imageUrl: string
  groups: InstallationSetup[]
}

export interface InstallationConfig {
  name: string
  categories: InstallationCategory[]
}

export interface InvoiceTemplate {
  id: string
  name: string
  description: string
  terms: string
  notes: string
  showTax: boolean
  status: 'active' | 'inactive'
  updatedAt: string
}

// ============================================
// MASTER PRODUCT CATALOG INTERFACES
// ============================================

export interface ProductVariant {
  variantId: string
  name: string
  options: string[]
  allowMultiple: boolean
  required: boolean
}

export interface ProductPricingTier {
  minQuantity: number
  unitPrice: number
}

export interface MasterProduct {
  productId: string
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
  taxRate: number
  createdAt: string
  updatedAt: string
}

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
  taxRate?: number
}

// ============================================
// SERVICE CATALOG INTERFACES
// ============================================

export interface ServiceAddon {
  addonId: string
  name: string
  description: string
  additionalCost: number
  isOptional: boolean
}

export interface DiscountRule {
  ruleId: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  minimumQuantity?: number
}

export interface CatalogService {
  serviceId: string
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
  taxRate: number
  displayPriority: number
  createdAt: string
  updatedAt: string
}

// ============================================
// ACCESSORIES INTERFACES
// ============================================

export interface AccessoryCompatibility {
  compatibleProductIds?: string[]
  compatibleServiceIds?: string[]
  notes?: string
}

export interface CatalogAccessory {
  accessoryId: string
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
  taxRate: number
  displayPriority: number
  createdAt: string
  updatedAt: string
}

// ============================================
// MAINTENANCE PLAN INTERFACES
// ============================================

export interface MaintenancePlanItem {
  serviceId: string
  serviceName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

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
