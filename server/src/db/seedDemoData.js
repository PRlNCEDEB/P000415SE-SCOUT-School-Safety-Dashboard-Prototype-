const { getDb, initFirebase } = require('./firebase')
const { notificationRecipients, notificationRouting } = require('./demoSeedData_notification')
const { demoSchools } = require('./demoSchools')
const { seedDemoUsers } = require('./seedDemoUsers')

async function upsertCollection(collectionName, docs) {
  const db = getDb()

  for (const doc of docs) {
    const { id, ...rest } = doc
    const now = new Date().toISOString()

    await db.collection(collectionName).doc(id).set(
      {
        ...rest,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    )
  }
}

async function seedDemoNotificationData() {
  initFirebase()

  await upsertCollection('notificationRecipients', notificationRecipients)
  await upsertCollection('notificationRouting', notificationRouting)
  await upsertCollection('schools', demoSchools)

  console.log(`Seeded ${notificationRecipients.length} demo notification recipients into notificationRecipients collection.`)
  console.log(`Seeded ${notificationRouting.length} routing rules into notificationRouting collection.`)
  console.log(`Seeded ${demoSchools.length} demo schools into schools collection.`)

  // Seed Firebase Auth accounts + Firestore user documents for Beta and Gamma
  await seedDemoUsers()
}

if (require.main === module) {
  seedDemoNotificationData().catch(error => {
    console.error('Failed to seed demo data:', error)
    process.exit(1)
  })
}

module.exports = { seedDemoNotificationData }
