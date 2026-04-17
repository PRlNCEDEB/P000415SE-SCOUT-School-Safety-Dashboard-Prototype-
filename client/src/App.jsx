import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import SubmitAlert from './pages/SubmitAlert'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'

// Redirects unauthenticated users to /login (AC5)
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

// Redirects already-logged-in users away from /login (AC3 complement)
function PublicRoute({ children }) {
  const { currentUser } = useAuth()
  if (currentUser) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute><Layout><Incidents /></Layout></ProtectedRoute>} />
          <Route path="/incidents/:id" element={<ProtectedRoute><Layout><IncidentDetail /></Layout></ProtectedRoute>} />
          <Route path="/submit" element={<ProtectedRoute><Layout><SubmitAlert /></Layout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App