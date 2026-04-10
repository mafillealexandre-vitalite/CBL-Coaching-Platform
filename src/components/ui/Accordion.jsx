import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Reusable accordion — state persisted in localStorage.
 *
 * Props:
 *  - id: string — unique key for localStorage persistence
 *  - title: string
 *  - icon: ReactNode (optional)
 *  - badge: string (optional, shown after title)
 *  - defaultOpen: boolean (default false)
 *  - children
 */
export default function Accordion({ id, title, icon, badge, defaultOpen = false, children }) {
  const storageKey = id ? `cbl_accordion_${id}` : null

  const [open, setOpen] = useState(() => {
    if (!storageKey) return defaultOpen
    try {
      const saved = localStorage.getItem(storageKey)
      return saved !== null ? JSON.parse(saved) : defaultOpen
    } catch {
      return defaultOpen
    }
  })

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-2/50 transition-colors"
      >
        {icon && (
          <span className="text-text-muted flex-shrink-0">{icon}</span>
        )}
        <span className="font-semibold text-text-primary flex-1 text-sm">{title}</span>
        {badge && (
          <span className="text-xs font-mono text-text-faint bg-surface-3 px-2 py-0.5 rounded-md flex-shrink-0">
            {badge}
          </span>
        )}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-text-faint flex-shrink-0"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 border-t border-border/50">
              <div className="pt-4">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
