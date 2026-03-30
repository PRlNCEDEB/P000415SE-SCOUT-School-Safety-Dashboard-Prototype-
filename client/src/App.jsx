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
    {/* TODO: Protect authenticated application routes and redirect unauthenticated users to the login page. */}
      <Routes>
        {/* TODO: Redirect authenticated users away from the login page if a valid session already exists. */}
        <Route path="/login" element={<Login />} />
        {/* TODO: Wrap these application routes in protected route logic once backend authentication/session handling is implemented. */}
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