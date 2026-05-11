export default function QuickViewStrip({ incidents }) {
  const unacked = incidents.filter(i => i.status === 'triggered').length
  const critical = incidents.filter(i => i.priority === 'critical').length
  const notificationsToday = incidents.filter(i => {
    const today = new Date().toDateString()
    const incidentDate = new Date(i.timestamp || Date.now()).toDateString()
    return incidentDate === today
  }).length

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
        <div className="text-xs text-red-600 font-semibold uppercase mb-1">Active Incidents</div>
        <div className="text-3xl font-bold text-red-700">{incidents.filter(i => i.status !== 'archived' && i.status !== 'resolved').length}</div>
        <div className="text-xs text-red-600 mt-1">{critical} critical</div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
        <div className="text-xs text-orange-600 font-semibold uppercase mb-1">Unacknowledged</div>
        <div className="text-3xl font-bold text-orange-700">{unacked}</div>
        <div className="text-xs text-orange-600 mt-1">awaiting response</div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
        <div className="text-xs text-blue-600 font-semibold uppercase mb-1">Notifications Today</div>
        <div className="text-3xl font-bold text-blue-700">{notificationsToday}</div>
        <div className="text-xs text-blue-600 mt-1">sent to staff</div>
      </div>
    </div>
  )
}
