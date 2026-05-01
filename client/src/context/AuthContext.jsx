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
  const [userRole,    setUserRole]    = useState(null)
  const [userSchoolId, setUserSchoolId] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Listen for Firebase auth state changes (handles page refresh automatically)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { role, schoolId, name } = await fetchUserProfile(firebaseUser)
        // Attach display name from Firestore if Firebase Auth doesn't have it
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

  // login — called from Login.jsx
  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
    // onAuthStateChanged fires automatically and sets currentUser + userRole
  }

  // logout
  async function logout() {
    await signOut(auth)
  }

  const isCompanyAdmin = userRole === 'Company Admin'
  const isSchoolAdmin  = userRole === 'School Admin'
  const isStaff        = userRole === 'Staff'

  // Legacy helper: Company Admin or School Admin counts as "admin" for nav/route gating
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
