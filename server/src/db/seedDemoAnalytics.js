const { getDb } = require('./firebase')
const { demoSchools } = require('./demoSchools')

const incidentTemplates = [
  {
    type: 'medical',
    priority: 'critical',
    status: 'resolved',
    title: 'Student injury - oval',
    location: 'Oval',
    triggeredByName: 'Murali',
    description: 'Student fell and sustained a head injury during PE class.',
  },
  {
    type: 'medical',
    priority: 'medium',
    status: 'resolved',
    title: 'Allergic reaction - cafeteria',
    location: 'Cafeteria',
    triggeredByName: 'Ian',
    description: 'Student experienced mild allergic reaction to food.',
  },
  {
    type: 'behaviour',
    priority: 'high',
    status: 'acknowledged',
    title: 'Altercation near canteen',
    location: 'Canteen',
    triggeredByName: 'Deva',
    description: 'Two students involved in a physical altercation.',
  },
  {
    type: 'fire',
    priority: 'critical',
    status: 'resolved',
    title: 'Fire alarm triggered - Block B',
    location: 'Block B',
    triggeredByName: 'Jacky',
    description: 'Fire alarm triggered in science lab. False alarm.',
  },
  {
    type: 'lockdown',
    priority: 'high',
    status: 'triggered',
    title: 'Lockdown initiated - main building',
    location: 'Main Building',
    triggeredByName: 'Prince',
    description: 'Lockdown initiated due to suspicious person.',
  },
  {
    type: 'weather',
    priority: 'medium',
    status: 'resolved',
    title: 'Severe storm - outdoor areas closed',
    location: 'Oval',
    triggeredByName: 'Weather Monitor',
    description: 'Severe storm approaching. Outdoor activities cancelled.',
  },
  {
    type: 'maintenance',
    priority: 'medium',
    status: 'resolved',
    title: 'Power outage - Block A',
    location: 'Block A',
    triggeredByName: 'Facilities',
    description: 'Complete power outage in Block A.',
  },
  {
    type: 'general',
    priority: 'low',
    status: 'resolved',
    title: 'Lost and found - student ID',
    location: 'Main Building',
    triggeredByName: 'Admin',
    description: 'Student ID lost and found.',
  },
  {
    type: 'behaviour',
    priority: 'medium',
    status: 'resolved',
    title: 'Bullying incident - classroom',
    location: 'Block B',
    triggeredByName: 'Emma',
    description: 'Report of verbal bullying during lunch break.',
  },
  {
    type: 'general',
    priority: 'low',
    status: 'archived',
    title: 'Transportation delay',
    location: 'Car Park',
    triggeredByName: 'Transport',
    description: 'School bus delayed due to traffic.',
  },
]

/**
 * Seed demo analytics data into Firestore.
 * Creates 10 deterministic demo incidents per school without duplicating them
 * on every backend restart.
 */
async function seedDemoAnalyticsData() {
  try {
    const db = getDb()
    const incidentsRef = db.collection('incidents')
    const schoolBatch = db.batch()

    demoSchools.forEach(school => {
      const { id, ...schoolData } = school
      schoolBatch.set(db.collection('schools').doc(id), schoolData, { merge: true })
    })
    await schoolBatch.commit()

    console.log('Seeding missing demo analytics data into Firestore...')

    const now = new Date()
    const batch = db.batch()
    let createdCount = 0

    for (const school of demoSchools) {
      for (const [index, incident] of incidentTemplates.entries()) {
        const docId = `demo_${school.id}_${String(index + 1).padStart(2, '0')}`
        const docRef = incidentsRef.doc(docId)
        const existingDoc = await docRef.get()

        if (existingDoc.exists) {
          continue
        }

        const daysAgo = createdCount
        const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        const updatedAt = incident.status === 'resolved'
          ? new Date(new Date(createdAt).getTime() + 5 * 60 * 1000).toISOString()
          : createdAt

        batch.set(docRef, {
          ...incident,
          triggeredById: incident.triggeredById || null,
          triggeredByEmail: incident.triggeredByEmail || null,
          triggeredByRole: incident.triggeredByRole || null,
          schoolId: school.id,
          schoolName: school.name,
          assignedUserIds: [],
          assignedUserEmails: [],
          createdAt,
          updatedAt,
        })
        createdCount += 1
      }
    }

    if (createdCount > 0) {
      await batch.commit()
    }

    console.log(`Successfully seeded ${createdCount} missing demo incidents into Firestore.`)
  } catch (error) {
    console.error('Error seeding analytics data:', error)
    throw error
  }
}

module.exports = { seedDemoAnalyticsData }
