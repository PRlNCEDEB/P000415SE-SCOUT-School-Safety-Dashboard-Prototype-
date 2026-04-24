require('dotenv').config()

const express = require('express')
const router = express.Router()
const sgMail = require('@sendgrid/mail')
const twilio = require('twilio')
const { getDb } = require('../db/firebase')
const admin = require('firebase-admin')

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null

function getDateFromTimestamp(timestamp) {
  if (!timestamp) return null
  return timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
}

function formatTimestamp(timestamp) {
  const date = getDateFromTimestamp(timestamp)

  if (!date || Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const emergencyRecipients = [
  {
    name: 'Prince',
    team: 'General',
    email: 'debprince21@gmail.com',
    phone: '+61422262896',
  },
  {
    name: 'Jacky',
    team: 'General',
    email: 'east.horng27@gmail.com',
    phone: '+61472578362',
  },
]

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await getDb()
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .get()

    const notifications = snapshot.docs.map(doc => {
      const item = doc.data()
      const createdAtDate = getDateFromTimestamp(item.createdAt)

      return {
        id: doc.id,
        incidentId: item.incidentId || '',
        incidentTitle: item.incidentTitle || 'Unknown incident',
        recipientName: item.recipientName || 'Unknown recipient',
        recipientEmail: item.recipientEmail || '',
        recipientPhone: item.recipientPhone || '',
        sms: item.smsStatus || 'pending',
        email: item.emailStatus || 'pending',
        type: item.incidentType || 'general',

        // Raw UTC time for frontend sorting
        createdAt: createdAtDate ? createdAtDate.toISOString() : '',

        // Melbourne formatted time for display
        timestamp: item.createdAt ? formatTimestamp(item.createdAt) : '',
      }
    })

    res.json({ notifications })
  } catch (error) {
    console.error('GET /api/notifications failed:', error)
    next(error)
  }
})

// POST /api/notifications/emergency
router.post('/emergency', async (req, res, next) => {
  try {
    const { code, emergencyType, location, message, incidentId } = req.body

    if (code !== '000') {
      return res.status(401).json({
        success: false,
        error: 'Invalid emergency code. Please enter 000 to confirm.',
      })
    }

    if (!emergencyType) {
      return res.status(400).json({
        success: false,
        error: 'Emergency type is required.',
      })
    }

    const incidentTitle = emergencyType
      ? `${emergencyType}${location ? ' - ' + location : ''}`
      : 'Emergency Alert'

    const subject = `🚨 EMERGENCY ALERT: ${incidentTitle}`
    const body =
      message || 'An emergency has been declared at the school. Please respond immediately.'

    const results = []

    for (const recipient of emergencyRecipients) {
      const result = {
        name: recipient.name,
        team: recipient.team,
        email: recipient.email,
        phone: recipient.phone || '',
        emailStatus: 'pending',
        smsStatus: recipient.phone ? 'pending' : 'skipped',
      }

      try {
        await sgMail.send({
          to: recipient.email,
          from: process.env.FROM_EMAIL,
          subject,
          text: body,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">🚨 EMERGENCY ALERT</h1>
                <p style="color: #fecaca; margin: 4px 0 0;">SCOUT School Safety Management System</p>
              </div>
              <div style="background: #fff; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px;">Emergency Type</p>
                <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0 0 16px;">${emergencyType}</p>
                ${
                  location
                    ? `<p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px;">Location</p><p style="font-size: 15px; color: #111827; margin: 0 0 16px;">📍 ${location}</p>`
                    : ''
                }
                <p style="color: #374151; font-size: 15px;">${body}</p>
              </div>
            </div>
          `,
        })

        result.emailStatus = 'sent'
      } catch (err) {
        result.emailStatus = 'failed'
        console.error(`Email failed for ${recipient.name}:`, err.message)
      }

      if (recipient.phone && twilioClient && process.env.TWILIO_MESSAGING_SERVICE_SID) {
        try {
          await twilioClient.messages.create({
            body: `🚨 SCOUT EMERGENCY: ${incidentTitle}. Please respond immediately.`,
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
            to: recipient.phone,
          })

          result.smsStatus = 'sent'
        } catch (err) {
          result.smsStatus = 'failed'
          console.error(`SMS failed for ${recipient.name}:`, err.message)
        }
      }

      console.log('Saving notification:', {
        incidentTitle,
        emergencyType,
        location,
        recipient: recipient.name,
        emailStatus: result.emailStatus,
        smsStatus: result.smsStatus,
      })

      await getDb().collection('notifications').add({
        incidentId: incidentId || null,
        incidentTitle,
        incidentType: emergencyType ? emergencyType.toLowerCase() : 'general',
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        recipientPhone: recipient.phone || '',
        emailStatus: result.emailStatus,
        smsStatus: result.smsStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      results.push(result)
    }

    const emailsSent = results.filter(r => r.emailStatus === 'sent').length

    res.json({
      success: emailsSent > 0,
      message: `Emergency alert sent to ${emailsSent} of ${results.length} recipients.`,
      emergencyType,
      location: location || null,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router