import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { schoolAPI } from '../api/client'
import { useAuth } from './AuthContext'

// One provider owns the school list for the whole app. Every dropdown reads
// from here rather than fetching its own copy, which is what makes a newly
// created school appear everywhere at once instead of page by page.
//
// Freshness comes from three signals rather than a socket connection:
//   • a mutation through this context refetches immediately (instant for the
//     admin who made the change),
//   • window focus and tab visibility changes revalidate (instant for anyone
//     switching back to the tab),
//   • a slow background poll catches everything else.
const POLL_INTERVAL_MS = 60 * 1000

// Focus and visibility events can fire in bursts (alt-tabbing, dev tools).
// Requests inside this window are skipped unless explicitly forced.
const MIN_REVALIDATE_INTERVAL_MS = 10 * 1000

const SchoolsContext = createContext(null)

export function SchoolsProvider({ children }) {
  const { authLoading, currentUser, userRole, isCompanyAdmin } = useAuth()

  // Raw server response. A Company Admin also receives deactivated schools so
  // the Setup page can manage them; `schools` below is the active-only view the
  // dropdowns use.
  const [allSchools, setAllSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  const mountedRef = useRef(true)
  const inFlightRef = useRef(null)
  const lastFetchedAtRef = useRef(0)

  // Monotonic request counter. Responses that are not from the newest request
  // are discarded, so a slow earlier reply can never overwrite a newer one.
  const requestSeqRef = useRef(0)

  // Last `version` seen from the server. It increments on every school change,
  // so an unchanged value means the background poll can skip the state write
  // and avoid re-rendering every dropdown in the app for nothing.
  const lastVersionRef = useRef(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Wait for the role as well as the user: the backend scopes the list by role,
  // so fetching before the role resolves would cache the wrong scope.
  const ready = !authLoading && Boolean(currentUser) && userRole !== null
  const userId = currentUser?.uid ?? null
  const signedOut = !authLoading && !currentUser

  const load = useCallback(
    async ({ force = false } = {}) => {
      if (!ready) return undefined

      if (!force) {
        if (Date.now() - lastFetchedAtRef.current < MIN_REVALIDATE_INTERVAL_MS) return undefined

        // Collapse overlapping background revalidations (a poll firing while a
        // focus refetch is in flight) into the request already running.
        //
        // A forced load deliberately does NOT reuse it: after a mutation the
        // in-flight request was issued before the change and would resolve with
        // a list that does not contain it yet.
        if (inFlightRef.current) return inFlightRef.current
      }

      const seq = requestSeqRef.current + 1
      requestSeqRef.current = seq

      const request = (async () => {
        try {
          const result = await schoolAPI.list({ includeInactive: isCompanyAdmin })

          if (!mountedRef.current || seq !== requestSeqRef.current) return

          if (force || lastVersionRef.current !== result.version) {
            setAllSchools(result.schools)
          }

          lastVersionRef.current = result.version
          setVersion(result.version)
          setError('')
          lastFetchedAtRef.current = Date.now()
        } catch (err) {
          // Keep the previously loaded list on failure a stale dropdown is
          // far better than an empty one during a transient network blip.
          if (mountedRef.current && seq === requestSeqRef.current) {
            setError(err.message || 'Failed to load schools.')
          }
        } finally {
          if (mountedRef.current && seq === requestSeqRef.current) setLoading(false)
          if (inFlightRef.current === request) inFlightRef.current = null
        }
      })()

      inFlightRef.current = request
      return request
    },
    [ready, isCompanyAdmin]
  )

  // Initial load, and a full reload whenever the signed-in user or their role
  // changes (the scope of the list changes with them).
  useEffect(() => {
    if (!ready) {
      // Signed out: drop the list so the next user never sees the previous
      // user's schools.
      if (signedOut) {
        setAllSchools([])
        setError('')
        setLoading(false)
        lastFetchedAtRef.current = 0
        lastVersionRef.current = null
        requestSeqRef.current += 1   // discard any reply still in flight
      }
      return
    }

    setLoading(true)
    lastFetchedAtRef.current = 0
    lastVersionRef.current = null
    load({ force: true })
  }, [ready, signedOut, userId, userRole, load])

  // Revalidation triggers.
  useEffect(() => {
    if (!ready) return undefined

    // Skip work entirely while the tab is hidden a background tab polling
    // every minute is wasted requests for a list that rarely changes.
    const revalidate = () => {
      if (document.visibilityState === 'visible') load()
    }

    window.addEventListener('focus', revalidate)
    document.addEventListener('visibilitychange', revalidate)
    const timer = setInterval(revalidate, POLL_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', revalidate)
      document.removeEventListener('visibilitychange', revalidate)
      clearInterval(timer)
    }
  }, [ready, load])

  const refresh = useCallback(() => load({ force: true }), [load])

  // Mutations refetch immediately so the acting admin sees the change at once,
  // in every dropdown, without waiting for the poll.
  const createSchool = useCallback(
    async name => {
      const school = await schoolAPI.create(name)
      await load({ force: true })
      return school
    },
    [load]
  )

  const renameSchool = useCallback(
    async (id, name) => {
      const result = await schoolAPI.rename(id, name)
      await load({ force: true })
      return result
    },
    [load]
  )

  const setSchoolActive = useCallback(
    async (id, active) => {
      const school = await schoolAPI.setActive(id, active)
      await load({ force: true })
      return school
    },
    [load]
  )

  // Dropdowns show active schools only. The filter is applied for a Company
  // Admin alone: for every other role the server already scoped the list and
  // deliberately includes their own school even when it is deactivated, so
  // filtering here would blank out their dashboard and analytics headings.
  const schools = useMemo(
    () => (isCompanyAdmin ? allSchools.filter(school => school.active !== false) : allSchools),
    [allSchools, isCompanyAdmin]
  )

  const schoolsById = useMemo(
    () => new Map(schools.map(school => [school.id, school])),
    [schools]
  )

  // Resolves a display name for any schoolId, including one that is no longer
  // in the list (a deactivated school still referenced by old incidents).
  const getSchoolName = useCallback(
    (schoolId, fallback = null) => schoolsById.get(schoolId)?.name || fallback,
    [schoolsById]
  )

  const value = useMemo(
    () => ({
      schools,
      allSchools,
      schoolsById,
      loading,
      error,
      version,
      refresh,
      getSchoolName,
      createSchool,
      renameSchool,
      setSchoolActive,
    }),
    [schools, allSchools, schoolsById, loading, error, version, refresh, getSchoolName, createSchool, renameSchool, setSchoolActive]
  )

  return <SchoolsContext.Provider value={value}>{children}</SchoolsContext.Provider>
}

export function useSchools() {
  const context = useContext(SchoolsContext)

  if (!context) {
    throw new Error('useSchools must be used inside a SchoolsProvider.')
  }

  return context
}
