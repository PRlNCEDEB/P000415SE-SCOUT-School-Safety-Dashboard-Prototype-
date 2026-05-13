import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO_PASSWORD = 'password123'

const demoAccounts = [
  {
    label: 'Company Admin',
    email: 'admin@scout.edu',
    password: DEMO_PASSWORD,
    badgeClass: 'bg-red-100 text-red-700',
  },
  {
    label: 'School Admin',
    email: 'schooladmin@school.edu',
    password: DEMO_PASSWORD,
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  {
    label: 'Staff',
    email: 'staff@school.edu',
    password: DEMO_PASSWORD,
    badgeClass: 'bg-blue-100 text-blue-700',
  },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function getLoginErrorMessage(err) {
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/invalid-credential'
    ) {
      return 'Invalid email or password.'
    }

    if (err.code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please try again later.'
    }

    if (err.code === 'auth/user-disabled') {
      return 'This account has been disabled. Contact your Safety Manager.'
    }

    return 'Login failed. Please try again.'
  }

  const signIn = async (loginEmail, loginPassword) => {
    setError('')
    setLoading(true)

    try {
      await login(loginEmail.trim(), loginPassword)
      navigate('/dashboard')
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    await signIn(email, password)
  }

  const handleDemoLogin = async (account) => {
    setEmail(account.email)
    setPassword(account.password)
    await signIn(account.email, account.password)
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

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Quick demo login</p>
            <div className="grid gap-2">
              {demoAccounts.map(account => (
                <button
                  key={account.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin(account)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{account.label}</span>
                    <span className="block text-xs text-gray-500">{account.email}</span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${account.badgeClass}`}>
                    {account.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
