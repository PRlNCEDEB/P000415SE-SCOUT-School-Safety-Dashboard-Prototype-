// seedCompanyAdmin.js
//
// Creates (or updates) the Company Admin account: a Firebase Auth user plus a
// matching Firestore `users` document.
//
// No other seed script creates a Company Admin the demo user fixture covers
// School Admins and staff so without this the Company Admin role is
// unreachable on a fresh Firebase project.
//
// Credentials are read from server/.env so they are never committed:
//   COMPANY_ADMIN_EMAIL=admin@scout.edu
//   COMPANY_ADMIN_PASSWORD=your_password
//   COMPANY_ADMIN_NAME=Company Admin        (optional)
//
// Safe to re-run:
//   • Existing Auth account is reused by UID and its password reset to the
//     current .env value.
//   • Firestore write uses { merge: true }.
//
// The Firestore document ID is always the Firebase Auth UID, because
// /api/auth/role looks that up first (db.collection('users').doc(uid)).

require('dotenv').config()
const admin = require('firebase-admin')
const { initFirebase, getDb } = require('./firebase')

// 'Company Admin' normalises to 'companyadmin' both in AuthContext and in the
// server-side normaliseRole() helpers, which is what the role guards compare.
const COMPANY_ADMIN_ROLE = 'Company Admin'

function readConfig() {
  const email = (process.env.COMPANY_ADMIN_EMAIL || '').trim()
  const password = process.env.COMPANY_ADMIN_PASSWORD || ''
  const name = (process.env.COMPANY_ADMIN_NAME || 'Company Admin').trim()

  const missing = []
  if (!email) missing.push('COMPANY_ADMIN_EMAIL')
  if (!password) missing.push('COMPANY_ADMIN_PASSWORD')

  if (missing.length) {
    console.error(`❌ Missing required env var(s): ${missing.join(', ')}`)
    console.error('   Add them to server/.env, then run this script again.')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('❌ COMPANY_ADMIN_PASSWORD must be at least 6 characters (Firebase Auth minimum).')
    process.exit(1)
  }

  return { email, password, name }
}

async function getOrCreateAuthUser({ email, password, name }) {
  try {
    const created = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    })
    console.log(`  ✅ Auth account created — ${email} (uid: ${created.uid})`)
    return created.uid
  } catch (err) {
    if (err.code !== 'auth/email-already-exists') throw err

    const existing = await admin.auth().getUserByEmail(email)
    await admin.auth().updateUser(existing.uid, { password, displayName: name })
    console.log(`  ℹ️  Auth account already existed — password reset (uid: ${existing.uid})`)
    return existing.uid
  }
}

async function upsertFirestoreUser(uid, { email, name }) {
  const now = new Date().toISOString()

  // schoolId is intentionally null: a Company Admin is not scoped to one
  // school, and the role guards branch on role before ever reading schoolId.
  await getDb().collection('users').doc(uid).set(
    {
      name,
      email,
      role: COMPANY_ADMIN_ROLE,
      schoolId: null,
      schoolName: null,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  )

  console.log(`  📄 Firestore users/${uid} upserted — ${name} (${COMPANY_ADMIN_ROLE})`)
}

async function seedCompanyAdmin() {
  const config = readConfig()

  initFirebase()

  console.log('\n👑 Seeding Company Admin...')

  const uid = await getOrCreateAuthUser(config)
  await upsertFirestoreUser(uid, config)

  console.log(`✅ Company Admin ready — sign in as ${config.email}\n`)
}

if (require.main === module) {
  seedCompanyAdmin()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ seedCompanyAdmin failed:', err.message)
      process.exit(1)
    })
}

module.exports = { seedCompanyAdmin }
