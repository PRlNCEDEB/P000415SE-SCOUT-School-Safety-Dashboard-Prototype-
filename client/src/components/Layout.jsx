import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const location = useLocation()
  const { currentUser, logout, isAdmin } = useAuth()

  // TODO: Load visible navigation items based on the authenticated user's role/permissions.
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠', allowed: true },
    { path: '/incidents', label: 'Incidents', icon: '🚨', allowed: true },
    { path: '/submit', label: 'Submit Alert', icon: '➕', allowed: true },
    { path: '/analytics', label: 'Analytics', icon: '📊', allowed: isAdmin },
    { path: '/notifications', label: 'Notifications', icon: '🔔', allowed: true },
  ]

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🛡️</span>
          </div>
          <span className="font-bold text-gray-900">SCOUT</span>
        </div>

        {/* Nav Links */}
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
                  <span>🔒</span>
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

        {/* User info + role + logout */}
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
          {/* TODO: Replace mock logout with real backend/session sign-out once auth is implemented. */}
          <button
            onClick={logout}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>🔄</span> Reset Session
          </button>
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

    </div>
  )
}
