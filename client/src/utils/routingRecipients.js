// Routing rules store a *snapshot* of each recipient's contact details rather
// than a reference to the user record. That keeps alert delivery independent of
// user lookups, but it means editing a user's phone number does not reach the
// routing rules on its own.
//
// These helpers push a changed phone number into every alert type the person is
// routed to. Updating only the alert type currently on screen leaves the other
// rules holding the old number, and SMS for those alerts silently goes to the
// wrong place or nowhere.

// Recipients are matched on email because that is the only stable identifier
// stored on a routing rule (there is no user id on the snapshot).
function normaliseEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function matchesRecipient(recipient, targetEmail) {
  return targetEmail !== '' && normaliseEmail(recipient?.email) === targetEmail
}

// Every alert type where this person currently appears as a recipient.
export function findAlertTypesForRecipient(routing, email) {
  const target = normaliseEmail(email)
  if (!target) return []

  return Object.keys(routing || {}).filter(alertType =>
    (Array.isArray(routing[alertType]) ? routing[alertType] : [])
      .some(recipient => matchesRecipient(recipient, target))
  )
}

// Builds the updated recipient lists for every alert type that needs one.
//
// Returns an object keyed by alert type, containing only the types that
// actually change a type where the phone already matches is skipped so it is
// not written back to the server for nothing.
export function applyRecipientPhone(routing, email, phone) {
  const target = normaliseEmail(email)
  const updates = {}

  if (!target) return updates

  for (const alertType of Object.keys(routing || {})) {
    const recipients = Array.isArray(routing[alertType]) ? routing[alertType] : []

    const needsUpdate = recipients.some(
      recipient => matchesRecipient(recipient, target) && recipient.phone !== phone
    )

    if (!needsUpdate) continue

    updates[alertType] = recipients.map(recipient =>
      matchesRecipient(recipient, target) ? { ...recipient, phone } : recipient
    )
  }

  return updates
}
