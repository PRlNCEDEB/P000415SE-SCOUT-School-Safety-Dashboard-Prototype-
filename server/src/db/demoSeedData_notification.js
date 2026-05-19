const defaultSchool = {
  schoolId: 'school_alpha',
  schoolName: 'Alpha School',
}

const notificationRecipients = [
  {
    id: 'classroom-teacher',
    name: 'Jordan Classroom Teacher',
    email: 'east.horng27@gmail.com',       // TODO: replace with real email
    phone: '+61400000011',
    role: 'classroom_teacher',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'leading-teacher',
    name: 'Taylor Leading Teacher',
    email: 'east.horng27@gmail.com',       // TODO: replace with real email
    phone: '+61400000012',
    role: 'leading_teacher',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'first-aid-officer',
    name: 'Casey First Aid Officer',
    email: 'east.horng27@gmail.com',       // TODO: replace with real email
    phone: '+61400000013',              // TODO: replace with real phone
    role: 'first_aid_officer',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'student-services',
    name: 'Alex Student Services',
    email: 'studentservices@school.edu',
    phone: '+61400000014',
    role: 'student_services',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'assistant-principal',
    name: 'Morgan Assistant Principal',
    email: 'assistant.principal@school.edu',
    phone: '+61400000015',
    role: 'assistant_principal',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'principal',
    name: 'Riley Principal',
    email: 'east.horng27@gmail.com',       // TODO: replace with real email
    phone: '+61400000016',
    role: 'principal',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'maintenance-facilities',
    name: 'Sam Facilities Lead',
    email: 'debprince21@gmail.com',     // using developer's email for the time being
    phone: '+61400000017',              // TODO: replace with real phone
    role: 'maintenance_facilities',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'relevant-staff',
    name: 'Jamie Relevant Staff',
    email: 'relevant.staff@school.edu',
    phone: '+61400000018',
    role: 'relevant_staff',
    ...defaultSchool,
    active: true,
  },

  // ── New roles added for emergency routing ─────────────────────────────────
  {
    id: 'fire-warden',
    name: 'Fire Warden',
    email: 'debprince21@gmail.com',     // using developer's email for the time being
    phone: '+61400000019',              // TODO: replace with real phone
    role: 'fire_warden',
    ...defaultSchool,
    active: true,
  },
  {
    id: 'security-officer',
    name: 'Security Officer',
    email: 'debprince21@gmail.com',     // using developer's email for the time being
    phone: '+61400000020',              // TODO: replace with real phone
    role: 'security_officer',
    ...defaultSchool,
    active: true,
  },
]

const notificationRouting = [

  // ── Emergency alerts — each type now notifies the correct roles ────────────

  {
    id: 'emergency-fire',
    alertScope: 'emergency',
    alertType: 'Fire',
    priority: 'critical',
    channels: ['sms', 'email'],
    // fire_warden responds, principal is informed
    roles: ['fire_warden', 'principal'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'emergency-threat',
    alertScope: 'emergency',
    alertType: 'Threat',
    priority: 'critical',
    channels: ['sms', 'email'],
    // security_officer responds, principal is informed
    roles: ['security_officer', 'principal'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'emergency-natural-disaster',
    alertScope: 'emergency',
    alertType: 'Natural Disaster',
    priority: 'critical',
    channels: ['sms', 'email'],
    // first_aid_officer and maintenance_facilities respond, principal is informed
    roles: ['first_aid_officer', 'maintenance_facilities', 'principal'],
    ...defaultSchool,
    active: true,
  },

  // ── General alerts — unchanged ─────────────────────────────────────────────

  {
    id: 'general-medical',
    alertScope: 'general',
    alertType: 'medical',
    priority: 'high',
    channels: ['sms', 'email'],
    roles: ['first_aid_officer', 'student_services', 'leading_teacher'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'general-fire',
    alertScope: 'general',
    alertType: 'fire',
    priority: 'medium',
    channels: ['email'],
    roles: ['leading_teacher', 'assistant_principal'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'general-lockdown',
    alertScope: 'general',
    alertType: 'lockdown',
    priority: 'critical',
    channels: ['sms', 'email'],
    roles: ['principal', 'assistant_principal', 'leading_teacher', 'classroom_teacher'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'general-behaviour',
    alertScope: 'general',
    alertType: 'behaviour',
    priority: 'medium',
    channels: ['email'],
    roles: ['leading_teacher', 'student_services'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'general-weather',
    alertScope: 'general',
    alertType: 'weather',
    priority: 'medium',
    channels: ['email'],
    roles: ['relevant_staff'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'general-maintenance',
    alertScope: 'general',
    alertType: 'maintenance',
    priority: 'low',
    channels: ['email'],
    roles: ['relevant_staff'],
    ...defaultSchool,
    active: true,
  },
  {
    id: 'general-general',
    alertScope: 'general',
    alertType: 'general',
    priority: 'low',
    channels: ['email'],
    roles: ['relevant_staff'],
    ...defaultSchool,
    active: true,
  },
]

module.exports = { notificationRecipients, notificationRouting }
