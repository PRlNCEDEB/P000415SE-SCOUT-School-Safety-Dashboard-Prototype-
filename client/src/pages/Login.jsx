import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // TODO: Replace hardcoded login validation with backend authentication.
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    // TODO: Send login credentials to the backend and validate the user session/role before redirecting.
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      // TODO: Redirect after a successful backend login and store the returned auth token/session if required.
      navigate('/')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mb-3">
            <span className="text-white text-xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SCOUT</h1>
          <p className="text-sm text-gray-500 mt-1">School Safety Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue.</p>

          {/* Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <p className="text-xs text-amber-800">
              ⚠️ Self-registration is not permitted. Contact your Safety Manager to request access.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* TODO: Remove demo credentials once backend authentication is connected. */}
        

      </div>
    </div>
  )
}
