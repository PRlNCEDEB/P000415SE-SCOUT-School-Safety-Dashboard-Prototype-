import { useState } from 'react'
// TODO: Replace mock notification records with delivery logs retrieved from the backend API.
const mockNotifications = [
  {
    id: '1',
    incidentTitle: 'Student injury - oval',
    recipientName: 'Principal Davis',
    recipientEmail: 'davis@school.edu',
    recipientPhone: '+61 400 111 222',
    sms: 'sent',
    email: 'sent',
    timestamp: 'Today 10:32am',
    type: 'medical',
  },
  {
    id: '2',
    incidentTitle: 'Student injury - oval',
    recipientName: 'First Aid Officer',
    recipientEmail: 'firstaid@school.edu',
    recipientPhone: '+61 400 333 444',
    sms: 'sent',
    email: 'failed',
    timestamp: 'Today 10:32am',
    type: 'medical',
  },
  {
    id: '3',
    incidentTitle: 'Altercation near canteen',
    recipientName: 'Deputy Principal',
    recipientEmail: 'deputy@school.edu',
    recipientPhone: '+61 400 555 666',
    sms: 'sent',
    email: 'sent',
    timestamp: 'Today 9:15am',
    type: 'behaviour',
  },
  {
    id: '4',
    incidentTitle: 'Lockdown initiated - main building',
    recipientName: 'All Staff',
    recipientEmail: 'staff@school.edu',
    recipientPhone: '+61 400 777 888',
    sms: 'sent',
    email: 'sent',
    timestamp: 'Yesterday 11:45am',
    type: 'lockdown',
  },
  {
    id: '5',
    incidentTitle: 'Lockdown initiated - main building',
    recipientName: 'Police Liaison',
    recipientEmail: 'police@school.edu',
    recipientPhone: '+61 400 999 000',
    sms: 'failed',
    email: 'sent',
    timestamp: 'Yesterday 11:45am',
    type: 'lockdown',
  },
  {
    id: '6',
    incidentTitle: 'Fire alarm triggered - Block B',
    recipientName: 'Fire Warden',
    recipientEmail: 'warden@school.edu',
    recipientPhone: '+61 400 123 456',
    sms: 'sent',
    email: 'sent',
    timestamp: 'Yesterday 2:10pm',
    type: 'fire',
  },
]

const typeIcons = {
  medical: '🏥',
  behaviour: '⚠️',
  fire: '🔥',
  lockdown: '🔒',
  weather: '🌩️',
  maintenance: '🔧',
  general: '📢',
}

const statusStyle = {
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

export default function Notifications() {
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  // TODO: Replace client-side notification summary counts with backend-provided metrics.
  const totalSent = mockNotifications.filter(
    n => n.sms === 'sent' || n.email === 'sent'
  ).length
  const totalFailed = mockNotifications.filter(
    n => n.sms === 'failed' || n.email === 'failed'
  ).length
  const smsFailed = mockNotifications.filter(n => n.sms === 'failed').length
  const emailFailed = mockNotifications.filter(n => n.email === 'failed').length
  // TODO: Move notification filtering to backend query parameters when integrating with the API.
  const filtered = mockNotifications.filter(n => {
    if (filterChannel === 'sms') return n.sms === filterStatus || filterStatus === 'all'
    if (filterChannel === 'email') return n.email === filterStatus || filterStatus === 'all'
    if (filterStatus === 'all') return true
    return n.sms === filterStatus || n.email === filterStatus
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500">Track SMS and email delivery across all incidents</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Sent" value={totalSent} icon="📤" color="text-green-600" />
        <SummaryCard label="Failed" value={totalFailed} icon="❌" color="text-red-600" />
        <SummaryCard label="SMS Failed" value={smsFailed} icon="📱" color="text-orange-600" />
        <SummaryCard label="Email Failed" value={emailFailed} icon="📧" color="text-orange-600" />
      </div>

      {/* Failed alerts banner */}
      {totalFailed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm text-red-800">
            <strong>{totalFailed} notification(s)</strong> failed to deliver. Check the log below and follow up manually if needed.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterChannel}
          onChange={e => setFilterChannel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Channels</option>
          <option value="sms">SMS Only</option>
          <option value="email">Email Only</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Notification Log */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {/* TODO: Replace the mock record count with the total number of delivery log records returned by the backend API. */}
            Delivery Log — {filtered.length} records
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No notifications match your filters.
            </div>
          ) : (
            <>
              {/* TODO: Ensure notification records are rendered from backend-loaded state once API integration is complete. */}
              {filtered.map(n => (
                <div key={n.id} className="px-4 py-4 flex items-start gap-4">
                  <span className="text-xl mt-0.5">{typeIcons[n.type]}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{n.incidentTitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      👤 {n.recipientName} · 📧 {n.recipientEmail} · 📱 {n.recipientPhone}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">🕐 {n.timestamp}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[n.sms]}`}>
                      📱 SMS {n.sms}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[n.email]}`}>
                      📧 Email {n.email}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

    </div>
  )
}

function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="mb-1">{icon}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}