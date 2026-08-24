import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

// Show the search box only once the list is long enough to be awkward to scan.
const SEARCHABLE_THRESHOLD = 8

const CATEGORY_GROUPS = [
  { key: 'emergency', label: 'Emergency Types' },
  { key: 'general', label: 'General Types' },
]

function groupLabel(category) {
  return CATEGORY_GROUPS.find(group => group.key === category)?.label || 'Other Types'
}

/**
 * Searchable, category-grouped dropdown for the alert types configured by the
 * Company Admin. `types` items are { value, label, icon, category }.
 */
export default function AlertTypeSelect({ types, value, onChange, placeholder = 'Select an alert type', disabled = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const searchable = types.length > SEARCHABLE_THRESHOLD

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return types
    return types.filter(type =>
      type.label.toLowerCase().includes(term) || groupLabel(type.category).toLowerCase().includes(term)
    )
  }, [types, query])

  // Keep the flat list (used for keyboard nav) in the same order as the grouped render.
  const ordered = useMemo(() => {
    const known = CATEGORY_GROUPS.flatMap(group => filtered.filter(type => type.category === group.key))
    const rest = filtered.filter(type => !CATEGORY_GROUPS.some(group => group.key === type.category))
    return [...known, ...rest]
  }, [filtered])

  const grouped = useMemo(() => {
    const groups = []
    for (const type of ordered) {
      const label = groupLabel(type.category)
      const existing = groups.find(group => group.label === label)
      if (existing) existing.items.push(type)
      else groups.push({ label, items: [type] })
    }
    return groups
  }, [ordered])

  const selected = types.find(type => type.value === value) || null

  useEffect(() => {
    if (!open) return

    const handleClickOutside = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus()
  }, [open, searchable])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector('[data-active="true"]')
    // scrollIntoView is missing in some non-browser environments (e.g. jsdom)
    node?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, open])

  const openMenu = () => {
    setActiveIndex(0)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  const select = type => {
    onChange(type.value)
    close()
  }

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      close()
      return
    }
    if (!open) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        openMenu()
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(index => Math.min(index + 1, ordered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const type = ordered[activeIndex]
      if (type) select(type)
    } else if (event.key === 'Tab') {
      close()
    }
  }

  let flatIndex = -1

  return (
    <div ref={containerRef} className="relative w-72" onKeyDown={handleKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Emergency type"
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        className={`w-full flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-red-400 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
        }`}
      >
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
          {selected ? `${selected.icon} ${selected.label}` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={event => {
                    setQuery(event.target.value)
                    setActiveIndex(0)
                  }}
                  placeholder="Search alert types..."
                  aria-label="Search alert types"
                  className="w-full border border-gray-200 rounded-md pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
          )}

          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {ordered.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-400">No alert types match "{query}".</li>
            )}
            {grouped.map(group => (
              <li key={group.label}>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {group.label}
                </p>
                <ul>
                  {group.items.map(type => {
                    flatIndex += 1
                    const isActive = flatIndex === activeIndex
                    const isSelected = type.value === value
                    return (
                      <li key={type.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          data-active={isActive}
                          onMouseEnter={() => setActiveIndex(ordered.indexOf(type))}
                          onClick={() => select(type)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                            isActive ? 'bg-red-50' : ''
                          } ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}
                        >
                          <span>{type.icon}</span>
                          <span className="flex-1 truncate">{type.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
