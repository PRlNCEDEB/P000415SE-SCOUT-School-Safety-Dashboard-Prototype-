require('dotenv').config()
const { initFirebase, getDb } = require('../db/firebase')

const ALERT_TYPES = [
  { label: 'Medical', emoji: '🏥', category: 'general' },
  { label: 'Fire', emoji: '🔥', category: 'emergency' },
  { label: 'Lockdown', emoji: '🔒', category: 'emergency' },
  { label: 'Behaviour', emoji: '⚠️', category: 'general' },
  { label: 'Weather', emoji: '🌩️', category: 'general' },
  { label: 'Maintenance', emoji: '🔧', category: 'general' },
  { label: 'General', emoji: '📢', category: 'general' },
]

const LOCATIONS = [
  'Oval',
  'Canteen',
  'Block A',
  'Block B',
  'Block C',
  'Main Building',
  'Cafeteria',
  'Library',
  'Car Park',
  'Reception',
]

async function seedAlertConfig() {
  initFirebase()
  const db = getDb()
  const now = new Date().toISOString()

  console.log('Seeding alert types...')
  for (const type of ALERT_TYPES) {
    await db.collection('alertTypes').add({
      label: type.label,
      emoji: type.emoji,
      category: type.category,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    console.log(`  ${type.emoji} ${type.label}`)
  }

  console.log('Seeding locations...')
  for (const label of LOCATIONS) {
    await db.collection('locations').add({
      label,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    console.log(`  ${label}`)
  }

  console.log('Done.')
  process.exit(0)
}

seedAlertConfig().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
