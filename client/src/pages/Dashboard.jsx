import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import QuickActions from '../components/QuickActions'
import ShortcutCard from '../components/ShortcutCard'
import QuickViewStrip from '../components/QuickViewStrip'
import SchoolAdminStatus from '../components/SchoolAdminStatus'
import { incidentAPI, settingsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

const priorityColors = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

const statusColors = {
  triggered: 'bg-red-100 text-red-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
}

const typeIcons = {
  medical: '🏥',
  behaviour: '⚠️',
  fire: '🔥',
  lockdown: '🔒',
  weather: '🌩️',
  maintenance: '🔧',
  general: '📢',
}

// ── Role badge used in the dashboard header ───────────────────────────────────
function RoleBadge({ role }) {
  const styles = {
    'Company Admin': 'bg-red-100 text-red-700',
    'School Admin':  'bg-purple-100 text-purple-700',
    'Staff':         'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[role] || 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  )
}

// ── Role-specific scope notice ────────────────────────────────────────────────
function ScopeNotice({ role }) {
  if (role === 'Company Admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-5 text-xs text-red-800">
        👁️ <strong>Company Admin view</strong> — you can see incidents across all schools in the network.
      </div>
    )
  }
  if (role === 'School Admin') {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 mb-5 text-xs text-purple-800">
        🏫 <strong>School Admin view</strong> — showing incidents for your school.
      </div>
    )
  }
  // Staff
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-5 text-xs text-blue-800">
      👤 <strong>Staff view</strong> — submit alerts and track incidents you are involved in.
    </div>
  )
}

function isTodayIncident(incident) {
  const rawDate = incident.createdAt || incident.updatedAt
  if (!rawDate) return false

  const incidentDate = new Date(rawDate)
  if (Number.isNaN(incidentDate.getTime())) return false

  const today = new Date()
  return incidentDate.getFullYear() === today.getFullYear() &&
    incidentDate.getMonth() === today.getMonth() &&
    incidentDate.getDate() === today.getDate()
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  const dayLabel = days === 1 ? 'day' : 'days'

  return remainingHours > 0 ? `${days} ${dayLabel} ${remainingHours} hr` : `${days} ${dayLabel}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, userRole, isCompanyAdmin, isSchoolAdmin, isStaff } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [overdueThresholdMinutes, setOverdueThresholdMinutes] = useState(15)

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true)
        const [data, settings] = await Promise.all([
          incidentAPI.list(),
          settingsAPI.get().catch(() => ({ overdueThresholdMinutes: 15 })),
        ])
        setIncidents(data)
        setOverdueThresholdMinutes(settings.overdueThresholdMinutes ?? 15)
      } catch (error) {
        console.error('Failed to fetch incidents:', error)
        setIncidents([])
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()
  }, [])

  const active  = incidents.filter(i => i.status !== 'archived' && i.status !== 'resolved')
  const unacked = active.filter(i => i.status === 'triggered')

  // Overdue: triggered incidents past the configured threshold
  function getElapsedMinutes(incident) {
    if (!incident.createdAt) return 0
    const created = new Date(incident.createdAt)
    if (Number.isNaN(created.getTime())) return 0
    return Math.floor((Date.now() - created.getTime()) / 60000)
  }
  const overdue = unacked.filter(i => getElapsedMinutes(i) > overdueThresholdMinutes)

  // Staff: show all their incidents (API already scopes to their own); School Admin: today's
  const recent      = incidents.filter(i => i.status !== 'triggered' && isTodayIncident(i))
  const recentToShow = isStaff ? incidents.slice(0, 10) : recent

  const displayName = currentUser?.displayName || currentUser?.name || currentUser?.email || 'there'

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500 text-center py-10">Loading incidents...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {userRole && <RoleBadge role={userRole} />}
          </div>
          <p className="text-sm text-gray-500">Welcome back, {displayName}</p>
        </div>
        {!isCompanyAdmin && (
        <button
          onClick={() => navigate('/submit')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          ➕ Submit Alert
        </button>
        )}
      </div>

      {/* ── Role scope notice ── */}
      <ScopeNotice role={userRole} />

      {/* ── Company Admin: Shortcut cards + Quick View Strip ── */}
      {isCompanyAdmin && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <ShortcutCard
              title="SCOUT Setup / Config"
              description="System configuration and global settings"
              to="/setup"
            />
            <ShortcutCard
              title="Live Operations"
              description="Manage incidents and responses"
              to="/incidents"
            />
            <ShortcutCard
              title="Data & Insights"
              description="Analytics and reporting"
              to="/analytics"
            />
          </div>

          <QuickViewStrip incidents={incidents} />
        </>
      )}

      {/* ── School Admin: High-level system status view ── */}
      {isSchoolAdmin && !isCompanyAdmin && (
        <SchoolAdminStatus incidents={incidents} />
      )}

      {/* ── Quick Actions (Staff & School Admin only, not Company Admin) ── */}
      {!isCompanyAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <QuickActions />
        </div>
      )}


      {/* ── Unacknowledged alerts ── */}
      {unacked.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            <h2 className="font-semibold text-gray-900">Unacknowledged Alerts</h2>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{unacked.length}</span>
            {overdue.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                ⏰ {overdue.length} overdue
              </span>
            )}
          </div>
          <div className="space-y-2">
            {unacked.map(incident => {
              const elapsedMinutes = getElapsedMinutes(incident)
              const isIncidentOverdue = elapsedMinutes > overdueThresholdMinutes
              return (
                <div
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className={`rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isIncidentOverdue
                      ? 'bg-amber-50 border border-amber-400 hover:bg-amber-100'
                      : 'bg-red-50 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  <span className="text-xs font-semibold text-gray-600">{typeIcons[incident.type] || '📢'}</span>
                  <div className="flex-1">
                    <p className={`text-sm ${isIncidentOverdue ? 'text-amber-900' : 'text-red-900'}`}>{incident.title}</p>
                    <p className={`text-xs ${isIncidentOverdue ? 'text-amber-700' : 'text-red-600'}`}>
                      {incident.location} - {incident.timestamp}
                      {isIncidentOverdue && ` · Unacknowledged for ${formatDuration(elapsedMinutes)}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[incident.priority]}`}>
                    {incident.priority}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[incident.status]}`}>
                    {incident.status}
                  </span>
                  {isIncidentOverdue && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
                      ⏰ Overdue
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent incidents ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">
            {isStaff ? 'My Activity' : "Today's Recent Incidents"}
          </h2>
          <button onClick={() => navigate('/incidents')} className="text-xs text-blue-600 hover:underline">
            View all
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {recentToShow.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No incidents found.</p>
          ) : (
            recentToShow.map(incident => (
              <div
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-600">{typeIcons[incident.type] || '📢'}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{incident.title}</p>
                  <p className="text-xs text-gray-500">{incident.location} - {incident.timestamp} - {incident.triggeredByName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[incident.priority]}`}>
                  {incident.priority}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[incident.status]}`}>
                  {incident.status}
                </span>
                <span className="text-gray-400">&gt;</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}


