import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import plan from '../data/coaching-plan.json'
import { estimateSessionDuration } from '../utils/sessionUtils'
import SessionExport from '../components/ui/SessionExport'
import SessionCompleteModal from '../components/ui/SessionCompleteModal'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Timer({ isRunning, elapsed, timeCap, onToggle, onReset }) {
  const remaining = timeCap ? timeCap - elapsed : null
  const pct = timeCap ? Math.min(1, elapsed / timeCap) : 0
  const isLow = remaining !== null && remaining < 60
  const isDone = remaining !== null && remaining <= 0

  const r = 54
  const circ = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center">
      {/* SVG ring */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1A1A1A" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={isDone ? '#FF3D3D' : isLow ? '#FF9500' : '#00D4FF'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-3xl font-bold font-mono tabular-nums ${isDone ? 'text-danger timer-pulse' : isLow ? 'text-warn' : 'text-text-primary'}`}>
            {timeCap ? formatTime(Math.max(0, remaining)) : formatTime(elapsed)}
          </div>
          {timeCap && <div className="text-xs text-text-muted">restant</div>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onReset}
          className="btn-ghost flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          </svg>
          Reset
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 font-semibold px-5 py-2 rounded-lg text-sm transition-all active:scale-95 ${
            isRunning
              ? 'bg-surface-2 border border-border text-text-primary hover:bg-surface-3'
              : 'bg-brand text-black hover:bg-brand-dim'
          }`}
        >
          {isRunning ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Pause
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Go
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ExerciseRow({ exercise, index, completed, onToggle }) {
  return (
    <motion.div
      layout
      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        completed
          ? 'bg-success/5 border-success/20 opacity-60'
          : 'glass border-border hover:border-text-faint'
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
        completed ? 'bg-success border-success' : 'border-text-faint'
      }`}>
        {completed && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${completed ? 'line-through text-text-muted' : ''}`}>
          {exercise.exercise || exercise.label}
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {exercise.sets && (
            <span className="text-xs font-mono text-text-faint">{exercise.sets} × {exercise.reps}</span>
          )}
          {exercise.weight && (
            <span className="text-xs font-mono text-warn/80">{exercise.weight}</span>
          )}
          {exercise.rest && (
            <span className="text-xs font-mono text-text-faint">récup {exercise.rest}s</span>
          )}
          {exercise.duration && (
            <span className="text-xs font-mono text-text-faint">{exercise.duration}s</span>
          )}
          {exercise.note && (
            <span className="text-xs text-text-muted italic">{exercise.note}</span>
          )}
        </div>
      </div>

      <div className="text-xs font-mono text-text-faint flex-shrink-0">#{index + 1}</div>
    </motion.div>
  )
}

function SectionBlock({ title, exercises, completed, onToggle, color = '#888' }) {
  if (!exercises || exercises.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
        <div className="label">{title}</div>
        <div className="text-xs text-text-muted ml-auto">
          {exercises.filter((_, i) => completed[title + i]).length}/{exercises.length}
        </div>
      </div>
      <div className="space-y-1.5">
        {exercises.map((ex, i) => (
          <ExerciseRow
            key={i}
            exercise={ex}
            index={i}
            completed={!!completed[title + i]}
            onToggle={() => onToggle(title + i)}
          />
        ))}
      </div>
    </div>
  )
}

function SessionSelector({ currentSession, onSelect }) {
  const today = new Date().getDay()

  const getWeekNumber = () => {
    const start = new Date('2026-04-07')
    const diff = (new Date() - start) / (1000 * 60 * 60 * 24)
    return Math.max(1, Math.ceil(diff / 7))
  }

  const week = getWeekNumber()
  const template = (() => {
    if (week <= 4) return plan.weekTemplates['m1-standard']
    if (week <= 8) return plan.weekTemplates['m2-standard']
    if (week <= 10) return plan.weekTemplates['m3-peak']
    return plan.weekTemplates['deload']
  })()

  const TYPE_COLORS = { force: '#00D4FF', lactate: '#FF3D3D', specificity: '#FF9500', simulation: '#FF3D3D', recovery: '#00D47A' }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="label mb-3">Séances disponibles — Semaine {week}</div>
      <div className="grid gap-2">
        {template.sessions.map((s, i) => {
          const color = TYPE_COLORS[s.type] || '#888'
          const isActive = currentSession?.name === s.name
          return (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className={`text-left p-3 rounded-xl border transition-all ${
                isActive ? 'border-brand/40 bg-brand/5' : 'border-border hover:border-text-faint glass-hover glass'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="ml-auto text-xs font-mono capitalize" style={{ color }}>{s.type}</span>
              </div>
              <div className="text-xs text-text-muted mt-1 ml-4">
                {(s.main || []).length} exercices principaux
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Session() {
  const today = new Date()
  const week = Math.max(1, Math.ceil((today - new Date('2026-04-07')) / (1000 * 60 * 60 * 24 * 7)))
  const template = (() => {
    if (week <= 4) return plan.weekTemplates['m1-standard']
    if (week <= 8) return plan.weekTemplates['m2-standard']
    if (week <= 10) return plan.weekTemplates['m3-peak']
    return plan.weekTemplates['deload']
  })()

  const todaySession = template.sessions.find(s => s.daySlot === today.getDay()) || template.sessions[0]

  const [session, setSession] = useState(todaySession)
  const [completed, setCompleted] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [showValidate, setShowValidate] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const toggleExercise = useCallback((key) => {
    setCompleted(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const allExercises = [
    ...(session?.warmup || []),
    ...(session?.main || []),
    ...(session?.finisher || []),
  ]
  const totalCompleted = Object.values(completed).filter(Boolean).length
  const totalExercises = allExercises.length
  const pct = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0

  const TYPE_COLORS = { force: '#00D4FF', lactate: '#FF3D3D', specificity: '#FF9500', simulation: '#FF3D3D', recovery: '#00D47A' }
  const sessionColor = session ? TYPE_COLORS[session.type] || '#888' : '#888'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

      <SessionCompleteModal
        isOpen={showValidate}
        onClose={() => setShowValidate(false)}
        session={session}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="label mb-1">Séance du jour</div>
          <h1 className="text-2xl font-bold tracking-tight">{session?.name || 'Choisir une séance'}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {session && (
              <span className="tag text-xs px-2 py-0.5 rounded border" style={{ color: sessionColor, borderColor: sessionColor + '40', backgroundColor: sessionColor + '10' }}>
                {session.type}
              </span>
            )}
            <span className="text-xs text-text-muted">Semaine {week}</span>
            {session && (() => {
              const est = estimateSessionDuration(session)
              return est ? <span className="text-xs text-text-faint">⏱ ~{est} min</span> : null
            })()}
          </div>
        </div>
        <button onClick={() => setShowSelector(s => !s)} className="btn-ghost text-xs">
          {showSelector ? 'Fermer' : 'Changer'}
        </button>
      </div>

      {/* Intention */}
      {session?.intention && (
        <div className="px-4 py-3 rounded-xl border-l-2 bg-surface-2/50" style={{ borderColor: sessionColor }}>
          <p className="text-xs text-text-muted italic leading-relaxed">
            "{session.intention}"
          </p>
        </div>
      )}

      {/* Session selector */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SessionSelector
              currentSession={session}
              onSelect={(s) => { setSession(s); setCompleted({}); setElapsed(0); setRunning(false); setShowSelector(false) }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      {session && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{totalCompleted}/{totalExercises} exercices</span>
            <span className="text-sm font-mono text-brand">{pct}%</span>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-brand rounded-full"
            />
          </div>
          {pct === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-success font-semibold text-sm mt-2"
            >
              Séance terminée — GG 💪
            </motion.div>
          )}
        </div>
      )}

      {/* Timer */}
      <div className="glass rounded-2xl p-6 flex flex-col items-center">
        <Timer
          isRunning={running}
          elapsed={elapsed}
          timeCap={null}
          onToggle={() => setRunning(r => !r)}
          onReset={() => { setElapsed(0); setRunning(false) }}
        />
      </div>

      {/* Exercises */}
      {session && (
        <div className="space-y-5">
          <SectionBlock
            title="Échauffement"
            exercises={session.warmup}
            completed={completed}
            onToggle={toggleExercise}
            color="#888"
          />
          <SectionBlock
            title="Principal"
            exercises={session.main}
            completed={completed}
            onToggle={toggleExercise}
            color={sessionColor}
          />
          <SectionBlock
            title="Finisher"
            exercises={session.finisher}
            completed={completed}
            onToggle={toggleExercise}
            color="#FF9500"
          />
        </div>
      )}

      {/* Validate + Export */}
      <div className="flex gap-3">
        {pct === 100 ? (
          <button
            onClick={() => setShowValidate(true)}
            className="flex-1 py-3 rounded-xl bg-success font-bold text-black text-sm hover:bg-success/90 transition-all"
          >
            ✓ Valider la séance
          </button>
        ) : (
          <button
            onClick={() => setShowValidate(true)}
            className="flex-1 py-2.5 rounded-xl bg-surface-2 border border-border text-sm font-medium text-text-muted hover:text-text-primary hover:border-brand/20 transition-all"
          >
            J'ai fait cette séance
          </button>
        )}
        {session && <SessionExport session={session} week={week} />}
      </div>

      {/* Reset session */}
      {totalCompleted > 0 && (
        <button
          onClick={() => { setCompleted({}); setElapsed(0); setRunning(false) }}
          className="w-full btn-ghost text-danger hover:text-danger text-sm"
        >
          Réinitialiser
        </button>
      )}
    </div>
  )
}
