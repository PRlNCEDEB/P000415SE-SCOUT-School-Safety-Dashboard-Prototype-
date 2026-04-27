const { getDb, initFirebase } = require('./firebase')
const { notificationRecipients, notificationRouting } = require('./demoSeedData_notification')

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

async function seed() {
  initFirebase()

  await upsertCollection('notificationRecipients', notificationRecipients)
  await upsertCollection('notificationRouting', notificationRouting)

  console.log(`Seeded ${notificationRecipients.length} demo notification recipients into notificationRecipients collection.`)
  console.log(`Seeded ${notificationRouting.length} routing rules into notificationRouting collection.`)
}

seed().catch(error => {
  console.error('Failed to seed demo data:', error)
  process.exit(1)
})