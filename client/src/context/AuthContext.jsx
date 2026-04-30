import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // login(mockUser, role) — matches main branch AuthContext API.
  // mockUser is a plain object with uid, email, displayName, photoURL.
  // role is a string: 'Admin' | 'User'
  async function login(mockUser, role) {
    setCurrentUser(mockUser)
    setUserRole(role)
  }

  function logout() {
    setCurrentUser(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRole,
      login,
      logout,
      isAdmin: userRole === 'Admin',
      isUser: userRole === 'User',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
