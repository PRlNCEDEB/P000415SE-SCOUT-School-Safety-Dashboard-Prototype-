const express = require('express')
const admin = require('firebase-admin')
const { docToObject, formatTimestamp, getDb, snapshotToArray } = require('../db/firebase')
const { invalidateAnalyticsCache } = require('../analyticsCache')

const router = express.Router()

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' })
  }

  try {
    req.user = await admin.auth().verifyIdToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

function normaliseRole(role) {
  return String(role || '').toLowerCase().replace(/[-_\s]/g, '')
}

function isCompanyAdmin(role) {
  return ['companyadmin', 'admin'].includes(normaliseRole(role))
}

function isSchoolAdmin(role) {
  return ['schooladmin', 'principal'].includes(normaliseRole(role))
}

function canCreateIncident(role) {
  return ['staff', 'schooladmin', 'principal'].includes(normaliseRole(role))
}

async function getSchoolName(db, schoolId) {
  if (!schoolId) return null

  const schoolDoc = await db.collection('schools').doc(schoolId).get()
  if (!schoolDoc.exists) return null

  const school = schoolDoc.data()
  return school?.name || null
}

async function getUserProfile(decodedUser) {
  const db = getDb()
  const { uid, email, name } = decodedUser
  let profile = null

  const userDoc = await db.collection('users').doc(uid).get()
  if (userDoc.exists) {
    profile = userDoc.data()
  } else if (email) {
    const byEmail = await db.collection('users').where('email', '==', email).limit(1).get()
    if (!byEmail.empty) {
      profile = byEmail.docs[0].data()
    }
  }

  return {
    uid,
    email: email || null,
    name: profile?.name || name || email || 'Unknown',
    role: profile?.role || null,
    schoolId: profile?.schoolId || null,
    schoolName: profile?.schoolName || await getSchoolName(db, profile?.schoolId),
  }
}

async function getVisibleIncidents(profile) {
  const db = getDb()

  if (isCompanyAdmin(profile.role)) {
    const snapshot = await db.collection('incidents').get()
    return snapshotToArray(snapshot)
  }

  if (isSchoolAdmin(profile.role)) {
    if (!profile.schoolId) return []

    const snapshot = await db.collection('incidents')
      .where('schoolId', '==', profile.schoolId)
      .get()
    return snapshotToArray(snapshot)
  }

  const incidentMap = new Map()
  const addSnapshot = snapshot => {
    snapshotToArray(snapshot).forEach(incident => {
      incidentMap.set(incident.id, incident)
    })
  }

  const submittedSnapshot = await db.collection('incidents')
    .where('triggeredById', '==', profile.uid)
    .get()
  addSnapshot(submittedSnapshot)

  const assignedByIdSnapshot = await db.collection('incidents')
    .where('assignedUserIds', 'array-contains', profile.uid)
    .get()
  addSnapshot(assignedByIdSnapshot)

  if (profile.email) {
    const assignedByEmailSnapshot = await db.collection('incidents')
      .where('assignedUserEmails', 'array-contains', profile.email)
      .get()
    addSnapshot(assignedByEmailSnapshot)
  }

  return [...incidentMap.values()]
}

function canReadIncident(profile, incident) {
  if (isCompanyAdmin(profile.role)) return true
  if (isSchoolAdmin(profile.role)) {
    return Boolean(profile.schoolId && incident.schoolId === profile.schoolId)
  }

  const assignedUserIds = Array.isArray(incident.assignedUserIds) ? incident.assignedUserIds : []
  const assignedUserEmails = Array.isArray(incident.assignedUserEmails) ? incident.assignedUserEmails : []

  return incident.triggeredById === profile.uid ||
    assignedUserIds.includes(profile.uid) ||
    (profile.email && assignedUserEmails.includes(profile.email))
}

function canUpdateIncidentStatus(profile, incident) {
  return canReadIncident(profile, incident) && (isCompanyAdmin(profile.role) || isSchoolAdmin(profile.role))
}

function appendUniqueActor(list, profile, timestamp, timeField) {
  const existing = Array.isArray(list) ? list : []
  const alreadyRecorded = existing.some(actor =>
    (profile.uid && actor.uid === profile.uid) ||
    (profile.email && actor.email === profile.email)
  )

  if (alreadyRecorded) return existing

  return [
    ...existing,
    {
      uid: profile.uid,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      [timeField]: timestamp,
    },
  ]
}

function getSortValue(incident) {
  //tries to get a timestamp for sorting based on createdAt, updatedAt, or timestamp fields
  const value = incident.createdAt || incident.updatedAt || incident.timestamp

  if (!value) return 0
  //if it is a Firestore Timestamp, use toMillis() to convert it into a number
  if (typeof value.toMillis === 'function') return value.toMillis()
  //otherwise, try to parse it as a date string and return the timestamp
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function toIsoTimestamp(value) {
  if (!value) return null
  const date = value.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

//converts a raw Firestore incident into the response shape used by the frontend
function toIncidentResponse(incident) {
  return {
    id: String(incident.id),
    type: incident.type || 'general',
    priority: incident.priority || 'low',
    status: incident.status || 'triggered',
    title: incident.title || 'Untitled incident',
    location: incident.location || 'Unknown location',
    createdAt: toIsoTimestamp(incident.createdAt),
    updatedAt: toIsoTimestamp(incident.updatedAt),
    timestamp: incident.createdAt ? formatTimestamp(incident.createdAt) : '',
    triggeredByName: incident.triggeredByName || 'Unknown reporter',
    triggeredById: incident.triggeredById || null,
    triggeredByEmail: incident.triggeredByEmail || null,
    triggeredByRole: incident.triggeredByRole || null,
    schoolId: incident.schoolId || null,
    schoolName: incident.schoolName || null,
    assignedUserIds: Array.isArray(incident.assignedUserIds) ? incident.assignedUserIds : [],
    assignedUserEmails: Array.isArray(incident.assignedUserEmails) ? incident.assignedUserEmails : [],
    description: incident.description || '',
    acknowledgedBy: incident.acknowledgedBy || [],  // ← added
    inProgressBy: incident.inProgressBy || [],
    notifications: [],
  }
}

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user)
    //sorts incidents from newest to oldest based on createdAt, updatedAt, or timestamp and converts to response format
    const incidents = (await getVisibleIncidents(profile))
      .sort((left, right) => getSortValue(right) - getSortValue(left))
      .map(toIncidentResponse)
    //sends the result back as JSON
    res.json({ incidents })
  } catch (error) {
    next(error)
  }
})
//gets a specific incident by ID
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user)
    const doc = await getDb().collection('incidents').doc(req.params.id).get()
    const incident = docToObject(doc)

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' })
    }

    if (!canReadIncident(profile, incident)) {
      return res.status(403).json({ error: 'You do not have access to this incident.' })
    }

    const notificationsSnapshot = await getDb()
      .collection('notifications')
      .where('incidentId', '==', req.params.id)
      .get()
    //converts each notification into a smaller response object
    const notifications = snapshotToArray(notificationsSnapshot).map(notification => ({
      recipientName: notification.recipientName || 'Unknown recipient',
      sms: notification.sms || notification.smsStatus || 'pending',      // ← fixed
      email: notification.email || notification.emailStatus || 'pending', // ← fixed
    }))
    //returns the incident details
    res.json({
      incident: {
        ...toIncidentResponse(incident),
        notifications,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { type, priority, status, title, location, description } = req.body
    const now = new Date().toISOString()
    const reporter = await getUserProfile(req.user)

    if (!canCreateIncident(reporter.role)) {
      return res.status(403).json({ error: 'You do not have permission to submit incidents.' })
    }

    if (!reporter.schoolId) {
      return res.status(403).json({ error: 'Your account is not assigned to a school.' })
    }

    const docRef = await getDb().collection('incidents').add({
      type: type || 'general',
      priority: priority || 'low',
      status: status || 'triggered',
      title: title || 'Untitled incident',
      location: location || 'Unknown',
      description: description || '',
      triggeredByName: reporter.name,
      triggeredById: reporter.uid,
      triggeredByEmail: reporter.email,
      triggeredByRole: reporter.role,
      schoolId: reporter.schoolId,
      schoolName: reporter.schoolName,
      assignedUserIds: [],
      assignedUserEmails: [],
      createdAt: now,
      updatedAt: now,
    })

    const doc = await docRef.get()
    const incident = { id: doc.id, ...doc.data() }
    invalidateAnalyticsCache()
    res.status(201).json(toIncidentResponse(incident))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/status', verifyToken, async (req, res, next) => {
  try {
    const { status } = req.body
    const now = new Date().toISOString()
    const db = getDb()
    const profile = await getUserProfile(req.user)
    const docRef = db.collection('incidents').doc(req.params.id)
    const doc = await docRef.get()
    const incident = docToObject(doc)

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found.' })
    }

    if (!canUpdateIncidentStatus(profile, incident)) {
      return res.status(403).json({ error: 'You do not have permission to update this incident.' })
    }

    const updates = { status, updatedAt: now }

    if (status === 'acknowledged') {
      updates.acknowledgedBy = appendUniqueActor(incident.acknowledgedBy, profile, now, 'acknowledgedAt')
    }

    if (status === 'in-progress') {
      updates.inProgressBy = appendUniqueActor(incident.inProgressBy, profile, now, 'inProgressAt')
    }

    await docRef.update(updates)
    const updatedDoc = await docRef.get()
    const updatedIncident = docToObject(updatedDoc)
    invalidateAnalyticsCache()
    res.json({ success: true, incident: toIncidentResponse(updatedIncident) })
  } catch (error) {
    next(error)
  }
})

module.exports = router
module.exports.getSortValue = getSortValue
module.exports.toIncidentResponse = toIncidentResponse
module.exports.toIsoTimestamp = toIsoTimestamp
