const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

let db
//returns the Firestore database instance, or throws an error if initFirebase() has not been called
function getDb() {
  if (!db) {
    throw new Error('Firebase not initialised. Call initFirebase() first.')
  }
  return db
}
//initialises the Firebase app and Firestore database connection
function initFirebase() {
  //if Firebase has already been initialised, return the existing instance
  if (admin.apps.length > 0) {
    db = admin.firestore()
    return db
  }
  //check for the service account file and load it
  const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
  )
  //if the service account file doesn't exist, log an error and exit
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Firebase service account file not found at:', serviceAccountPath)
    console.error('   Download it from: Firebase Console → Project Settings → Service Accounts')
    process.exit(1)
  }
  //initialise the Firebase app with the service account credentials
  const serviceAccount = require(serviceAccountPath)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  })

  db = admin.firestore()

  // Use timestamps in Firestore snapshots
  db.settings({ ignoreUndefinedProperties: true })

  console.log('✅ Firebase initialised — project:', serviceAccount.project_id)
  return db
}

// Helper: convert a Firestore doc snapshot to a plain object with id
function docToObject(doc) {
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() }
}

// Helper: convert a Firestore query snapshot to an array of plain objects
function snapshotToArray(snapshot) {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Helper: Firestore server timestamp
function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp()
}

// Helper: format a Firestore Timestamp (or ISO string) to a readable string
function formatTimestamp(value) {
  if (!value) return ''
  const date = value.toDate ? value.toDate() : new Date(value)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)

  if (diffDays === 0) {
    return `Today ${date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `Yesterday ${date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`
  }
  return `${diffDays} days ago`
}

module.exports = { initFirebase, getDb, docToObject, snapshotToArray, serverTimestamp, formatTimestamp }
