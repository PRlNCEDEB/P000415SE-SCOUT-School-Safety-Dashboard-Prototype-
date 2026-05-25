import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI } from '../api/client'

const statusStyle = {
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  skipped: 'bg-gray-100 text-gray-600',
}

export default function Notifications() {
  const { isCompanyAdmin, isSchoolAdmin, authLoading, userRole } = useAuth()
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const canViewNotifications = isCompanyAdmin || isSchoolAdmin

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await notificationsAPI.list()
      setNotifications(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canViewNotifications) return
    fetchNotifications()
  }, [canViewNotifications])

  if (authLoading || userRole === null) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500 text-center py-10">Loading notifications...</p>
      </div>
    )
  }

  if (!canViewNotifications) {
    return <Navigate to="/dashboard" replace />
  }

  const visibleNotifications = notifications
  const totalSent = visibleNotifications.filter(n => n.sms === 'sent' || n.email === 'sent').length
  const totalFailed = visibleNotifications.filter(n => n.sms === 'failed' || n.email === 'failed').length
  const smsFailed = visibleNotifications.filter(n => n.sms === 'failed').length
  const emailFailed = visibleNotifications.filter(n => n.email === 'failed').length

  const filtered = visibleNotifications.filter(n => {
    if (filterChannel === 'sms') return filterStatus === 'all' || n.sms === filterStatus
    if (filterChannel === 'email') return filterStatus === 'all' || n.email === filterStatus
    if (filterStatus === 'all') return true
    return n.sms === filterStatus || n.email === filterStatus
  })

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500 text-center py-10">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {isCompanyAdmin
              ? 'Track SMS and email delivery across all schools'
              : 'Track SMS and email delivery for your school'}
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Sent" value={totalSent} icon="📥" color="text-green-600" />
        <SummaryCard label="Failed" value={totalFailed} icon="❌" color="text-red-600" />
        <SummaryCard label="SMS Failed" value={smsFailed} icon="📱" color="text-orange-600" />
        <SummaryCard label="Email Failed" value={emailFailed} icon="📧" color="text-orange-600" />
      </div>

      {totalFailed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-red-800">
            <strong>{totalFailed} notification(s)</strong> failed to deliver. Check the log below and follow up manually if needed.
          </p>
        </div>
      )}

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
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Delivery Log - {filtered.length} records
          </p>
          {isSchoolAdmin && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              School view only
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No notifications match your filters.
            </div>
          ) : (
            filtered.map(n => (
              <div key={n.id} className="px-4 py-4 flex items-start gap-4">
                <span className="mt-0.5 text-lg">{getTypeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{n.incidentTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    👤 {n.recipientName} · 📧 {n.recipientEmail}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    🕐 {formatTimestamp(n.timestamp)}
                    {n.schoolName ? ` - ${n.schoolName}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0 items-end">
                  <StatusBadge label="SMS" status={n.sms} />
                  <StatusBadge label="Email" status={n.email} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function getTypeIcon(type) {
  const icons = {
    medical: '🚑',
    behaviour: '⚠️',
    fire: '🔥',
    lockdown: '🔒',
    weather: '🌊',
    maintenance: '🛠️',
    general: '🔔',
    'natural disaster': '🌊',
    naturaldisaster: '🌊',
  }
  return icons[String(type || '').toLowerCase().replace(/\s/g, '')] ||
    icons[String(type || '').toLowerCase()] ||
    '🔔'
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown time'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return date.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function StatusBadge({ label, status = 'pending' }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[status] || statusStyle.pending}`}>
      {label === 'SMS' ? '📱' : '📧'} {label} {status}
    </span>
  )
}

function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="mb-2 text-sm">{icon}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
