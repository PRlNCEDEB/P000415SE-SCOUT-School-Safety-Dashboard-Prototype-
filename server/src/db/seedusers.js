require('dotenv').config()
const bcrypt = require('bcryptjs')
const { initFirebase, getDb } = require('./firebase')

const users = [
  {
    name: 'Admin User',
    email: 'admin@school.edu',
    password: 'password123',
    role: 'admin',
  },
  {
    name: 'Staff User',
    email: 'user@school.edu',
    password: 'password123',
    role: 'user',
  },

  {
      name: 'Murali User',
      email: 'gmd@school.edu',
      password: 'password123',
      role: 'user',
    },

]

async function seed() {
  initFirebase()
  const db = getDb()

  for (const user of users) {
    // Check if user already exists
    const existing = await db
      .collection('users')
      .where('email', '==', user.email)
      .get()

    if (!existing.empty) {
      console.log(`⏭️  Skipping ${user.email} — already exists`)
      continue
    }

    const passwordHash = await bcrypt.hash(user.password, 10)

    await db.collection('users').add({
      name: user.name,
      email: user.email,
      passwordHash,
      role: user.role,
      createdAt: new Date().toISOString(),
    })

    console.log(`✅ Created user: ${user.email} (${user.role})`)
  }

  console.log('🌱 Seeding complete.')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})