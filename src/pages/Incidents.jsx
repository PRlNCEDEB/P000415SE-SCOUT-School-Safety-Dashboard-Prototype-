import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

const ACTIVE_STATUSES = ['triggered', 'acknowledged', 'in-progress']

export default function Incidents({ incidents, isLoading, error }) {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterPriority, setFilterPriority] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => incidents.filter((incident) => {
    const matchesStatus = filterStatus === 'active'
      ? ACTIVE_STATUSES.includes(incident.status)
      : filterStatus === 'all' || incident.status === filterStatus

    const matchesPriority = filterPriority === 'all' || incident.priority === filterPriority

    const keyword = search.trim().toLowerCase()
    const matchesSearch = !keyword || [incident.title, incident.type, incident.location, incident.status]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    return matchesStatus && matchesPriority && matchesSearch
  }), [incidents, filterPriority, filterStatus, search])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Incidents</h1>
          <p className="text-sm text-gray-500">{filtered.length} incidents shown</p>
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          ➕ Submit Alert
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-56"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="active">Active only</option>
          <option value="all">All statuses</option>
          <option value="triggered">Triggered</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading incidents...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No incidents found.</div>
        ) : (
          filtered.map((incident) => (
            <div
              key={incident.id}
              onClick={() => navigate(`/incidents/${incident.id}`)}
              className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{typeIcons[incident.type]}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{incident.title}</p>
                <p className="text-xs text-gray-500">
                  {incident.location} · {incident.timestamp} · {incident.triggeredByName}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[incident.priority]}`}>
                {incident.priority}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[incident.status]}`}>
                {incident.status}
              </span>
              <span className="text-gray-400">›</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
