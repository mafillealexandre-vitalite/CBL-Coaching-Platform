import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { logSession, getPlanWeek } from '../../utils/sessionUtils'

const SESSION_COLORS = {
  force: '#00D4FF',
  lactate: '#FF3D3D',
  specificity: '#FF9500',
  simulation: '#FF3D3D',
  recovery: '#00D47A',
}

/**
 * "J'ai fait ma séance" modal.
 *
 * Props:
 *  - isOpen
 *  - onClose
 *  - session: { name, type } — pre-filled session data (optional)
 *  - onSaved: callback after save (to refresh parent)
 */
export default function SessionCompleteModal({ isOpen, onClose, session, onSaved }) {
  const [rpe, setRpe] = useState(7)
  const [duration, setDuration] = useState(session ? 45 : '')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const RPE_LABELS = ['', 'Très léger', 'Léger', 'Modéré', 'Assez dur', 'Dur', 'Dur+', 'Très dur', 'Max−', 'Max', 'MAX ABS.']

  const handleSave = () => {
    const week = getPlanWeek(new Date())
    logSession({
      label: session?.name || 'Séance',
      type: session?.type || 'force',
      rpe,
      duration: parseInt(duration) || 0,
      week,
      templateName: session?.name || '',
    })
    setSaved(true)
    onSaved?.()
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1400)
  }

  const color = SESSION_COLORS[session?.type] || '#00D4FF'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-sm bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden"
          >
            {saved ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D47A" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="text-lg font-bold text-success mb-1">Séance enregistrée</div>
                <div className="text-sm text-text-muted">{duration} min · RPE {rpe}/10</div>
              </motion.div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-text-faint mb-0.5">Valider la séance</div>
                    <div className="font-bold text-text-primary">{session?.name || 'Séance du jour'}</div>
                    {session?.type && (
                      <div className="text-xs mt-0.5 font-medium" style={{ color }}>
                        {session.type}
                      </div>
                    )}
                  </div>
                  <button onClick={onClose} className="text-text-faint hover:text-text-muted w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2">
                    ✕
                  </button>
                </div>

                {/* RPE */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      RPE — Effort ressenti
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold tabular-nums" style={{ color }}>{rpe}</span>
                      <span className="text-xs text-text-faint">{RPE_LABELS[rpe]}</span>
                    </div>
                  </div>
                  <input
                    type="range" min="1" max="10" step="1" value={rpe}
                    onChange={e => setRpe(Number(e.target.value))}
                    className="w-full accent-brand h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-text-faint mt-1">
                    <span>1</span><span>5</span><span>10</span>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Durée réelle
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="45"
                      className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary text-lg font-bold text-center focus:outline-none focus:border-brand tabular-nums"
                    />
                    <span className="text-text-muted font-medium">min</span>
                  </div>
                </div>

                {/* Optional note */}
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Note rapide (optionnel)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Une sensation, un point clé..."
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand placeholder-text-faint"
                  />
                </div>

                {/* CTA */}
                <button
                  onClick={handleSave}
                  disabled={!duration}
                  className="w-full py-3.5 rounded-2xl font-bold text-black text-sm transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: duration ? color : '#666' }}
                >
                  ✓ Valider — {duration || '?'} min · RPE {rpe}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
