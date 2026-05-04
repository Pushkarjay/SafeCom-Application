import admin from 'firebase-admin';
import fs from 'fs';

const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

const db = admin.firestore();

const customers = [
  { id: 'CUST001', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 98765 43210', address: '123 Main Street, Mumbai, MH', status: 'active', totalOrders: 5, totalSpent: 45000, createdAt: new Date().toISOString() },
  { id: 'CUST002', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43211', address: '456 Park Avenue, Delhi, DL', status: 'active', totalOrders: 3, totalSpent: 32000, createdAt: new Date().toISOString() },
  { id: 'CUST003', name: 'Amit Patel', email: 'amit@example.com', phone: '+91 98765 43212', address: '789 Business Park, Bangalore, KA', status: 'active', totalOrders: 8, totalSpent: 78000, createdAt: new Date().toISOString() },
  { id: 'CUST004', name: 'Sneha Gupta', email: 'sneha@example.com', phone: '+91 87654 32109', address: '321 Tower Lane, Pune, MH', status: 'active', totalOrders: 2, totalSpent: 18000, createdAt: new Date().toISOString() }
];

const technicians = [
  { id: 'TECH001', name: 'Vikram Singh', email: 'vikram@safecom.com', phone: '+91 98765 43220', location: 'Mumbai', skills: ['installation', 'maintenance', 'repair'], totalJobs: 156, rating: 4.8, status: 'available', createdAt: new Date().toISOString() },
  { id: 'TECH002', name: 'Deepak Verma', email: 'deepak@safecom.com', phone: '+91 98765 43221', location: 'Delhi', skills: ['maintenance', 'upgrade', 'accessories'], totalJobs: 98, rating: 4.6, status: 'on-job', createdAt: new Date().toISOString() },
  { id: 'TECH003', name: 'Suresh Kumar', email: 'suresh@safecom.com', phone: '+91 98765 43222', location: 'Bangalore', skills: ['installation', 'repair', 'upgrade'], totalJobs: 203, rating: 4.9, status: 'available', createdAt: new Date().toISOString() }
];

const jobs = [
  { id: 'JOB001', customerId: 'CUST001', technicianId: 'TECH001', serviceType: 'installation', status: 'completed', amount: 15000, scheduledDate: '2024-04-15', completedDate: '2024-04-15', notes: 'System installed successfully', createdAt: new Date().toISOString() },
  { id: 'JOB002', customerId: 'CUST002', technicianId: 'TECH002', serviceType: 'maintenance', status: 'in-progress', amount: 5000, scheduledDate: '2024-04-20', completedDate: null, notes: 'Regular maintenance', createdAt: new Date().toISOString() },
  { id: 'JOB003', customerId: 'CUST003', technicianId: null, serviceType: 'repair', status: 'pending', amount: 8000, scheduledDate: '2024-04-22', completedDate: null, notes: 'Camera module replacement needed', createdAt: new Date().toISOString() },
  { id: 'JOB004', customerId: 'CUST004', technicianId: 'TECH003', serviceType: 'upgrade', status: 'completed', amount: 12000, scheduledDate: '2024-04-18', completedDate: '2024-04-18', notes: 'System upgraded to 5MP cameras', createdAt: new Date().toISOString() }
];

const payments = [
  { id: 'PAY001', jobId: 'JOB001', customerId: 'CUST001', amount: 15000, status: 'completed', paymentMethod: 'card', timestamp: new Date().toISOString() },
  { id: 'PAY002', jobId: 'JOB002', customerId: 'CUST002', amount: 5000, status: 'pending', paymentMethod: 'upi', timestamp: new Date().toISOString() },
  { id: 'PAY003', jobId: 'JOB004', customerId: 'CUST004', amount: 12000, status: 'completed', paymentMethod: 'transfer', timestamp: new Date().toISOString() },
  { id: 'PAY004', jobId: null, customerId: 'CUST003', amount: 2500, status: 'completed', paymentMethod: 'card', timestamp: new Date().toISOString() }
];

async function seedData() {
  try {
    console.log('🌱 Starting core data seeding...\n');

    // Seed customers
    console.log('👥 Seeding customers...');
    for (const cust of customers) {
      await db.collection('customers').doc(cust.id).set(cust);
    }
    console.log(`✅ Seeded ${customers.length} customers\n`);

    // Seed technicians
    console.log('🔧 Seeding technicians...');
    for (const tech of technicians) {
      await db.collection('technicians').doc(tech.id).set(tech);
    }
    console.log(`✅ Seeded ${technicians.length} technicians\n`);

    // Seed jobs
    console.log('📋 Seeding jobs...');
    for (const job of jobs) {
      await db.collection('jobs').doc(job.id).set(job);
    }
    console.log(`✅ Seeded ${jobs.length} jobs\n`);

    // Seed payments
    console.log('💳 Seeding payments...');
    for (const payment of payments) {
      await db.collection('payments').doc(payment.id).set(payment);
    }
    console.log(`✅ Seeded ${payments.length} payments\n`);

    console.log('🎉 All core data seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
