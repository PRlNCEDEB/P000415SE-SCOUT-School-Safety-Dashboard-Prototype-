import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import QuickActions from '../components/QuickActions'
import { incidentAPI } from '../api/client'
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

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, userRole, isCompanyAdmin, isSchoolAdmin, isStaff } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true)
        const data = await incidentAPI.list()
        setIncidents(data)
      } catch (error) {
        console.error('Failed to fetch incidents:', error)
        setIncidents([])
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()

  }, [])

  const active   = incidents.filter(i => i.status !== 'archived' && i.status !== 'resolved')
  const critical = active.filter(i => i.priority === 'critical').length
  const high     = active.filter(i => i.priority === 'high').length
  const unacked  = active.filter(i => i.status === 'triggered')
  const recent   = incidents.filter(i => i.status !== 'triggered')

  // Staff see only the last 5 recent incidents for a simplified view
  const recentToShow = isStaff ? recent.slice(0, 5) : recent

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
        <button
          onClick={() => navigate('/submit')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          ➕ Submit Alert
        </button>
      </div>

      {/* ── Role scope notice ── */}
      <ScopeNotice role={userRole} />

      {/* ── Quick Actions (Company Admin & School Admin only) ── */}
      {!isStaff && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <QuickActions />
        </div>
      )}

      {/* ── Summary stats (Company Admin & School Admin see all 4; Staff sees simplified 2) ── */}
      {isStaff ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Active Incidents" value={active.length} color="text-gray-700" icon="🚨" />
          <StatCard label="Unacknowledged"   value={unacked.length} color="text-red-600"  icon="⏳" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Active Incidents" value={active.length}   color="text-gray-700"   icon="🚨" />
          <StatCard label="Critical"         value={critical}        color="text-red-600"    icon="⚡" />
          <StatCard label="High Priority"    value={high}            color="text-orange-600" icon="🚩" />
          <StatCard label="Avg Response"     value="4.2m"            color="text-blue-600"   icon="⏱️" />
        </div>
      )}

      {/* ── Unacknowledged alerts ── */}
      {unacked.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            <h2 className="font-semibold text-gray-900">Unacknowledged Alerts</h2>
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{unacked.length}</span>
          </div>
          <div className="space-y-2">
            {unacked.map(incident => (
              <div
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-600">{typeIcons[incident.type] || '📢'}</span>
                <div className="flex-1">
                  <p className="text-sm text-red-900">{incident.title}</p>
                  <p className="text-xs text-red-600">{incident.location} - {incident.timestamp}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[incident.priority]}`}>
                  {incident.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent incidents ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">
            {isStaff ? 'Recent Incidents' : 'All Recent Incidents'}
          </h2>
          <button onClick={() => navigate('/incidents')} className="text-xs text-blue-600 hover:underline">
            View all
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {recentToShow.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No recent incidents.</p>
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

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="mb-1 text-xs font-semibold text-gray-500">{icon}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
