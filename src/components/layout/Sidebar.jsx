import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { daysToComp } from '../../utils/dates'
import { getFeedback, getProgram, getStandards, getAvailabilityNotifs, getCurrentAthleteId, getAthletes, getRole, logoutAthlete } from '../../utils/coachStore'

// Compute notification badges (athlete-side)
function useBadges() {
  const athleteId = getCurrentAthleteId() || 'alexandre'
  const feedbacks = getFeedback(athleteId)
  const feedbackBadge = feedbacks.filter(f => f.status === 'replied' && !f.readByAthlete).length

  // New published weeks (simple: count total published weeks — could be refined)
  const program = getProgram(athleteId)
  const publishedWeeks = (program.cycles || []).flatMap(c =>
    (c.blocs || []).flatMap(b => (b.weeks || []).filter(w => w.status === 'published'))
  ).length
  // Mark as "seen" via localStorage key
  const seenWeeks = (() => { try { return parseInt(localStorage.getItem('cbl_seen_published_weeks') || '0') } catch { return 0 } })()
  const programmeBadge = Math.max(0, publishedWeeks - seenWeeks)

  const standards = getStandards()
  const seenStandards = (() => { try { return parseInt(localStorage.getItem('cbl_seen_standards') || '0') } catch { return 0 } })()
  const standardsBadge = Math.max(0, standards.length - seenStandards)

  return { feedbackBadge, programmeBadge, standardsBadge }
}

const links = [
  {
    to: '/dashboard',
    label: 'Accueil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/plan',
    label: 'Programme',
    badgeKey: 'programmeBadge',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    onClick: () => {
      const athleteId = getCurrentAthleteId() || 'alexandre'
      const p = getProgram(athleteId)
      const count = (p.cycles || []).flatMap(c => (c.blocs || []).flatMap(b => (b.weeks || []).filter(w => w.status === 'published'))).length
      localStorage.setItem('cbl_seen_published_weeks', String(count))
    },
  },
  {
    to: '/feedback',
    label: 'Feedback',
    badgeKey: 'feedbackBadge',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
    onClick: () => {
      // Marks feedback as read done via FeedbackPage itself
    },
  },
  {
    to: '/standards',
    label: 'Standards',
    badgeKey: 'standardsBadge',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    onClick: () => {
      const s = getStandards()
      localStorage.setItem('cbl_seen_standards', String(s.length))
    },
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
    to: '/coach-panel',
    label: 'Espace Coach',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    coach: true,
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const badges = useBadges()
  const navigate = useNavigate()
  const athleteId = getCurrentAthleteId()
  const role = getRole()
  const athletes = getAthletes()
  const currentAthlete = athletes.find(a => a.id === athleteId)
  const athleteName = currentAthlete?.name || 'Athlète'
  const isAlexandre = athleteId === 'alexandre' || (!athleteId && role !== 'coach')

  const handleLogout = () => {
    logoutAthlete()
    onClose()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + athlete */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div className="font-black text-base tracking-widest uppercase" style={{ color: '#ffffff', letterSpacing: '0.12em' }}>CBL <span style={{ color: '#0EA5E9' }}>COACH</span> PRO</div>
          </div>
        </div>
        {athleteId && (
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-widest uppercase font-medium" style={{ color: 'rgba(248,250,252,0.55)' }}>
              {athleteName}
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-1 rounded-md hover:bg-white/8 transition-colors"
              style={{ color: 'rgba(248,250,252,0.35)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(link => {
          const badge = link.badgeKey ? badges[link.badgeKey] : 0
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => { onClose(); link.onClick?.() }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand/20 text-brand border border-brand/30'
                    : 'hover:bg-white/8'
                }`
              }
              style={({ isActive }) => ({ color: isActive ? '#0EA5E9' : 'rgba(248,250,252,0.65)' })}
            >
              {link.icon}
              <span className="flex-1">{link.label}</span>
              {badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand text-black text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </NavLink>
          )
        })}

        {/* Separator */}
        <div className="pt-3 pb-1">
          <div className="h-px mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {bottomLinks.filter(link => !link.coach || role === 'coach').map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? link.coach
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : (link.accent ? 'bg-warn/20 border border-warn/30' : 'bg-brand/20 text-brand border border-brand/30')
                  : 'hover:bg-white/8'
              }`
            }
            style={({ isActive }) => ({
              color: isActive
                ? link.coach ? '#A78BFA' : (link.accent ? '#F59E0B' : '#0EA5E9')
                : 'rgba(248,250,252,0.65)'
            })}
          >
            {link.icon}
            {link.label}
            {link.accent && (
              <span className="ml-auto text-[9px] bg-warn/20 text-warn px-1.5 py-0.5 rounded-full font-bold">LOCAL</span>
            )}
            {link.coach && (
              <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">COACH</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Competition countdown — Alexandre only */}
      {isAlexandre && <CompetitionCountdown />}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col flex-shrink-0" style={{ background: '#1A2332', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
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
            className="fixed left-0 top-0 bottom-0 z-40 w-56 flex flex-col md:hidden"
            style={{ background: '#1A2332', borderRight: '1px solid rgba(255,255,255,0.06)' }}
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function CompetitionCountdown() {
  const diff = daysToComp()

  return (
    <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-[10px] font-medium tracking-widest uppercase mb-1.5" style={{ color: 'rgba(248,250,252,0.4)' }}>Prochaine compét.</div>
      <div className="text-2xl font-bold text-brand tabular-nums">{diff}j</div>
      <div className="text-xs mt-0.5" style={{ color: 'rgba(248,250,252,0.5)' }}>CBL Open Qualifier 2026</div>
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full bg-brand rounded-full"
          style={{ width: `${Math.max(5, Math.min(95, (1 - diff / 150) * 100))}%` }}
        />
      </div>
    </div>
  )
}
