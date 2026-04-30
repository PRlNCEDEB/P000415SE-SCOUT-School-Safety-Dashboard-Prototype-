const { initFirebase } = require('./firebase')
const { seedDemoUsers } = require('./seedDemousers')
const { seedDemoNotificationData } = require('./seedDemoData')
const { seedDemoAnalyticsData } = require('./seedDemoAnalytics')

async function seedEmulatorData() {
  initFirebase()

  console.log('Seeding Firebase emulator data...')

  await seedDemoUsers()
  await seedDemoNotificationData()
  await seedDemoAnalyticsData()

  console.log('Firebase emulator seed complete.')
}

if (require.main === module) {
  seedEmulatorData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to seed emulator data:', error)
      process.exit(1)
    })
}

module.exports = { seedEmulatorData }
