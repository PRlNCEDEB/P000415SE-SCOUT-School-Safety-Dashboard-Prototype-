// Run with: npm run seed
// Seeds Firestore with users, incidents, and notifications

require('dotenv').config()
const bcrypt = require('bcryptjs')
const { initFirebase } = require('./firebase')

async function seed() {
  const db = initFirebase()
  console.log('🌱 Seeding Firestore...')

  // ── Users ────────────────────────────────────────────────────────────────────
  const usersRef = db.collection('users')
  const existingUsers = await usersRef.limit(1).get()

  if (!existingUsers.empty) {
    console.log('⚠️  Users already exist — skipping seed. Delete the collection in Firebase Console to re-seed.')
    process.exit(0)
  }

  const adminRef = usersRef.doc('admin')
  await adminRef.set({
    name: 'Admin User',
    email: 'admin@school.edu',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  })

  await usersRef.doc('murali').set({
    name: 'Murali Singh',
    email: 'murali@school.edu',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'staff',
    createdAt: new Date().toISOString(),
  })

  await usersRef.doc('deva').set({
    name: 'Deva Kumar',
    email: 'deva@school.edu',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'staff',
    createdAt: new Date().toISOString(),
  })

  console.log('✅ Users seeded')

  // ── Incidents + Notifications ─────────────────────────────────────────────────
  const incidentsRef = db.collection('incidents')
  const notificationsRef = db.collection('notifications')

  const now = new Date()
  const yesterday = new Date(now - 86400000)
  const twoDaysAgo = new Date(now - 2 * 86400000)

  const incidentSeedData = [
    {
      type: 'medical', priority: 'critical', status: 'triggered',
      title: 'Student injury - oval', location: 'Oval',
      description: 'Student fell and sustained a head injury during PE class. Ambulance has been called.',
      triggeredByName: 'Murali', triggeredById: 'murali',
      createdAt: new Date(new Date(now).setHours(10, 32, 0)).toISOString(),
      updatedAt: new Date(new Date(now).setHours(10, 32, 0)).toISOString(),
      notifications: [
        { recipientName: 'Principal Davis', recipientEmail: 'davis@school.edu', recipientPhone: '+61 400 111 222', smsStatus: 'sent', emailStatus: 'sent' },
        { recipientName: 'First Aid Officer', recipientEmail: 'firstaid@school.edu', recipientPhone: '+61 400 333 444', smsStatus: 'sent', emailStatus: 'failed' },
      ],
    },
    {
      type: 'behaviour', priority: 'high', status: 'acknowledged',
      title: 'Altercation near canteen', location: 'Canteen',
      description: 'Two students involved in a physical altercation near the canteen area. Both students have been separated.',
      triggeredByName: 'Deva', triggeredById: 'deva',
      createdAt: new Date(new Date(now).setHours(9, 15, 0)).toISOString(),
      updatedAt: new Date(new Date(now).setHours(9, 15, 0)).toISOString(),
      notifications: [
        { recipientName: 'Deputy Principal', recipientEmail: 'deputy@school.edu', recipientPhone: '+61 400 555 666', smsStatus: 'sent', emailStatus: 'sent' },
      ],
    },
    {
      type: 'fire', priority: 'critical', status: 'resolved',
      title: 'Fire alarm triggered - Block B', location: 'Block B',
      description: 'Fire alarm triggered in Block B science lab. Fire brigade attended. False alarm confirmed.',
      triggeredByName: 'Jacky', triggeredById: null,
      createdAt: new Date(new Date(yesterday).setHours(14, 10, 0)).toISOString(),
      updatedAt: new Date(new Date(yesterday).setHours(14, 10, 0)).toISOString(),
      notifications: [
        { recipientName: 'Principal Davis', recipientEmail: 'davis@school.edu', recipientPhone: '+61 400 111 222', smsStatus: 'sent', emailStatus: 'sent' },
        { recipientName: 'Fire Warden', recipientEmail: 'warden@school.edu', recipientPhone: '+61 400 123 456', smsStatus: 'sent', emailStatus: 'sent' },
      ],
    },
    {
      type: 'lockdown', priority: 'high', status: 'triggered',
      title: 'Lockdown initiated - main building', location: 'Main Building',
      description: 'Lockdown initiated due to reported suspicious person near school perimeter. Police notified.',
      triggeredByName: 'Prince', triggeredById: null,
      createdAt: new Date(new Date(yesterday).setHours(11, 45, 0)).toISOString(),
      updatedAt: new Date(new Date(yesterday).setHours(11, 45, 0)).toISOString(),
      notifications: [
        { recipientName: 'All Staff', recipientEmail: 'staff@school.edu', recipientPhone: '+61 400 777 888', smsStatus: 'sent', emailStatus: 'sent' },
        { recipientName: 'Police Liaison', recipientEmail: 'police@school.edu', recipientPhone: '+61 400 999 000', smsStatus: 'failed', emailStatus: 'sent' },
      ],
    },
    {
      type: 'medical', priority: 'medium', status: 'resolved',
      title: 'Allergic reaction - cafeteria', location: 'Cafeteria',
      description: 'Student experienced mild allergic reaction to food in cafeteria. EpiPen administered by nurse.',
      triggeredByName: 'Ian', triggeredById: null,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString(),
      notifications: [
        { recipientName: 'School Nurse', recipientEmail: 'nurse@school.edu', recipientPhone: '+61 400 200 300', smsStatus: 'sent', emailStatus: 'sent' },
      ],
    },
  ]

  for (const seed of incidentSeedData) {
    const { notifications, ...incidentData } = seed
    const incidentRef = await incidentsRef.add(incidentData)

    for (const notif of notifications) {
      await notificationsRef.add({
        incidentId: incidentRef.id,
        incidentTitle: incidentData.title,
        incidentType: incidentData.type,
        ...notif,
        createdAt: incidentData.createdAt,
      })
    }
  }

  console.log('✅ Incidents and notifications seeded')
  console.log('\n🎉 Seed complete! Your Firestore database is ready.')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
