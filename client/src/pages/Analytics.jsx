import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { analyticsAPI } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#9ca3af']

export default function Analytics() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data states
  const [summary, setSummary] = useState({
    totalIncidents: 0,
    resolvedCount: 0,
    avgResponseTime: 0,
    thisWeekIncidents: 0,
  })
  const [incidentsByType, setIncidentsByType] = useState([])
  const [statusBreakdown, setStatusBreakdown] = useState([])
  const [locationData, setLocationData] = useState([])
  const [incidentsByDay, setIncidentsByDay] = useState([])
  const [responseTimeData, setResponseTimeData] = useState([])

  // Fetch all analytics data
  useEffect(() => {
    if (!isAdmin) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await analyticsAPI.all()

        setSummary(data.summary)
        setIncidentsByType(data.incidentsByType)
        setStatusBreakdown(data.statusBreakdown)
        setLocationData(data.locationData)
        setIncidentsByDay(data.incidentsByDay)
        setResponseTimeData(data.responseTimeData)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()

    // Set up polling for live updates every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-20 text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-10">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Access</h2>
          <p className="text-sm text-gray-500">
            The Analytics page is only available to Admin users.
            Contact your Safety Manager if you need access.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p>⚠️ {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Live operational insights from Firestore</p>
        </div>
        <div className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
          ✓ Live updates
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total Incidents"
          value={summary.totalIncidents.toString()}
          icon="🚨"
          color="text-gray-700"
        />
        <SummaryCard
          label="Resolved"
          value={summary.resolvedCount.toString()}
          icon="✅"
          color="text-green-600"
        />
        <SummaryCard
          label="Avg Response"
          value={`${summary.avgResponseTime}m`}
          icon="⏱️"
          color="text-blue-600"
        />
        <SummaryCard
          label="This Week"
          value={summary.thisWeekIncidents.toString()}
          icon="📅"
          color="text-orange-600"
        />
      </div>

      {/* Row 1 — Bar + Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Incidents by Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Incidents by Type</h2>
          {incidentsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidentsByType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Breakdown</h2>
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusBreakdown.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

      </div>

      {/* Row 2 — Line + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Avg Response Time Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Avg Response Time (minutes)</h2>
          {responseTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={responseTimeData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgMinutes"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

        {/* Incidents by Location */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Incidents by Location</h2>
          {locationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={locationData} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="location" type="category" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-10">No data available</p>
          )}
        </div>

      </div>

      {/* Row 3 — Daily trend */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Incidents This Week by Day</h2>
        {incidentsByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incidentsByDay} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="incidents" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">No data available</p>
        )}
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
