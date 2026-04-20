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
    const analyticsData = [
      // Medical incidents
      {
        type: 'medical',
        priority: 'critical',
        status: 'resolved',
        title: 'Student injury - oval',
        location: 'Oval',
        timestamp: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000), // Today
        triggeredByName: 'Murali',
        description: 'Student fell and sustained a head injury during PE class.',
        responseTime: 3.5,
      },
      {
        type: 'medical',
        priority: 'medium',
        status: 'resolved',
        title: 'Allergic reaction - cafeteria',
        location: 'Cafeteria',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        triggeredByName: 'Ian',
        description: 'Student experienced mild allergic reaction to food.',
        responseTime: 5.2,
      },
      {
        type: 'medical',
        priority: 'medium',
        status: 'resolved',
        title: 'Asthma attack - main building',
        location: 'Main Building',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        triggeredByName: 'Sarah',
        description: 'Student experienced asthma attack during class.',
        responseTime: 4.1,
      },
      {
        type: 'medical',
        priority: 'low',
        status: 'resolved',
        title: 'Headache - nurse office',
        location: 'Main Building',
        timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        triggeredByName: 'John',
        description: 'Student complained of severe headache.',
        responseTime: 3.8,
      },

      // Behaviour incidents
      {
        type: 'behaviour',
        priority: 'high',
        status: 'acknowledged',
        title: 'Altercation near canteen',
        location: 'Canteen',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        triggeredByName: 'Deva',
        description: 'Two students involved in a physical altercation.',
        responseTime: 6.1,
      },
      {
        type: 'behaviour',
        priority: 'medium',
        status: 'resolved',
        title: 'Bullying incident - classroom',
        location: 'Block B',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Emma',
        description: 'Report of verbal bullying during lunch break.',
        responseTime: 4.5,
      },
      {
        type: 'behaviour',
        priority: 'low',
        status: 'resolved',
        title: 'Disruptive behaviour - classroom',
        location: 'Block A',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Mark',
        description: 'Student being disruptive in classroom.',
        responseTime: 3.2,
      },
      {
        type: 'behaviour',
        priority: 'medium',
        status: 'resolved',
        title: 'Fighting incident - oval',
        location: 'Oval',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Chris',
        description: 'Two students fighting during sports day.',
        responseTime: 5.8,
      },
      {
        type: 'behaviour',
        priority: 'low',
        status: 'archived',
        title: 'Verbal abuse - playground',
        location: 'Canteen',
        timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Lisa',
        description: 'Student making insulting remarks to another student.',
        responseTime: 4.0,
      },

      // Fire incidents
      {
        type: 'fire',
        priority: 'critical',
        status: 'resolved',
        title: 'Fire alarm triggered - Block B',
        location: 'Block B',
        timestamp: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Jacky',
        description: 'Fire alarm triggered in science lab. False alarm.',
        responseTime: 2.1,
      },
      {
        type: 'fire',
        priority: 'critical',
        status: 'resolved',
        title: 'Smoke detected - kitchen',
        location: 'Cafeteria',
        timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Robert',
        description: 'Smoke detected in kitchen. Caused by cooking.',
        responseTime: 2.8,
      },

      // Lockdown incidents
      {
        type: 'lockdown',
        priority: 'high',
        status: 'triggered',
        title: 'Lockdown initiated - main building',
        location: 'Main Building',
        timestamp: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Prince',
        description: 'Lockdown initiated due to suspicious person.',
        responseTime: 3.5,
      },

      // Weather incidents
      {
        type: 'weather',
        priority: 'medium',
        status: 'resolved',
        title: 'Severe storm - outdoor areas closed',
        location: 'Oval',
        timestamp: new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Weather Monitor',
        description: 'Severe storm approaching. Outdoor activities cancelled.',
        responseTime: 4.2,
      },
      {
        type: 'weather',
        priority: 'low',
        status: 'resolved',
        title: 'Heavy rain - sports day postponed',
        location: 'Oval',
        timestamp: new Date(now.getTime() - 5.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Coach',
        description: 'Heavy rain caused postponement of sports day.',
        responseTime: 3.9,
      },

      // Maintenance incidents
      {
        type: 'maintenance',
        priority: 'medium',
        status: 'resolved',
        title: 'Power outage - Block A',
        location: 'Block A',
        timestamp: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Facilities',
        description: 'Complete power outage in Block A.',
        responseTime: 8.5,
      },
      {
        type: 'maintenance',
        priority: 'low',
        status: 'resolved',
        title: 'Plumbing issue - bathroom',
        location: 'Main Building',
        timestamp: new Date(now.getTime() - 4.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Facilities',
        description: 'Leaking pipe in bathroom.',
        responseTime: 6.3,
      },
      {
        type: 'maintenance',
        priority: 'low',
        status: 'resolved',
        title: 'Broken equipment - gym',
        location: 'Main Building',
        timestamp: new Date(now.getTime() - 6.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Coach',
        description: 'Gym equipment broken and unsafe.',
        responseTime: 5.1,
      },

      // General incidents
      {
        type: 'general',
        priority: 'low',
        status: 'resolved',
        title: 'Lost and found - student ID',
        location: 'Main Building',
        timestamp: new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Admin',
        description: 'Student ID lost and found.',
        responseTime: 2.5,
      },
      {
        type: 'general',
        priority: 'low',
        status: 'archived',
        title: 'Transportation delay',
        location: 'Car Park',
        timestamp: new Date(now.getTime() - 7.5 * 24 * 60 * 60 * 1000),
        triggeredByName: 'Transport',
        description: 'School bus delayed due to traffic.',
        responseTime: 15.0,
      },
    ]

    // Batch write to Firestore
    const batch = db.batch()
    analyticsData.forEach((incident, index) => {
      const docRef = incidentsRef.doc(`incident_${index + 1}`)
      batch.set(docRef, {
        ...incident,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
    console.log(`✅ Successfully seeded ${analyticsData.length} incidents into Firestore`)
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error)
    throw error
  }
}

module.exports = { seedAnalyticsData }
