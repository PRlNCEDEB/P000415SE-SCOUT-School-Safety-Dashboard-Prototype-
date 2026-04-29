require('dotenv').config()
const express = require('express')
const router = express.Router()
const sgMail = require('@sendgrid/mail')
const twilio = require('twilio')
const crypto = require('crypto')
const admin = require('firebase-admin')
const { getDb } = require('../db/firebase')

const BACKEND_URL = process.env.BACKEND_URL || 'https://p000415se-scout-school-safety-dashboard-lo5f.onrender.com'

// Lazily initialise clients so missing env vars don't crash the server at startup
function getSgMail() {
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY is not set in .env')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  return sgMail
}

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not set in .env')
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

// Query Firestore to get the correct recipients for a given emergency type
async function getRecipientsForEmergency(emergencyType) {
  const db = getDb()

  const routingSnapshot = await db.collection('notificationRouting')
    .where('alertScope', '==', 'emergency')
    .where('alertType', '==', emergencyType)
    .where('active', '==', true)
    .get()

  if (routingSnapshot.empty) {
    console.warn(`⚠️ No routing rule found for emergency type: ${emergencyType}`)
    return []
  }

  const rule = routingSnapshot.docs[0].data()
  const roles = rule.roles
  console.log(`📋 Routing rule found for "${emergencyType}" → roles: ${roles.join(', ')}`)

  const recipientsSnapshot = await db.collection('notificationRecipients')
    .where('active', '==', true)
    .get()

  const recipients = recipientsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(r => roles.includes(r.role))

  console.log(`👥 Found ${recipients.length} recipient(s): ${recipients.map(r => r.name).join(', ')}`)
  return recipients
}

// POST /api/notifications/emergency
router.post('/emergency', async (req, res) => {
  const { code, emergencyType, location, message, incidentId } = req.body

  if (code !== '000') {
    return res.status(401).json({
      success: false,
      error: 'Invalid emergency code. Please enter 000 to confirm.'
    })
  }

  if (!emergencyType) {
    return res.status(400).json({
      success: false,
      error: 'Emergency type is required.'
    })
  }

  let recipients = []
  try {
    recipients = await getRecipientsForEmergency(emergencyType)
  } catch (err) {
    console.error('❌ Failed to fetch recipients from Firestore:', err.message)
    return res.status(500).json({ success: false, error: 'Failed to load recipients. Please try again.' })
  }

  if (recipients.length === 0) {
    return res.status(404).json({
      success: false,
      error: `No active recipients found for emergency type: ${emergencyType}`
    })
  }

  const subject = `🚨 EMERGENCY ALERT: ${emergencyType}${location ? ' - ' + location : ''}`
  const body = message || `An emergency has been declared at the school. Please respond immediately.`
  const timestamp = new Date().toISOString()
  const results = []

  for (const recipient of recipients) {
    // Generate unique token per recipient for the acknowledge link
    const token = crypto.randomUUID()
    const acknowledgeLink = `${BACKEND_URL}/api/notifications/acknowledge/${token}`

    const result = {
      name: recipient.name,
      role: recipient.role,
      email: recipient.email,
      emailStatus: 'pending',
      smsStatus: 'skipped',
      token,
    }

    // Send Email with acknowledge button
    try {
      await getSgMail().send({
        to: recipient.email,
        from: process.env.FROM_EMAIL,
        subject: subject,
        text: `${body}\n\nClick here to acknowledge this alert: ${acknowledgeLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">🚨 EMERGENCY ALERT</h1>
              <p style="color: #fecaca; margin: 4px 0 0;">SCOUT School Safety Management System</p>
            </div>
            <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px;">Emergency Type</p>
              <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0 0 16px;">${emergencyType}</p>
              ${location ? `<p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px;">Location</p><p style="font-size: 15px; color: #111827; margin: 0 0 16px;">📍 ${location}</p>` : ''}
              <p style="color: #374151; font-size: 15px;">${body}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

              <div style="text-align: center; margin: 24px 0;">
                <a
                  href="${acknowledgeLink}"
                  style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;"
                >
                  ✅ I am responding — Acknowledge Alert
                </a>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 12px;">
                  Click the button above to confirm you have received this alert and are responding.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px;">
                This is an automated emergency alert from the SCOUT School Safety System.
                Please do not reply to this email.
              </p>
            </div>
          </div>
        `
      })
      result.emailStatus = 'sent'
      console.log(`✅ Email sent to ${recipient.name} (${recipient.email})`)
    } catch (err) {
      result.emailStatus = 'failed'
      console.error(`❌ Email failed for ${recipient.name}:`, err.message)
    }

    // Send SMS
    if (recipient.phone) {
      try {
        const sms = await getTwilioClient().messages.create({
          body: `🚨 SCOUT EMERGENCY: ${emergencyType}${location ? ' at ' + location : ''}. Please respond immediately. Check your email to acknowledge.`,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
          to: recipient.phone
        })
        result.smsStatus = 'sent'
        console.log(`✅ SMS sent to ${recipient.name} - SID: ${sms.sid}`)
      } catch (err) {
        result.smsStatus = 'failed'
        console.error(`❌ SMS failed for ${recipient.name}:`, err.message)
      }
    }

    results.push(result)
  }

  const emailsSent = results.filter(r => r.emailStatus === 'sent').length

  // Save notification logs to Firestore with token and incidentId
  try {
    const db = getDb()
    const batch = db.batch()
    for (const r of results) {
      const ref = db.collection('notifications').doc()
      batch.set(ref, {
        incidentId: incidentId || null,
        incidentTitle: `${emergencyType}${location ? ' - ' + location : ''}`,
        type: emergencyType.toLowerCase(),
        recipientName: r.name,
        recipientEmail: r.email,
        recipientRole: r.role,
        sms: r.smsStatus,
        email: r.emailStatus,
        token: r.token,
        acknowledged: false,
        acknowledgedAt: null,
        timestamp,
      })
    }
    await batch.commit()
    console.log(`💾 Saved ${results.length} notification log(s) to Firestore`)
  } catch (err) {
    console.error('Failed to save notification logs:', err.message)
  }

  res.json({
    success: emailsSent > 0,
    message: `Emergency alert sent to ${emailsSent} of ${results.length} recipients.`,
    emergencyType,
    location: location || null,
    timestamp,
    results
  })
})

// GET /api/notifications/acknowledge/:token
// The link recipients click in their email
router.get('/acknowledge/:token', async (req, res) => {
  const { token } = req.params
  const db = getDb()

  try {
    const snapshot = await db.collection('notifications')
      .where('token', '==', token)
      .get()

    if (snapshot.empty) {
      return res.status(404).send(`
        <!DOCTYPE html><html>
        <head><title>SCOUT - Invalid Link</title></head>
        <body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
          <div style="text-align:center;max-width:400px;padding:40px;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size:48px;margin-bottom:16px;">❌</div>
            <h1 style="color:#111827;margin-bottom:8px;">Invalid Link</h1>
            <p style="color:#6b7280;">This acknowledgement link is invalid or has expired.</p>
            <p style="color:#9ca3af;font-size:12px;margin-top:16px;">SCOUT School Safety System</p>
          </div>
        </body></html>
      `)
    }

    const doc = snapshot.docs[0]
    const notification = doc.data()

    // Already acknowledged
    if (notification.acknowledged) {
      return res.send(`
        <!DOCTYPE html><html>
        <head><title>SCOUT - Already Acknowledged</title></head>
        <body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
          <div style="text-align:center;max-width:400px;padding:40px;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <h1 style="color:#111827;margin-bottom:8px;">Already Acknowledged</h1>
            <p style="color:#6b7280;">You have already confirmed your response to this alert.</p>
            <p style="color:#9ca3af;font-size:12px;margin-top:16px;">SCOUT School Safety System</p>
          </div>
        </body></html>
      `)
    }

    const acknowledgedAt = new Date().toISOString()

    // Mark notification as acknowledged
    await db.collection('notifications').doc(doc.id).update({
      acknowledged: true,
      acknowledgedAt,
    })

    // Add to incident's acknowledgedBy array using arrayUnion
    if (notification.incidentId) {
      try {
        const incidentRef = db.collection('incidents').doc(notification.incidentId)
        await incidentRef.update({
          acknowledgedBy: admin.firestore.FieldValue.arrayUnion({
            name: notification.recipientName,
            email: notification.recipientEmail,
            role: notification.recipientRole,
            acknowledgedAt,
          }),
          status: 'acknowledged',
          updatedAt: new Date().toISOString(),
        })
        console.log(`✅ Incident ${notification.incidentId} acknowledged by ${notification.recipientName}`)
      } catch (err) {
        console.error('Failed to update incident acknowledgedBy:', err.message)
      }
    }

    // Thank you page
    return res.send(`
      <!DOCTYPE html><html>
      <head><title>SCOUT - Response Confirmed</title></head>
      <body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
        <div style="text-align:center;max-width:400px;padding:40px;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <div style="font-size:48px;margin-bottom:16px;">✅</div>
          <h1 style="color:#16a34a;margin-bottom:8px;">Response Confirmed</h1>
          <p style="color:#374151;margin-bottom:8px;">
            Thank you, <strong>${notification.recipientName}</strong>.
          </p>
          <p style="color:#6b7280;margin-bottom:16px;">
            You have acknowledged the <strong>${notification.incidentTitle}</strong> emergency alert.
            Your response has been recorded in the SCOUT system.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:16px;">
            <p style="color:#15803d;font-size:14px;margin:0;">Please proceed to respond to the emergency immediately.</p>
          </div>
          <p style="color:#9ca3af;font-size:12px;">You can close this page.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:8px;">SCOUT School Safety System</p>
        </div>
      </body></html>
    `)
  } catch (err) {
    console.error('Acknowledge error:', err)
    return res.status(500).send(`
      <!DOCTYPE html><html>
      <head><title>SCOUT - Error</title></head>
      <body style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
        <div style="text-align:center;max-width:400px;padding:40px;background:white;border-radius:12px;">
          <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
          <h1 style="color:#111827;">Something went wrong</h1>
          <p style="color:#6b7280;">Please try again or contact your safety manager.</p>
        </div>
      </body></html>
    `)
  }
})

// GET /api/notifications — fetch delivery logs from Firestore
router.get('/', async (req, res, next) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('notifications').orderBy('timestamp', 'desc').limit(100).get()
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json({ notifications })
  } catch (err) {
    next(err)
  }
})

module.exports = router