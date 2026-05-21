// seedDemoUsers.js
//
// Creates Firebase Auth accounts + matching Firestore `users` documents for
// every entry in demoUsers.js.
//
// Safe to re-run:
//   • If the Auth account already exists, it reuses the existing UID (no duplicate).
//   • Firestore write uses { merge: true } so existing fields are preserved.
//
// The Firestore document ID is always the Firebase Auth UID, which is what
// /api/auth/role looks up first (db.collection('users').doc(uid)).

const admin = require('firebase-admin')
const { initFirebase, getDb } = require('./firebase')
const { demoUsers } = require('./demoUsers')

async function getOrCreateAuthUser(user) {
  // Try to create a new Firebase Auth account.
  // If the email is already registered, fetch the existing user instead.
  try {
    const created = await admin.auth().createUser({
      email:       user.email,
      password:    user.password,
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

async function upsertFirestoreUser(uid, user) {
  const db = getDb()
  const now = new Date().toISOString()

  await db.collection('users').doc(uid).set(
    {
      name:       user.name,
      email:      user.email,
      role:       user.role,
      schoolId:   user.schoolId,
      schoolName: user.schoolName,
      updatedAt:  now,
      // createdAt is only written on first insert; merge: true leaves it alone afterwards
      createdAt:  now,
    },
    { merge: true }
  )

  console.log(`  📄 Firestore users/${uid} upserted — ${user.name} (${user.role} @ ${user.schoolName})`)
}

async function seedDemoUsers() {
  initFirebase()

  console.log('\n👤 Seeding demo users...')

  for (const user of demoUsers) {
    try {
      const uid = await getOrCreateAuthUser(user)
      await upsertFirestoreUser(uid, user)
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

module.exports = { seedDemoUsers }
