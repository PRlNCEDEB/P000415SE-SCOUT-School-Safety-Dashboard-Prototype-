require('dotenv').config()
const bcrypt = require('bcryptjs')
const { initFirebase, getDb } = require('./firebase')

async function run() {
  initFirebase()
  const db = getDb()

  const snapshot = await db.collection('users').where('email', '==', 'gmd@school.edu').get()

  if (snapshot.empty) {
    console.log('❌ User not found: gmd@school.edu')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash('password123', 10)
  const doc = snapshot.docs[0]
  await db.collection('users').doc(doc.id).update({ passwordHash })
  console.log('✅ Password updated for gmd@school.edu')
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
