import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { settingsAPI } from '../api/client'

export default function Setup() {
  const { isCompanyAdmin, isSchoolAdmin } = useAuth()
  const canEditSchoolSettings = isCompanyAdmin || isSchoolAdmin
  const [schoolName, setSchoolName] = useState('')
  const [systemValue, setSystemValue] = useState('')

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
      <h1 className="text-2xl font-bold mb-4">Setup</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-2">Your School Settings</h3>
          <p className="text-sm text-gray-500 mb-4">These settings apply only to your school.</p>
          <label className="block text-xs text-gray-600 mb-1">School display name</label>
          <input value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full px-3 py-2 border rounded" disabled={!canEditSchoolSettings} />
          <div className="mt-4">
            <button className="px-3 py-2 bg-blue-600 text-white rounded" disabled={!canEditSchoolSettings}>Save school settings</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-2">System-wide Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">Only Company Admins can update global settings.</p>

          <label className="block text-xs text-gray-600 mb-1">System value</label>
          <input value={systemValue} onChange={e => setSystemValue(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" disabled={!isCompanyAdmin} />

          <label className="block text-xs text-gray-600 mb-1">
            Unacknowledged alert threshold (minutes)
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Alerts that remain unacknowledged longer than this will be flagged as overdue.
          </p>
          <input
            type="number"
            min={1}
            max={1440}
            value={thresholdLoading ? '' : overdueThreshold}
            onChange={e => {
              setThresholdSuccess(false)
              setThresholdError('')
              setOverdueThreshold(e.target.value)
            }}
            placeholder={thresholdLoading ? 'Loading…' : '15'}
            className="w-full px-3 py-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
            disabled={!isCompanyAdmin || thresholdLoading}
          />

          {thresholdError && (
            <p className="text-xs text-red-600 mt-1">{thresholdError}</p>
          )}
          {thresholdSuccess && (
            <p className="text-xs text-green-600 mt-1">✓ Settings saved.</p>
          )}

          <div className="mt-4">
            <button
              onClick={handleSaveGlobalSettings}
              disabled={!isCompanyAdmin || thresholdSaving || thresholdLoading}
              className={`px-3 py-2 rounded ${isCompanyAdmin ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-600 cursor-not-allowed'} disabled:opacity-50`}
            >
              {thresholdSaving ? 'Saving…' : isCompanyAdmin ? 'Save global settings' : 'Insufficient permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
