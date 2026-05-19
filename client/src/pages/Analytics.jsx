import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { analyticsAPI } from '../api/client'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#9ca3af', '#f97316']

export default function Analytics() {
  const { isAdmin, isCompanyAdmin, userRole, authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({
    totalIncidents: 0,
    resolvedCount: 0,
    avgResponseTime: 0,
    avgAckTime: 0,
    failedAlerts: 0,
    thisWeekIncidents: 0,
    unacknowledgedCount: 0,
  })
  const [incidentsByType, setIncidentsByType] = useState([])
  const [statusBreakdown, setStatusBreakdown] = useState([])
  const [locationData, setLocationData] = useState([])
  const [incidentsByDay, setIncidentsByDay] = useState([])
  const [responseTimeData, setResponseTimeData] = useState([])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await analyticsAPI.all()
      setSummary(data.summary || {})
      setIncidentsByType(data.incidentsByType || [])
      setStatusBreakdown(data.statusBreakdown || [])
      setLocationData(data.locationData || [])
      setIncidentsByDay(data.incidentsByDay || [])
      setResponseTimeData(data.responseTimeData || [])
    } catch (err) {
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    fetchAnalytics()
  }, [isAdmin])

  if (authLoading || userRole === null) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500 text-center py-12">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500 text-center py-12">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-1">Failed to load analytics data</p>
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Operational insights</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className={`grid gap-4 mb-6 ${isCompanyAdmin ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
        <SummaryCard label="Total Incidents" value={summary.totalIncidents?.toString() || '0'} icon="🚨" color="text-gray-700" />
        <SummaryCard label="Resolved" value={summary.resolvedCount?.toString() || '0'} icon="✅" color="text-green-600" />
        {isCompanyAdmin && (
          <SummaryCard label="Avg Response" value={`${summary.avgResponseTime || 0}m`} icon="⏱️" color="text-blue-600" />
        )}
        {isCompanyAdmin && (
          <SummaryCard label="Failed Alerts" value={(summary.failedAlerts ?? 0).toString()} icon="❌" color="text-red-600" />
        )}
        <SummaryCard label="This Week" value={summary.thisWeekIncidents?.toString() || '0'} icon="📅" color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ChartPanel title="Incidents by Type">
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
            <EmptyChart />
          )}
        </ChartPanel>

        <ChartPanel title="Status Breakdown">
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusBreakdown.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>
      </div>

      <div className={`grid grid-cols-1 gap-4 mb-4 ${isCompanyAdmin ? 'md:grid-cols-2' : ''}`}>
        {isCompanyAdmin && (
          <ChartPanel title="Response & Resolution Time (minutes)" helper="Avg time from incident creation to acknowledgement vs full resolution">
            {responseTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={responseTimeData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => [
                    `${value} min`,
                    name === 'avgAckMinutes' ? 'Avg Acknowledgement' : 'Avg Resolution',
                  ]} />
                  <Legend formatter={value => value === 'avgAckMinutes' ? 'Avg Acknowledgement Time' : 'Avg Resolution Time'} />
                  <Line type="monotone" dataKey="avgAckMinutes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avgResolutionMinutes" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </ChartPanel>
        )}

        <ChartPanel title="Incidents by Location">
          {locationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={getTopLocations(locationData)} dataKey="count" nameKey="location" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {getTopLocations(locationData).map((entry, index) => (
                    <Cell key={index} fill={entry.location === 'Others' ? '#ec4899' : PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>
      </div>

      <ChartPanel title="Incidents This Week by Day">
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
          <EmptyChart />
        )}
      </ChartPanel>
    </div>
  )
}

function getTopLocations(locationData) {
  const sorted = [...locationData].sort((a, b) => b.count - a.count)
  const top5 = sorted.slice(0, 5)
  const othersTotal = sorted.slice(5).reduce((sum, d) => sum + d.count, 0)
  return othersTotal > 0 ? [...top5, { location: 'Others', count: othersTotal }] : top5
}

function ChartPanel({ title, helper, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="font-semibold text-gray-900 mb-1">{title}</h2>
      {helper && <p className="text-xs text-gray-400 mb-3">{helper}</p>}
      {children}
    </div>
  )
}

function EmptyChart() {
  return <p className="text-gray-400 text-center py-10">No data available</p>
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
