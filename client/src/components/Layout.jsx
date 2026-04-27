import { useState, useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getIncidentById } from '../api/client'

export default function Layout({ children }) {
  const location = useLocation()
  const { currentUser, logout, isAdmin } = useAuth()

  // Active emergency banner state
  const [activeEmergency, setActiveEmergency] = useState(null)
  const [acknowledgedBy, setAcknowledgedBy] = useState([])

  // Check localStorage every second for active emergency
  // This ensures the banner appears on the same page without needing to navigate
  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem('activeEmergency')
      if (stored && !activeEmergency) {
        try {
          setActiveEmergency(JSON.parse(stored))
        } catch {
          localStorage.removeItem('activeEmergency')
        }
      }
    }

    check() // run immediately on mount
    const interval = setInterval(check, 1000) // check every 1 second
    return () => clearInterval(interval)
  }, [activeEmergency])

  // Poll the incident every 5 seconds to check for acknowledgements
  useEffect(() => {
    if (!activeEmergency?.incidentId) return

    const poll = async () => {
      try {
        const incident = await getIncidentById(activeEmergency.incidentId)
        if (incident?.acknowledgedBy?.length > 0) {
          setAcknowledgedBy(incident.acknowledgedBy)
        }
      } catch (err) {
        console.error('Failed to poll incident acknowledgement:', err)
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [activeEmergency])

  const dismissBanner = () => {
    localStorage.removeItem('activeEmergency')
    setActiveEmergency(null)
    setAcknowledgedBy([])
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'D', allowed: true },
    { path: '/incidents', label: 'Incidents', icon: 'I', allowed: true },
    { path: '/submit', label: 'Submit Alert', icon: '+', allowed: true },
    { path: '/analytics', label: 'Analytics', icon: 'A', allowed: isAdmin },
    { path: '/notifications', label: 'Notifications', icon: 'N', allowed: true },
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
                  <p className="text-white text-xs opacity-90">⏳ Waiting for acknowledgement...</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={dismissBanner}
            className="text-white text-xs opacity-75 hover:opacity-100 px-2 py-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      <div className={`w-56 bg-white border-r border-gray-200 flex flex-col ${activeEmergency ? 'mt-12' : ''}`}>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">S</span>
          </div>
          <span className="font-bold text-gray-900">SCOUT</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            if (!item.allowed) {
              return (
                <div
                  key={item.path}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-300 cursor-not-allowed"
                  title="Admin access required"
                >
                  <div className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    {item.label}
                  </div>
                  <span>X</span>
                </div>
              )
            }

            return (
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
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isAdmin ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {currentUser.role}
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