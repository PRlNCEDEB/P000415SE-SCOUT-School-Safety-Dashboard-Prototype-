const admin = require('firebase-admin')

const serviceAccount = require('./firebase-service-account.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function setupFirestore() {
  const batch = db.batch()

  const userRef = db.collection('users').doc('admin')
  batch.set(userRef, {
    name: 'Admin User',
    email: 'admin@school.edu',
    passwordHash: 'demo-hash',
    role: 'admin',
    createdAt: new Date().toISOString(),
  })

  const incidentRef = db.collection('incidents').doc('incident-001')
  batch.set(incidentRef, {
    title: 'Fire alert',
    description: 'Fire emergency triggered from dashboard.',
    location: 'Dashboard quick action',
    type: 'fire',
    priority: 'critical',
    status: 'triggered',
    triggeredById: 'admin',
    triggeredByName: 'Admin User',
    acknowledgedBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const notificationRef = db.collection('notifications').doc('notification-001')
  batch.set(notificationRef, {
    incidentId: 'incident-001',
    incidentTitle: 'Fire alert',
    incidentType: 'fire',
    recipientName: 'Riley Principal',
    recipientEmail: 'principal@school.edu',
    recipientPhone: '+61400000016',
    recipientRole: 'principal',
    emailStatus: 'sent',
    smsStatus: 'sent',
    token: 'demo-token-001',
    acknowledged: false,
    acknowledgedAt: null,
    createdAt: new Date().toISOString(),
  })

  const recipientRef = db.collection('notificationRecipients').doc('principal')
  batch.set(recipientRef, {
    name: 'Riley Principal',
    email: 'principal@school.edu',
    phone: '+61400000016',
    role: 'principal',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const routingRef = db.collection('notificationRouting').doc('emergency-fire')
  batch.set(routingRef, {
    alertScope: 'emergency',
    alertType: 'Fire',
    priority: 'critical',
    channels: ['sms', 'email'],
    roles: ['principal'],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const actionLogRef = db.collection('actionLogs').doc('action-001')
  batch.set(actionLogRef, {
    button: '1',
    actions: ['Email', 'SMS', 'Record'],
    title: 'Fire alert triggered',
    description: 'Quick action fire alert triggered.',
    location: 'Dashboard quick action',
    emergencyType: 'Fire',
    triggeredById: 'admin',
    createdAt: new Date().toISOString(),
  })

  await batch.commit()
  console.log('Firestore setup complete.')
}

setupFirestore().catch(console.error)
