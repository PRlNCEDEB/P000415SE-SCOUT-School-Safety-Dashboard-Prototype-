import { Link, useLocation, useNavigate } from 'react-router-dom'
// TODO: Load visible navigation items based on the authenticated user's role/permissions.
const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/incidents', label: 'Incidents', icon: '🚨' },
  { path: '/submit', label: 'Submit Alert', icon: '➕' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

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
          {navItems.map(item => (
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
        </nav>

        {/* Bottom - User + Logout */}
        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-1">
            {/* TODO: Replace hardcoded user details with the authenticated user's name and role from backend/session data. */}
            <p className="text-sm font-medium text-gray-800">Admin User</p>
            <p className="text-xs text-gray-400">Safety Manager</p>
          </div>
          <button
          // TODO: Replace redirect-only logout with backend/session logout and clear stored auth data before navigating to login.
            onClick={() => navigate('/login')}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>🚪</span> Logout
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