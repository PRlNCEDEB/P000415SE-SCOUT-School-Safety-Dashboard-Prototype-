// Demo users for testing — 2 school admins + 2 staff across Beta and Gamma schools.
//
// These are seeded into Firebase Auth AND the Firestore `users` collection by
// seedDemoUsers.js.  The Firestore document ID is always the Firebase Auth UID
// so the /api/auth/role lookup works without a fallback email scan.
//
// Role values must normalise to 'schooladmin' or 'staff' via AuthContext's
// normaliseRole():  'School Admin' → 'schooladmin', 'staff' → 'staff'.

const DEMO_PASSWORD = 'Scout@1234'   // shared test password — change before production

const demoUsers = [
  // ── Beta School ────────────────────────────────────────────────────────────
  {
    email:      'admin.beta@scout.edu',
    name:       'Beta Admin',
    role:       'School Admin',
    schoolId:   'school_beta',
    schoolName: 'Beta School',
    password:   DEMO_PASSWORD,
  },
  {
    email:      'staff.beta@scout.edu',
    name:       'Beta Staff',
    role:       'staff',
    schoolId:   'school_beta',
    schoolName: 'Beta School',
    password:   DEMO_PASSWORD,
  },

  // ── Gamma School ───────────────────────────────────────────────────────────
  {
    email:      'admin.gamma@scout.edu',
    name:       'Gamma Admin',
    role:       'School Admin',
    schoolId:   'school_gamma',
    schoolName: 'Gamma School',
    password:   DEMO_PASSWORD,
  },
  {
    email:      'staff.gamma@scout.edu',
    name:       'Gamma Staff',
    role:       'staff',
    schoolId:   'school_gamma',
    schoolName: 'Gamma School',
    password:   DEMO_PASSWORD,
  },
]

module.exports = { demoUsers, DEMO_PASSWORD }
