require('dotenv').config()
const { initFirebase, getDb } = require('./firebase')

// ── Demo Accounts ──────────────────────────────────────────────────────────────
//
//  admin@scout.edu         → companyAdmin  (sees all schools)
//  principal@school.edu    → schoolAdmin   (manages school_alpha)
//  user@school.edu         → staff         (under principal@school.edu / school_alpha)
//  murali@school.edu       → staff         (under principal@school.edu / school_alpha)
//
// Passwords are managed in Firebase Authentication (Console or Admin SDK).
// This script only creates / updates the Firestore user documents that the
// backend reads for role lookup via GET /api/auth/role.
const users = [
  {
    name: 'Scout Administrator',
    email: 'admin@scout.edu',
    role: 'companyAdmin',
    schoolId: null,
  },
  {
    name: 'School Principal',
    email: 'principal@school.edu',
    role: 'schoolAdmin',
    schoolId: 'school_alpha',
  },
  {
    name: 'Staff User',
    email: 'user@school.edu',
    role: 'staff',
    schoolId: 'school_alpha',   // under principal@school.edu
  },
  {
    name: 'Murali',
    email: 'murali@school.edu',
    role: 'staff',
    schoolId: 'school_alpha',   // under principal@school.edu
  },
]

async function seedDemoUsers() {
  initFirebase()
  const db = getDb()

  for (const user of users) {
    const existing = await db
      .collection('users')
      .where('email', '==', user.email)
      .get()

    if (!existing.empty) {
      // Update fields on existing document in case role / school changed
      const docRef = existing.docs[0].ref
      await docRef.update({
        name: user.name,
        role: user.role,
        schoolId: user.schoolId ?? null,
      })
      console.log(`Updated ${user.email} → role: ${user.role}, schoolId: ${user.schoolId}`)
      continue
    }

    await db.collection('users').add({
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ?? null,
      createdAt: new Date().toISOString(),
    })

    console.log(`Created user: ${user.email} (${user.role})`)
  }

  console.log('Demo user seeding complete.')
}

if (require.main === module) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}

module.exports = { seedDemoUsers }
