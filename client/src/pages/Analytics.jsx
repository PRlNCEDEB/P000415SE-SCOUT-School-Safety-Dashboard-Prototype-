import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { analyticsAPI } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#9ca3af', '#f97316']

export default function Analytics() {
  const { isAdmin, isCompanyAdmin, userRole, authLoading } = useAuth()
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
  const [failedAlerts, setFailedAlerts] = useState({ total: 0, sms: 0, email: 0 })
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await analyticsAPI.all()
      setSummary(data.summary)
      setIncidentsByType(data.incidentsByType)
      setStatusBreakdown(data.statusBreakdown)
      setLocationData(data.locationData)
      setIncidentsByDay(data.incidentsByDay)
      setResponseTimeData(data.responseTimeData)
      setFailedAlerts(data.failedAlerts || { total: 0, sms: 0, email: 0 })
      setUnacknowledgedCount(data.summary?.unacknowledgedCount ?? 0)
    } catch (err) {
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch once on mount — no polling (saves ~2,280 Firestore reads/hour)
  useEffect(() => {
    if (!isAdmin) return
    fetchAnalytics()
  }, [isAdmin])

  // Wait for role to be resolved before deciding access.
  // userRole is null briefly after authLoading clears (backend fetch in flight).
  if (authLoading || userRole === null) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // RBAC guard — redirect Staff (non-admins) only once role is confirmed
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-1">⚠️ Failed to load analytics data</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
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
          <p className="text-sm text-gray-500">Operational insights</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className={`grid gap-4 mb-6 ${isCompanyAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
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
        {/* Avg Response: Company Admin only */}
        {isCompanyAdmin && (
          <SummaryCard
            label="Avg Response"
            value={`${summary.avgResponseTime}m`}
            icon="⏱️"
            color="text-blue-600"
          />
        )}
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={incidentsByType} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Status Breakdown</h2>
            {unacknowledgedCount > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                ⚠️ {unacknowledgedCount} unacknowledged
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                ✅ All acknowledged
              </span>
            )}
          </div>
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

      {/* Row 2 — Line (Company Admin only) + Bar */}
      <div className={`grid grid-cols-1 gap-4 mb-4 ${isCompanyAdmin ? 'md:grid-cols-2' : ''}`}>

        {/* Response & Resolution Time Trend — Company Admin only */}
        {isCompanyAdmin && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Response &amp; Resolution Time (minutes)</h2>
            <p className="text-xs text-gray-400 mb-3">Avg time from incident creation to acknowledgement vs full resolution</p>
            {responseTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={responseTimeData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => [
                    `${value} min`,
                    name === 'avgAckMinutes' ? 'Avg Acknowledgement' : 'Avg Resolution'
                  ]} />
                  <Legend formatter={(value) =>
                    value === 'avgAckMinutes' ? 'Avg Acknowledgement Time' : 'Avg Resolution Time'
                  } />
                  <Line
                    type="monotone"
                    dataKey="avgAckMinutes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgResolutionMinutes"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    strokeDasharray="5 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-10">No data available</p>
            )}
          </div>
        )}

        {/* Incidents by Location — Top 5 + Others donut */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Incidents by Location</h2>
          {locationData.length > 0 ? (() => {
            const sorted = [...locationData].sort((a, b) => b.count - a.count)
            const top5 = sorted.slice(0, 5)
            const othersTotal = sorted.slice(5).reduce((sum, d) => sum + d.count, 0)
            const chartData = othersTotal > 0 ? [...top5, { location: 'Others', count: othersTotal }] : top5
            return (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="location"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.location === 'Others' ? '#ec4899' : PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )
          })() : (
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

      {/* Row 4 — Failed Alerts (Company Admin only) */}
      {isCompanyAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Failed Alerts</h2>
            {failedAlerts.total > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                ❌ {failedAlerts.total} failed
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                ✅ No failures
              </span>
            )}
          </div>
          {failedAlerts.total > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[{ name: 'Failures', sms: failedAlerts.sms, email: failedAlerts.email }]}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sms" name="SMS Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="email" name="Email Failed" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">All notifications delivered successfully.</p>
          )}
        </div>
      )}

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
