/**
 * Feature 2b — Technique guide modal
 * Opens when user clicks an exercise name.
 */
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SVG_ILLUSTRATIONS } from './MovementSVGs'

const CATEGORY_COLORS = {
  PULL:   { bg: 'rgba(14,165,233,0.1)',  text: '#0EA5E9' },
  PUSH:   { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444' },
  LEGS:   { bg: 'rgba(16,185,129,0.1)',  text: '#10B981' },
  CORE:   { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B' },
  CARDIO: { bg: 'rgba(139,92,246,0.1)',  text: '#8B5CF6' },
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export default function TechniqueModal({ standard, isOpen, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const categoryStyle = standard ? (CATEGORY_COLORS[standard.category] || CATEGORY_COLORS.PULL) : {}
  const illustration = standard ? SVG_ILLUSTRATIONS[standard.svgKey] : null

  const storageKey = standard ? `cbl_technique_validated_${standard.id}` : null
  const isValidated = storageKey ? !!localStorage.getItem(storageKey) : false

  const handleValidate = () => {
    if (storageKey) {
      if (isValidated) localStorage.removeItem(storageKey)
      else localStorage.setItem(storageKey, '1')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && standard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ background: 'rgba(15,25,35,0.5)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(15,25,35,0.16)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <span className="text-[10px] font-bold tracking-widest uppercase text-text-faint">
                Guide technique
              </span>
              <button onClick={onClose} className="text-text-faint hover:text-text-muted transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content — responsive: row on desktop, col on mobile */}
            <div className="flex flex-col sm:flex-row min-h-0">
              {/* LEFT: illustration placeholder */}
              <div
                className="sm:w-[40%] flex flex-col items-center justify-center p-6 gap-3 border-b sm:border-b-0 sm:border-r border-border"
                style={{ background: '#FAFAF8', minHeight: 160 }}
              >
                <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#CBD5E1"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-text-faint">Illustration</div>
                  <div className="text-[10px] text-text-faint mt-0.5">Bientôt disponible</div>
                </div>
              </div>

              {/* RIGHT: details (60% desktop) */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[60vh] sm:max-h-none">
                {/* Name + category */}
                <div>
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">{standard.name}</h2>
                  <span
                    className="inline-block mt-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{ background: categoryStyle.bg, color: categoryStyle.text }}
                  >
                    {standard.category}
                  </span>
                </div>

                {/* Criteria */}
                <div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-text-faint mb-2">
                    Critères d'exécution
                  </div>
                  <ul className="space-y-2">
                    {standard.criteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
                        <span className="mt-0.5 text-success flex-shrink-0"><CheckIcon /></span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* No-rep list */}
                {standard.noRep && standard.noRep.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold tracking-widest uppercase text-danger/70 mb-2">
                      No-rep — à éviter
                    </div>
                    <ul className="space-y-1.5">
                      {standard.noRep.map((nr, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
                          <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-danger/50" />
                          {nr}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Coach tip */}
                {standard.coachTip && (
                  <div className="px-3 py-2.5 rounded-lg bg-warn/8 border border-warn/20">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-warn/70 mb-1">Coach tip</div>
                    <p className="text-xs text-text-muted italic leading-relaxed">{standard.coachTip}</p>
                  </div>
                )}

                {/* Validate toggle */}
                <button
                  onClick={handleValidate}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: isValidated ? 'rgba(16,185,129,0.1)' : '#0F1923',
                    color: isValidated ? '#10B981' : '#FFFFFF',
                    border: isValidated ? '1.5px solid #10B981' : 'none',
                  }}
                >
                  {isValidated ? '✓ Technique validée' : 'Valider ma technique'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
