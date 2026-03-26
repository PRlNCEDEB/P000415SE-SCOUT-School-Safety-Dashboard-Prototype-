import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const incidentsByType = [
  { type: 'Medical', count: 12 },
  { type: 'Fire', count: 5 },
  { type: 'Lockdown', count: 3 },
  { type: 'Behaviour', count: 9 },
  { type: 'Weather', count: 2 },
  { type: 'Maintenance', count: 6 },
  { type: 'General', count: 4 },
]

const incidentsByDay = [
  { day: 'Mon', incidents: 4 },
  { day: 'Tue', incidents: 7 },
  { day: 'Wed', incidents: 3 },
  { day: 'Thu', incidents: 8 },
  { day: 'Fri', incidents: 5 },
]

const responseTimeData = [
  { week: 'Week 1', avgMinutes: 6.2 },
  { week: 'Week 2', avgMinutes: 5.1 },
  { week: 'Week 3', avgMinutes: 4.8 },
  { week: 'Week 4', avgMinutes: 4.2 },
]

const statusBreakdown = [
  { name: 'Resolved', value: 28 },
  { name: 'Acknowledged', value: 8 },
  { name: 'Triggered', value: 5 },
  { name: 'Archived', value: 10 },
]

const PIE_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#9ca3af']

const locationData = [
  { location: 'Oval', count: 8 },
  { location: 'Canteen', count: 6 },
  { location: 'Block B', count: 5 },
  { location: 'Main Building', count: 9 },
  { location: 'Cafeteria', count: 4 },
  { location: 'Car Park', count: 3 },
]

export default function Analytics() {
  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Operational insights from incident data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Incidents" value="51" icon="🚨" color="text-gray-700" />
        <SummaryCard label="Resolved" value="28" icon="✅" color="text-green-600" />
        <SummaryCard label="Avg Response" value="4.2m" icon="⏱️" color="text-blue-600" />
        <SummaryCard label="This Week" value="12" icon="📅" color="text-orange-600" />
      </div>

      {/* Row 1 — Bar + Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Incidents by Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Incidents by Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incidentsByType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Breakdown</h2>
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
        </div>

      </div>

      {/* Row 2 — Line + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Avg Response Time Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Avg Response Time (minutes)</h2>
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
        </div>

        {/* Incidents by Location */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Incidents by Location</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={locationData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="location" type="category" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Row 3 — Daily trend full width */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Incidents This Week by Day</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={incidentsByDay} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="incidents" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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