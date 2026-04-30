import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MOCK_USERS } from '../data/mockData'

// Demo account quick-fill buttons — kept in sync with MOCK_USERS
const demoAccounts = MOCK_USERS.map(u => ({
  name: u.displayName,
  email: u.email,
  role: u.role,
  color: u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700',
}))

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 400))

    // Match against MOCK_USERS (same source as main branch)
    const matched = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    )

    if (!matched) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Build the user object AuthContext expects (matches main branch shape)
    const mockFirebaseUser = {
      uid: matched.uid,
      email: matched.email,
      displayName: matched.displayName,
      name: matched.displayName,
      photoURL: matched.photoURL ?? null,
    }

    // Normalise role to title-case so isAdmin check ('Admin') works
    // regardless of how the role is stored (Firestore uses lowercase 'admin')
    const normalisedRole = matched.role.charAt(0).toUpperCase() + matched.role.slice(1)

    try {
      await login(mockFirebaseUser, normalisedRole)
      navigate('/dashboard')
    } catch (err) {
      setError('Login failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl mb-3">
            <span className="text-white text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SCOUT</h1>
          <p className="text-sm text-gray-500 mt-1">School Safety Management System</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue.</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <p className="text-xs text-amber-800">
              Self-registration is not permitted. Contact your Safety Manager to request access.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
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
                onChange={event => setPassword(event.target.value)}
                placeholder="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-3">
            Demo accounts, password: <code className="bg-gray-100 px-1 rounded">password123</code>
          </p>
          <div className="space-y-2">
            {demoAccounts.map(account => (
              <button
                key={account.email}
                onClick={() => {
                  setEmail(account.email)
                  setPassword('password123')
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm text-gray-800">{account.name}</p>
                  <p className="text-xs text-gray-400">{account.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${account.color}`}>
                  {account.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
