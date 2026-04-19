const incidents = [
  {
    id: '1',
    type: 'medical',
    priority: 'critical',
    status: 'triggered',
    title: 'Student injury - oval',
    location: 'Oval',
    timestamp: 'Today 10:32am',
    triggeredByName: 'Murali',
    description: 'Student fell and sustained a head injury during PE class. Ambulance has been called.',
    notifications: [
      { recipientName: 'Principal Davis', sms: 'sent', email: 'sent' },
      { recipientName: 'First Aid Officer', sms: 'sent', email: 'failed' },
    ],
  },
  {
    id: '2',
    type: 'behaviour',
    priority: 'high',
    status: 'acknowledged',
    title: 'Altercation near canteen',
    location: 'Canteen',
    timestamp: 'Today 9:15am',
    triggeredByName: 'Deva',
    description: 'Two students involved in a physical altercation near the canteen area. Both students have been separated.',
    notifications: [
      { recipientName: 'Deputy Principal', sms: 'sent', email: 'sent' },
    ],
  },
  {
    id: '3',
    type: 'fire',
    priority: 'critical',
    status: 'resolved',
    title: 'Fire alarm triggered - Block B',
    location: 'Block B',
    timestamp: 'Yesterday 2:10pm',
    triggeredByName: 'Jacky',
    description: 'Fire alarm triggered in Block B science lab. Fire brigade attended. False alarm confirmed.',
    notifications: [
      { recipientName: 'Principal Davis', sms: 'sent', email: 'sent' },
      { recipientName: 'Fire Warden', sms: 'sent', email: 'sent' },
    ],
  },
  {
    id: '4',
    type: 'lockdown',
    priority: 'high',
    status: 'triggered',
    title: 'Lockdown initiated - main building',
    location: 'Main Building',
    timestamp: 'Yesterday 11:45am',
    triggeredByName: 'Prince',
    description: 'Lockdown initiated due to reported suspicious person near school perimeter. Police notified.',
    notifications: [
      { recipientName: 'All Staff', sms: 'sent', email: 'sent' },
      { recipientName: 'Police Liaison', sms: 'failed', email: 'sent' },
    ],
  },
  {
    id: '5',
    type: 'medical',
    priority: 'medium',
    status: 'resolved',
    title: 'Allergic reaction - cafeteria',
    location: 'Cafeteria',
    timestamp: '2 days ago',
    triggeredByName: 'Ian',
    description: 'Student experienced mild allergic reaction to food in cafeteria. EpiPen administered by nurse.',
    notifications: [
      { recipientName: 'School Nurse', sms: 'sent', email: 'sent' },
    ],
  },
]

function getAllIncidents() {
  return incidents
}

function getIncidentById(id) {
  return incidents.find((incident) => incident.id === id)
}

function createIncident(payload) {
  const nextId = String(Math.max(0, ...incidents.map((i) => Number(i.id) || 0)) + 1)
  const newIncident = {
    id: nextId,
    type: payload.type,
    priority: payload.priority,
    status: 'triggered',
    title: payload.title.trim(),
    location: payload.location,
    timestamp: 'Just now',
    triggeredByName: payload.triggeredByName || 'Admin',
    description: payload.description?.trim() || '',
    notifications: [],
  }
  incidents.unshift(newIncident)
  return newIncident
}

function updateIncidentStatus(id, status) {
  const incident = getIncidentById(id)
  if (!incident) return null
  incident.status = status
  return incident
}

module.exports = {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
}
