import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Role normalisation ────────────────────────────────────────────────────────
// Maps raw Firestore role strings to display-friendly role names.
//
// Demo accounts:
//   admin@scout.edu         → companyAdmin → 'Company Admin'
//   schooladmin@school.edu  → schoolAdmin  → 'School Admin'
//   user@school.edu         → staff        → 'Staff'   (under school_alpha)
//   murali@school.edu       → staff        → 'Staff'   (under school_alpha)
function normaliseRole(raw) {
  switch ((raw || '').toLowerCase().replace(/[-_\s]/g, '')) {
    case 'companyadmin':
    case 'admin':         return 'Company Admin'
    case 'schooladmin':
    case 'principal':     return 'School Admin'
    case 'staff':
    case 'user':          return 'Staff'
    default:              return 'Staff'
  }
}

// ── Role fetching ─────────────────────────────────────────────────────────────
// Fetch the user's role, schoolId, and name from the backend using their
// Firebase ID token. The backend verifies the token and reads from Firestore.
async function fetchUserProfile(firebaseUser) {
  try {
    const token = await firebaseUser.getIdToken()
    const res = await fetch(`${API_BASE}/api/auth/role`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { role: 'Staff', schoolId: null, name: null }
    const data = await res.json()
    return {
      role:     normaliseRole(data.role),
      schoolId: data.schoolId || null,
      name:     data.name     || null,
    }
  } catch {
    return { role: 'Staff', schoolId: null, name: null }
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
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

  // logout
  async function logout() {
    await signOut(auth)
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
      userSchoolId,
      authLoading,
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
