import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // login(mockUser, role) — accepts 'company_admin' | 'school_admin' | 'staff'
  // mockUser is a plain object with uid, email, displayName, photoURL.
  async function login(mockUser, role) {
    setCurrentUser(mockUser)
    setUserRole(role)
  }

  function logout() {
    setCurrentUser(null)
    setUserRole(null)
  }

  // Role check helpers
  const isCompanyAdmin = userRole === 'company_admin'
  const isSchoolAdmin = userRole === 'school_admin'
  const isStaff = userRole === 'staff'
  const isAdmin = isCompanyAdmin || isSchoolAdmin

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRole,
      login,
      logout,
      isCompanyAdmin,
      isSchoolAdmin,
      isStaff,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
