import { Link } from 'react-router-dom'
import { Settings, AlertCircle, BarChart3, ExternalLink } from 'lucide-react'

function resolveIcon(title) {
  const t = (title || '').toLowerCase()
  if (t.includes('setup')) return Settings
  if (t.includes('live')) return AlertCircle
  if (t.includes('data') || t.includes('insight')) return BarChart3
  return ExternalLink
}

export default function ShortcutCard({ title, description, to }) {
  const Icon = resolveIcon(title)

  return (
    <Link
      to={to}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col min-h-40"
    >
      <div className="mb-3">
        <Icon className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="pt-4 text-right text-sm text-red-600 hover:underline font-medium">Open →</div>
    </Link>
  )
}
