import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
// TODO: Replace mock incident lookup with backend fetch by incident ID.
import { incidents } from '../data/mockData'

const priorityColors = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

const statusColors = {
  triggered: 'bg-red-100 text-red-700',
  acknowledged: 'bg-blue-100 text-blue-700',
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

const nextStatus = {
  triggered: 'acknowledged',
  acknowledged: 'resolved',
  resolved: 'archived',
}

const nextLabel = {
  triggered: 'Acknowledge',
  acknowledged: 'Mark Resolved',
  resolved: 'Archive',
}

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const found = incidents.find(i => i.id === id)
  // TODO: Replace local-only status state with backend-backed incident status updates.
  const [status, setStatus] = useState(found?.status)
  // TODO: Add loading and error handling for backend incident fetch states.
  if (!found) {
    return (
      <div className="p-6 text-center text-gray-500">
        Incident not found.{' '}
        <button onClick={() => navigate('/incidents')} className="text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate('/incidents')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← Back to Incidents
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeIcons[found.type]}</span>
            <h1 className="text-xl font-bold text-gray-900">{found.title}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[found.priority]}`}>
              {found.priority}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[status]}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Location</p>
            <p className="text-gray-800">📍 {found.location}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Time</p>
            <p className="text-gray-800">🕐 {found.timestamp}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Reported by</p>
            <p className="text-gray-800">👤 {found.triggeredByName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Type</p>
            <p className="text-gray-800 capitalize">{found.type}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
        <p className="text-sm text-gray-600">
          {found.description || 'No additional description provided for this incident.'}
        </p>
      </div>

      {/* Notification Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Notification Delivery</h2>
        {found.notifications && found.notifications.length > 0 ? (
          <div className="space-y-2">
            {found.notifications.map((n, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{n.recipientName}</span>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${n.sms === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    SMS {n.sms}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${n.email === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Email {n.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No notification records found.</p>
        )}
      </div>

      {/* Action Button */}
      {nextStatus[status] && (
        <button
        // TODO: Persist status transition to backend before updating the UI.
        // const handleStatusUpdate = async () => {
        // call backend
        // update UI on success
        // show error on failure
        //}
          onClick={() => setStatus(nextStatus[status])}//onClick={handleStatusUpdate}
          className="w-full py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
        >
          {nextLabel[status]}
        </button>
      )}

      {status === 'archived' && (
        <div className="text-center text-sm text-gray-400 py-3">
          This incident has been archived.
        </div>
      )}

    </div>
  )
}