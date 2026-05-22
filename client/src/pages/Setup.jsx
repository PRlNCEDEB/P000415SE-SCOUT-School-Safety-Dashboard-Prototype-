import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { settingsAPI } from '../api/client'
import { setupAPI } from '../api/client'

const EMOJI_OPTIONS = ['🏥', '🔥', '🔒', '⚠️', '🌩️', '🔧', '📢', '🚨', '🛡️', '🌊']

function formatRole(role) {
  return String(role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function Setup() {
  const { isCompanyAdmin, isSchoolAdmin } = useAuth()

  // ── Alert Config state (Company Admin) ─────────────────────────────────────
  const [alertTypes, setAlertTypes] = useState([])
  const [locations, setLocations] = useState([])
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [configError, setConfigError] = useState('')

  const [newType, setNewType] = useState({ label: '', emoji: '', category: 'general' })
  const [addingType, setAddingType] = useState(false)
  const [typeError, setTypeError] = useState('')
  const [editingTypeId, setEditingTypeId] = useState(null)
  const [editTypeForm, setEditTypeForm] = useState({ label: '', emoji: '', category: 'general' })

  const [newLocation, setNewLocation] = useState('')
  const [addingLocation, setAddingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [editingLocationId, setEditingLocationId] = useState(null)
  const [editLocationLabel, setEditLocationLabel] = useState('')

  // ── Routing state (School Admin) ────────────────────────────────────────────
  const [emergencyTypes, setEmergencyTypes] = useState([])
  const [routing, setRouting] = useState({})
  const [schoolUsers, setSchoolUsers] = useState([])
  const [loadingRouting, setLoadingRouting] = useState(false)
  const [routingError, setRoutingError] = useState('')
  const [savingRouting, setSavingRouting] = useState({})
  const [saveStatus, setSaveStatus] = useState({})
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('')
  const [notifyPrefs, setNotifyPrefs] = useState({})

  // ── Load alert types and locations (Company Admin) ─────────────────────────
  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    setConfigError('')
    try {
      const [typesData, locsData] = await Promise.all([
        setupAPI.getAlertTypes(),
        setupAPI.getLocations(),
      ])
      setAlertTypes(typesData.alertTypes || [])
      setLocations(locsData.locations || [])
    } catch {
      setConfigError('Failed to load configuration. Is the backend running?')
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  useEffect(() => {
    if (isCompanyAdmin) loadConfig()
  }, [isCompanyAdmin, loadConfig])

  // ── Load routing + school users + emergency types (School Admin) ────────────
  useEffect(() => {
    if (!isSchoolAdmin) return
    async function loadData() {
      setLoadingRouting(true)
      setRoutingError('')
      try {
        const [routingData, usersData, emergencyTypesData] = await Promise.all([
          setupAPI.getRouting(),
          setupAPI.getSchoolUsers(),
          setupAPI.getAlertTypes('emergency'),
        ])
        const map = {}
        for (const rule of (routingData.routing || [])) {
          map[rule.alertType] = rule.recipients || []
        }
        setRouting(map)
        setSchoolUsers(usersData.users || [])
        setEmergencyTypes(
          (emergencyTypesData.alertTypes || []).map(t => ({
            value: t.label,
            icon: t.emoji || '🚨',
          }))
        )
      } catch {
        setRoutingError('Failed to load routing. Is the backend running?')
      } finally {
        setLoadingRouting(false)
      }
    }
    loadData()
  }, [isSchoolAdmin])

  // ── Alert type handlers ─────────────────────────────────────────────────────
  const handleAddType = async () => {
    if (!newType.label.trim()) { setTypeError('Label is required.'); return }
    if (!newType.category) { setTypeError('Category is required.'); return }
    setAddingType(true)
    setTypeError('')
    try {
      const data = await setupAPI.createAlertType(newType)
      setAlertTypes(prev => [...prev, data.alertType])
      setNewType({ label: '', emoji: '', category: 'general' })
    } catch (err) {
      setTypeError(err.message || 'Failed to add alert type.')
    } finally {
      setAddingType(false)
    }
  }

  const handleSaveType = async (id) => {
    if (!editTypeForm.label.trim()) return
    try {
      const data = await setupAPI.updateAlertType(id, editTypeForm)
      setAlertTypes(prev => prev.map(t => t.id === id ? data.alertType : t))
      setEditingTypeId(null)
    } catch (err) {
      setTypeError(err.message || 'Failed to update.')
    }
  }

  const handleDeleteType = async (id) => {
    if (!confirm('Delete this alert type?')) return
    try {
      await setupAPI.deleteAlertType(id)
      setAlertTypes(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setTypeError(err.message || 'Failed to delete.')
    }
  }

  // ── Location handlers ───────────────────────────────────────────────────────
  const handleAddLocation = async () => {
    if (!newLocation.trim()) { setLocationError('Label is required.'); return }
    setAddingLocation(true)
    setLocationError('')
    try {
      const data = await setupAPI.createLocation({ label: newLocation })
      setLocations(prev => [...prev, data.location])
      setNewLocation('')
    } catch (err) {
      setLocationError(err.message || 'Failed to add location.')
    } finally {
      setAddingLocation(false)
    }
  }

  const handleSaveLocation = async (id) => {
    if (!editLocationLabel.trim()) return
    try {
      const data = await setupAPI.updateLocation(id, { label: editLocationLabel })
      setLocations(prev => prev.map(l => l.id === id ? data.location : l))
      setEditingLocationId(null)
    } catch (err) {
      setLocationError(err.message || 'Failed to update.')
    }
  }

  const handleDeleteLocation = async (id) => {
    if (!confirm('Delete this location?')) return
    try {
      await setupAPI.deleteLocation(id)
      setLocations(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      setLocationError(err.message || 'Failed to delete.')
    }
  }

  // ── Routing handlers ────────────────────────────────────────────────────────
  const getRecipients = (alertType) => routing[alertType] || []

  const saveRouting = async (alertType, recipients) => {
    setSavingRouting(s => ({ ...s, [alertType]: true }))
    setSaveStatus(s => ({ ...s, [alertType]: null }))
    try {
      await setupAPI.updateRouting(alertType, recipients)
      setSaveStatus(s => ({ ...s, [alertType]: 'saved' }))
      setTimeout(() => setSaveStatus(s => ({ ...s, [alertType]: null })), 3000)
    } catch {
      setSaveStatus(s => ({ ...s, [alertType]: 'error' }))
    } finally {
      setSavingRouting(s => ({ ...s, [alertType]: false }))
    }
  }

  const handleAddUser = async (alertType, user) => {
    const notify = notifyPrefs[alertType]?.[user.id] || 'email'
    const current = getRecipients(alertType)
    const alreadyAdded = current.some(r => r.email?.toLowerCase() === user.email?.toLowerCase())
    if (alreadyAdded) return
    const updated = [...current, { name: user.name, email: user.email || null, phone: user.phone || null, role: user.role, notify }]
    setRouting(r => ({ ...r, [alertType]: updated }))
    await saveRouting(alertType, updated)
  }

  const handleRemoveRecipient = async (alertType, index) => {
    const updated = getRecipients(alertType).filter((_, i) => i !== index)
    setRouting(r => ({ ...r, [alertType]: updated }))
    await saveRouting(alertType, updated)
  }

  const getNotifyPref = (alertType, userId) => notifyPrefs[alertType]?.[userId] || 'email'

  const setNotifyPref = (alertType, userId, value) => {
    setNotifyPrefs(p => ({ ...p, [alertType]: { ...(p[alertType] || {}), [userId]: value } }))
  }

  // Overdue threshold state
  const [overdueThreshold, setOverdueThreshold] = useState(15)
  const [thresholdLoading, setThresholdLoading] = useState(true)
  const [thresholdSaving, setThresholdSaving] = useState(false)
  const [thresholdError, setThresholdError] = useState('')
  const [thresholdSuccess, setThresholdSuccess] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await settingsAPI.get()
        setOverdueThreshold(data.overdueThresholdMinutes ?? 15)
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setThresholdLoading(false)
      }
    }

    if (isCompanyAdmin) {
      loadSettings()
    } else {
      setThresholdLoading(false)
    }
  }, [isCompanyAdmin])

  async function handleSaveGlobalSettings() {
    setThresholdSaving(true)
    setThresholdError('')
    setThresholdSuccess(false)

    const parsed = parseInt(overdueThreshold, 10)

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1440) {
      setThresholdError('Threshold must be a whole number between 1 and 1440 minutes.')
      setThresholdSaving(false)
      return
    }

    try {
      await settingsAPI.update(parsed)
      setOverdueThreshold(parsed)
      setThresholdSuccess(true)
      setTimeout(() => setThresholdSuccess(false), 3000)
    } catch (err) {
      setThresholdError(err.message || 'Failed to save settings.')
    } finally {
      setThresholdSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Setup</h1>
        {isCompanyAdmin && (
           <p className="text-sm text-gray-500 mb-6 max-w-2xl">
            Through this page you can design, configure, and manage the SCOUT system across all schools. 
            This includes creating alert types, defining workflows, and shaping how SCOUT functions for all users.
           </p>
)}

        {isSchoolAdmin && (
  <p className="text-sm text-gray-500 mb-6 max-w-2xl">
    Configure and apply SCOUT within your school. This includes selecting available alert types, 
    assigning roles, and defining who receives notifications.
        </p>
)}




      {/* Alert Configuration — Company Admin only */}
      {isCompanyAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Alert Configuration</h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Company Admin</span>
          </div>

          {loadingConfig && <p className="text-sm text-gray-400 mb-4">Loading...</p>}
          {configError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{configError}</p>}

          <div className="grid grid-cols-2 gap-6">

            {/* Alert Types */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">Alert Types</h3>
              <p className="text-sm text-gray-500 mb-4">Appear in the alert type dropdown when submitting an alert.</p>

              {typeError && <p className="text-xs text-red-600 mb-2">{typeError}</p>}

              <div className="space-y-2 mb-4">
                {alertTypes.map(type => (
                  <div key={type.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    {editingTypeId === type.id ? (
                      <>
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex gap-2">
                            <select
                              value={editTypeForm.emoji}
                              onChange={e => setEditTypeForm(f => ({ ...f, emoji: e.target.value }))}
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                            >
                              <option value="">—</option>
                              {EMOJI_OPTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                            </select>
                            <input
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                              value={editTypeForm.label}
                              onChange={e => setEditTypeForm(f => ({ ...f, label: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleSaveType(type.id)}
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <select
                              value={editTypeForm.category}
                              onChange={e => setEditTypeForm(f => ({ ...f, category: e.target.value }))}
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                            >
                              <option value="general">General</option>
                              <option value="emergency">Emergency</option>
                            </select>
                            <button onClick={() => handleSaveType(type.id)} className="text-xs text-green-600 hover:text-green-800 font-medium">Save</button>
                            <button onClick={() => setEditingTypeId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-base w-7">{type.emoji || '📢'}</span>
                        <span className="flex-1 text-sm font-medium text-gray-800">{type.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          type.category === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {type.category || 'general'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingTypeId(type.id)
                            setEditTypeForm({ label: type.label, emoji: type.emoji || '', category: type.category || 'general' })
                          }}
                          className="text-xs text-gray-400 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteType(type.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
                      </>
                    )}
                  </div>
                ))}
                {alertTypes.length === 0 && !loadingConfig && (
                  <p className="text-sm text-gray-400">No alert types yet.</p>
                )}
              </div>

              {/* Add new */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Add new</p>
                <div className="flex gap-2 mb-2">
                  <select
                    value={newType.emoji}
                    onChange={e => setNewType(f => ({ ...f, emoji: e.target.value }))}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm w-16"
                  >
                    <option value="">Emoji</option>
                    {EMOJI_OPTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                  </select>
                  <input
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="e.g. Medical"
                    value={newType.label}
                    onChange={e => setNewType(f => ({ ...f, label: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddType()}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newType.category}
                    onChange={e => setNewType(f => ({ ...f, category: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="general">General</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  <button
                    onClick={handleAddType}
                    disabled={addingType}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {addingType ? '...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">Locations</h3>
              <p className="text-sm text-gray-500 mb-4">Appear as location options when submitting an alert.</p>

              {locationError && <p className="text-xs text-red-600 mb-2">{locationError}</p>}

              <div className="space-y-2 mb-4">
                {locations.map(loc => (
                  <div key={loc.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    {editingLocationId === loc.id ? (
                      <>
                        <input
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                          value={editLocationLabel}
                          onChange={e => setEditLocationLabel(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveLocation(loc.id)}
                        />
                        <button onClick={() => handleSaveLocation(loc.id)} className="text-xs text-green-600 hover:text-green-800 font-medium">Save</button>
                        <button onClick={() => setEditingLocationId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-400">📍</span>
                        <span className="flex-1 text-sm font-medium text-gray-800">{loc.label}</span>
                        <button
                          onClick={() => { setEditingLocationId(loc.id); setEditLocationLabel(loc.label) }}
                          className="text-xs text-gray-400 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteLocation(loc.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
                      </>
                    )}
                  </div>
                ))}
                {locations.length === 0 && !loadingConfig && (
                  <p className="text-sm text-gray-400">No locations yet.</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Add new</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="e.g. Block A"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddLocation()}
                  />
                  <button
                    onClick={handleAddLocation}
                    disabled={addingLocation}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {addingLocation ? '...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Email Routing — School Admin only */}
      {isSchoolAdmin && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Email Routing</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">School Admin</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Configure who receives notifications for each emergency alert type at your school.</p>

          {loadingRouting && <p className="text-sm text-gray-400 mb-4">Loading...</p>}
          {routingError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{routingError}</p>}

          {/* Emergency type selector — fetched from Firestore */}
          <div className="mb-4">
            <select
              value={selectedEmergencyType}
              onChange={e => setSelectedEmergencyType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 w-64"
            >
              <option value="">Select an emergency type</option>
              {emergencyTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.value}
                </option>
              ))}
            </select>
          </div>

          {/* Recipients panel for selected type */}
          {selectedEmergencyType && (() => {
            const type = emergencyTypes.find(t => t.value === selectedEmergencyType)
            if (!type) return null
            const recipients = getRecipients(type.value)
            const isSaving = savingRouting[type.value]
            const status = saveStatus[type.value]

            return (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <h3 className="font-semibold text-gray-900">{type.value}</h3>
                    <span className="text-xs text-gray-400">{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving && <span className="text-xs text-gray-400">Saving...</span>}
                    {status === 'saved' && <span className="text-xs text-green-600">✓ Saved</span>}
                    {status === 'error' && <span className="text-xs text-red-600">✗ Failed to save</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Current Recipients</p>
                  {recipients.length === 0 ? (
                    <p className="text-xs text-gray-400">No recipients yet — add from school users below.</p>
                  ) : (
                    <div className="space-y-2">
                      {recipients.map((r, index) => (
                        <div key={index} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{r.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-400">{formatRole(r.role)}</span>
                              {r.email && <span className="text-xs text-gray-400">📧 {r.email}</span>}
                              {r.phone && <span className="text-xs text-gray-400">📱 {r.phone}</span>}
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                r.notify === 'both' ? 'bg-blue-100 text-blue-700' :
                                r.notify === 'sms' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {r.notify === 'both' ? 'Email + SMS' : r.notify === 'sms' ? 'SMS' : 'Email'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveRecipient(type.value, index)}
                            className="text-xs text-gray-400 hover:text-red-600 shrink-0 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Add from school users</p>
                  {schoolUsers.length === 0 ? (
                    <p className="text-xs text-gray-400">No other users found at your school.</p>
                  ) : (
                    <div className="space-y-2">
                      {schoolUsers.map(user => {
                        const alreadyAdded = recipients.some(r => r.email?.toLowerCase() === user.email?.toLowerCase())
                        const notify = getNotifyPref(type.value, user.id)

                        return (
                          <div key={user.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                            alreadyAdded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'
                          }`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{user.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-gray-400">{formatRole(user.role)}</span>
                                {user.email && <span className="text-xs text-gray-400">📧 {user.email}</span>}
                                {user.phone && <span className="text-xs text-gray-400">📱 {user.phone}</span>}
                              </div>
                            </div>
                            {alreadyAdded ? (
                              <span className="text-xs text-green-600 font-medium shrink-0">✓ Added</span>
                            ) : (
                              <div className="flex items-center gap-2 shrink-0">
                                <select
                                  value={notify}
                                  onChange={e => setNotifyPref(type.value, user.id, e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                  <option value="email">Email</option>
                                  <option value="sms">SMS</option>
                                  <option value="both">Both</option>
                                </select>
                                <button
                                  onClick={() => handleAddUser(type.value, user)}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            )
          })()}

        </div>
      )}

    </div>
  )
}