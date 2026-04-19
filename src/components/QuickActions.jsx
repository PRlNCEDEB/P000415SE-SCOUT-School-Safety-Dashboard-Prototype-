import { useState, useEffect } from 'react'

// TODO: Replace hardcoded emergency types with values fetched from backend if these categories are stored centrally.
const emergencyTypes = [
  { value: 'Natural Disaster', icon: '🌊', desc: 'Earthquake, flood, severe weather' },
  { value: 'Fire', icon: '🔥', desc: 'Fire emergency or smoke detected' },
  { value: 'Threat', icon: '🛡️', desc: 'Security threat or lockdown' },
]

const standardAlertTypes = [
  { value: 'General', icon: '📢', desc: 'General safety concern or announcement' },
  { value: 'Weather', icon: '🌩️', desc: 'Weather-related disruption or warning' },
  { value: 'Maintenance', icon: '🔧', desc: 'Facilities issue requiring attention' },
  { value: 'Medical', icon: '🏥', desc: 'Medical assistance required' },
]

export default function QuickActions({ onSubmitAlert }) {
  const [feedback, setFeedback] = useState(null)
  const [showCategory, setShowCategory] = useState(false)
  const [showStandardCategory, setShowStandardCategory] = useState(false)
  const [pendingEmergencyType, setPendingEmergencyType] = useState(null)
  const [showEmergencyVerification, setShowEmergencyVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [showEmergencySuccess, setShowEmergencySuccess] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    if (showCategory || showStandardCategory || showEmergencyVerification || showEmergencySuccess) return
    const handler = (e) => {
      if (e.key === '1') handleEmergencyClick()
      if (e.key === '2') handleAction2()
    }
    window.addEventListener('keypress', handler)
    return () => window.removeEventListener('keypress', handler)
  }, [showCategory, showStandardCategory, showEmergencyVerification, showEmergencySuccess])

  const handleEmergencyClick = () => {
    setShowCategory(true)
  }

  const handleCategorySelect = (type) => {
    setShowCategory(false)
    setPendingEmergencyType(type)
    setVerificationCode('')
    setVerificationError('')
    setShowEmergencyVerification(true)
  }

  const buildEmergencyAlertPayload = (type) => {
    const incidentType = type.value === 'Threat' ? 'lockdown' : 'weather'
    const location = incidentType === 'fire' ? 'Block B' : incidentType === 'lockdown' ? 'Main Building' : 'School Grounds'
    const priority = incidentType === 'fire' ? 'critical' : 'high'

    return {
      type: incidentType,
      priority,
      title: `${type.value} alert triggered`,
      location,
      description: `Alert Type 1 triggered for ${type.value}.`,
    }
  }

  const handleEmergencyVerificationSubmit = () => {
    if (verificationCode !== '0000') {
      setVerificationError('Incorrect verification code. Please try again.')
      return
    }

    if (!pendingEmergencyType) return

    onSubmitAlert?.(buildEmergencyAlertPayload(pendingEmergencyType))
    setShowEmergencyVerification(false)
    setPendingEmergencyType(null)
    setVerificationCode('')
    setVerificationError('')
    setShowEmergencySuccess(true)
    setFeedback({ button: '1', actions: 'Email + SMS + Record' })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleCloseVerification = () => {
    setShowEmergencyVerification(false)
    setPendingEmergencyType(null)
    setVerificationCode('')
    setVerificationError('')
  }

  const handleBackToEmergencyType = () => {
    setShowEmergencyVerification(false)
    setVerificationCode('')
    setVerificationError('')
    setShowCategory(true)
  }

  const handleAction2 = () => {
    setShowStandardCategory(true)
  }

  const buildStandardAlertPayload = (type) => {
    const incidentType = type.value.toLowerCase()
    const priority = incidentType === 'medical' ? 'critical' : incidentType === 'maintenance' ? 'medium' : 'high'

    return {
      type: incidentType,
      priority,
      title: `${type.value} alert triggered`,
      location: 'Main Building',
      description: `Alert Type 2 triggered for ${type.value}.`,
    }
  }

  const handleStandardCategorySelect = (type) => {
    onSubmitAlert?.(buildStandardAlertPayload(type))
    setShowStandardCategory(false)
    setShowEmergencySuccess(true)
    setFeedback({ button: '2', actions: 'Email + Record' })
    setTimeout(() => setFeedback(null), 3000)
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

      {/* Category Selection Modal */}
      {showCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowCategory(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Select Emergency Type</h4>
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

      {/* Alert Type 2 Category Selection Modal */}
      {showStandardCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowStandardCategory(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Select Alert Type 2 Category</h4>
              <button onClick={() => setShowStandardCategory(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Choose the category for this standard alert:</p>
            <div className="space-y-2">
              {standardAlertTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleStandardCategorySelect(type)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left"
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

      {/* Emergency Verification Modal */}
      {showEmergencyVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={handleCloseVerification} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBackToEmergencyType}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <h4 className="text-lg font-bold text-gray-900">Emergency Verification</h4>
              <button onClick={handleCloseVerification} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Enter the 4-digit code to submit this emergency alert.</p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={verificationCode}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, '').slice(0, 4)
                setVerificationCode(numericValue)
                setVerificationError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleEmergencyVerificationSubmit()
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
              placeholder="••••"
            />
            {verificationError && <p className="text-xs text-red-500 mb-3">{verificationError}</p>}
            <button
              onClick={handleEmergencyVerificationSubmit}
              className="w-full py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Verify and Submit
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showEmergencySuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowEmergencySuccess(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="text-4xl mb-2">✅</div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Incident Submitted</h4>
            <p className="text-sm text-gray-500 mb-4">The incident was submitted successfully.</p>
            <button
              onClick={() => setShowEmergencySuccess(false)}
              className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
