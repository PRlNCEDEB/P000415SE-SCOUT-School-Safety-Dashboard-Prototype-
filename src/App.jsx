import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import SubmitAlert from './pages/SubmitAlert'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/incidents" element={<Layout><Incidents /></Layout>} />
        <Route path="/incidents/:id" element={<Layout><IncidentDetail /></Layout>} />
        <Route path="/submit" element={<Layout><SubmitAlert /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App