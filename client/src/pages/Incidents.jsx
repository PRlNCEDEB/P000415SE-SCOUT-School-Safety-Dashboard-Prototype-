import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIncidents, settingsAPI } from '../api/client'
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

// Active statuses — what "active" view means
const ACTIVE_STATUSES = ['triggered', 'acknowledged', 'in-progress']

// Returns true when a triggered incident has exceeded the overdue threshold
function isOverdue(incident, thresholdMinutes) {
  if (incident.status !== 'triggered') return false
  if (!incident.createdAt) return false

  const created = new Date(incident.createdAt)
  if (Number.isNaN(created.getTime())) return false

  const elapsedMs = Date.now() - created.getTime()
  return elapsedMs > thresholdMinutes * 60 * 1000
}

export default function Incidents() {
  const navigate = useNavigate()
  const { userRole, authLoading } = useAuth()
  const { isCompanyAdmin, isSchoolAdmin } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterSchool, setFilterSchool] = useState('all')
  const [search, setSearch] = useState('')

  // Overdue threshold (minutes), loaded from settings API
  const [overdueThresholdMinutes, setOverdueThresholdMinutes] = useState(15)

  useEffect(() => {
    if (authLoading || userRole === null) return

    let isActive = true

    async function loadIncidents() {
      setLoading(true)
      setError('')

      try {
        const [records, settings] = await Promise.all([
          getIncidents(),
          settingsAPI.get().catch(() => ({ overdueThresholdMinutes: 15 })),
        ])

        if (isActive) {
          setIncidents(records)
          setOverdueThresholdMinutes(settings.overdueThresholdMinutes ?? 15)
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Failed to load incidents.')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadIncidents()

    return () => {
      isActive = false
    }
  }, [authLoading, userRole])

  // Wait for role to resolve before deciding access
  if (authLoading || userRole === null) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12"><p className="text-gray-500">Loading...</p></div>
      </div>
    )
  }

  const schoolOptions = useMemo(() => {
    const options = new Map()

    incidents.forEach(incident => {
      if (incident.schoolId) {
        options.set(incident.schoolId, incident.schoolName || incident.schoolId)
      }
    })

    return [...options.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [incidents])

  const schoolAdminSchoolName = useMemo(() => {
    if (!isSchoolAdmin || isCompanyAdmin) return null

    const incidentWithSchool = incidents.find(incident => incident.schoolName)
    return incidentWithSchool?.schoolName || null
  }, [incidents, isCompanyAdmin, isSchoolAdmin])

  const filtered = incidents.filter(incident => {
    const searchTerm = search.trim().toLowerCase()
    const searchableText = [
      incident.title,
      incident.location,
      incident.triggeredByName,
      incident.schoolName,
      incident.schoolId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
          ? ACTIVE_STATUSES.includes(incident.status)
          : incident.status === filterStatus
    const matchPriority = filterPriority === 'all' || incident.priority === filterPriority
    const matchSchool = !isCompanyAdmin || filterSchool === 'all' || incident.schoolId === filterSchool
    const matchSearch = !searchTerm || searchableText.includes(searchTerm)

    return matchStatus && matchPriority && matchSchool && matchSearch
  })

  const activeCount = incidents.filter(i => ACTIVE_STATUSES.includes(i.status)).length

  const subtitleText = loading
    ? 'Loading incidents...'
    : filterStatus === 'active'
      ? `${activeCount} active incident${activeCount !== 1 ? 's' : ''}`
      : `${filtered.length} of ${incidents.length} incidents`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Log</h1>
          <p className="text-sm text-gray-500">{subtitleText}</p>
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

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-56"
        />
        <select
          value={filterStatus}
          onChange={event => setFilterStatus(event.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="active">Active Incidents</option>
          <option value="all">All Incidents</option>
          <option value="triggered">Triggered</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filterPriority}
          onChange={event => setFilterPriority(event.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {isCompanyAdmin && (
          <select
            value={filterSchool}
            onChange={event => setFilterSchool(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Schools</option>
            {schoolOptions.map(school => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading incidents...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No incidents found.</div>
        ) : (
          filtered.map(incident => {
            const overdue = isOverdue(incident, overdueThresholdMinutes)

            return (
              <div
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                  overdue ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-400' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{typeIcons[incident.type] || '📢'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{incident.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {incident.location} · {incident.timestamp} · {incident.triggeredByName}
                    {isCompanyAdmin && incident.schoolName ? ` · ${incident.schoolName}` : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[incident.priority]}`}>
                  {incident.priority}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[incident.status]}`}>
                  {incident.status}
                </span>
                {overdue && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
                    ⏰ Overdue
                  </span>
                )}
                {!overdue && incident.acknowledgedBy && incident.acknowledgedBy.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                    ✅ Responded
                  </span>
                )}
                <span className="text-gray-400">›</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
