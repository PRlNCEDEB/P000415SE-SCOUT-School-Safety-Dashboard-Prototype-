require('dotenv').config()

const { getDb, initFirebase } = require('./firebase')

const DELETE_FLAG = '--confirm-delete'
const shouldDelete = process.argv.includes(DELETE_FLAG)

function isOldIncident(data) {
  return !data.schoolId
}

async function deleteOldIncidents() {
  initFirebase()
  const db = getDb()
  const snapshot = await db.collection('incidents').get()

  const oldDocs = snapshot.docs.filter(doc => isOldIncident(doc.data()))

  console.log(`Found ${oldDocs.length} old incident record(s) without schoolId.`)

  oldDocs.forEach(doc => {
    const data = doc.data()
    console.log(`- ${doc.id}: ${data.title || 'Untitled incident'} (${data.createdAt || data.timestamp || 'no timestamp'})`)
  })

  if (!shouldDelete) {
    console.log(`Dry run only. Re-run with ${DELETE_FLAG} to delete these records.`)
    return
  }

  const batchSize = 450
  let deletedCount = 0

  for (let index = 0; index < oldDocs.length; index += batchSize) {
    const batch = db.batch()
    const docs = oldDocs.slice(index, index + batchSize)

    docs.forEach(doc => batch.delete(doc.ref))

    await batch.commit()
    deletedCount += docs.length
  }

  console.log(`Deleted ${deletedCount} old incident record(s).`)
}

if (require.main === module) {
  deleteOldIncidents().catch(error => {
    console.error('Failed to delete old incidents:', error)
    process.exit(1)
  })
}

module.exports = { deleteOldIncidents, isOldIncident }
