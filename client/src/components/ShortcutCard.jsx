import { Link } from 'react-router-dom'

export default function ShortcutCard({ title, description, to }) {
  const icon = title && (
    title.toLowerCase().includes('setup') ? '⚙️'
    : title.toLowerCase().includes('live') ? '🚨'
    : title.toLowerCase().includes('data') || title.toLowerCase().includes('insight') ? '📊'
    : '🔗'
  )

  return (
    <Link
      to={to}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col min-h-40"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="pt-4 text-right text-sm text-red-600 hover:underline font-medium">Open →</div>
    </Link>
  )
}
