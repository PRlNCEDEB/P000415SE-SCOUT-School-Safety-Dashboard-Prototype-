require('dotenv').config()
const { initFirebase, getDb } = require('../db/firebase')

// Full alert type definitions with value, category and desc
const ALERT_TYPES = [
  // Emergency types
  { label: 'Fire', value: 'fire', emoji: '🔥', category: 'emergency', desc: 'Fire emergency or smoke detected' },
  { label: 'Threat', value: 'lockdown', emoji: '🛡️', category: 'emergency', desc: 'Security threat or lockdown' },
  { label: 'Natural Disaster', value: 'weather', emoji: '🌊', category: 'emergency', desc: 'Earthquake, flood, severe weather' },
  { label: 'Lockdown', value: 'lockdown', emoji: '🔒', category: 'emergency', desc: 'School lockdown procedure' },

  // General types
  { label: 'Medical', value: 'medical', emoji: '🏥', category: 'general', desc: 'Health and first-aid incidents' },
  { label: 'Behaviour', value: 'behaviour', emoji: '⚠️', category: 'general', desc: 'Student behaviour and conduct incidents' },
  { label: 'Weather', value: 'weather', emoji: '🌩️', category: 'general', desc: 'Severe weather conditions' },
  { label: 'Maintenance', value: 'maintenance', emoji: '🔧', category: 'general', desc: 'Facilities and maintenance issues' },
  { label: 'General', value: 'general', emoji: '📢', category: 'general', desc: 'General incident or school-wide notice' },
]

async function migrateAlertTypes() {
  initFirebase()
  const db = getDb()
  const now = new Date().toISOString()

  console.log('Starting alert types migration...')

  // Get all existing alert types
  const snapshot = await db.collection('alertTypes').get()
  const existing = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  console.log(`Found ${existing.length} existing alert types`)

  for (const alertType of ALERT_TYPES) {
    // Check if this label already exists
    const match = existing.find(
      e => e.label?.toLowerCase() === alertType.label.toLowerCase()
    )

    if (match) {
      // Update existing document
      await db.collection('alertTypes').doc(match.id).update({
        value: alertType.value,
        category: alertType.category,
        desc: alertType.desc,
        emoji: alertType.emoji,
        updatedAt: now,
      })
      console.log(`  ✅ Updated: ${alertType.emoji} ${alertType.label} → ${alertType.category}`)
    } else {
      // Add new document
      await db.collection('alertTypes').add({
        label: alertType.label,
        value: alertType.value,
        emoji: alertType.emoji,
        category: alertType.category,
        desc: alertType.desc,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      console.log(`  ➕ Added: ${alertType.emoji} ${alertType.label} → ${alertType.category}`)
    }
  }

  console.log('Migration complete.')
  process.exit(0)
}

migrateAlertTypes().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})