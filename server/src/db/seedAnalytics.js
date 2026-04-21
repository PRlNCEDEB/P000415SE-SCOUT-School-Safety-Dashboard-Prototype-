const { getDb, serverTimestamp } = require('./firebase')

/**
 * Seed analytics data into Firestore
 * This will create incidents with proper timestamps and response times
 */
async function seedAnalyticsData() {
  try {
    const db = getDb()
    const incidentsRef = db.collection('incidents')

    // Check if data already exists
    const existingCount = await incidentsRef.count().get()
    if (existingCount.data().count > 0) {
      console.log('✅ Incidents already exist in Firestore. Skipping seed.')
      return
    }

    console.log('📝 Seeding analytics data into Firestore...')

    const now = new Date()
    const incidentsData = [
      // Medical incidents
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
        type: 'medical',
        priority: 'medium',
        status: 'resolved',
        title: 'Asthma attack - main building',
        location: 'Main Building',
        triggeredByName: 'Sarah',
        description: 'Student experienced asthma attack during class.',
      },
      {
        type: 'medical',
        priority: 'low',
        status: 'resolved',
        title: 'Headache - nurse office',
        location: 'Main Building',
        triggeredByName: 'John',
        description: 'Student complained of severe headache.',
      },

      // Behaviour incidents
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
        type: 'behaviour',
        priority: 'medium',
        status: 'resolved',
        title: 'Bullying incident - classroom',
        location: 'Block B',
        triggeredByName: 'Emma',
        description: 'Report of verbal bullying during lunch break.',
      },
      {
        type: 'behaviour',
        priority: 'low',
        status: 'resolved',
        title: 'Disruptive behaviour - classroom',
        location: 'Block A',
        triggeredByName: 'Mark',
        description: 'Student being disruptive in classroom.',
      },
      {
        type: 'behaviour',
        priority: 'medium',
        status: 'resolved',
        title: 'Fighting incident - oval',
        location: 'Oval',
        triggeredByName: 'Chris',
        description: 'Two students fighting during sports day.',
      },
      {
        type: 'behaviour',
        priority: 'low',
        status: 'archived',
        title: 'Verbal abuse - playground',
        location: 'Canteen',
        triggeredByName: 'Lisa',
        description: 'Student making insulting remarks to another student.',
      },

      // Fire incidents
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
        type: 'fire',
        priority: 'critical',
        status: 'resolved',
        title: 'Smoke detected - kitchen',
        location: 'Cafeteria',
        triggeredByName: 'Robert',
        description: 'Smoke detected in kitchen. Caused by cooking.',
      },

      // Lockdown incidents
      {
        type: 'lockdown',
        priority: 'high',
        status: 'triggered',
        title: 'Lockdown initiated - main building',
        location: 'Main Building',
        triggeredByName: 'Prince',
        description: 'Lockdown initiated due to suspicious person.',
      },

      // Weather incidents
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
        type: 'weather',
        priority: 'low',
        status: 'resolved',
        title: 'Heavy rain - sports day postponed',
        location: 'Oval',
        triggeredByName: 'Coach',
        description: 'Heavy rain caused postponement of sports day.',
      },

      // Maintenance incidents
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
        type: 'maintenance',
        priority: 'low',
        status: 'resolved',
        title: 'Plumbing issue - bathroom',
        location: 'Main Building',
        triggeredByName: 'Facilities',
        description: 'Leaking pipe in bathroom.',
      },
      {
        type: 'maintenance',
        priority: 'low',
        status: 'resolved',
        title: 'Broken equipment - gym',
        location: 'Main Building',
        triggeredByName: 'Coach',
        description: 'Gym equipment broken and unsafe.',
      },

      // General incidents
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
        type: 'general',
        priority: 'low',
        status: 'archived',
        title: 'Transportation delay',
        location: 'Car Park',
        triggeredByName: 'Transport',
        description: 'School bus delayed due to traffic.',
      },
    ]

    // Batch write to Firestore
    const batch = db.batch()
    incidentsData.forEach((incident, index) => {
      const docRef = incidentsRef.doc(`incident_${index + 1}`)
      // Spread createdAt across past days so analytics charts show varied data
      const daysAgo = index % 7
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
      const updatedAt = incident.status === 'resolved'
        ? new Date(new Date(createdAt).getTime() + 5 * 60 * 1000).toISOString()
        : createdAt
      batch.set(docRef, {
        ...incident,
        triggeredById: incident.triggeredById || null,
        createdAt,
        updatedAt,
      })
    })

    await batch.commit()
    console.log(`✅ Successfully seeded ${incidentsData.length} incidents into Firestore`)
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error)
    throw error
  }
}

module.exports = { seedAnalyticsData }
