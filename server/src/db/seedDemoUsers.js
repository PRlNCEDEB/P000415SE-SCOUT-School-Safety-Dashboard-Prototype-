// seedDemoUsers.js
//
// Creates Firebase Auth accounts + matching Firestore `users` documents for
// every entry in fixtures/demoUsers.json.
//
// Safe to re-run:
//   • If the Auth account already exists, it reuses the existing UID (no duplicate).
//   • Firestore write uses { merge: true } so existing fields are preserved.
//
// The Firestore document ID is always the Firebase Auth UID, which is what
// /api/auth/role looks up first (db.collection('users').doc(uid)).
//
// The fixture stores only schoolId. schoolName is resolved from the `schools`
// collection at seed time, so the two can never drift out of sync and so no
// school name is hardcoded alongside the user list.

require('dotenv').config()

const admin = require('firebase-admin')
const { initFirebase, getDb } = require('./firebase')

const demoUsers = require('./fixtures/demoUsers.json')

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Scout@1234'

async function loadSchoolNames() {
  const snapshot = await getDb().collection('schools').get()
  return new Map(snapshot.docs.map(doc => [doc.id, doc.data()?.name || null]))
}

async function getOrCreateAuthUser(user) {
  // Try to create a new Firebase Auth account.
  // If the email is already registered, fetch the existing user instead.
  try {
    const created = await admin.auth().createUser({
      email:       user.email,
      password:    DEMO_PASSWORD,
      displayName: user.name,
    })
    console.log(`  ✅ Auth account created — ${user.email} (uid: ${created.uid})`)
    return created.uid
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const existing = await admin.auth().getUserByEmail(user.email)
      console.log(`  ℹ️  Auth account already exists — ${user.email} (uid: ${existing.uid})`)
      return existing.uid
    }
    throw err
  }
}

async function upsertFirestoreUser(uid, user, schoolName) {
  const db = getDb()
  const now = new Date().toISOString()

  await db.collection('users').doc(uid).set(
    {
      name:       user.name,
      email:      user.email,
      role:       user.role,
      schoolId:   user.schoolId,
      schoolName,
      updatedAt:  now,
      // createdAt is only written on first insert; merge: true leaves it alone afterwards
      createdAt:  now,
    },
    { merge: true }
  )

  console.log(`  📄 Firestore users/${uid} upserted — ${user.name} (${user.role} @ ${schoolName || 'unassigned'})`)
}

async function seedDemoUsers() {
  initFirebase()

  console.log('\n👤 Seeding demo users...')

  const schoolNames = await loadSchoolNames()

  for (const user of demoUsers) {
    try {
      const schoolName = schoolNames.get(user.schoolId) || null

      if (user.schoolId && !schoolName) {
        console.warn(`  ⚠️  ${user.email} references missing school "${user.schoolId}" — seed schools first.`)
      }

      const uid = await getOrCreateAuthUser(user)
      await upsertFirestoreUser(uid, user, schoolName)
    } catch (err) {
      console.error(`  ❌ Failed to seed user ${user.email}:`, err.message)
    }
  }

  console.log(`✅ Demo users seeded (${demoUsers.length} total)\n`)
}

// Allow running directly:  node server/src/db/seedDemoUsers.js
if (require.main === module) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ seedDemoUsers failed:', err)
      process.exit(1)
    })
}

module.exports = { seedDemoUsers, DEMO_PASSWORD }
