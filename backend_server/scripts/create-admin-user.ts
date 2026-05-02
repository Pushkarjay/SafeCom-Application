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

function parseAdminUsersFromEnv(): AdminUserData[] {
  const json = process.env.ADMIN_USERS_JSON?.trim()
  if (json) {
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          email: String(item.email),
          password: String(item.password),
          displayName: String(item.displayName ?? item.email)
        }))
      }
    } catch (error) {
      console.error('❌ Failed to parse ADMIN_USERS_JSON:', error)
      process.exit(1)
    }
  }

  return [
    {
      email: 'admin@safecom.local',
      password: 'AdminTest@123',
      displayName: 'SafeCom Admin'
    }
  ]
}

async function createAdminUser(adminData: AdminUserData): Promise<void> {
  console.log(`\n🔧 Creating admin user: ${adminData.email}\n`)

  try {
    let userRecord

    try {
      userRecord = await auth.getUserByEmail(adminData.email)
      console.log(`🔁 Admin user already exists: ${userRecord.uid}`)
      await auth.updateUser(userRecord.uid, {
        password: adminData.password,
        displayName: adminData.displayName,
        emailVerified: true
      })
      console.log(`✅ Updated existing Firebase user password and display name`)
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).code === 'auth/user-not-found') {
        console.log('📝 Step 1: Creating Firebase Auth user...')
        userRecord = await auth.createUser({
          email: adminData.email,
          password: adminData.password,
          displayName: adminData.displayName,
          emailVerified: true
        })
        console.log(`✅ Firebase user created: ${userRecord.uid}`)
      } else {
        throw err
      }
    }

    if (!userRecord) {
      throw new Error('Unable to resolve Firebase user record')
    }

    const now = new Date()

    console.log('\n📝 Step 2: Creating/updating Firestore user document...')
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: adminData.email,
      displayName: adminData.displayName,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }, { merge: true })
    console.log(`✅ Firestore user document created/updated`)

    console.log('\n📝 Step 3: Creating/updating admin profile document...')
    await db.collection('admins').doc(userRecord.uid).set({
      id: userRecord.uid,
      firebaseUid: userRecord.uid,
      email: adminData.email,
      displayName: adminData.displayName,
      role: 'super_admin',
      permissions: ['all'],
      status: 'active',
      createdAt: now,
      updatedAt: now
    }, { merge: true })
    console.log(`✅ Admin profile document created/updated`)

    console.log('\n📝 Step 4: Verifying creation...')
    const userDoc = await db.collection('users').doc(userRecord.uid).get()
    const adminDoc = await db.collection('admins').doc(userRecord.uid).get()

    if (userDoc.exists && adminDoc.exists) {
      console.log(`✅ Verification successful!\n`)
      console.log('📊 Created Admin User Summary:')
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`Email:        ${adminData.email}`)
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

async function main() {
  const adminUsers = parseAdminUsersFromEnv()
  for (const admin of adminUsers) {
    await createAdminUser(admin)
  }
}

main()
  .then(() => {
    console.log('Process completed. Exiting...\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
