import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getIncidentById } from '../api/client'

export default function Layout({ children }) {
  const location = useLocation()
  const { currentUser, userRole, logout, isCompanyAdmin, isSchoolAdmin, isStaff } = useAuth()

  // Active emergency banner state
  const [activeEmergency, setActiveEmergency] = useState(null)
  const [acknowledgedBy, setAcknowledgedBy] = useState([])
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  // Sync the active emergency banner without polling Firestore.
  useEffect(() => {
    const loadActiveEmergency = () => {
      const stored = localStorage.getItem('activeEmergency')
      if (!stored) {
        setActiveEmergency(null)
        setAcknowledgedBy([])
        return
      }

      try {
        setActiveEmergency(JSON.parse(stored))
      } catch {
        localStorage.removeItem('activeEmergency')
      }
    }

    const handleStorage = event => {
      if (event.key === 'activeEmergency') {
        loadActiveEmergency()
      }
    }

    loadActiveEmergency()
    window.addEventListener('emergencyTriggered', loadActiveEmergency)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('emergencyTriggered', loadActiveEmergency)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const dismissBanner = () => {
    localStorage.removeItem('activeEmergency')
    setActiveEmergency(null)
    setAcknowledgedBy([])
    setRefreshError('')
  }

  const refreshEmergencyStatus = useCallback(async () => {
    if (!activeEmergency?.incidentId || refreshingStatus) return

    setRefreshingStatus(true)
    setRefreshError('')

    try {
      const incident = await getIncidentById(activeEmergency.incidentId)
      setAcknowledgedBy(incident?.acknowledgedBy || [])
    } catch (err) {
      console.error('Failed to refresh incident acknowledgement:', err)
      setRefreshError('Could not refresh status.')
    } finally {
      setRefreshingStatus(false)
    }
  }, [activeEmergency?.incidentId, refreshingStatus])

  useEffect(() => {
    if (!activeEmergency?.incidentId) return

    const refreshOnFocus = () => {
      refreshEmergencyStatus()
    }

    window.addEventListener('focus', refreshOnFocus)
    return () => window.removeEventListener('focus', refreshOnFocus)
  }, [activeEmergency?.incidentId, refreshEmergencyStatus])

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Role-based navigation sections with visibility control
  const navigationSections = [
    {
      title: 'SCOUT Setup / Config',
      visible: isCompanyAdmin || isSchoolAdmin,
      items: [
        { path: '/setup', label: 'Setup', icon: 'S', visible: isCompanyAdmin || isSchoolAdmin },
      ],
    },
    {
      title: 'Live Operations',
      visible: true,
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: 'D', visible: true },
        { path: '/submit', label: 'Submit Alert', icon: '+', visible: isSchoolAdmin || isStaff },
        { path: '/incidents', label: 'Incidents', icon: 'I', visible: isCompanyAdmin || isSchoolAdmin },
      ],
    },
    {
      title: 'Data & Insights',
      visible: isCompanyAdmin || isSchoolAdmin,
      items: [
        { path: '/analytics', label: 'Analytics', icon: 'A', visible: isCompanyAdmin },
        { path: '/notifications', label: 'Notifications', icon: 'N', visible: isCompanyAdmin || isSchoolAdmin },
      ],
    },
  ]

  const isAcknowledged = acknowledgedBy.length > 0
  const firstAck = acknowledgedBy[0]

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Floating Emergency Banner — shown on all pages */}
      {activeEmergency && (
        <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between shadow-lg ${
          isAcknowledged ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <div className="flex items-center gap-3">
            {isAcknowledged ? (
              <>
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-white font-semibold text-sm">Help is on the way!</p>
                  <p className="text-white text-xs opacity-90">
                    {firstAck.name} acknowledged at {new Date(firstAck.acknowledgedAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="text-xl animate-pulse">🚨</span>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {activeEmergency.emergencyType} Emergency Alert Sent
                  </p>
                  <p className="text-white text-xs opacity-90">
                    Waiting for acknowledgement. Use refresh to check status.
                  </p>
                  {refreshError && <p className="text-white text-xs opacity-90">{refreshError}</p>}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshEmergencyStatus}
              disabled={refreshingStatus}
              className="text-white text-xs opacity-90 hover:opacity-100 px-2 py-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50"
            >
              {refreshingStatus ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <button
              onClick={dismissBanner}
              className="text-white text-xs opacity-75 hover:opacity-100 px-2 py-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className={`w-56 bg-white border-r border-gray-200 flex flex-col ${activeEmergency ? 'mt-12' : ''}`}>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">S</span>
          </div>
          <span className="font-bold text-gray-900">SCOUT</span>
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {navigationSections.map((section) => {
            // Only show section if it has at least one visible item
            const visibleItems = section.items.filter(item => item.visible)
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {visibleItems.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'bg-red-50 text-red-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-sm font-medium text-gray-800">{currentUser.displayName || currentUser.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isCompanyAdmin
                  ? 'bg-red-100 text-red-700'
                  : isSchoolAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {userRole || currentUser.role}
              </span>
            </div>
            <p className="text-xs text-gray-400">{currentUser.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>R</span> Reset Session
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${activeEmergency ? 'mt-12' : ''}`}>
        {children}
      </div>

    </div>
  )
}
