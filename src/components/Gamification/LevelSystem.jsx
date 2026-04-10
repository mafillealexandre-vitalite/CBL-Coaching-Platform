/**
 * Level system — Rookie → Légende
 * Based on total sessions logged in localStorage.
 */

export const LEVELS = [
  { name: 'Rookie',    min: 0,   color: '#94A3B8', icon: '🎯' },
  { name: 'Engagé',   min: 10,  color: '#0EA5E9', icon: '💪' },
  { name: 'Confirmé', min: 30,  color: '#10B981', icon: '⚡' },
  { name: 'Elite',    min: 75,  color: '#F59E0B', icon: '🏅' },
  { name: 'Légende',  min: 150, color: '#8B5CF6', icon: '👑' },
]

export function getLevel(totalSessions) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (totalSessions >= lvl.min) current = lvl
    else break
  }
  return current
}

export function getNextLevel(totalSessions) {
  const idx = LEVELS.findIndex(l => l.min > totalSessions)
  return idx >= 0 ? LEVELS[idx] : null
}

export function getLevelProgress(totalSessions) {
  const current = getLevel(totalSessions)
  const next = getNextLevel(totalSessions)
  if (!next) return 100
  const range = next.min - current.min
  const done = totalSessions - current.min
  return Math.min(100, Math.round((done / range) * 100))
}

/** Small rank badge shown in dashboard header */
export function LevelBadge({ totalSessions }) {
  const level = getLevel(totalSessions)
  const next = getNextLevel(totalSessions)
  const pct = getLevelProgress(totalSessions)

  return (
    <div className="flex items-center gap-2">
      {/* SVG progress arc */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#E2E8F0" strokeWidth="3" />
          <circle
            cx="20" cy="20" r="16"
            fill="none"
            stroke={level.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 16}
            strokeDashoffset={2 * Math.PI * 16 * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base leading-none">
          {level.icon}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold" style={{ color: level.color }}>{level.name}</div>
        {next && (
          <div className="text-[10px] text-text-faint">{pct}% → {next.name}</div>
        )}
      </div>
    </div>
  )
}

/** Full level-up modal */
import { motion, AnimatePresence } from 'framer-motion'

export function LevelUpModal({ level, onClose }) {
  return (
    <AnimatePresence>
      {level && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(15,25,35,0.55)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="bg-white rounded-2xl p-8 max-w-xs w-full text-center shadow-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl mb-3">{level.icon}</div>
            <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: level.color }}>
              Niveau atteint
            </div>
            <div className="text-2xl font-bold text-text-primary mb-2">{level.name}</div>
            <p className="text-sm text-text-muted mb-6">
              Félicitations ! Un nouveau circuit est maintenant disponible.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm"
              style={{ background: level.color }}
            >
              Continuer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
