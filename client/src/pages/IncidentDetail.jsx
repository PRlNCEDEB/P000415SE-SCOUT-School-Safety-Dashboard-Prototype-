import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getIncidentById, incidentAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

const progressSteps = [
  { key: 'triggered', label: 'Unacknowledged' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
]

const statusStepIndex = {
  triggered: 0,
  acknowledged: 1,
  'in-progress': 2,
  resolved: 3,
  archived: 3,
}

function normalizeUsers(list) {
  if (!Array.isArray(list)) return []

  return [...new Set(list
    .map(item => {
      if (typeof item === 'string') return item.trim()
      if (!item || typeof item !== 'object') return ''

      return (
        item.name ||
        item.displayName ||
        item.userName ||
        item.fullName ||
        item.acknowledgedByName ||
        item.inProgressByName ||
        ''
      ).trim()
    })
    .filter(Boolean))]
}

function extractUsersFromHistory(history, statuses) {
  if (!Array.isArray(history)) return []

  return [...new Set(history
    .filter(entry => statuses.includes(entry?.status || entry?.toStatus || entry?.newStatus))
    .map(entry => (
      entry?.userName ||
      entry?.actorName ||
      entry?.updatedByName ||
      entry?.displayName ||
      entry?.name ||
      ''
    ).trim())
    .filter(Boolean))]
}

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

const nextStatus = {
  triggered: 'acknowledged',
  acknowledged: 'in-progress',
  'in-progress': 'resolved',
}

const nextLabel = {
  triggered: 'Acknowledge',
  acknowledged: 'Mark In Progress',
  'in-progress': 'Mark Resolved',
}

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()
  const [incident, setIncident] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [showProgressDetails, setShowProgressDetails] = useState(false)
  const [acknowledgedUsers, setAcknowledgedUsers] = useState([])
  const [inProgressUsers, setInProgressUsers] = useState([])

  useEffect(() => {
    let isActive = true

    async function loadIncident() {
      setLoading(true)
      setError('')

      try {
        const record = await getIncidentById(id)

        if (isActive) {
          setIncident(record)
          setStatus(record?.status || '')

          const acknowledged = normalizeUsers([
            ...(record?.acknowledgedUsers || []),
            ...(record?.acknowledgedBy || []),
            ...(record?.ackUsers || []),
            ...(record?.acknowledgements || []),
          ])
          const acknowledgedFromHistory = extractUsersFromHistory(
            record?.statusHistory,
            ['acknowledged']
          )

          const inProgress = normalizeUsers([
            ...(record?.inProgressUsers || []),
            ...(record?.inProgressBy || []),
            ...(record?.workingUsers || []),
            ...(record?.responders || []),
          ])
          const inProgressFromHistory = extractUsersFromHistory(
            record?.statusHistory,
            ['in-progress', 'in_progress']
          )

          setAcknowledgedUsers([...new Set([...acknowledged, ...acknowledgedFromHistory])])
          setInProgressUsers([...new Set([...inProgress, ...inProgressFromHistory])])
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Failed to load incident.')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadIncident()

    return () => {
      isActive = false
    }
  }, [id])

  const found = incident

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading incident...</div>
  }

  if (error) {
    return (
      <div className="p-6 text-center text-gray-500">
        {error}{' '}
        <button onClick={() => navigate('/incidents')} className="text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    )
  }

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

  const currentStepIndex = statusStepIndex[status] ?? 0

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
            <span className={`text-xs px-2 py-1 rounded ${statusColors[status] || statusColors.archived}`}>
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

      {/* Ticket Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Ticket Progress</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {progressSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex
            const isCurrent = idx === currentStepIndex

            return (
              <div
                key={step.key}
                className={`rounded-lg border px-3 py-2 ${
                  isCurrent
                    ? 'border-red-300 bg-red-50'
                    : isCompleted
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isCurrent
                      ? 'text-red-700'
                      : isCompleted
                        ? 'text-green-700'
                        : 'text-gray-500'
                  }`}
                >
                  Step {idx + 1}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    isCurrent
                      ? 'text-red-700'
                      : isCompleted
                        ? 'text-green-700'
                        : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowProgressDetails(prev => !prev)}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          {showProgressDetails ? 'Hide details' : 'More details'}
        </button>

        {showProgressDetails && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Acknowledged by</p>
              {acknowledgedUsers.length > 0 ? (
                <ul className="space-y-1">
                  {acknowledgedUsers.map(name => (
                    <li key={name} className="text-sm text-gray-800">• {name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No users have acknowledged this ticket yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">In progress by</p>
              {inProgressUsers.length > 0 ? (
                <ul className="space-y-1">
                  {inProgressUsers.map(name => (
                    <li key={name} className="text-sm text-gray-800">• {name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No users are currently marked in-progress.</p>
              )}
            </div>
          </div>
        )}
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

      {/* Action Button — admin only */}
      {isAdmin ? (
        nextStatus[status] && (
          <>
            {statusError && (
              <p className="text-sm text-red-500 mb-2 text-center">{statusError}</p>
            )}
            <button
              disabled={statusUpdating}
              onClick={async () => {
                setStatusUpdating(true)
                setStatusError('')
                try {
                  const upcomingStatus = nextStatus[status]
                  await incidentAPI.updateStatus(found.id, upcomingStatus)
                  setStatus(upcomingStatus)

                  if (currentUser?.name && upcomingStatus === 'acknowledged') {
                    setAcknowledgedUsers(prev => prev.includes(currentUser.name) ? prev : [...prev, currentUser.name])
                  }

                  if (currentUser?.name && upcomingStatus === 'in-progress') {
                    setInProgressUsers(prev => prev.includes(currentUser.name) ? prev : [...prev, currentUser.name])
                  }
                } catch (err) {
                  setStatusError(err.message || 'Failed to update status. Please try again.')
                } finally {
                  setStatusUpdating(false)
                }
              }}
              className="w-full py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {statusUpdating ? 'Updating...' : nextLabel[status]}
            </button>
          </>
        )
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-2 text-sm text-gray-500">
          🔒 Status can only be updated by an Admin
        </div>
      )}

      {status === 'archived' && (
        <div className="text-center text-sm text-gray-400 py-3">
          This incident has been archived.
        </div>
      )}

    </div>
  )
}
