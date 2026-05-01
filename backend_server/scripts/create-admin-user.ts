import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import * as path from 'path'
import * as fs from 'fs'

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ service-account-key.json not found. Please ensure it exists in the project root.')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))

const app = initializeApp({
  credential: cert(serviceAccount as Parameters<typeof cert>[0]),
  projectId: 'safecom-application-01'
})

const auth = getAuth(app)
const db = getFirestore(app)

interface AdminUserData {
  email: string
  password: string
  displayName: string
}

async function createAdminUser(adminData: AdminUserData): Promise<void> {
  console.log(`\n🔧 Creating admin user: ${adminData.email}\n`)

  try {
    // Step 1: Create Firebase Auth user
    console.log('📝 Step 1: Creating Firebase Auth user...')
    const userRecord = await auth.createUser({
      email: adminData.email,
      password: adminData.password,
      displayName: adminData.displayName,
      emailVerified: true
    })
    console.log(`✅ Firebase user created: ${userRecord.uid}`)

    // Step 2: Create user document in Firestore
    console.log('\n📝 Step 2: Creating Firestore user document...')
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: adminData.email,
      displayName: adminData.displayName,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`✅ Firestore user document created`)

    // Step 3: Create admin profile document
    console.log('\n📝 Step 3: Creating admin profile document...')
    await db.collection('admins').doc(userRecord.uid).set({
      id: userRecord.uid,
      firebaseUid: userRecord.uid,
      email: adminData.email,
      displayName: adminData.displayName,
      role: 'super_admin',
      permissions: ['all'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log(`✅ Admin profile document created`)

    // Step 4: Verify creation
    console.log('\n📝 Step 4: Verifying creation...')
    const userDoc = await db.collection('users').doc(userRecord.uid).get()
    const adminDoc = await db.collection('admins').doc(userRecord.uid).get()

    if (userDoc.exists && adminDoc.exists) {
      console.log(`✅ Verification successful!\n`)
      console.log('📊 Created Admin User Summary:')
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`Email:        ${adminData.email}`)
      console.log(`Password:     ${adminData.password}`)
      console.log(`Display Name: ${adminData.displayName}`)
      console.log(`Firebase UID: ${userRecord.uid}`)
      console.log(`Role:         super_admin`)
      console.log(`Status:       active`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log('\n✨ Admin user created successfully!\n')
    } else {
      throw new Error('Verification failed: Documents not created properly')
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  }
}

// Default admin user for testing
const testAdminUser: AdminUserData = {
  email: 'admin@safecom.local',
  password: 'AdminTest@123',
  displayName: 'SafeCom Admin'
}

// Run the script
createAdminUser(testAdminUser)
  .then(() => {
    console.log('Process completed. Exiting...\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
