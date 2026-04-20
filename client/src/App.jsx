import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import SubmitAlert from './pages/SubmitAlert'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'

function App() {

  // Handlers will be managed by individual components using API directly
  const handleSubmitAlert = async (alert) => {
    // This will be handled by SubmitAlert component using incidentAPI.create()
    return alert
  }

  const handleUpdateIncidentStatus = async (incidentId, status) => {
    // This will be handled by component using incidentAPI.updateStatus()
    return { incidentId, status }
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout><Dashboard onSubmitAlert={handleSubmitAlert} /></Layout>} />
          <Route path="/incidents" element={<Layout><Incidents /></Layout>} />
          <Route path="/incidents/:id" element={<Layout><IncidentDetail onUpdateIncidentStatus={handleUpdateIncidentStatus} /></Layout>} />
          <Route path="/submit" element={<Layout><SubmitAlert onSubmitAlert={handleSubmitAlert} /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App