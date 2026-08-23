// demoSeedData_notification.js
//
// Generates demo notification recipients and routing rules **for a given
// school**, instead of embedding one hardcoded school.
//
// Previously every record here carried a literal `school_alpha` / 'Alpha
// School', which meant only that one school had any routing: alerts raised at
// any other school matched no rules and notified nobody. Building the records
// per school fixes that and removes the last hardcoded school reference from
// the seed layer.

// Role templates. Phone numbers stay distinct per school by offsetting the
// final digits with the school's index, so no two demo contacts collide.
const RECIPIENT_TEMPLATES = [
  { key: 'classroom-teacher',      name: 'Jordan Classroom Teacher',   role: 'classroom_teacher',      email: 'east.horng27@gmail.com',   phone: 11 },
  { key: 'leading-teacher',        name: 'Taylor Leading Teacher',     role: 'leading_teacher',        email: 'east.horng27@gmail.com',   phone: 12 },
  { key: 'first-aid-officer',      name: 'Casey First Aid Officer',    role: 'first_aid_officer',      email: 'east.horng27@gmail.com',   phone: 13 },
  { key: 'student-services',       name: 'Alex Student Services',      role: 'student_services',       email: 'studentservices@school.edu', phone: 14 },
  { key: 'assistant-principal',    name: 'Morgan Assistant Principal', role: 'assistant_principal',    email: 'assistant.principal@school.edu', phone: 15 },
  { key: 'principal',              name: 'Riley Principal',            role: 'principal',              email: 'east.horng27@gmail.com',   phone: 16 },
  { key: 'maintenance-facilities', name: 'Sam Facilities Lead',        role: 'maintenance_facilities', email: 'debprince21@gmail.com',    phone: 17 },
  { key: 'relevant-staff',         name: 'Jamie Relevant Staff',       role: 'relevant_staff',         email: 'relevant.staff@school.edu', phone: 18 },
  { key: 'fire-warden',            name: 'Fire Warden',                role: 'fire_warden',            email: 'debprince21@gmail.com',    phone: 19 },
  { key: 'security-officer',       name: 'Security Officer',           role: 'security_officer',       email: 'debprince21@gmail.com',    phone: 20 },
]

const ROUTING_TEMPLATES = [
  // ── Emergency alerts — each type notifies the responders plus the principal ─
  { key: 'emergency-fire',              alertScope: 'emergency', alertType: 'Fire',             priority: 'critical', channels: ['sms', 'email'], roles: ['fire_warden', 'principal'] },
  { key: 'emergency-threat',            alertScope: 'emergency', alertType: 'Threat',           priority: 'critical', channels: ['sms', 'email'], roles: ['security_officer', 'principal'] },
  { key: 'emergency-natural-disaster',  alertScope: 'emergency', alertType: 'Natural Disaster', priority: 'critical', channels: ['sms', 'email'], roles: ['first_aid_officer', 'maintenance_facilities', 'principal'] },

  // ── General alerts ─────────────────────────────────────────────────────────
  { key: 'general-medical',     alertScope: 'general', alertType: 'medical',     priority: 'high',   channels: ['sms', 'email'], roles: ['first_aid_officer', 'student_services', 'leading_teacher'] },
  { key: 'general-fire',        alertScope: 'general', alertType: 'fire',        priority: 'medium', channels: ['email'],        roles: ['leading_teacher', 'assistant_principal'] },
  { key: 'general-lockdown',    alertScope: 'general', alertType: 'lockdown',    priority: 'critical', channels: ['sms', 'email'], roles: ['principal', 'assistant_principal', 'leading_teacher', 'classroom_teacher'] },
  { key: 'general-behaviour',   alertScope: 'general', alertType: 'behaviour',   priority: 'medium', channels: ['email'],        roles: ['leading_teacher', 'student_services'] },
  { key: 'general-weather',     alertScope: 'general', alertType: 'weather',     priority: 'medium', channels: ['email'],        roles: ['relevant_staff'] },
  { key: 'general-maintenance', alertScope: 'general', alertType: 'maintenance', priority: 'low',    channels: ['email'],        roles: ['relevant_staff'] },
  { key: 'general-general',     alertScope: 'general', alertType: 'general',     priority: 'low',    channels: ['email'],        roles: ['relevant_staff'] },
]

// Document IDs from the original single-school seed. The seeder deletes these
// so re-seeding does not leave duplicates alongside the per-school records —
// duplicate recipients would mean duplicate alerts.
const LEGACY_RECIPIENT_IDS = RECIPIENT_TEMPLATES.map(template => template.key)
const LEGACY_ROUTING_IDS = ROUTING_TEMPLATES.map(template => template.key)

// Namespacing by schoolId keeps IDs deterministic (so re-seeding overwrites
// rather than duplicates) while letting every school hold its own full set.
function scopedId(schoolId, key) {
  return `${schoolId}__${key}`
}

function buildRecipientsForSchool(school, schoolIndex = 0) {
  return RECIPIENT_TEMPLATES.map(template => ({
    id: scopedId(school.id, template.key),
    name: template.name,
    email: template.email,
    phone: `+614${String(schoolIndex).padStart(2, '0')}0000${template.phone}`,
    role: template.role,
    schoolId: school.id,
    schoolName: school.name,
    active: true,
  }))
}

function buildRoutingForSchool(school) {
  return ROUTING_TEMPLATES.map(template => ({
    id: scopedId(school.id, template.key),
    alertScope: template.alertScope,
    alertType: template.alertType,
    priority: template.priority,
    channels: [...template.channels],
    roles: [...template.roles],
    schoolId: school.id,
    schoolName: school.name,
    active: true,
  }))
}

// Builds the full recipient and routing set for every school passed in.
function buildNotificationSeedData(schools) {
  const recipients = []
  const routing = []

  schools.forEach((school, index) => {
    recipients.push(...buildRecipientsForSchool(school, index))
    routing.push(...buildRoutingForSchool(school))
  })

  return { recipients, routing }
}

module.exports = {
  buildNotificationSeedData,
  buildRecipientsForSchool,
  buildRoutingForSchool,
  LEGACY_RECIPIENT_IDS,
  LEGACY_ROUTING_IDS,
  RECIPIENT_TEMPLATES,
  ROUTING_TEMPLATES,
}
