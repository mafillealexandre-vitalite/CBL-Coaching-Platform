import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { computeProfile, getDiagnosisSummary } from '../utils/diagnosticEngine'

const PROTOCOL = [
  {
    id: 'pullUp',
    label: 'Tractions max',
    unit: 'reps',
    type: 'reps',
    instruction: 'Prise pronation, 1 série à l\'échec complet. Amplitude complète : bras tendus en bas, menton au-dessus de la barre.',
    icon: '⬆️',
    rest: 180,
  },
  {
    id: 'dips',
    label: 'Dips max',
    unit: 'reps',
    type: 'reps',
    instruction: 'Poids de corps, 1 série à l\'échec. Amplitude complète : coudes à 90° en bas, bras tendus en haut.',
    icon: '↕️',
    rest: 180,
  },
  {
    id: 'muscleUp',
    label: 'Muscle-up max',
    unit: 'reps',
    type: 'reps',
    instruction: 'Strict si possible. Compter uniquement les reps complètes : barre sous les épaules en bas, bras tendus au-dessus en haut.',
    icon: '🔄',
    rest: 240,
  },
  {
    id: 'pushUp',
    label: 'Pompes max',
    unit: 'reps',
    type: 'reps',
    instruction: '1 série à l\'échec. Corps rigide, poitrine au sol en bas, bras tendus en haut. Aucune pause en haut.',
    icon: '🤸',
    rest: 180,
  },
  {
    id: 'gobletSquat',
    label: 'Goblet Squat @15kg',
    unit: 'reps',
    type: 'reps',
    instruction: 'Kettlebell ou disque 15kg maintenu contre la poitrine. 1 série à l\'échec. Profondeur sous parallèle obligatoire.',
    icon: '🏋️',
    rest: 180,
  },
  {
    id: 'circuit',
    label: 'Circuit Test CBL',
    unit: 'sec',
    type: 'circuit',
    instruction: 'Enchaîner sans pause imposée : 10 tractions → 20 dips → 30 pompes → 20 squats. Lance le chrono au départ. Note le temps total et les reps complétées.',
    icon: '⚡',
    rest: 0,
    sequence: [
      { name: '10 Tractions', reps: 10 },
      { name: '20 Dips', reps: 20 },
      { name: '30 Pompes', reps: 30 },
      { name: '20 Squats', reps: 20 },
    ]
  },
  {
    id: 'rpe',
    label: 'RPE Global',
    unit: '/10',
    type: 'rpe',
    instruction: 'Ressenti général de l\'effort sur l\'ensemble du test. 1 = très facile, 10 = effort maximal absolu.',
    icon: '🎯',
    rest: 0,
  },
]

const AXIS_COLORS = {
  forceBrute: '#00D4FF',
  enduranceForce: '#FF9500',
  resistanceLactique: '#FF3D3D',
  equilibre: '#00D47A',
}

function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) { onDone(); return }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const pct = (remaining / seconds) * 100
  const r = 28
  const circ = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1E1E1E" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke="#00D4FF" strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-brand tabular-nums">
          {remaining}
        </div>
      </div>
      <p className="text-text-muted text-sm">Récupération en cours…</p>
      <button onClick={onDone} className="text-xs text-text-faint hover:text-text-muted underline">
        Passer
      </button>
    </div>
  )
}

function CircuitTimer({ onResult }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [reps, setReps] = useState('')
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  const start = () => {
    setRunning(true)
    setElapsed(0)
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }
  const stop = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setDone(true)
  }

  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const secs = (elapsed % 60).toString().padStart(2, '0')
  const isOverTime = elapsed > 360

  return (
    <div className="space-y-4">
      {!done ? (
        <>
          <div className={`text-5xl font-bold tabular-nums text-center py-4 ${isOverTime ? 'text-danger' : 'text-brand'}`}>
            {mins}:{secs}
          </div>
          {isOverTime && (
            <p className="text-center text-danger text-sm">⚠️ Dépassement du temps limite (6 min)</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[{ name: '10 Tractions', reps: 10 }, { name: '20 Dips', reps: 20 }, { name: '30 Pompes', reps: 30 }, { name: '20 Squats', reps: 20 }].map(s => (
              <div key={s.name} className="p-2 rounded-lg bg-surface-2 text-text-muted border border-border">
                {s.name}
              </div>
            ))}
          </div>
          {!running ? (
            <button onClick={start} className="btn-primary w-full">
              Lancer le chrono
            </button>
          ) : (
            <button onClick={stop} className="w-full py-3 rounded-xl bg-danger/10 border border-danger/30 text-danger font-bold hover:bg-danger/20 transition-colors">
              Terminer le circuit
            </button>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-3xl font-bold text-center text-brand tabular-nums">
            {mins}:{secs}
          </div>
          <div>
            <label className="label mb-1 block">Reps complétées (total sur 80)</label>
            <input
              type="number"
              min="0"
              max="80"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="ex: 80"
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary text-xl text-center focus:outline-none focus:border-brand"
            />
          </div>
          <button
            onClick={() => onResult({ circuitTime: elapsed, circuitReps: parseInt(reps) || 0 })}
            disabled={!reps}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Valider
          </button>
        </div>
      )}
    </div>
  )
}

function RPEPicker({ onResult }) {
  const [value, setValue] = useState(7)
  const labels = ['', 'Très léger', 'Léger', 'Modéré', 'Assez dur', 'Dur', 'Dur+', 'Très dur', 'Max−', 'Max', 'MAX ABSOLU']

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-brand tabular-nums">{value}</div>
        <div className="text-text-muted mt-1">{labels[value]}</div>
      </div>
      <input
        type="range" min="1" max="10" step="1" value={value}
        onChange={e => setValue(Number(e.target.value))}
        className="w-full accent-brand"
      />
      <div className="flex justify-between text-xs text-text-faint">
        <span>1 — Léger</span>
        <span>10 — Max</span>
      </div>
      <button onClick={() => onResult({ rpe: value })} className="btn-primary w-full">
        Valider RPE {value}/10
      </button>
    </div>
  )
}

function RepInput({ step, onResult }) {
  const [value, setValue] = useState('')
  return (
    <div className="space-y-4">
      <div className="text-center">
        <input
          type="number"
          min="0"
          max="200"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="0"
          className="text-5xl font-bold text-center bg-transparent text-brand w-32 focus:outline-none tabular-nums"
          autoFocus
        />
        <div className="text-text-muted text-sm mt-1">{step.unit}</div>
      </div>
      <button
        onClick={() => onResult({ [step.id]: parseInt(value) || 0 })}
        disabled={value === ''}
        className="btn-primary w-full disabled:opacity-40"
      >
        Valider — {value || '0'} {step.unit}
      </button>
    </div>
  )
}

function ProfileRadar({ scores }) {
  const axes = [
    { key: 'forceBrute', label: 'Force Brute', color: AXIS_COLORS.forceBrute },
    { key: 'enduranceForce', label: 'Endurance', color: AXIS_COLORS.enduranceForce },
    { key: 'resistanceLactique', label: 'Lactique', color: AXIS_COLORS.resistanceLactique },
    { key: 'equilibre', label: 'Équilibre', color: AXIS_COLORS.equilibre },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {axes.map(ax => (
        <div key={ax.key} className="glass p-3 rounded-xl">
          <div className="text-xs text-text-muted mb-2">{ax.label}</div>
          <div className="text-2xl font-bold" style={{ color: ax.color }}>
            {scores[ax.key]}
            <span className="text-sm text-text-faint font-normal">/100</span>
          </div>
          <div className="mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: ax.color }}
              initial={{ width: 0 }}
              animate={{ width: `${scores[ax.key]}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Diagnostic() {
  const [phase, setPhase] = useState('intro') // intro | testing | rest | results
  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState({})
  const [profile, setProfile] = useState(null)
  const [showRest, setShowRest] = useState(false)

  // Load existing diagnostic
  useEffect(() => {
    const saved = localStorage.getItem('cbl_diagnostic')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProfile(parsed.profile)
    }
  }, [])

  const step = PROTOCOL[currentStep]

  const handleResult = (data) => {
    const newResults = { ...results, ...data }
    setResults(newResults)

    if (step.rest > 0) {
      setShowRest(true)
    } else {
      advanceStep(newResults)
    }
  }

  const advanceStep = (currentResults) => {
    setShowRest(false)
    if (currentStep < PROTOCOL.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      // Compute profile
      const computed = computeProfile(currentResults)
      const record = { profile: computed, raw: currentResults, date: new Date().toISOString() }
      localStorage.setItem('cbl_diagnostic', JSON.stringify(record))

      // Also save to meso tests history
      const history = JSON.parse(localStorage.getItem('cbl_meso_tests') || '[]')
      history.push(record)
      localStorage.setItem('cbl_meso_tests', JSON.stringify(history))

      setProfile(computed)
      setPhase('results')
    }
  }

  const handleRestDone = () => advanceStep(results)

  const resetDiagnostic = () => {
    setPhase('intro')
    setCurrentStep(0)
    setResults({})
    setShowRest(false)
  }

  if (phase === 'results' && profile) {
    const summary = getDiagnosisSummary(profile)
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center text-success">✓</div>
            <h1 className="text-2xl font-bold text-text-primary">Diagnostic complété</h1>
          </div>
          <p className="text-text-muted text-sm ml-11">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </motion.div>

        {/* Overall score */}
        <motion.div
          className="glass p-5 rounded-2xl border border-border text-center"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
        >
          <div className="text-sm text-text-muted mb-1">Score global CBL</div>
          <div className="text-7xl font-bold text-brand tabular-nums">{profile.overall}</div>
          <div className="text-text-muted">/100</div>
          <div className="mt-2 tag">{summary.level}</div>
        </motion.div>

        {/* 4-axis scores */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-semibold text-text-primary mb-3">Profil par axe</h2>
          <ProfileRadar scores={profile.scores} />
        </motion.div>

        {/* Priority insight */}
        <motion.div
          className="p-4 rounded-xl bg-warn/10 border border-warn/20"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          <div className="text-xs text-warn font-semibold uppercase tracking-wider mb-1">Priorité d'entraînement</div>
          <div className="text-text-primary text-sm">{summary.message}</div>
        </motion.div>

        {/* Raw results */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="font-semibold text-text-primary mb-3">Résultats bruts</h2>
          <div className="space-y-2">
            {[
              { key: 'pullUp', label: 'Tractions', target: 30, unit: 'reps' },
              { key: 'muscleUp', label: 'Muscle-up', target: 12, unit: 'reps' },
              { key: 'dips', label: 'Dips', target: 40, unit: 'reps' },
              { key: 'pushUp', label: 'Pompes', target: 65, unit: 'reps' },
              { key: 'gobletSquat', label: 'Goblet @15kg', target: 40, unit: 'reps' },
              { key: 'circuitTime', label: 'Circuit CBL', target: 360, unit: 'sec', inverted: true },
              { key: 'circuitReps', label: 'Reps circuit', target: 80, unit: '/80' },
              { key: 'rpe', label: 'RPE global', target: 10, unit: '/10' },
            ].map(m => {
              const val = profile.raw[m.key]
              if (val === undefined) return null
              const display = m.key === 'circuitTime'
                ? `${Math.floor(val / 60)}'${(val % 60).toString().padStart(2, '0')}`
                : val
              const progress = m.inverted
                ? Math.max(0, Math.min(100, (1 - val / (m.target * 1.5)) * 100))
                : Math.min(100, (val / m.target) * 100)
              return (
                <div key={m.key} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-text-muted flex-shrink-0">{m.label}</div>
                  <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-text-primary tabular-nums">
                    {display} <span className="text-text-faint">{m.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <div className="flex gap-3 pb-8">
          <button onClick={resetDiagnostic} className="btn-ghost flex-1">
            Refaire le test
          </button>
          <button
            onClick={() => window.history.back()}
            className="btn-primary flex-1"
          >
            Voir le Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Test Diagnostique</h1>
          <p className="text-text-muted text-sm mt-1">
            Point d'entrée du plan CBL — à faire une fois, puis en fin de chaque bloc méso.
          </p>
        </div>

        {/* Existing diagnostic */}
        {profile && (
          <div className="glass p-4 rounded-xl border border-success/20 bg-success/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-success">Dernier diagnostic</div>
              <div className="text-xs text-text-faint">
                {new Date(profile.timestamp).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="text-4xl font-bold text-brand">{profile.overall}<span className="text-sm text-text-muted">/100</span></div>
            <ProfileRadar scores={profile.scores} />
          </div>
        )}

        <div className="glass p-4 rounded-xl border border-border">
          <div className="text-sm font-semibold text-text-primary mb-3">Protocole (~45 min)</div>
          <div className="space-y-2">
            {PROTOCOL.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs text-text-faint flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-text-muted">{s.icon} {s.label}</span>
                {s.rest > 0 && <span className="ml-auto text-text-faint text-xs">{s.rest / 60} min récup</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-brand/5 border border-brand/20 text-sm text-text-muted">
          <span className="text-brand font-semibold">Important : </span>
          Ne fais pas ce test après un entraînement. Minimum 24h de repos. Échauffement 10 min avant.
        </div>

        <button
          onClick={() => { setPhase('testing'); setCurrentStep(0); setResults({}) }}
          className="btn-primary w-full"
        >
          Lancer le diagnostic
        </button>
      </div>
    )
  }

  // Testing phase
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-muted">Test {currentStep + 1}/{PROTOCOL.length}</span>
          <button onClick={resetDiagnostic} className="text-xs text-text-faint hover:text-text-muted">
            Annuler
          </button>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand rounded-full"
            animate={{ width: `${((currentStep) / PROTOCOL.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showRest ? (
          <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass p-6 rounded-2xl border border-border text-center">
              <div className="text-sm font-semibold text-success mb-1">Résultat enregistré ✓</div>
              <RestTimer seconds={step.rest} onDone={handleRestDone} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="glass p-6 rounded-2xl border border-border space-y-5">
              {/* Step header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{step.icon}</span>
                  <h2 className="text-xl font-bold text-text-primary">{step.label}</h2>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{step.instruction}</p>
              </div>

              {/* Input */}
              {step.type === 'reps' && <RepInput step={step} onResult={handleResult} />}
              {step.type === 'circuit' && <CircuitTimer onResult={handleResult} />}
              {step.type === 'rpe' && <RPEPicker onResult={handleResult} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
