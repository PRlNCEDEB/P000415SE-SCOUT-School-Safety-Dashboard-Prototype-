import { createContext, useContext, useState } from 'react'
import { loginUser } from '../api/client'

const AuthContext = createContext(null)

function loadSession() {
  try {
    const stored = localStorage.getItem('scout_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadSession())

  const login = async (email, password) => {
    try {
      // Call the real backend — verifies against Firestore
      const { token, user } = await loginUser(email, password)

      // Persist token and user session
      localStorage.setItem('scout_token', token)
      localStorage.setItem('scout_user', JSON.stringify(user))
      setCurrentUser(user)

      return { success: true }
    } catch (error) {
      return { success: false, message: error.message || 'Invalid email or password.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('scout_token')
    localStorage.removeItem('scout_user')
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAdmin: currentUser?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}