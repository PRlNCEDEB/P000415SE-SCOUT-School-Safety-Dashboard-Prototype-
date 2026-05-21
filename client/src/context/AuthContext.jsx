import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Role normalization for backend role values.
function normaliseRole(raw) {
  switch ((raw || '').toLowerCase().replace(/[-_\s]/g, '')) {
    case 'companyadmin':
      return 'Company Admin'
    case 'schooladmin':
      return 'School Admin'
    case 'staff':
      return 'Staff'
    default:
      return 'Staff'
  }
}

// Fetch role details from backend using Firebase ID token.
async function fetchUserProfile(firebaseUser) {
  try {
    const token = await firebaseUser.getIdToken()
    let res = await fetch(`${API_BASE_URL}/auth/role`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 401) {
      const freshToken = await firebaseUser.getIdToken(true)
      res = await fetch(`${API_BASE_URL}/auth/role`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      })
    }

    if (!res.ok) {
      if (res.status === 401) {
        return { role: 'Staff', schoolId: null, name: null }
      }

      return { role: 'Staff', schoolId: null, name: null }
    }

    const data = await res.json()
    return {
      role: normaliseRole(data.role),
      schoolId: data.schoolId || null,
      name: data.name || null,
    }
  } catch {
    return { role: 'Staff', schoolId: null, name: null }
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userSchoolId, setUserSchoolId] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser)

        const { role, schoolId, name } = profile

        // Preserve name from profile if auth displayName is missing.
        if (name && !firebaseUser.displayName) {
          firebaseUser._profileName = name
        }

        setCurrentUser(firebaseUser)
        setUserRole(role)
        setUserSchoolId(schoolId)
      } else {
        setCurrentUser(null)
        setUserRole(null)
        setUserSchoolId(null)
      }

      setAuthLoading(false)
    })

    return unsubscribe
  }, [])

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  const isCompanyAdmin = userRole === 'Company Admin'
  const isSchoolAdmin = userRole === 'School Admin'
  const isStaff = userRole === 'Staff'
  const isAdmin = isCompanyAdmin || isSchoolAdmin

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        userSchoolId,
        authLoading,
        login,
        logout,
        isCompanyAdmin,
        isSchoolAdmin,
        isStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
