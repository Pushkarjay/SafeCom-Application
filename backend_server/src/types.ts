export type Role = 'admin' | 'customer' | 'employee'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface DashboardMetrics {
  totalCustomers: number
  activeTechnicians: number
  pendingJobs: number
  totalRevenue: number
  completionRate: number
  avgResponseTime: number
}

export interface CustomerRecord {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive'
  totalOrders: number
  totalSpent: number
}

export interface TechnicianRecord {
  id: string
  name: string
  email: string
  phone: string
  location: string
  skills: string[]
  totalJobs: number
  rating: number
  status: 'available' | 'on-job' | 'inactive'
}

export interface JobRecord {
  id: string
  customerId: string
  technicianId: string | null
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  amount: number
  scheduledDate: string
  completedDate: string | null
  notes: string
}

export interface PaymentRecord {
  id: string
  jobId: string
  customerId: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  paymentMethod: 'card' | 'cash' | 'upi' | 'bank' | 'razorpay'
  timestamp: string
}

export interface CatalogProductRecord {
  id: string
  name: string
  category: string
  group: string
  unit: string
  price: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogPackageRecord {
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

export interface CatalogAddonRecord {
  id: string
  name: string
  description: string
  category: string
  price: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogTaxRecord {
  id: string
  name: string
  description: string
  rate: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogRecommendationRecord {
  id: string
  name: string
  description: string
  productIds: string[]
  priority: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface InvoiceTemplateRecord {
  id: string
  name: string
  description: string
  terms: string
  notes: string
  showTax: boolean
  status: 'active' | 'inactive'
  updatedAt: string
}

// =================================================================
// Service Catalog & Pricing Data Models
// =================================================================

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  // other user properties
}

export interface Service {
  id: string;
  title: string;
  icon: string;
  enabled: boolean;
  details: string[];
  faqs: { question: string; answer: string }[];
}

export interface InstallationPricing {
  nvrByPackage: { [key: string]: number };
  cameraByMp: { [key: string]: number };
  hddBySize: { [key: string]: number };
  cableKitPrice: number;
  connectorPrice: number;
  wiringPrice: number;
  installationChargePrice: number;
}

export interface MaintenancePricing {
  planVisits: { [key: string]: number };
  itemTemplates: MaintenanceItemTemplate[];
}

export interface MaintenanceItemTemplate {
  key: string;
  name: string;
  unitPrice: number;
  baseQuantity: number;
  multiplyByVisitCount: boolean;
  canEditQuantity: boolean;
}

export interface RepairPricing {
  issues: RepairIssue[];
  itemTemplates: RepairItemTemplate[];
}

export interface RepairIssue {
  id: string;
  title: string;
  visitFee: number;
  diagnosticFee: number;
}

export interface RepairItemTemplate {
  key: string;
  name: string;
  unitPrice: number;
  quantity: number;
  canEditQuantity: boolean;
}

export interface UpgradeBundle {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string; // ISO 8601 format
  rating: number;
  totalJobs: number;
  completedJobs: number;
  skills: string[];
  status: 'active' | 'inactive' | 'on-leave';
  profileImageUrl?: string;
}

export interface Earning {
  jobId: string;
  customer: string;
  amount: number;
  date: string; // ISO 8601 format
  status: 'paid' | 'pending';
}

export interface Payment {
  id: string;
  jobId: string;
  customerId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'cash' | 'upi' | 'bank' | 'razorpay';
  timestamp: string;
}

export interface FirestoreUser {
  uid: string; // Firebase UID
  email: string;
  displayName: string;
  role: Role;
  phone?: string;       // Phase 3.1 — supports phone-only sign-in
  googleLinked: boolean; // Phase 3.1 — true if Google email was linked
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

export interface FirestoreCustomer {
  id: string; // Firestore doc ID or custom ID
  firebaseUid: string; // Link to Firebase user
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  registeredDate: string; // ISO 8601
  status: 'active' | 'inactive';
  googleLinked: boolean; // Phase 3.1 — true if Google account was linked
  savedAddresses?: SavedAddress[];
  defaultAddressId?: string;
}

export interface SavedAddress {
  id: string;
  label: string;         // e.g. "Home", "Office", "Other"
  address: string;       // Full address string
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreEmployee {
  id: string; // Employee ID or Firestore doc ID
  firebaseUid: string; // Link to Firebase user
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string; // ISO 8601
  rating: number;
  totalJobs: number;
  completedJobs: number;
  skills: string[];
  status: 'active' | 'inactive' | 'on-leave';
  profileImageUrl?: string;
}
