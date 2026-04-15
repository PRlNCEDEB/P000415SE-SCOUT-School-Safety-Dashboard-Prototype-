import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const alertTypes = [
  { value: 'medical', label: '🏥 Medical' },
  { value: 'fire', label: '🔥 Fire' },
  { value: 'lockdown', label: '🔒 Lockdown' },
  { value: 'behaviour', label: '⚠️ Behaviour' },
  { value: 'weather', label: '🌩️ Weather' },
  { value: 'maintenance', label: '🔧 Maintenance' },
  { value: 'general', label: '📢 General' },
]

const priorities = [
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '⚪ Low' },
]

const locations = [
  'Oval', 'Canteen', 'Block A', 'Block B', 'Block C',
  'Main Building', 'Cafeteria', 'Library', 'Car Park', 'Reception',
]

export default function SubmitAlert({ onSubmitAlert }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type: '',
    priority: '',
    title: '',
    description: '',
    location: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
 // TODO: Keep basic client-side validation here, but also validate all alert fields again on the backend before saving.
  const validate = () => {
    const e = {}
    if (!form.type) e.type = 'Please select an alert type'
    if (!form.priority) e.priority = 'Please select a priority'
    if (!form.title.trim()) e.title = 'Please enter a title'
    if (!form.location) e.location = 'Please select a location'
    return e
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }
  // TODO: Replace local submit handling with a backend API request to create a new alert event.
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const e2 = validate()
    if (Object.keys(e2).length > 0) {
      setErrors(e2)
      return
    }

    setIsSubmitting(true)
    try {
      const createdIncident = await Promise.resolve(onSubmitAlert(form))
      navigate(`/incidents/${createdIncident.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Alert</h1>
        <p className="text-sm text-gray-500">Report a safety incident or concern</p>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">

        {/* Alert Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {alertTypes.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleChange('type', t.value)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors text-left ${
                  form.type === t.value
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {priorities.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleChange('priority', p.value)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors text-left ${
                  form.priority === p.value
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="Brief description of the incident"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <select
            value={form.location}
            onChange={e => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select a location</option>
            {locations.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Any additional details about the incident..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : '🚨 Submit Alert'}
        </button>

      </div>
    </div>
  )
}