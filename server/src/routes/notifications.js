require('dotenv').config()
const express = require('express')
const router = express.Router()
const sgMail = require('@sendgrid/mail')
const twilio = require('twilio')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Emergency recipients — add all staff here
const emergencyRecipients = [
  {
    name: 'Prince',
    team: 'General',
    email: 'debprince21@gmail.com',
    phone: '+61422262896'
  },
  // Add more recipients:
  // { name: 'Principal', team: 'Management', email: 'principal@school.edu', phone: '+61400000001' },
  // { name: 'First Aid Officer', team: 'Medical', email: 'firstaid@school.edu', phone: '+61400000002' },
]

// POST /api/notifications/emergency
router.post('/emergency', async (req, res) => {
  const { code, emergencyType, location, message } = req.body

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

  const subject = `🚨 EMERGENCY ALERT: ${emergencyType}${location ? ' - ' + location : ''}`
  const body = message || `An emergency has been declared at the school. Please respond immediately.`

  const results = []

  for (const recipient of emergencyRecipients) {
    const result = {
      name: recipient.name,
      team: recipient.team,
      email: recipient.email,
      emailStatus: 'pending',
      smsStatus: 'skipped'
    }

    // Send Email
    try {
      await sgMail.send({
        to: recipient.email,
        from: process.env.FROM_EMAIL,
        subject: subject,
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
              ${location ? `<p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px;">Location</p><p style="font-size: 15px; color: #111827; margin: 0 0 16px;">📍 ${location}</p>` : ''}
              <p style="color: #374151; font-size: 15px;">${body}</p>
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
        const sms = await twilioClient.messages.create({
          body: `🚨 SCOUT EMERGENCY: ${emergencyType}${location ? ' at ' + location : ''}. Please respond immediately.`,
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

  res.json({
    success: emailsSent > 0,
    message: `Emergency alert sent to ${emailsSent} of ${results.length} recipients.`,
    emergencyType,
    location: location || null,
    timestamp: new Date().toISOString(),
    results
  })
})

module.exports = router
