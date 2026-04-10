import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { logSession, getPlanWeek, getSessionLog } from '../../utils/sessionUtils'
import { saveRpeExercises, getRpeExercises, getCurrentAthleteId } from '../../utils/coachStore'

const SESSION_COLORS = {
  force: '#0EA5E9',
  lactate: '#EF4444',
  specificity: '#F59E0B',
  simulation: '#EF4444',
  recovery: '#10B981',
}

const RPE_LABELS = ['', 'Très léger', 'Léger', 'Modéré', 'Assez dur', 'Dur', 'Dur+', 'Très dur', 'Max−', 'Max', 'MAX ABS.']

function saveDebrief({ sessionName, sessionType, rpe, duration, note, week }) {
  const athleteId = getCurrentAthleteId() || 'alexandre'
  const key = `cbl_debriefs_${athleteId}`
  const debriefs = JSON.parse(localStorage.getItem(key) || '[]')
  debriefs.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    sessionName,
    sessionType,
    rpe,
    duration,
    note: note.trim(),
    week,
  })
  localStorage.setItem(key, JSON.stringify(debriefs))
}

function getCurrentSerie() {
  const log = getSessionLog()
  const completedDates = [...new Set(log.filter(s => s.completed).map(s => new Date(s.date).toDateString()))]
  const sorted = completedDates.sort((a, b) => new Date(b) - new Date(a))
  let serie = 0
  const now = new Date(); now.setHours(0, 0, 0, 0)
  let prev = now
  for (const d of sorted) {
    const diff = Math.round((prev - new Date(d)) / 86400000)
    if (diff <= 1) { serie++; prev = new Date(d) } else break
  }
  return serie
}

const RPE_COLOR = (v) => {
  if (v <= 3) return '#10B981'
  if (v <= 6) return '#F59E0B'
  if (v <= 8) return '#F97316'
  return '#EF4444'
}

export default function SessionCompleteModal({ isOpen, onClose, session, onSaved }) {
  const [rpe, setRpe] = useState(7)
  const [duration, setDuration] = useState(45)
  const [note, setNote] = useState('')
  const [step, setStep] = useState('form') // 'form' | 'confirm'
  const [serie, setSerie] = useState(0)
  const [exerciseRpe, setExerciseRpe] = useState({})
  const [showExRpe, setShowExRpe] = useState(false)

  const exercises = session
    ? [...(session.warmup || []), ...(session.main || []), ...(session.finisher || [])].filter(ex => ex.exercise || ex.label)
    : []

  const color = SESSION_COLORS[session?.type] || '#0EA5E9'
  const week = getPlanWeek(new Date())

  const handleSave = () => {
    logSession({
      label: session?.name || 'Séance',
      type: session?.type || 'force',
      rpe,
      duration: parseInt(duration) || 0,
      week,
      templateName: session?.name || '',
    })
    saveDebrief({
      sessionName: session?.name || 'Séance',
      sessionType: session?.type || 'force',
      rpe,
      duration: parseInt(duration) || 0,
      note,
      week,
    })
    // Save per-exercise RPE if any
    if (exercises.length > 0) {
      const prev = getRpeExercises()
      saveRpeExercises([...prev, {
        date: new Date().toISOString(),
        sessionName: session?.name || 'Séance',
        exercises: exercises.map((ex, i) => ({
          name: ex.exercise || ex.label,
          rpe: exerciseRpe[i] ?? 0,
        })),
      }])
    }
    setSerie(getCurrentSerie())
    onSaved?.()
    setStep('confirm')
  }

  const handleClose = () => {
    setStep('form')
    setRpe(7)
    setDuration(45)
    setNote('')
    setExerciseRpe({})
    setShowExRpe(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-sm bg-surface rounded-3xl border border-border shadow-modal overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="p-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-text-faint mb-0.5">Séance terminée</div>
                      <div className="font-bold text-text-primary">{session?.name || 'Séance du jour'}</div>
                    </div>
                    <button onClick={handleClose} className="text-text-faint hover:text-text-muted w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2">✕</button>
                  </div>

                  {/* Durée */}
                  <div>
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Durée</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="1" max="180" value={duration}
                        onChange={e => setDuration(e.target.value)} placeholder="45"
                        className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary text-lg font-bold text-center focus:outline-none focus:border-brand tabular-nums"
                      />
                      <span className="text-text-muted font-medium">min</span>
                    </div>
                  </div>

                  {/* Charge ressentie */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Charge ressentie</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{rpe}</span>
                        <span className="text-xs text-text-faint">{RPE_LABELS[rpe]}</span>
                      </div>
                    </div>
                    <input type="range" min="1" max="10" step="1" value={rpe}
                      onChange={e => setRpe(Number(e.target.value))}
                      className="w-full accent-brand h-1.5"
                    />
                    <div className="flex justify-between text-[10px] text-text-faint mt-1">
                      <span>Léger</span><span>Optimal</span><span>Max</span>
                    </div>
                  </div>

                  {/* RPE par exercice */}
                  {exercises.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowExRpe(v => !v)}
                        className="flex items-center gap-1.5 text-xs text-text-faint hover:text-brand transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points={showExRpe ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
                        </svg>
                        RPE par exercice {showExRpe ? '' : '(optionnel)'}
                      </button>
                      <AnimatePresence>
                        {showExRpe && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-2 space-y-2">
                              {exercises.map((ex, i) => {
                                const v = exerciseRpe[i] ?? 5
                                return (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="text-[11px] text-text-muted flex-1 truncate">{ex.exercise || ex.label}</span>
                                    <input
                                      type="range" min="0" max="10" step="1" value={v}
                                      onChange={e => setExerciseRpe(prev => ({ ...prev, [i]: +e.target.value }))}
                                      className="w-20 h-1 accent-brand"
                                    />
                                    <span className="text-xs font-bold tabular-nums w-4" style={{ color: RPE_COLOR(v) }}>{v}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Note */}
                  <div>
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Note rapide (optionnel)</label>
                    <textarea
                      value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Une sensation, un point clé..."
                      rows={2}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand placeholder-text-faint resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-98"
                    style={{ background: color }}
                  >
                    Valider — {duration || '?'} min · RPE {rpe}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-text-primary">Bien joué.</div>
                    <div className="text-sm text-text-muted mt-1">{duration} min · Charge {rpe}/10</div>
                    {serie > 0 && (
                      <div className="text-xs text-text-faint mt-2">
                        {serie >= 7 ? `${serie} jours sans briser la chaîne.` : serie > 1 ? `Série de ${serie} jours.` : 'La chaîne est lancée.'}
                      </div>
                    )}
                  </div>
                  <Link to="/coach" onClick={handleClose} className="block text-xs text-text-faint hover:text-brand transition-colors">
                    Voir mes débriefs →
                  </Link>
                  <button onClick={handleClose} className="w-full py-3 rounded-2xl font-semibold text-sm bg-surface-2 border border-border text-text-muted hover:text-text-primary transition-all">
                    Fermer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
