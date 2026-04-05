import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/plan',
    label: 'Plan 3 mois',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
  },
  {
    to: '/session',
    label: 'Séance du jour',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    to: '/circuits',
    label: 'Circuits CBL',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    to: '/stats',
    label: 'Mes stats',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    to: '/progression',
    label: 'Progression',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

const bottomLinks = [
  {
    to: '/diagnostic',
    label: 'Diagnostic',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
      </svg>
    ),
  },
  {
    to: '/coach',
    label: 'Coach IA',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: true,
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-text-primary">CBL COACH</div>
            <div className="text-[10px] text-text-muted tracking-widest uppercase">Alexandre Mafille</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand/10 text-brand border border-brand/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}

        {/* Separator */}
        <div className="pt-3 pb-1">
          <div className="h-px bg-border mx-1" />
        </div>

        {bottomLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? (link.accent ? 'bg-warn/10 text-warn border border-warn/20' : 'bg-brand/10 text-brand border border-brand/20')
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
              }`
            }
          >
            {link.icon}
            {link.label}
            {link.accent && (
              <span className="ml-auto text-[9px] bg-warn/20 text-warn px-1.5 py-0.5 rounded-full font-bold">LOCAL</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Competition countdown */}
      <CompetitionCountdown />
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-surface flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -224 }}
            animate={{ x: 0 }}
            exit={{ x: -224 }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed left-0 top-0 bottom-0 z-40 w-56 flex flex-col border-r border-border bg-surface md:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function CompetitionCountdown() {
  const compDate = new Date('2026-09-01')
  const today = new Date()
  const diff = Math.ceil((compDate - today) / (1000 * 60 * 60 * 24))

  return (
    <div className="mx-3 mb-4 p-3 rounded-xl bg-surface-2 border border-border">
      <div className="label mb-1.5">Prochaine compét.</div>
      <div className="text-2xl font-bold text-brand tabular-nums">{diff}j</div>
      <div className="text-xs text-text-muted mt-0.5">CBL Open Qualifier 2026</div>
      <div className="mt-2 h-1 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full"
          style={{ width: `${Math.max(5, Math.min(95, (1 - diff / 150) * 100))}%` }}
        />
      </div>
    </div>
  )
}
