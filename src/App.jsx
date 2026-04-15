import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import SubmitAlert from './pages/SubmitAlert'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import { incidents as seedIncidents } from './data/mockData'

function App() {
  const [incidents, setIncidents] = useState(seedIncidents)

  const handleSubmitAlert = (alert) => {
    const nextId = String(Math.max(0, ...incidents.map(i => Number(i.id) || 0)) + 1)
    const newIncident = {
      id: nextId,
      type: alert.type,
      priority: alert.priority,
      status: 'triggered',
      title: alert.title.trim(),
      location: alert.location,
      timestamp: 'Just now',
      triggeredByName: 'Admin',
      description: alert.description.trim(),
      notifications: [],
    }

    setIncidents(prev => [newIncident, ...prev])
    return newIncident
  }

  const handleUpdateIncidentStatus = (incidentId, status) => {
    setIncidents(prev => prev.map(i => (
      i.id === incidentId ? { ...i, status } : i
    )))
  }

  return (
    <BrowserRouter>
    {/* TODO: Protect authenticated application routes and redirect unauthenticated users to the login page. */}
      <Routes>
        {/* TODO: Redirect authenticated users away from the login page if a valid session already exists. */}
        <Route path="/login" element={<Login />} />
        {/* TODO: Wrap these application routes in protected route logic once backend authentication/session handling is implemented. */}
        <Route path="/" element={<Layout><Dashboard incidents={incidents} onSubmitAlert={handleSubmitAlert} /></Layout>} />
        <Route path="/incidents" element={<Layout><Incidents incidents={incidents} /></Layout>} />
        <Route path="/incidents/:id" element={<Layout><IncidentDetail incidents={incidents} onUpdateIncidentStatus={handleUpdateIncidentStatus} /></Layout>} />
        <Route path="/submit" element={<Layout><SubmitAlert onSubmitAlert={handleSubmitAlert} /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App