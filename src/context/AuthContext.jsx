import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const mockUsers = [
  { id: '1', name: 'Admin User', email: 'admin@school.edu', password: 'password123', role: 'admin' },
  { id: '2', name: 'Staff User', email: 'user@school.edu', password: 'password123', role: 'user' },
]

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  const login = (email, password) => {
    const found = mockUsers.find(u => u.email === email && u.password === password)
    if (found) {
      setCurrentUser(found)
      return { success: true }
    }
    return { success: false, message: 'Invalid email or password' }
  }

  const logout = () => setCurrentUser(null)

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAdmin: currentUser?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}