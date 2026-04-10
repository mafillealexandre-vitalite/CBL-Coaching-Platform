import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import circuitsData from '../data/circuits.json'
import { PILOT_MODE, findStandard } from '../data/movementStandards'
import { getCircuitTimes, saveCircuitTimes, uid, getAthletes, getCurrentAthleteId } from '../utils/coachStore'
import AudioMemoButton from '../components/ExerciseGuide/AudioMemoButton'
import TechniqueModal from '../components/ExerciseGuide/TechniqueModal'
import GarminExport from '../components/GarminExport/GarminExport'

const LEVEL_LABELS = { 1: 'Amateur', 2: 'Amateur+', 3: 'Espoir', 4: 'Pro', 5: 'Elite' }
// Updated to Premium Slate accents
const LEVEL_COLORS = { 1: '#0EA5E9', 2: '#0EA5E9', 3: '#F59E0B', 4: '#EF4444', 5: '#8B5CF6' }

function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SimulationMode({ circuit, onClose }) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [completedExs, setCompletedExs] = useState({})
  const [phase, setPhase] = useState('countdown')
  const [countdown, setCountdown] = useState(3)
  const [timeSaved, setTimeSaved] = useState(false)
  const intervalRef = useRef(null)

  const remaining = circuit.timeCap - elapsed
  const isOvertime = elapsed > circuit.timeCap
  const pct = Math.min(1, elapsed / circuit.timeCap)
  const isLow = remaining < 60 && remaining > 0

  useEffect(() => {
    if (phase === 'countdown' && running) {
      intervalRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(intervalRef.current); setPhase('running'); return 0 }
          return c - 1
        })
      }, 1000)
      return () => clearInterval(intervalRef.current)
    }
  }, [phase, running])

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= circuit.timeCap + 30) { clearInterval(intervalRef.current); setPhase('done'); return e }
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="text-xs text-text-muted">{circuit.event}</div>
          <div className="font-bold text-sm">{circuit.name}</div>
        </div>
        <button onClick={onClose} className="btn-ghost text-xs p-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 overflow-y-auto py-6">
        {phase === 'countdown' && running && countdown > 0 && (
          <motion.div key={countdown} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-8xl font-bold text-brand tabular-nums">
            {countdown}
          </motion.div>
        )}

        {(phase === 'running' || phase === 'done') && (
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1A1A1A" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={isOvertime ? '#FF3D3D' : isLow ? '#FF9500' : '#00D4FF'} strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - pct)} style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isOvertime ? <div className="text-danger text-xs font-mono mb-1 timer-pulse">OVERTIME</div> : <div className="text-xs text-text-muted mb-1">restant</div>}
              <div className={`text-4xl font-bold font-mono tabular-nums ${isOvertime ? 'text-danger' : isLow ? 'text-warn' : ''}`}>
                {isOvertime ? '+' : ''}{formatTime(isOvertime ? elapsed - circuit.timeCap : remaining)}
              </div>
              <div className="text-xs text-text-muted mt-1">{totalDone}/{circuit.exercises.length} stations</div>
            </div>
          </div>
        )}

        {phase === 'countdown' && !running && (
          <button onClick={() => setRunning(true)} className="btn-primary text-lg px-10 py-4 rounded-2xl">
            Démarrer le circuit
          </button>
        )}

        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3">
            <div className="text-4xl">🏆</div>
            <div className="text-xl font-bold text-success">Circuit terminé !</div>
            <div className="text-text-muted">{totalDone}/{circuit.exercises.length} stations · {formatTime(elapsed)}</div>
            {timeSaved ? (
              <div className="text-sm text-success font-semibold">✓ Temps sauvegardé</div>
            ) : (
              <button
                onClick={() => {
                  const athleteId = getCurrentAthleteId() || 'alexandre'
                  const times = getCircuitTimes()
                  if (!times[athleteId]) times[athleteId] = {}
                  if (!times[athleteId][circuit.id]) times[athleteId][circuit.id] = []
                  times[athleteId][circuit.id].push({
                    id: uid(),
                    time: elapsed,
                    date: new Date().toISOString().slice(0, 10),
                    note: '',
                  })
                  saveCircuitTimes(times)
                  setTimeSaved(true)
                }}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-success/10 border border-success/30 text-success hover:bg-success/20 transition-all"
              >
                Sauvegarder mon temps — {formatTime(elapsed)}
              </button>
            )}
            <button onClick={() => { setElapsed(0); setRunning(false); setPhase('countdown'); setCountdown(3); setCompletedExs({}); setTimeSaved(false) }} className="btn-primary w-full">
              Recommencer
            </button>
          </motion.div>
        )}

        {(phase === 'running' || phase === 'done') && (
          <div className="w-full max-w-md space-y-2">
            <div className="label mb-2">Stations</div>
            {circuit.exercises.map((ex, i) => {
              const done = !!completedExs[i]
              return (
                <button key={i} onClick={() => setCompletedExs(prev => ({ ...prev, [i]: !prev[i] }))} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${done ? 'bg-success/5 border-success/30' : 'bg-white border-border hover:border-text-faint'}`}>
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

function CircuitCard({ circuit, onSimulate, circuitIndex }) {
  const cardRef = useRef(null)
  const color = LEVEL_COLORS[circuit.level] || '#888'
  const mins = Math.floor(circuit.timeCap / 60)
  const [exporting, setExporting] = useState(false)
  const [techniqueStandard, setTechniqueStandard] = useState(null)

  // Pilot mode: only apply audio/technique to first 5 circuits
  const showGuide = !PILOT_MODE || circuitIndex < 5

  const handleExport = async () => {
    if (!cardRef.current || exporting) return
    setExporting(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `CBL_${circuit.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="w-full shrink-0 px-4">
      {/* Technique modal */}
      <TechniqueModal
        standard={techniqueStandard}
        isOpen={!!techniqueStandard}
        onClose={() => setTechniqueStandard(null)}
      />

      {/* Visual card — exportable */}
      <div
        ref={cardRef}
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: `1px solid ${color}25`,
          boxShadow: `0 1px 3px rgba(15,25,35,0.08), 0 4px 16px rgba(15,25,35,0.06)`,
        }}
      >
        {/* Color top bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent 70%)` }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3" style={{ background: '#FAFAF8' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color }}>
                {LEVEL_LABELS[circuit.level]} · {circuit.division}
              </div>
              <div className="font-bold text-base leading-snug text-text-primary tracking-tight">
                {circuit.name}
              </div>
              <div className="text-xs text-text-muted mt-0.5 truncate">{circuit.event}</div>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold text-white"
              style={{ backgroundColor: color }}
            >
              <span className="text-xl leading-none font-bold">{mins}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider leading-tight">min</span>
            </div>
          </div>
          {circuit.tag && (
            <span
              className="inline-block mt-2.5 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ backgroundColor: color + '18', color }}
            >
              {circuit.tag}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px mx-5" style={{ background: '#E2E8F0' }} />

        {/* Exercise list */}
        <div className="px-5 py-4 space-y-2">
          {circuit.exercises.map((ex, i) => {
            const standard = showGuide ? findStandard(ex.label) : null
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 flex items-center justify-center tabular-nums"
                  style={{ backgroundColor: color + '15', color }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {standard ? (
                    <button
                      onClick={() => setTechniqueStandard(standard)}
                      className="text-sm text-left hover:underline text-text-primary font-medium"
                      style={{ textDecorationColor: color }}
                    >
                      {ex.label}
                    </button>
                  ) : (
                    <span className="text-sm text-text-primary">{ex.label}</span>
                  )}
                  {ex.weight && (
                    <span className="ml-2 font-mono text-xs font-semibold" style={{ color: '#F59E0B' }}>
                      @{ex.weight}
                    </span>
                  )}
                  {ex.note && (
                    <div className="text-xs text-text-muted mt-0.5 italic">{ex.note}</div>
                  )}
                </div>
                {showGuide && (
                  <AudioMemoButton exerciseId={`${circuit.id}-ex${i}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Time cap */}
        <div className="mx-5 mb-4">
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: color + '0D', border: `1px solid ${color}20` }}
          >
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 3h14M5 21h14"/>
                <path d="M7 3v3a5 5 0 0 0 10 0V3"/>
                <path d="M7 21v-3a5 5 0 0 1 10 0v3"/>
              </svg>
              <span className="text-xs text-text-muted font-medium">Time Cap</span>
            </div>
            <span className="font-bold font-mono text-base tabular-nums" style={{ color }}>{mins}:00</span>
          </div>
        </div>

        {circuit.catchUpLine && (
          <div className="mx-5 mb-4 text-xs text-text-muted rounded-xl px-3 py-2 leading-relaxed" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <span className="font-semibold" style={{ color: '#D97706' }}>Rattrapage · </span>
            {circuit.catchUpLine}
          </div>
        )}
      </div>

      {/* Action buttons — outside exportable area */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSimulate(circuit)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 text-white"
          style={{ backgroundColor: color }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Simuler
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm border border-border text-text-muted transition-all active:scale-95 hover:border-text-faint hover:text-text-primary disabled:opacity-40 bg-white"
        >
          {exporting ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          )}
          PNG
        </button>
      </div>

      {/* Feature 3: Garmin TCX export */}
      <GarminExport circuit={circuit} />
    </div>
  )
}

function ObjectiveBlock() {
  const athleteId = getCurrentAthleteId() || 'alexandre'
  const athlete = getAthletes().find(a => a.id === athleteId)
  const goal = athlete?.goalShort
  const goalMedium = athlete?.goalMedium
  if (!goal && !goalMedium) return null
  return (
    <div className="mx-4 rounded-xl p-4 border border-l-2 border-warn" style={{ background: 'white', borderColor: 'var(--color-border)', borderLeftColor: '#F59E0B' }}>
      <div className="text-xs text-warn font-semibold mb-1">Objectif</div>
      <div className="text-xs text-text-muted leading-relaxed">
        {goal && <div><strong className="text-text-primary">Court terme :</strong> {goal}</div>}
        {goalMedium && <div className="mt-0.5"><strong className="text-text-primary">Moyen terme :</strong> {goalMedium}</div>}
      </div>
    </div>
  )
}

export default function Circuits() {
  const [filter, setFilter] = useState('all')
  const [simulatingCircuit, setSimulatingCircuit] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)

  const filters = [
    { id: 'all', label: 'Tous' },
    { id: '1', label: 'Amateur' },
    { id: '3', label: 'Espoir' },
    { id: '5', label: 'Elite' },
  ]

  const filtered = circuitsData.circuits.filter(c =>
    filter === 'all' ? true : c.level === parseInt(filter)
  )

  useEffect(() => {
    setActiveIndex(0)
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'instant' })
    }
  }, [filter])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    if (clientWidth > 0) setActiveIndex(Math.round(scrollLeft / clientWidth))
  }, [])

  const goTo = (index) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.clientWidth,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <div className="animate-fade-in pb-6">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="label mb-1">Bibliothèque</div>
          <h1 className="text-2xl font-bold tracking-tight">Circuits CBL</h1>
          <p className="text-sm text-text-muted mt-1">
            {circuitsData.circuits.length} circuits · Amateur → Elite
          </p>
        </div>

        {/* Filter + counter */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                  filter === f.id
                    ? 'bg-brand text-white border-brand'
                    : 'border-border text-text-muted hover:border-text-faint'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-text-muted tabular-nums">
              {activeIndex + 1}/{filtered.length}
            </span>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex no-scrollbar"
          style={{
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {filtered.map((circuit, idx) => (
            <div key={circuit.id} className="w-full shrink-0" style={{ scrollSnapAlign: 'start' }}>
              <CircuitCard circuit={circuit} onSimulate={setSimulatingCircuit} circuitIndex={idx} />
            </div>
          ))}
        </div>

        {/* Pagination dots */}
        {filtered.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-4 pb-2">
            {filtered.map((c, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === activeIndex ? 20 : 6,
                  height: 6,
                  backgroundColor: i === activeIndex
                    ? (LEVEL_COLORS[filtered[i]?.level] || '#0EA5E9')
                    : '#CBD5E1',
                }}
              />
            ))}
          </div>
        )}

        {/* Desktop nav arrows */}
        <div className="hidden md:flex items-center justify-center gap-4 pt-2 pb-4">
          <button
            onClick={() => goTo(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-faint transition disabled:opacity-20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="text-sm text-text-muted tabular-nums">{activeIndex + 1} / {filtered.length}</span>
          <button
            onClick={() => goTo(Math.min(filtered.length - 1, activeIndex + 1))}
            disabled={activeIndex === filtered.length - 1}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:border-text-faint transition disabled:opacity-20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Objective reminder */}
        <ObjectiveBlock />
      </div>

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
