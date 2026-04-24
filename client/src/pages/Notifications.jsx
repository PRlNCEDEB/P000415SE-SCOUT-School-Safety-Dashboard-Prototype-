import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI } from '../api/client'

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
  const { isAdmin, currentUser } = useAuth()
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await notificationsAPI.list()
      setNotifications(data)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch once on mount — no polling (saves ~24,000 Firestore reads/hour)
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Admin sees all, user sees only their own
  const visibleNotifications = isAdmin
    ? notifications
    : notifications.filter(n => n.recipientEmail === currentUser?.email)

  const totalSent = visibleNotifications.filter(
    n => n.sms === 'sent' || n.email === 'sent'
  ).length
  const totalFailed = visibleNotifications.filter(
    n => n.sms === 'failed' || n.email === 'failed'
  ).length
  const smsFailed = visibleNotifications.filter(n => n.sms === 'failed').length
  const emailFailed = visibleNotifications.filter(n => n.email === 'failed').length

  const filtered = visibleNotifications.filter(n => {
    if (filterChannel === 'sms') return n.sms === filterStatus || filterStatus === 'all'
    if (filterChannel === 'email') return n.email === filterStatus || filterStatus === 'all'
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

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {isAdmin
              ? 'Track SMS and email delivery across all incidents'
              : 'Your personal notification history'}
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* User info banner */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2 mb-6">
          <span>ℹ️</span>
          <p className="text-sm text-blue-800">
            You are viewing your personal notification history only.
            Admins can see all delivery logs across the system.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Sent" value={totalSent} icon="📤" color="text-green-600" />
        <SummaryCard label="Failed" value={totalFailed} icon="❌" color="text-red-600" />
        <SummaryCard label="SMS Failed" value={smsFailed} icon="📱" color="text-orange-600" />
        <SummaryCard label="Email Failed" value={emailFailed} icon="📧" color="text-orange-600" />
      </div>

      {/* Failed alerts banner — admin only */}
      {isAdmin && totalFailed > 0 && (
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
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Delivery Log — {filtered.length} records
          </p>
          {!isAdmin && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Personal view only
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

                {/* Icon */}
                <span className="text-xl mt-0.5">{typeIcons[n.type]}</span>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{n.incidentTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    👤 {n.recipientName} · 📧 {n.recipientEmail}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">🕐 {n.timestamp}</p>
                </div>

                {/* Channel statuses */}
                <div className="flex flex-col gap-1.5 shrink-0 items-end">
                  <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[n.sms]}`}>
                    📱 SMS {n.sms}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[n.email]}`}>
                    📧 Email {n.email}
                  </span>
                </div>

              </div>
            ))
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
