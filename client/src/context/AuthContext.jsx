import { createContext, useContext, useState } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

function loadSession() {
  try {
    const token = localStorage.getItem('auth_token')
    const stored = localStorage.getItem('scout_user')
    if (token && stored) return JSON.parse(stored)
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadSession())

  const login = async (email, password) => {
    try {
      const { token, user } = await authAPI.login(email, password)

      localStorage.setItem('auth_token', token)
      localStorage.setItem('scout_user', JSON.stringify(user))
      setCurrentUser(user)

      return { success: true }
    } catch (error) {
      return { success: false, message: error.message || 'Invalid email or password.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
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