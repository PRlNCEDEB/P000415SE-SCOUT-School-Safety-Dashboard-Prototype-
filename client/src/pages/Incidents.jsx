import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIncidents } from '../api/client'

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

export default function Incidents({ incidents }) {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadIncidents() {
      setLoading(true)
      setError('')

      try {
        const records = await getIncidents()

        if (isActive) {
          setIncidents(records)
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
  }, [])

  const filtered = incidents.filter(i => {
    const matchStatus = filterStatus === 'all' || i.status === filterStatus
    const matchPriority = filterPriority === 'all' || i.priority === filterPriority
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.location.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchPriority && matchSearch
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Log</h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading incidents...' : `${incidents.length} total incidents`}
          </p>
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          ➕ Submit Alert
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-56"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Statuses</option>
          <option value="triggered">Triggered</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading incidents...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No incidents found.</div>
        ) : (
          filtered.map(i => (
            <div
              key={i.id}
              onClick={() => navigate(`/incidents/${i.id}`)}
              className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{typeIcons[i.type]}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{i.title}</p>
                <p className="text-xs text-gray-500">{i.location} · {i.timestamp} · {i.triggeredByName}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[i.priority]}`}>
                {i.priority}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[i.status]}`}>
                {i.status}
              </span>
              <span className="text-gray-400">›</span>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
