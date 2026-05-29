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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PIE_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#9ca3af', '#f97316']

const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

export default function Analytics() {
  const { isSchoolAdmin, userSchoolName, authLoading, userRole } = useAuth()
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
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0)
  const [incidentsByPriority, setIncidentsByPriority] = useState([])
  const [failedAlerts, setFailedAlerts] = useState({ total: 0, sms: 0, email: 0 })

  const [trendsRange, setTrendsRange] = useState('week')
  const [trendsData, setTrendsData] = useState(null)
  const [trendsLoading, setTrendsLoading] = useState(false)
  const [trendsError, setTrendsError] = useState(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await analyticsAPI.all()
      setSummary(data.summary || {})
      setIncidentsByType(data.incidentsByType || [])
      setStatusBreakdown(data.statusBreakdown || [])
      setLocationData(data.locationData || [])
      setUnacknowledgedCount(data.summary?.unacknowledgedCount ?? 0)
      setIncidentsByPriority(data.incidentsByPriority || [])
      setFailedAlerts(data.failedAlerts || { total: 0, sms: 0, email: 0 })
    } catch (err) {
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSchoolAdmin) return
    fetchAnalytics()
  }, [isSchoolAdmin])

  useEffect(() => {
    if (!isSchoolAdmin) return
    let isActive = true

    async function loadTrends() {
      setTrendsLoading(true)
      setTrendsError(null)
      try {
        const data = await analyticsAPI.trends(trendsRange)
        if (isActive) setTrendsData(data)
      } catch (err) {
        if (isActive) setTrendsError(err.message || 'Failed to load trend data')
      } finally {
        if (isActive) setTrendsLoading(false)
      }
    }

    loadTrends()
    return () => { isActive = false }
  }, [isSchoolAdmin, trendsRange])

  if (authLoading || userRole === null) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500 text-center py-12">Loading...</p>
      </div>
    )
  }

  if (!isSchoolAdmin) {
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
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── School scope banner ── */}
      {userSchoolName && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 mb-6 text-xs text-purple-800">
          <strong>Scoped to {userSchoolName}</strong> — all figures below reflect your school only.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total Incidents" value={summary.totalIncidents?.toString() || '0'} color="text-gray-700" />
        <SummaryCard label="Resolved"        value={summary.resolvedCount?.toString() || '0'} color="text-green-600" />
        <SummaryCard label="This Week"       value={summary.thisWeekIncidents?.toString() || '0'} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ChartPanel title="Incidents by Type">
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
            <EmptyChart />
          )}
        </ChartPanel>

        <ChartPanel title="Status Breakdown">
          <div className="flex items-center justify-end mb-2">
            {unacknowledgedCount > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                {unacknowledgedCount} unacknowledged
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                All acknowledged
              </span>
            )}
          </div>
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

      <ChartPanel title="Incidents by Location" className="mb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartPanel title="Incidents by Priority" helper="Total incidents across all statuses grouped by severity">
          {incidentsByPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                layout="vertical"
                data={incidentsByPriority}
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="priority" tick={{ fontSize: 12 }} width={65} />
                <Tooltip formatter={value => [value, 'Incidents']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {incidentsByPriority.map(entry => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>

        <ChartPanel title="Failed Alerts">
          <div className="mb-4 flex justify-end">
            {failedAlerts.total > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                {failedAlerts.total} failed
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                No failures
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
        </ChartPanel>
      </div>

      {/* ── Incident Trends ───────────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Incident Trends</h2>
            <p className="text-xs text-gray-400">Identify patterns by time of day, day of week, and volume over time</p>
          </div>
          <div className="flex items-center gap-2">
            {trendsLoading && <span className="text-xs text-gray-400">Updating...</span>}
            <select
              value={trendsRange}
              onChange={e => setTrendsRange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="week">This Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {trendsError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-sm text-red-600">
            {trendsError}
          </div>
        ) : (
          <>
            <ChartPanel
              title="Incidents Over Time"
              helper={
                trendsRange === 'week' ? 'Daily totals for the last 7 days'
                : trendsRange === 'month' ? 'Weekly totals for the last month'
                : trendsRange === 'quarter' ? 'Monthly totals for the last 3 months'
                : trendsRange === 'year' ? 'Monthly totals for the last 12 months'
                : 'All incidents grouped by month'
              }
            >
              {trendsLoading || !trendsData ? (
                <div className="py-10 text-center text-sm text-gray-400">{trendsLoading ? 'Loading...' : 'No data'}</div>
              ) : trendsData.incidentsByPeriod.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendsData.incidentsByPeriod} margin={{ top: 0, right: 10, left: -20, bottom: trendsRange === 'week' ? 40 : 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      angle={trendsRange === 'week' ? -35 : 0}
                      textAnchor={trendsRange === 'week' ? 'end' : 'middle'}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={value => [value, 'Incidents']} />
                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <ChartPanel
                title="Incidents by Day of Week"
                helper="Which days consistently see the most incidents"
              >
                {trendsLoading || !trendsData ? (
                  <div className="py-10 text-center text-sm text-gray-400">{trendsLoading ? 'Loading...' : 'No data'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendsData.incidentsByDayOfWeek} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip formatter={value => [value, 'Incidents']} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartPanel>

              <ChartPanel
                title="Incidents by Hour of Day"
                helper="When during the day incidents are most likely to occur"
              >
                {trendsLoading || !trendsData ? (
                  <div className="py-10 text-center text-sm text-gray-400">{trendsLoading ? 'Loading...' : 'No data'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendsData.incidentsByHour} margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 9 }}
                        angle={-45}
                        textAnchor="end"
                        interval={1}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip formatter={value => [value, 'Incidents']} />
                      <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartPanel>
            </div>

            {trendsData && (
              <p className="text-xs text-gray-400 text-right mt-2">
                {trendsData.totalInRange} incident{trendsData.totalInRange !== 1 ? 's' : ''} in selected range
              </p>
            )}
          </>
        )}
      </div>

    </div>
  )
}

function getTopLocations(locationData) {
  const sorted = [...locationData].sort((a, b) => b.count - a.count)
  const top5 = sorted.slice(0, 5)
  const othersTotal = sorted.slice(5).reduce((sum, d) => sum + d.count, 0)
  return othersTotal > 0 ? [...top5, { location: 'Others', count: othersTotal }] : top5
}

function ChartPanel({ title, helper, className = '', children }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}>
      <h2 className="font-semibold text-gray-900 mb-1">{title}</h2>
      {helper && <p className="text-xs text-gray-400 mb-3">{helper}</p>}
      {children}
    </div>
  )
}

function EmptyChart() {
  return <p className="text-gray-400 text-center py-10">No data available</p>
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
