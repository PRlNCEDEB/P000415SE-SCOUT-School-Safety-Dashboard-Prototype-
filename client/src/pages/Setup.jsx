import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Setup() {
  const { isCompanyAdmin, isSchoolAdmin } = useAuth()
  const [schoolName, setSchoolName] = useState('')
  const [systemValue, setSystemValue] = useState('')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Setup</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-2">Your School Settings</h3>
          <p className="text-sm text-gray-500 mb-4">These settings apply only to your school.</p>
          <label className="block text-xs text-gray-600 mb-1">School display name</label>
          <input value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <div className="mt-4">
            <button className="px-3 py-2 bg-blue-600 text-white rounded">Save school settings</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-2">System-wide Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">Only Company Admins can update global settings.</p>
          <label className="block text-xs text-gray-600 mb-1">System value</label>
          <input value={systemValue} onChange={e => setSystemValue(e.target.value)} className="w-full px-3 py-2 border rounded" disabled={!isCompanyAdmin} />
          <div className="mt-4">
            <button className={`px-3 py-2 rounded ${isCompanyAdmin ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`} disabled={!isCompanyAdmin}>
              {isCompanyAdmin ? 'Save global settings' : 'Insufficient permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
