import { useState, useEffect } from 'react'

const emergencyTypes = [
  { value: 'Natural Disaster', icon: '🌊', desc: 'Earthquake, flood, severe weather' },
  { value: 'Fire', icon: '🔥', desc: 'Fire emergency or smoke detected' },
  { value: 'Threat', icon: '🛡️', desc: 'Security threat or lockdown' },
]

export default function QuickActions() {
  const [logs, setLogs] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCategory, setShowCategory] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', location: '' })

  // Keyboard shortcuts
  useEffect(() => {
    if (editingId || showConfirm || showCategory) return
    const handler = (e) => {
      if (e.key === '1') handleEmergencyClick()
      if (e.key === '2') handleAction2()
    }
    window.addEventListener('keypress', handler)
    return () => window.removeEventListener('keypress', handler)
  }, [editingId, showConfirm, showCategory])

  // Countdown timer
  useEffect(() => {
    if (showConfirm && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [showConfirm, countdown])

  const handleEmergencyClick = () => {
    setShowConfirm(true)
    setCountdown(5)
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    setShowCategory(true)
  }

  const handleCategorySelect = (type) => {
    const newLog = {
      id: Date.now().toString(),
      button: '1',
      emergencyType: type.value,
      actions: ['Email', 'SMS', 'Record'],
      timestamp: new Date().toLocaleTimeString(),
      title: '',
      description: '',
      location: '',
    }
    setLogs(prev => [newLog, ...prev])
    setShowCategory(false)
    setFeedback({ button: '1', actions: 'Email + SMS + Record' })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleAction2 = () => {
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
    setLogs(prev => [newLog, ...prev])
    setFeedback({ button: '2', actions: 'Email + Record' })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleSaveEdit = () => {
    setLogs(prev => prev.map(l => l.id === editingId ? { ...l, ...editForm } : l))
    setEditingId(null)
    setEditForm({ title: '', description: '', location: '' })
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-xs text-gray-500">Press keyboard key or click button to trigger notifications</p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">

        {/* Button 1 - Emergency */}
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

        {/* Button 2 - General */}
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

      {/* Feedback toast */}
      {feedback && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="text-green-600">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-900">Action {feedback.button} triggered</p>
            <p className="text-xs text-green-700">{feedback.actions} completed</p>
          </div>
        </div>
      )}

      {/* Action Log */}
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
                  <p className="text-xs text-gray-400 mt-0.5">{log.actions.join(' + ')} · {log.timestamp}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingId(log.id)
                    setEditForm({ title: log.title, description: log.description, location: log.location })
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                >
                  ✏️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Confirmation Modal */}
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
                disabled={countdown > 0}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  countdown > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {countdown > 0 ? `Confirm (${countdown}s)` : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowCategory(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Select Emergency Type</h4>
              <button onClick={() => setShowCategory(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Choose the category that best describes this emergency:</p>
            <div className="space-y-2">
              {emergencyTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleCategorySelect(type)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all text-left"
                >
                  <span className="text-2xl">{type.icon}</span>
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

      {/* Edit Details Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setEditingId(null)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Add Details to Record</h4>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Student injury in playground"
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Description</label>
                <textarea
                  rows={3}
                  placeholder="Add details about what happened..."
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main playground"
                  value={editForm.location}
                  onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
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
                💾 Save Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}