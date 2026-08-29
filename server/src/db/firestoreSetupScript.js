// firestoreSetupScript.js
//
// One-off smoke-test writer: drops a single sample incident, notification,
// recipient and routing rule into Firestore so a brand-new project has
// something to look at.
//
// It used to hardcode a school ('school_alpha' / 'Alpha School') and create it
// as a side effect, which is exactly the behaviour the dynamic-schools work
// removed. It now requires a school to already exist and attaches its sample
// records to a real one.
//
// Usage (from server/):
//   node src/db/firestoreSetupScript.js              → uses the first school
//   node src/db/firestoreSetupScript.js school_beta  → uses the named school
//
// Prefer `npm run seed:demo` for normal seeding; this script is only useful for
// eyeballing a fresh project.

require('dotenv').config()

const { initFirebase, getDb } = require('./firebase')

async function resolveSchool(db, requestedId) {
  if (requestedId) {
    const doc = await db.collection('schools').doc(requestedId).get()

    if (!doc.exists) {
      throw new Error(`School "${requestedId}" not found. Run: npm run seed:demo`)
    }

    return { id: doc.id, ...doc.data() }
  }

  const snapshot = await db.collection('schools').get()

  if (snapshot.empty) {
    throw new Error('No schools exist yet. Run: npm run seed:demo')
  }

  const schools = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))

  return schools[0]
}

async function setupFirestore() {
  initFirebase()
  const db = getDb()

  const school = await resolveSchool(db, process.argv[2])
  const now = new Date().toISOString()
  const batch = db.batch()

  const incidentRef = db.collection('incidents').doc('sample-incident-001')
  batch.set(incidentRef, {
    title: 'Fire alert',
    description: 'Fire emergency triggered from dashboard.',
    location: 'Dashboard quick action',
    type: 'fire',
    priority: 'critical',
    status: 'triggered',
    triggeredById: null,
    triggeredByName: 'Sample Data',
    triggeredByEmail: null,
    triggeredByRole: null,
    schoolId: school.id,
    schoolName: school.name,
    assignedUserIds: [],
    assignedUserEmails: [],
    acknowledgedBy: [],
    createdAt: now,
    updatedAt: now,
  })

  const notificationRef = db.collection('notifications').doc('sample-notification-001')
  batch.set(notificationRef, {
    incidentId: 'sample-incident-001',
    incidentTitle: 'Fire alert',
    incidentType: 'fire',
    schoolId: school.id,
    schoolName: school.name,
    recipientName: 'Riley Principal',
    recipientEmail: 'principal@school.edu',
    recipientPhone: '+61400000016',
    recipientRole: 'principal',
    emailStatus: 'sent',
    smsStatus: 'sent',
    token: 'sample-token-001',
    acknowledged: false,
    acknowledgedAt: null,
    timestamp: now,
    createdAt: now,
  })

  await batch.commit()

  console.log(`Firestore setup complete sample records attached to ${school.name} (${school.id}).`)
}

if (require.main === module) {
  setupFirestore()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Firestore setup failed:', err.message)
      process.exit(1)
    })
}

module.exports = { setupFirestore }
