// Run once to create test users in Firestore:
//   node src/scripts/seedUsers.js

require('dotenv').config()
const bcrypt = require('bcryptjs')
const { initFirebase, getDb } = require('../db/firebase')

async function seed() {
  initFirebase()
  const db = getDb()

  const users = [
    { name: 'Admin User',  email: 'admin@school.edu', password: 'password123', role: 'admin',  isActive: true },
    { name: 'Staff User',  email: 'user@school.edu',  password: 'password123', role: 'user',   isActive: true },
  ]

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10)
    await db.collection('users').add({ ...user, password: hash, createdAt: new Date() })
    console.log(`✅ Seeded: ${user.email}`)
  }

  console.log('Done.')
  process.exit(0)
}

seed().catch(console.error)