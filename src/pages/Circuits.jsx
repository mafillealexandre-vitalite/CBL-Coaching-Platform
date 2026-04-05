import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import circuitsData from '../data/circuits.json'

const LEVEL_LABELS = { 1: 'Amateur', 2: 'Amateur+', 3: 'Espoir', 4: 'Pro', 5: 'Elite' }
const LEVEL_COLORS = { 1: '#00D4FF', 2: '#00D4FF', 3: '#FF9500', 4: '#FF6B00', 5: '#FF3D3D' }

function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SimulationMode({ circuit, onClose }) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [completedExs, setCompletedExs] = useState({})
  const [phase, setPhase] = useState('countdown') // countdown | running | done
  const [countdown, setCountdown] = useState(3)
  const intervalRef = useRef(null)

  const remaining = circuit.timeCap - elapsed
  const isOvertime = elapsed > circuit.timeCap
  const pct = Math.min(1, elapsed / circuit.timeCap)
  const isLow = remaining < 60 && remaining > 0

  // Countdown phase
  useEffect(() => {
    if (phase === 'countdown' && running) {
      intervalRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(intervalRef.current)
            setPhase('running')
            return 0
          }
          return c - 1
        })
      }, 1000)
      return () => clearInterval(intervalRef.current)
    }
  }, [phase, running])

  // Timer phase
  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= circuit.timeCap + 30) {
            clearInterval(intervalRef.current)
            setPhase('done')
            return e
          }
          return e + 1
        })
      }, 1000)
      return () => clearInterval(intervalRef.current)
    }
  }, [phase, circuit.timeCap])

  const totalDone = Object.values(completedExs).filter(Boolean).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="text-xs text-text-muted">{circuit.event}</div>
          <div className="font-bold text-sm">{circuit.name}</div>
        </div>
        <button onClick={onClose} className="btn-ghost text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 overflow-y-auto py-6">

        {/* Countdown overlay */}
        {phase === 'countdown' && running && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-8xl font-bold text-brand tabular-nums"
          >
            {countdown}
          </motion.div>
        )}

        {/* Timer ring */}
        {(phase === 'running' || phase === 'done') && (
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1A1A1A" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={isOvertime ? '#FF3D3D' : isLow ? '#FF9500' : '#00D4FF'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isOvertime ? (
                <div className="text-danger text-xs font-mono mb-1 timer-pulse">OVERTIME</div>
              ) : (
                <div className="text-xs text-text-muted mb-1">restant</div>
              )}
              <div className={`text-4xl font-bold font-mono tabular-nums ${isOvertime ? 'text-danger' : isLow ? 'text-warn' : ''}`}>
                {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsed - circuit.timeCap : remaining)}
              </div>
              <div className="text-xs text-text-muted mt-1">{totalDone}/{circuit.exercises.length} stations</div>
            </div>
          </div>
        )}

        {/* Start/stop */}
        {phase === 'countdown' && !running && (
          <button
            onClick={() => setRunning(true)}
            className="btn-primary text-lg px-10 py-4 rounded-2xl"
          >
            Démarrer le circuit
          </button>
        )}

        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-xl font-bold text-success">Circuit terminé !</div>
            <div className="text-text-muted mt-1">{totalDone}/{circuit.exercises.length} stations · {formatTime(elapsed)}</div>
            <button
              onClick={() => { setElapsed(0); setRunning(false); setPhase('countdown'); setCountdown(3); setCompletedExs({}) }}
              className="btn-primary mt-4"
            >
              Recommencer
            </button>
          </motion.div>
        )}

        {/* Exercise checklist during run */}
        {(phase === 'running' || phase === 'done') && (
          <div className="w-full max-w-md space-y-2">
            <div className="label mb-2">Stations</div>
            {circuit.exercises.map((ex, i) => {
              const done = !!completedExs[i]
              return (
                <button
                  key={i}
                  onClick={() => setCompletedExs(prev => ({ ...prev, [i]: !prev[i] }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    done ? 'bg-success/5 border-success/30' : 'glass border-border hover:border-text-faint'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${done ? 'bg-success border-success' : 'border-text-faint'}`}>
                    {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div className={`text-sm flex-1 ${done ? 'line-through text-text-muted' : ''}`}>
                    <span className="font-medium">{ex.label}</span>
                    {ex.weight && <span className="text-warn/80 ml-2 text-xs font-mono">@{ex.weight}</span>}
                  </div>
                  <span className="text-xs font-mono text-text-faint">#{i + 1}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function CircuitCard({ circuit, onSimulate }) {
  const [expanded, setExpanded] = useState(false)
  const color = LEVEL_COLORS[circuit.level] || '#888'
  const timeCap = circuit.timeCap
  const mins = Math.floor(timeCap / 60)

  return (
    <motion.div layout className="glass rounded-2xl overflow-hidden">
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Card header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-black font-bold text-sm"
            style={{ backgroundColor: color }}
          >
            {mins}'
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-muted mb-0.5">{circuit.event}</div>
            <div className="font-bold text-sm leading-tight">{circuit.name}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded border font-mono" style={{ color, borderColor: color + '40', backgroundColor: color + '10' }}>
                {circuit.division}
              </span>
              <span className="text-[10px] text-text-muted">{circuit.exercises.length} stations</span>
              <span className="text-[10px] font-mono text-text-muted">⏱ {mins}min</span>
              {circuit.tag && (
                <span className="text-[10px] text-text-faint">{circuit.tag}</span>
              )}
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </motion.div>
        </div>

        {/* Quick exercises preview */}
        {!expanded && (
          <div className="mt-3 flex flex-wrap gap-1">
            {circuit.exercises.slice(0, 4).map((ex, i) => (
              <span key={i} className="text-[10px] bg-surface-2 border border-border rounded px-1.5 py-0.5 text-text-muted truncate max-w-[10rem]">
                {ex.label}
              </span>
            ))}
            {circuit.exercises.length > 4 && (
              <span className="text-[10px] text-text-faint px-1">+{circuit.exercises.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded exercise list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
              {circuit.catchUpLine && (
                <div className="text-xs text-text-muted bg-surface-2 border border-border rounded-lg px-3 py-2">
                  <span className="text-warn font-medium">Ligne de rattrapage: </span>
                  {circuit.catchUpLine}
                </div>
              )}

              {/* Exercise list */}
              <ol className="space-y-2">
                {circuit.exercises.map((ex, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm">{ex.label}</span>
                      {ex.weight && (
                        <span className="text-xs font-mono text-warn/80 ml-2">@{ex.weight}</span>
                      )}
                      {ex.note && (
                        <div className="text-xs text-text-muted italic mt-0.5">{ex.note}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {/* Time cap */}
              <div className="flex items-center justify-between py-2 border-t border-border">
                <span className="text-sm font-semibold">Time Cap</span>
                <span className="text-lg font-bold font-mono" style={{ color }}>{mins}:00</span>
              </div>

              {/* Simulate button */}
              <button
                onClick={() => onSimulate(circuit)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-98"
                style={{ backgroundColor: color, color: '#000' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Simuler ce circuit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Circuits() {
  const [filter, setFilter] = useState('all')
  const [simulatingCircuit, setSimulatingCircuit] = useState(null)

  const filters = [
    { id: 'all', label: 'Tous' },
    { id: '1', label: 'Amateur' },
    { id: '3', label: 'Espoir' },
    { id: '5', label: 'Elite' },
  ]

  const filtered = circuitsData.circuits.filter(c => {
    if (filter === 'all') return true
    return c.level === parseInt(filter)
  })

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <div className="label mb-1">Bibliothèque</div>
          <h1 className="text-2xl font-bold tracking-tight">Circuits CBL</h1>
          <p className="text-sm text-text-muted mt-1">
            {circuitsData.circuits.length} circuits extraits des compétitions — du Amateur au Elite
          </p>
        </div>

        {/* Legend */}
        <div className="glass rounded-xl p-3 flex flex-wrap gap-3">
          {Object.entries(LEVEL_LABELS).map(([level, label]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS[level] }} />
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === f.id
                  ? 'bg-brand text-black border-brand'
                  : 'border-border text-text-muted hover:border-text-faint'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-text-muted self-center">{filtered.length} circuits</span>
        </div>

        {/* Circuit cards */}
        <div className="space-y-3">
          {filtered.map(circuit => (
            <CircuitCard
              key={circuit.id}
              circuit={circuit}
              onSimulate={setSimulatingCircuit}
            />
          ))}
        </div>

        {/* Info box */}
        <div className="glass rounded-xl p-4 border-l-2 border-warn">
          <div className="text-xs text-warn font-semibold mb-1">Rappel objectif</div>
          <div className="text-xs text-text-muted">
            Ta prochaine étape : compléter le circuit <strong className="text-text-primary">OQ7 Amateur 1st Round</strong> en moins de 6 min sans pause. Ensuite viser le <strong className="text-text-primary">WOD Espoir</strong>.
          </div>
        </div>
      </div>

      {/* Simulation overlay */}
      <AnimatePresence>
        {simulatingCircuit && (
          <SimulationMode
            circuit={simulatingCircuit}
            onClose={() => setSimulatingCircuit(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
