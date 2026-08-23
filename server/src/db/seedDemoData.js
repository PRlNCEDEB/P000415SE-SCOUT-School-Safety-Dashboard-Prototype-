require('dotenv').config()

const { getDb, initFirebase } = require('./firebase')
const { invalidateSchoolCache } = require('../schoolCache')
const {
  buildNotificationSeedData,
  LEGACY_RECIPIENT_IDS,
  LEGACY_ROUTING_IDS,
} = require('./demoSeedData_notification')
const { seedDemoUsers } = require('./seedDemoUsers')

const demoSchools = require('./fixtures/demoSchools.json')

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

// Removes the single-school records written by earlier versions of this seed.
// They used unnamespaced IDs ('principal', 'emergency-fire', ...) and would
// otherwise sit alongside the new per-school records, double-notifying whoever
// belonged to the school they were pinned to.
async function removeLegacyNotificationDocs() {
  const db = getDb()
  let removed = 0

  const targets = [
    ['notificationRecipients', LEGACY_RECIPIENT_IDS],
    ['notificationRouting', LEGACY_ROUTING_IDS],
  ]

  for (const [collectionName, ids] of targets) {
    for (const id of ids) {
      const ref = db.collection(collectionName).doc(id)
      const doc = await ref.get()

      if (doc.exists) {
        await ref.delete()
        removed += 1
      }
    }
  }

  if (removed > 0) {
    console.log(`Removed ${removed} legacy single-school notification record(s).`)
  }
}

// Reads the schools that actually exist, rather than assuming the fixture list.
// Anything a Company Admin created through the app gets routing rules too.
async function loadSchoolsFromDb() {
  const snapshot = await getDb().collection('schools').get()
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
}

async function seedDemoNotificationData() {
  initFirebase()

  // Schools first everything below is derived from them.
  await upsertCollection('schools', demoSchools)
  invalidateSchoolCache()
  console.log(`Seeded ${demoSchools.length} demo schools into schools collection.`)

  const schools = await loadSchoolsFromDb()

  if (schools.length === 0) {
    console.warn('No schools found, skipping notification seed.')
    return
  }

  await removeLegacyNotificationDocs()

  const { recipients, routing } = buildNotificationSeedData(schools)

  await upsertCollection('notificationRecipients', recipients)
  await upsertCollection('notificationRouting', routing)

  console.log(
    `Seeded ${recipients.length} notification recipients and ${routing.length} routing rules ` +
    `across ${schools.length} school(s): ${schools.map(school => school.name).join(', ')}.`
  )

  // Firebase Auth accounts + Firestore user documents for the demo users.
  await seedDemoUsers()
}

if (require.main === module) {
  seedDemoNotificationData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to seed demo data:', error)
      process.exit(1)
    })
}

module.exports = { seedDemoNotificationData }
