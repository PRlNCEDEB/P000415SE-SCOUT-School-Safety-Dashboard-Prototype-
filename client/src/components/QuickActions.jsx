import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { incidentAPI, apiCall } from '../api/client'

const emergencyTypes = [
  { value: 'Natural Disaster', icon: '🌊', desc: 'Earthquake, flood, severe weather' },
  { value: 'Fire', icon: '🔥', desc: 'Fire emergency or smoke detected' },
  { value: 'Threat', icon: '🛡️', desc: 'Security threat or lockdown' },
]

export default function QuickActions() {
  const { isAdmin, currentUser } = useAuth()
  const [logs, setLogs] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCategory, setShowCategory] = useState(false)
  const [showKeypad, setShowKeypad] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', location: '' })

  useEffect(() => {
    if (editingId || showConfirm || showCategory || showKeypad) return

    const handler = event => {
      if (event.key === '1') handleEmergencyClick()
      if (event.key === '2') handleAction2()
    }

    window.addEventListener('keypress', handler)
    return () => window.removeEventListener('keypress', handler)
  }, [editingId, showConfirm, showCategory, showKeypad])

  const handleEmergencyClick = () => {
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    setShowCategory(true)
  }

  const handleCategorySelect = type => {
    setSelectedType(type)
    setShowCategory(false)
    setShowKeypad(true)
    setCode('')
    setCodeError('')
    setCustomMessage('')
  }

  // Creates the incident record and returns the full incident object (with id)
  const createIncidentRecord = async (typeValue, description) => {
    const mappedType = typeValue === 'Natural Disaster'
      ? 'weather'
      : typeValue === 'Fire'
        ? 'fire'
        : 'lockdown'

    try {
      const incident = await incidentAPI.create({
        type: mappedType,
        priority: 'critical',
        title: `${typeValue} alert`,
        location: editForm.location || 'Dashboard quick action',
        description: description || `${typeValue} emergency triggered from dashboard.`,
        triggeredByName: currentUser?.name || 'Unknown',
        triggeredById: currentUser?.id || null,
      })
      return incident  // return full incident so we can get the id
    } catch (err) {
      console.error('Failed to create incident record:', err)
      return null
    }
  }

  const handleCodeSubmit = async () => {
    if (code !== '000') {
      setCodeError('Invalid code. Please enter 000 to confirm emergency.')
      return
    }

    setLoading(true)
    setCodeError('')

    try {
      // Step 1: Create incident FIRST so we have the incidentId
      const incident = await createIncidentRecord(selectedType.value, customMessage || editForm.description)
      const incidentId = incident?.id || null

      // Step 2: Send emergency notification, passing incidentId
      const data = await apiCall('/notifications/emergency', {
        method: 'POST',
        body: JSON.stringify({
          code,
          emergencyType: selectedType.value,
          location: editForm.location || '',
          message: customMessage || `Emergency alert triggered for ${selectedType.value}. All relevant staff have been notified.`,
          incidentId,  // link notification to incident
        }),
      })

      if (data.success) {
        // Store active emergency in localStorage so Layout can show the banner
        if (incidentId) {
          localStorage.setItem('activeEmergency', JSON.stringify({
            incidentId,
            emergencyType: selectedType.value,
            triggeredAt: new Date().toISOString(),
          }))
          window.dispatchEvent(new Event('emergencyTriggered')) // 
        }

        const newLog = {
          id: Date.now().toString(),
          button: '1',
          emergencyType: selectedType.value,
          actions: ['Email', 'SMS', 'Record'],
          timestamp: new Date().toLocaleTimeString(),
          title: editForm.title,
          description: customMessage || editForm.description,
          location: editForm.location,
        }

        setLogs(prev => [newLog, ...prev])
        setShowKeypad(false)
        setShowResult(data)
        setFeedback({ button: '1', actions: 'Email + SMS + Record' })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setCodeError(data.error || 'Failed to send alert. Please try again.')
      }
    } catch (error) {
      setCodeError('Could not connect to server. Make sure the backend is running.')
    }

    setLoading(false)
  }

  const handleAction2 = async () => {
    const newLog = {
      id: Date.now().toString(),
      button: '2',
      emergencyType: null,
      actions: ['Email', 'Record'],
      timestamp: new Date().toLocaleTimeString(),
      title: '',
      description: '',
      location: '',
    }

    try {
      await incidentAPI.create({
        type: 'general',
        priority: 'medium',
        title: 'General alert',
        location: 'Dashboard quick action',
        description: 'General quick action triggered from dashboard.',
        triggeredByName: currentUser?.name || 'Unknown',
        triggeredById: currentUser?.id || null,
      })
    } catch (err) {
      console.error('Failed to create general incident record:', err)
    }

    setLogs(prev => [newLog, ...prev])
    setFeedback({ button: '2', actions: 'Email + Record' })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleSaveEdit = () => {
    setLogs(prev => prev.map(log => (log.id === editingId ? { ...log, ...editForm } : log)))
    setEditingId(null)
    setEditForm({ title: '', description: '', location: '' })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-xs text-gray-500">Press keyboard key or click button to trigger notifications</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleEmergencyClick}
          className="relative bg-red-50 border-2 border-red-300 rounded-xl p-6 hover:border-red-500 hover:bg-red-100 transition-all text-left"
        >
          <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">
            EMERGENCY
          </span>
          <div className="text-4xl font-bold text-red-700 mb-3 text-center">1</div>
          <div className="space-y-1">
             <p className="text-xs text-red-700">📧 Send Email</p>
            <p className="text-xs text-red-700">📱 Send SMS</p>
            <p className="text-xs text-red-700">🗄️ Create Record</p>
          </div>
        </button>

        <button
          onClick={handleAction2}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 hover:border-green-500 hover:bg-green-50 transition-all text-left"
        >
          <div className="text-4xl font-bold text-gray-700 mb-3 text-center">2</div>
          <div className="space-y-1">
             <p className="text-xs text-gray-600">📧 Send Email</p>
            <p className="text-xs text-gray-600">🗄️ Create Record</p>
          </div>
        </button>
      </div>

      {feedback && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
         <span className="text-green-600">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-900">Action {feedback.button} triggered</p>
            <p className="text-xs text-green-700">{feedback.actions} completed</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Action Log</h3>
        {logs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-xs text-gray-400">No actions recorded yet. Press 1 or 2 to trigger.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {logs.map(log => (
              <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  log.button === '1' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {log.button}
                </div>
                <div className="flex-1 min-w-0">
                  {log.emergencyType && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold mb-1 inline-block">
                      {log.emergencyType}
                    </span>
                  )}
                  {log.title ? (
                    <p className="text-sm font-medium text-gray-800">{log.title}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No details added</p>
                  )}
                  {log.description && <p className="text-xs text-gray-500 mt-0.5">{log.description}</p>}
                  {log.location && <p className="text-xs text-gray-400">📍 {log.location}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{log.actions.join(' + ')} - {log.timestamp}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingId(log.id)
                      setEditForm({ title: log.title, description: log.description, location: log.location })
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white border-2 border-red-500 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-3 mb-4">
               <div className="p-2 bg-red-100 rounded-lg">⚠️</div>
              <div>
                <h4 className="font-semibold text-gray-900">Emergency Alert Confirmation</h4>
                <p className="text-sm text-gray-500 mt-1">
                  This will send immediate notifications via Email and SMS to all relevant staff.
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">Are you sure you want to proceed?</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowCategory(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Select Emergency Type</h4>
              <button onClick={() => setShowCategory(false)} className="text-gray-400 hover:text-gray-600">X</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Choose the category that best describes this emergency:</p>
            <div className="space-y-2">
              {emergencyTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleCategorySelect(type)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all text-left"
                >
                  <span className="text-sm font-semibold text-gray-600">{type.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{type.value}</p>
                    <p className="text-xs text-gray-400">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showKeypad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative bg-white border-2 border-red-500 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold mb-2">{selectedType?.icon}</div>
              <h4 className="font-bold text-gray-900">{selectedType?.value} Emergency</h4>
              <p className="text-sm text-gray-500 mt-1">Enter <strong className="text-red-600">000</strong> to confirm and send alerts to all teams.</p>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={code}
                onChange={event => {
                  setCode(event.target.value)
                  setCodeError('')
                }}
                placeholder="Enter 000"
                maxLength={3}
                className="w-full text-center text-3xl font-bold tracking-widest px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-red-500"
              />
              {codeError && <p className="text-xs text-red-600 text-center mt-2">{codeError}</p>}
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Additional message <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={customMessage}
                onChange={event => setCustomMessage(event.target.value)}
                placeholder="e.g. Fire spotted near Block B, students evacuating..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowKeypad(false)
                  setCode('')
                  setCodeError('')
                  setCustomMessage('')
                }}
                className="flex-1 py-2.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCodeSubmit}
                disabled={loading || code.length !== 3}
                className={`flex-1 py-2.5 text-sm rounded-lg font-semibold transition-colors ${
                  loading || code.length !== 3 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? 'Sending...' : '🚨 Send Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowResult(null)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">✅</div>
              <h4 className="font-bold text-gray-900">Emergency Alert Sent</h4>
              <p className="text-sm text-gray-500 mt-1">{showResult.message}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Notifications sent to:</p>
              <div className="space-y-2">
                {showResult.results?.map((result, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{result.name}</p>
                      <p className="text-xs text-gray-400">{result.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${result.emailStatus === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        📧 {result.emailStatus}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${result.smsStatus === 'sent' ? 'bg-green-100 text-green-700' : result.smsStatus === 'skipped' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>
                       📱 {result.smsStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setShowResult(null)} className="w-full py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setEditingId(null)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Add Details to Record</h4>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">X</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Student injury in playground"
                  value={editForm.title}
                  onChange={event => setEditForm(prev => ({ ...prev, title: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Description</label>
                <textarea
                  rows={3}
                  placeholder="Add details about what happened..."
                  value={editForm.description}
                  onChange={event => setEditForm(prev => ({ ...prev, description: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main playground"
                  value={editForm.location}
                  onChange={event => setEditForm(prev => ({ ...prev, location: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}