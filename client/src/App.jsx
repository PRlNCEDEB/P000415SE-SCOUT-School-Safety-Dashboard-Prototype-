import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import SubmitAlert from './pages/SubmitAlert'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'

// ── PrivateRoute ──────────────────────────────────────────────────────────────
// Blocks access to protected pages when the user is not authenticated.
// Shows a loading screen while Firebase resolves the initial auth state.
function PrivateRoute({ children }) {
  const { currentUser, authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mb-3">
            <span className="text-white text-xl">S</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}

// ── PublicRoute ───────────────────────────────────────────────────────────────
// Redirects already-authenticated users away from the login page.
function PublicRoute({ children }) {
  const { currentUser, authLoading } = useAuth()

  if (authLoading) return null  // wait silently; PrivateRoute handles the spinner

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard"       element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/incidents"       element={<PrivateRoute><Layout><Incidents /></Layout></PrivateRoute>} />
      <Route path="/incidents/:id"   element={<PrivateRoute><Layout><IncidentDetail /></Layout></PrivateRoute>} />
      <Route path="/submit"          element={<PrivateRoute><Layout><SubmitAlert /></Layout></PrivateRoute>} />
      <Route path="/analytics"       element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
      <Route path="/notifications"   element={<PrivateRoute><Layout><Notifications /></Layout></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
