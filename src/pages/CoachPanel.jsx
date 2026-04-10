import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getRole, setRole as persistRole,
  getAthletes, saveAthletes,
  getProgram, saveProgram,
  uid,
  getFeedback, saveFeedback,
  getAvailabilityNotifs, saveAvailabilityNotifs,
  getRpeExercises,
  getSessionTemplates, saveSessionTemplates,
} from '../utils/coachStore'
import CoachStandards from '../components/coach/CoachStandards'
import CoachCircuits from '../components/coach/CoachCircuits'
import CoachOnboarding, { shouldShowCoachOnboarding } from '../components/coach/CoachOnboarding'
import { MOVEMENT_STANDARDS } from '../data/movementStandards'
import circuitsData from '../data/circuits.json'

// ── Constants ─────────────────────────────────────────────────────────────────
const BLOC_TYPES = ['force', 'volume', 'peak', 'deload', 'spécifique']
const ATHLETE_LEVEL_MAP = { 'Débutante': 1, 'Débutant': 1, 'Amateur': 2, 'Espoir': 3, 'Confirmé': 4, 'Elite': 5 }
const BLOC_COLORS = { force: '#0EA5E9', volume: '#10B981', peak: '#EF4444', deload: '#6B7280', spécifique: '#F59E0B' }
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// ── Helpers ───────────────────────────────────────────────────────────────────
function tagPill(label, color = '#0EA5E9') {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize"
      style={{ backgroundColor: color + '20', color }}>
      {label}
    </span>
  )
}

// ── CoachLock ─────────────────────────────────────────────────────────────────
function CoachLock({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const tryUnlock = () => {
    if (pin === 'CBL2026') { onUnlock() }
    else { setError(true); setPin('') }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary">Espace Coach</h2>
        <p className="text-sm text-text-muted">Réservé à Nicolas Natanek</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && tryUnlock()}
          placeholder="Code d'accès"
          className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-sm text-text-primary text-center tracking-widest focus:outline-none transition-colors ${
            error ? 'border-danger' : 'border-border focus:border-brand'
          }`}
          autoFocus
        />
        {error && <p className="text-xs text-danger text-center">Code incorrect</p>}
        <button onClick={tryUnlock} className="w-full btn-primary">Accéder</button>
      </div>
      <p className="text-xs text-text-faint">Code : CBL2026</p>
    </div>
  )
}

// ── Week Editor ───────────────────────────────────────────────────────────────
function WeekEditor({ week, onUpdate, onPublish, onClose, athleteLevel = 3 }) {
  const [sessions, setSessions] = useState(week.sessions || [])
  const [addingSession, setAddingSession] = useState(false)
  const [newDay, setNewDay] = useState('Lundi')

  const persist = useCallback((nextSessions) => {
    setSessions(nextSessions)
    onUpdate({ ...week, sessions: nextSessions })
  }, [week, onUpdate])

  const addSession = () => {
    const newSession = { id: uid(), day: newDay, coachNote: '', exercises: [] }
    persist([...sessions, newSession])
    setAddingSession(false)
  }

  const removeSession = (sid) => persist(sessions.filter(s => s.id !== sid))

  const updateSession = (sid, patch) => {
    persist(sessions.map(s => s.id === sid ? { ...s, ...patch } : s))
  }

  const addExercise = (sid, exData) => {
    const ex = exData
      ? { id: uid(), ...exData }
      : { id: uid(), name: '', sets: '3', reps: '8', weight: '', note: '' }
    persist(sessions.map(s => s.id === sid ? { ...s, exercises: [...s.exercises, ex] } : s))
  }

  const updateExercise = (sid, eid, patch) => {
    persist(sessions.map(s =>
      s.id === sid ? { ...s, exercises: s.exercises.map(e => e.id === eid ? { ...e, ...patch } : e) } : s
    ))
  }

  const removeExercise = (sid, eid) => {
    persist(sessions.map(s =>
      s.id === sid ? { ...s, exercises: s.exercises.filter(e => e.id !== eid) } : s
    ))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-text-faint hover:text-text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <h3 className="font-bold text-text-primary">{week.name}</h3>
            {week.status === 'published'
              ? tagPill('Publiée', '#10B981')
              : tagPill('Brouillon', '#6B7280')}
          </div>
          <div className="text-xs text-text-faint mt-1 ml-6">{sessions.length} séance{sessions.length !== 1 ? 's' : ''}</div>
        </div>

        {week.status !== 'published' && (
          <button
            onClick={() => onPublish(week.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30 text-success text-xs font-semibold hover:bg-success/20 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Valider & envoyer au coaché
          </button>
        )}
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            onUpdate={(patch) => updateSession(session.id, patch)}
            onRemove={() => removeSession(session.id)}
            onAddExercise={(exData) => addExercise(session.id, exData)}
            onUpdateExercise={(eid, patch) => updateExercise(session.id, eid, patch)}
            onRemoveExercise={(eid) => removeExercise(session.id, eid)}
            athleteLevel={athleteLevel}
          />
        ))}
      </div>

      {/* Add session */}
      {addingSession ? (
        <div className="glass rounded-xl p-3 border border-border flex items-center gap-2">
          <select
            value={newDay}
            onChange={e => setNewDay(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none"
          >
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
          <button onClick={addSession} className="text-sm font-semibold text-brand hover:text-brand/80 px-2 py-1.5">
            Ajouter
          </button>
          <button onClick={() => setAddingSession(false)} className="text-sm text-text-faint px-2 py-1.5">✕</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingSession(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-border text-xs text-text-muted hover:border-brand/40 hover:text-brand transition-all flex items-center justify-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter une séance
        </button>
      )}
    </motion.div>
  )
}

const WORKOUT_FORMATS = [
  { id: 'classic', label: 'Classique', hint: '3×8 reps' },
  { id: 'emom', label: 'EMOM', hint: 'Every Minute On the Minute' },
  { id: 'amrap', label: 'AMRAP', hint: 'As Many Reps/Rounds As Possible' },
  { id: 'tabata', label: 'Tabata', hint: '20s travail / 10s repos' },
  { id: 'fortime', label: 'For Time', hint: 'Compléter le plus vite possible' },
]

function TemplatePanel({ onLoad, onClose }) {
  const [templates, setTemplates] = useState(getSessionTemplates)
  const [search, setSearch] = useState('')

  const filtered = templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  )

  const del = (id) => {
    const next = templates.filter(t => t.id !== id)
    saveSessionTemplates(next)
    setTemplates(next)
  }

  return (
    <div className="p-3 border-t border-border bg-surface-2/20 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted">Bibliothèque de séances</span>
        <button onClick={onClose} className="text-text-faint hover:text-text-muted text-xs">✕</button>
      </div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher…"
        className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand"
      />
      {filtered.length === 0 ? (
        <div className="text-xs text-text-faint text-center py-3">
          {templates.length === 0 ? 'Aucun template. Sauvegarde une séance pour la réutiliser.' : 'Aucun résultat.'}
        </div>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {filtered.map(t => (
            <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 border border-border hover:border-brand/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary">{t.name}</div>
                <div className="text-[10px] text-text-faint">{t.exercises.length} exercice{t.exercises.length !== 1 ? 's' : ''} · {new Date(t.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
              </div>
              <button onClick={() => onLoad(t)} className="text-xs text-brand font-semibold hover:underline flex-shrink-0">Charger</button>
              <button onClick={() => del(t.id)} className="text-[10px] text-text-faint hover:text-danger flex-shrink-0">suppr.</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const CIRCUIT_LEVEL_LABELS = { 1: 'Amateur', 2: 'Amateur+', 3: 'Espoir', 4: 'Pro', 5: 'Elite' }
const CIRCUIT_LEVEL_COLORS = { 1: '#10B981', 2: '#0EA5E9', 3: '#F59E0B', 4: '#EF4444', 5: '#8B5CF6' }

function CircuitPanel({ athleteLevel, onInsert, onClose }) {
  const circuits = circuitsData.circuits
  // Group by level
  const groups = [1, 2, 3, 4, 5].map(lvl => ({
    lvl,
    label: CIRCUIT_LEVEL_LABELS[lvl],
    color: CIRCUIT_LEVEL_COLORS[lvl],
    circuits: circuits.filter(c => c.level === lvl),
    recommended: lvl === athleteLevel,
  })).filter(g => g.circuits.length > 0)

  return (
    <div className="p-3 border-t border-border bg-surface-2/20 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted">Circuits CBL — par niveau</span>
        <button onClick={onClose} className="text-text-faint hover:text-text-muted text-xs">✕</button>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {groups.map(({ lvl, label, color, circuits: grpCircuits, recommended }) => (
          <div key={lvl}>
            {/* Level tag header */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: color + '22', color }}
              >
                {label}
              </span>
              {recommended && (
                <span className="text-[9px] text-text-faint italic">— recommandé pour cet athlète</span>
              )}
              <div className="flex-1 h-px" style={{ background: color + '30' }} />
            </div>

            <div className="space-y-2">
              {grpCircuits.map(circuit => {
                const capMin = Math.floor(circuit.timeCap / 60)
                return (
                  <div key={circuit.id} className={`rounded-xl border bg-surface-2 p-3 space-y-2 hover:border-brand/30 transition-colors ${recommended ? 'border-border' : 'border-border/60 opacity-80'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-text-primary leading-tight">{circuit.name}</div>
                        <div className="text-[10px] text-text-faint mt-0.5">{circuit.division} · cap {capMin}min</div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {circuit.exercises.slice(0, 4).map((ex, i) => (
                        <div key={i} className="text-[10px] text-text-muted flex items-start gap-1">
                          <span className="text-text-faint flex-shrink-0">•</span>
                          <span>{ex.label}{ex.weight ? ` — ${ex.weight}` : ''}</span>
                        </div>
                      ))}
                      {circuit.exercises.length > 4 && (
                        <div className="text-[10px] text-text-faint">+{circuit.exercises.length - 4} exercices…</div>
                      )}
                    </div>
                    <button
                      onClick={() => onInsert(circuit)}
                      className="w-full py-1.5 rounded-lg text-[11px] font-semibold border border-brand/30 text-brand bg-brand/5 hover:bg-brand/15 transition-all active:scale-95"
                    >
                      Insérer dans la séance
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionCard({ session, onUpdate, onRemove, onAddExercise, onUpdateExercise, onRemoveExercise, athleteLevel = 3 }) {
  const [addingEx, setAddingEx] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', sets: '3', reps: '8', weight: '', note: '', format: 'classic', duration: '', interval: '' })
  const [editingNote, setEditingNote] = useState(false)
  const [exSearch, setExSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCircuits, setShowCircuits] = useState(false)

  const insertCircuit = (circuit) => {
    const capMin = Math.floor(circuit.timeCap / 60)
    const header = {
      id: uid(),
      name: `Circuit CBL — ${circuit.name}`,
      note: `${circuit.division} · cap ${capMin}min`,
      format: 'fortime',
      duration: String(capMin),
      sets: '',
      reps: String(circuit.exercises.length),
      weight: '',
    }
    const exes = circuit.exercises.map(ex => ({
      id: uid(),
      name: ex.label,
      note: [ex.weight, ex.note].filter(Boolean).join(' · '),
      format: 'classic',
      sets: '',
      reps: '',
      weight: ex.weight || '',
    }))
    onUpdate({ exercises: [...session.exercises, header, ...exes] })
    setShowCircuits(false)
  }

  const suggestions = exSearch.trim().length >= 2
    ? MOVEMENT_STANDARDS.filter(m => m.name.toLowerCase().includes(exSearch.toLowerCase())).slice(0, 6)
    : []

  const saveExercise = () => {
    if (!newEx.name.trim()) return
    onAddExercise(newEx)
    setAddingEx(false)
    setNewEx({ name: '', sets: '3', reps: '8', weight: '', note: '', format: 'classic', duration: '', interval: '' })
    setExSearch('')
    setShowSuggestions(false)
  }

  const saveAsTemplate = () => {
    if (!session.exercises.length) return
    const name = prompt('Nom du template de séance ?', session.day)
    if (!name) return
    const templates = getSessionTemplates()
    templates.push({ id: uid(), name: name.trim(), exercises: session.exercises, savedAt: new Date().toISOString() })
    saveSessionTemplates(templates)
    alert('Template sauvegardé !')
  }

  const loadTemplate = (t) => {
    t.exercises.forEach(ex => onAddExercise({ ...ex, id: uid() }))
    setShowTemplates(false)
  }

  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      {/* Session header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface-2/50">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="text-sm font-semibold text-text-primary">{session.day}</span>
        <span className="text-xs text-text-faint">{session.exercises.length} exercice{session.exercises.length !== 1 ? 's' : ''}</span>
        <button onClick={onRemove} className="ml-auto text-text-faint hover:text-danger transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>

      {/* Exercises table */}
      {session.exercises.length > 0 && (
        <div className="divide-y divide-border/50">
          {session.exercises.map(ex => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onUpdate={(patch) => onUpdateExercise(ex.id, patch)}
              onRemove={() => onRemoveExercise(ex.id)}
            />
          ))}
        </div>
      )}

      {/* Add exercise inline form */}
      {addingEx ? (
        <div className="p-3 border-t border-border space-y-2 bg-surface-2/30">
          {/* Format selector */}
          <div className="flex gap-1 flex-wrap">
            {WORKOUT_FORMATS.map(f => (
              <button
                key={f.id}
                onClick={() => setNewEx(p => ({ ...p, format: f.id }))}
                className={`text-[10px] px-2 py-1 rounded-full border font-semibold transition-all ${
                  newEx.format === f.id ? 'bg-brand/20 border-brand/40 text-brand' : 'border-border text-text-faint hover:border-text-faint'
                }`}
                title={f.hint}
              >{f.label}</button>
            ))}
          </div>

          {/* Exercise name search */}
          <div className="relative">
            <input
              autoFocus
              value={exSearch || newEx.name}
              onChange={e => {
                const v = e.target.value
                setExSearch(v)
                setNewEx(p => ({ ...p, name: v }))
                setShowSuggestions(true)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => exSearch.length >= 2 && setShowSuggestions(true)}
              placeholder="Nom de l'exercice (tape pour chercher CBL)"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-surface rounded-xl border border-border shadow-modal overflow-hidden">
                {suggestions.map(m => (
                  <button
                    key={m.id}
                    onMouseDown={() => {
                      setNewEx(p => ({ ...p, name: m.name }))
                      setExSearch(m.name)
                      setShowSuggestions(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                  >
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#0EA5E920', color: '#0EA5E9' }}>{m.category}</span>
                    <span className="text-sm text-text-primary">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Classic fields */}
          {newEx.format === 'classic' && (
            <div className="flex gap-2 flex-wrap">
              <input value={newEx.sets} onChange={e => setNewEx(p => ({ ...p, sets: e.target.value }))} placeholder="Séries"
                className="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-brand" />
              <span className="self-center text-text-faint">×</span>
              <input value={newEx.reps} onChange={e => setNewEx(p => ({ ...p, reps: e.target.value }))} placeholder="Reps"
                className="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-brand" />
              <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 w-28 focus-within:border-brand">
                <input
                  value={newEx.weight.replace(/\s*kg$/, '')}
                  onChange={e => { const raw = e.target.value.replace(/[^\d.]/g, ''); setNewEx(p => ({ ...p, weight: raw ? `${raw} kg` : '' })) }}
                  placeholder="Charge" className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none w-12" />
                <span className="text-xs text-text-faint flex-shrink-0">kg</span>
              </div>
            </div>
          )}

          {/* EMOM fields */}
          {newEx.format === 'emom' && (
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 focus-within:border-brand">
                <input value={newEx.duration} onChange={e => setNewEx(p => ({ ...p, duration: e.target.value }))} placeholder="Durée" className="w-14 bg-transparent text-sm text-text-primary focus:outline-none" />
                <span className="text-xs text-text-faint">min</span>
              </div>
              <span className="text-xs text-text-faint">chaque minute :</span>
              <input value={newEx.reps} onChange={e => setNewEx(p => ({ ...p, reps: e.target.value }))} placeholder="Reps"
                className="w-16 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-brand" />
            </div>
          )}

          {/* AMRAP fields */}
          {newEx.format === 'amrap' && (
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 focus-within:border-brand">
                <input value={newEx.duration} onChange={e => setNewEx(p => ({ ...p, duration: e.target.value }))} placeholder="Durée" className="w-14 bg-transparent text-sm text-text-primary focus:outline-none" />
                <span className="text-xs text-text-faint">min</span>
              </div>
              <span className="text-xs text-text-faint">max rounds :</span>
              <input value={newEx.reps} onChange={e => setNewEx(p => ({ ...p, reps: e.target.value }))} placeholder="Reps/tour"
                className="w-20 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-brand" />
            </div>
          )}

          {/* Tabata fields */}
          {newEx.format === 'tabata' && (
            <div className="flex gap-2 flex-wrap items-center">
              <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 focus-within:border-brand">
                <input value={newEx.sets} onChange={e => setNewEx(p => ({ ...p, sets: e.target.value }))} placeholder="8" className="w-10 bg-transparent text-sm text-text-primary text-center focus:outline-none" />
                <span className="text-xs text-text-faint">rounds</span>
              </div>
              <span className="text-xs text-text-faint">20s / 10s</span>
            </div>
          )}

          {/* For Time fields */}
          {newEx.format === 'fortime' && (
            <div className="flex gap-2 flex-wrap items-center">
              <input value={newEx.reps} onChange={e => setNewEx(p => ({ ...p, reps: e.target.value }))} placeholder="Reps total"
                className="w-24 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-brand" />
              <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 focus-within:border-brand">
                <span className="text-xs text-text-faint">Time cap :</span>
                <input value={newEx.duration} onChange={e => setNewEx(p => ({ ...p, duration: e.target.value }))} placeholder="—" className="w-10 bg-transparent text-sm text-text-primary text-center focus:outline-none" />
                <span className="text-xs text-text-faint">min</span>
              </div>
            </div>
          )}

          {/* Note */}
          <input value={newEx.note} onChange={e => setNewEx(p => ({ ...p, note: e.target.value }))} placeholder="Note coach (opt.)"
            className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand" />

          <div className="flex gap-2">
            <button onClick={saveExercise} className="text-sm font-semibold text-brand hover:text-brand/80 px-3 py-1.5">Ajouter</button>
            <button onClick={() => { setAddingEx(false); setExSearch('') }} className="text-sm text-text-faint px-2 py-1.5">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-border/50 flex items-center gap-3 flex-wrap">
          <button onClick={() => setAddingEx(true)} className="text-xs text-text-faint hover:text-brand transition-colors flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Exercice
          </button>
          <button onClick={() => { setShowTemplates(v => !v); setShowCircuits(false) }} className="text-xs text-text-faint hover:text-warn transition-colors flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/>
            </svg>
            Templates
          </button>
          <button onClick={() => { setShowCircuits(v => !v); setShowTemplates(false) }} className="text-xs text-text-faint hover:text-brand transition-colors flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Circuits CBL
          </button>
          {session.exercises.length > 0 && (
            <button onClick={saveAsTemplate} className="text-xs text-text-faint hover:text-success transition-colors flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Sauvegarder
            </button>
          )}
          {!editingNote ? (
            <button onClick={() => setEditingNote(true)} className="text-xs text-text-faint hover:text-brand transition-colors flex items-center gap-1 ml-auto">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {session.coachNote ? 'Note coach' : 'Ajouter note'}
            </button>
          ) : (
            <div className="ml-auto flex-1">
              <input autoFocus value={session.coachNote} onChange={e => onUpdate({ coachNote: e.target.value })}
                onBlur={() => setEditingNote(false)} placeholder="Note coach pour cette séance…"
                className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand" />
            </div>
          )}
        </div>
      )}
      {session.coachNote && !editingNote && (
        <div className="px-3 pb-2 text-xs text-text-muted italic cursor-pointer hover:text-text-primary" onClick={() => setEditingNote(true)}>
          "{session.coachNote}"
        </div>
      )}
      {showTemplates && !addingEx && !showCircuits && <TemplatePanel onLoad={loadTemplate} onClose={() => setShowTemplates(false)} />}
      {showCircuits && !addingEx && !showTemplates && (
        <CircuitPanel
          athleteLevel={athleteLevel}
          onInsert={insertCircuit}
          onClose={() => setShowCircuits(false)}
        />
      )}
    </div>
  )
}

const FORMAT_COLORS = { emom: '#0EA5E9', amrap: '#EF4444', tabata: '#8B5CF6', fortime: '#F59E0B', classic: '#6B7280' }

function formatExerciseLabel(ex) {
  const f = ex.format || 'classic'
  if (f === 'emom') return `EMOM ${ex.duration || '?'}min — ${ex.reps || '?'} reps/${ex.name}`
  if (f === 'amrap') return `AMRAP ${ex.duration || '?'}min — ${ex.reps || '?'} reps ${ex.name}`
  if (f === 'tabata') return `Tabata ${ex.sets || '8'} rounds ${ex.name}`
  if (f === 'fortime') return `${ex.reps || '?'} reps ${ex.name}${ex.duration ? ` (cap ${ex.duration}min)` : ''}`
  return `${ex.name}${ex.sets ? ` — ${ex.sets}×${ex.reps}` : ''}${ex.weight ? ` @${ex.weight}` : ''}`
}

function ExerciseRow({ exercise, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const fmt = exercise.format || 'classic'
  const color = FORMAT_COLORS[fmt] || FORMAT_COLORS.classic

  if (editing) {
    return (
      <div className="p-2 space-y-1.5 bg-surface-2/50">
        <input autoFocus value={exercise.name} onChange={e => onUpdate({ name: e.target.value })}
          className="w-full bg-surface-2 border border-brand rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
          placeholder="Nom exercice" />
        <div className="flex gap-1.5 flex-wrap">
          {['sets', 'reps', 'weight', 'duration', 'note'].map(field => (
            <input key={field} value={exercise[field] || ''} onChange={e => onUpdate({ [field]: e.target.value })}
              placeholder={field === 'sets' ? 'Séries/Rounds' : field === 'reps' ? 'Reps' : field === 'weight' ? 'Charge' : field === 'duration' ? 'Durée (min)' : 'Note'}
              className={`bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand ${field === 'note' ? 'flex-1 min-w-24' : 'w-20'}`} />
          ))}
          <button onClick={() => setEditing(false)} className="text-brand text-xs font-semibold px-2 py-1">OK</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-surface-2/30 cursor-pointer transition-colors group" onClick={() => setEditing(true)}>
      {fmt !== 'classic' && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 uppercase" style={{ background: color + '20', color }}>{fmt}</span>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text-primary">{exercise.name || <span className="italic text-text-faint">Sans nom</span>}</span>
        {exercise.note && <span className="text-xs text-text-muted ml-2 italic">{exercise.note}</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono text-text-faint">
        {fmt === 'classic' && exercise.sets && <span>{exercise.sets}×{exercise.reps}</span>}
        {fmt === 'emom' && exercise.duration && <span className="text-brand">{exercise.duration}min</span>}
        {fmt === 'amrap' && exercise.duration && <span className="text-danger">{exercise.duration}min</span>}
        {fmt === 'tabata' && <span className="text-purple-400">{exercise.sets || 8}×20s</span>}
        {fmt === 'fortime' && exercise.duration && <span className="text-warn">cap {exercise.duration}min</span>}
        {exercise.weight && <span className="text-warn">{exercise.weight}</span>}
      </div>
      <button onClick={e => { e.stopPropagation(); onRemove() }} className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-danger transition-all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

// ── Program Tree ──────────────────────────────────────────────────────────────
function ProgramTree({ program, onProgramChange, athleteId }) {
  const [expandedCycles, setExpandedCycles] = useState(new Set())
  const [expandedBlocs, setExpandedBlocs] = useState(new Set())
  const [selectedWeek, setSelectedWeek] = useState(null) // { cycleId, blocId, weekId }
  const [modal, setModal] = useState(null) // { type, parentCycleId?, parentBlocId? }

  const athleteLevel = (() => {
    const a = getAthletes().find(a => a.id === athleteId)
    return ATHLETE_LEVEL_MAP[a?.level] || 3
  })()
  const [form, setForm] = useState({})

  const save = useCallback((nextProgram) => {
    saveProgram(athleteId, nextProgram)
    onProgramChange(nextProgram)
  }, [athleteId, onProgramChange])

  const toggleCycle = (id) => setExpandedCycles(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleBloc = (id) => setExpandedBlocs(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  // ── CRUD ──
  const addCycle = () => {
    const cycle = {
      id: uid(), name: form.name || 'Cycle', startDate: form.startDate || '', endDate: form.endDate || '', objective: form.objective || '',
      blocs: [],
    }
    save({ ...program, cycles: [...program.cycles, cycle] })
    setExpandedCycles(s => new Set([...s, cycle.id]))
    setModal(null); setForm({})
  }

  const deleteCycle = (cycleId) => {
    save({ ...program, cycles: program.cycles.filter(c => c.id !== cycleId) })
    if (selectedWeek?.cycleId === cycleId) setSelectedWeek(null)
  }

  const addBloc = () => {
    const bloc = { id: uid(), name: form.name || 'Bloc', type: form.type || 'force', weeks: [] }
    save({
      ...program,
      cycles: program.cycles.map(c => c.id === modal.parentCycleId ? { ...c, blocs: [...c.blocs, bloc] } : c)
    })
    setExpandedBlocs(s => new Set([...s, bloc.id]))
    setModal(null); setForm({})
  }

  const deleteBloc = (cycleId, blocId) => {
    save({
      ...program,
      cycles: program.cycles.map(c => c.id === cycleId ? { ...c, blocs: c.blocs.filter(b => b.id !== blocId) } : c)
    })
    if (selectedWeek?.blocId === blocId) setSelectedWeek(null)
  }

  const addWeek = () => {
    const { parentCycleId, parentBlocId } = modal
    // Find previous week count for auto-name
    const bloc = program.cycles.find(c => c.id === parentCycleId)?.blocs.find(b => b.id === parentBlocId)
    const weekNum = (bloc?.weeks.length || 0) + 1
    const week = {
      id: uid(), name: form.name || `Semaine ${weekNum}`, status: 'draft', sessions: [],
    }
    save({
      ...program,
      cycles: program.cycles.map(c => c.id === parentCycleId ? {
        ...c, blocs: c.blocs.map(b => b.id === parentBlocId ? { ...b, weeks: [...b.weeks, week] } : b)
      } : c)
    })
    setSelectedWeek({ cycleId: parentCycleId, blocId: parentBlocId, weekId: week.id })
    setModal(null); setForm({})
  }

  const duplicateWeek = (cycleId, blocId, weekId) => {
    const week = program.cycles
      .find(c => c.id === cycleId)?.blocs
      .find(b => b.id === blocId)?.weeks
      .find(w => w.id === weekId)
    if (!week) return
    const bloc = program.cycles.find(c => c.id === cycleId)?.blocs.find(b => b.id === blocId)
    const newWeek = {
      ...week,
      id: uid(),
      name: `Semaine ${(bloc?.weeks.length || 0) + 1}`,
      status: 'draft',
      sessions: week.sessions.map(s => ({ ...s, id: uid(), exercises: s.exercises.map(e => ({ ...e, id: uid() })) })),
    }
    save({
      ...program,
      cycles: program.cycles.map(c => c.id === cycleId ? {
        ...c, blocs: c.blocs.map(b => b.id === blocId ? { ...b, weeks: [...b.weeks, newWeek] } : b)
      } : c)
    })
  }

  const deleteWeek = (cycleId, blocId, weekId) => {
    save({
      ...program,
      cycles: program.cycles.map(c => c.id === cycleId ? {
        ...c, blocs: c.blocs.map(b => b.id === blocId ? { ...b, weeks: b.weeks.filter(w => w.id !== weekId) } : b)
      } : c)
    })
    if (selectedWeek?.weekId === weekId) setSelectedWeek(null)
  }

  const updateWeek = useCallback((cycleId, blocId, updatedWeek) => {
    save({
      ...program,
      cycles: program.cycles.map(c => c.id === cycleId ? {
        ...c, blocs: c.blocs.map(b => b.id === blocId ? {
          ...b, weeks: b.weeks.map(w => w.id === updatedWeek.id ? updatedWeek : w)
        } : b)
      } : c)
    })
  }, [program, save])

  const publishWeek = (cycleId, blocId, weekId) => {
    save({
      ...program,
      cycles: program.cycles.map(c => c.id === cycleId ? {
        ...c, blocs: c.blocs.map(b => b.id === blocId ? {
          ...b, weeks: b.weeks.map(w => w.id === weekId ? { ...w, status: 'published' } : w)
        } : b)
      } : c)
    })
  }

  const selWeekData = selectedWeek
    ? program.cycles.find(c => c.id === selectedWeek.cycleId)?.blocs
        .find(b => b.id === selectedWeek.blocId)?.weeks
        .find(w => w.id === selectedWeek.weekId)
    : null

  // ── Week editor add exercise override (pass-through to session card) ──
  // SessionCard calls onAddExercise(newExData) — we need to handle it in WeekEditor
  // via updateWeek. Already wired: WeekEditor calls onUpdate which calls updateWeek.

  return (
    <div className="flex gap-5 items-start">
      {/* Tree column */}
      <div className={`space-y-3 ${selWeekData ? 'w-80 flex-shrink-0' : 'flex-1'} transition-all`}>
        {program.cycles.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center border border-dashed border-border">
            <div className="text-4xl mb-3">📁</div>
            <div className="text-sm text-text-muted">Aucun cycle pour l'instant</div>
            <div className="text-xs text-text-faint mt-1">Créer le premier cycle de programme</div>
          </div>
        ) : (
          program.cycles.map(cycle => (
            <div key={cycle.id} className="glass rounded-xl border border-border overflow-hidden">
              {/* Cycle header */}
              <div
                className="flex items-center gap-2 px-3 py-3 cursor-pointer hover:bg-surface-2/50 transition-colors"
                onClick={() => toggleCycle(cycle.id)}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"
                  className={`transition-transform flex-shrink-0 ${expandedCycles.has(cycle.id) ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={expandedCycles.has(cycle.id) ? '#0EA5E920' : 'none'} stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="font-semibold text-sm text-text-primary flex-1">{cycle.name}</span>
                {cycle.objective && <span className="text-xs text-text-faint truncate max-w-24">{cycle.objective}</span>}
                <button
                  onClick={e => { e.stopPropagation(); setModal({ type: 'bloc', parentCycleId: cycle.id }); setForm({ type: 'force' }) }}
                  className="text-text-faint hover:text-brand transition-colors px-1"
                  title="Ajouter un bloc"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteCycle(cycle.id) }}
                  className="text-text-faint hover:text-danger transition-colors px-1"
                  title="Supprimer le cycle"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>

              {/* Blocs */}
              <AnimatePresence>
                {expandedCycles.has(cycle.id) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 divide-y divide-border/30">
                      {cycle.blocs.length === 0 && (
                        <div className="pl-8 py-2 text-xs text-text-faint italic">Aucun bloc — cliquez + pour en ajouter</div>
                      )}
                      {cycle.blocs.map(bloc => {
                        const bc = BLOC_COLORS[bloc.type] || '#888'
                        return (
                          <div key={bloc.id}>
                            <div
                              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-surface-2/40 transition-colors"
                              onClick={() => toggleBloc(bloc.id)}
                            >
                              <svg
                                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={bc} strokeWidth="2" strokeLinecap="round"
                                className={`transition-transform flex-shrink-0 ${expandedBlocs.has(bloc.id) ? 'rotate-90' : ''}`}
                              >
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: bc }} />
                              <span className="text-sm text-text-primary flex-1">{bloc.name}</span>
                              {tagPill(bloc.type, bc)}
                              <span className="text-[10px] text-text-faint">{bloc.weeks.length}sem</span>
                              <button
                                onClick={e => { e.stopPropagation(); setModal({ type: 'week', parentCycleId: cycle.id, parentBlocId: bloc.id }); setForm({}) }}
                                className="text-text-faint hover:text-brand transition-colors px-1"
                                title="Ajouter une semaine"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteBloc(cycle.id, bloc.id) }}
                                className="text-text-faint hover:text-danger transition-colors px-1"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                </svg>
                              </button>
                            </div>

                            {/* Weeks */}
                            <AnimatePresence>
                              {expandedBlocs.has(bloc.id) && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-10 pb-2 space-y-0.5">
                                    {bloc.weeks.length === 0 && (
                                      <div className="py-1 text-xs text-text-faint italic">Aucune semaine</div>
                                    )}
                                    {bloc.weeks.map(week => {
                                      const isSelected = selectedWeek?.weekId === week.id
                                      return (
                                        <div key={week.id} className="flex items-center gap-1.5 group">
                                          <button
                                            onClick={() => setSelectedWeek(isSelected ? null : { cycleId: cycle.id, blocId: bloc.id, weekId: week.id })}
                                            className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${
                                              isSelected ? 'bg-brand/10 text-brand border border-brand/20' : 'hover:bg-surface-2 text-text-muted hover:text-text-primary'
                                            }`}
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                              <polyline points="14 2 14 8 20 8"/>
                                            </svg>
                                            <span className="flex-1">{week.name}</span>
                                            {week.status === 'published'
                                              ? <span className="text-[9px] text-success">✓ pub.</span>
                                              : <span className="text-[9px] text-text-faint">brouillon</span>}
                                          </button>
                                          <button
                                            onClick={() => duplicateWeek(cycle.id, bloc.id, week.id)}
                                            className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-brand transition-all"
                                            title="Dupliquer →"
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => deleteWeek(cycle.id, bloc.id, week.id)}
                                            className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-danger transition-all"
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                          </button>
                                        </div>
                                      )
                                    })}
                                    <button
                                      onClick={() => { setModal({ type: 'week', parentCycleId: cycle.id, parentBlocId: bloc.id }); setForm({}) }}
                                      className="w-full py-1 text-[10px] text-text-faint hover:text-brand transition-colors flex items-center gap-1 px-2"
                                    >
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                      </svg>
                                      Semaine suivante
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}

        <button
          onClick={() => { setModal({ type: 'cycle' }); setForm({}) }}
          className="w-full py-2.5 rounded-xl border border-dashed border-border text-xs text-text-muted hover:border-brand/40 hover:text-brand transition-all flex items-center justify-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un cycle
        </button>
      </div>

      {/* Week editor */}
      <AnimatePresence>
        {selWeekData && (
          <div className="flex-1 min-w-0">
            <WeekEditor
              week={selWeekData}
              onUpdate={(updated) => updateWeek(selectedWeek.cycleId, selectedWeek.blocId, updated)}
              onPublish={(weekId) => { publishWeek(selectedWeek.cycleId, selectedWeek.blocId, weekId) }}
              onClose={() => setSelectedWeek(null)}
              athleteLevel={athleteLevel}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setModal(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-5 w-full max-w-sm space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {modal.type === 'cycle' && (
                <>
                  <h3 className="font-bold text-text-primary">Nouveau cycle</h3>
                  <div className="space-y-2">
                    <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Nom du cycle (ex: Préparation Compétition)"
                      className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand" autoFocus />
                    <div className="flex gap-2">
                      <input type="date" value={form.startDate || ''} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                        className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand" />
                      <input type="date" value={form.endDate || ''} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                        className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand" />
                    </div>
                    <input value={form.objective || ''} onChange={e => setForm(p => ({ ...p, objective: e.target.value }))}
                      placeholder="Objectif du cycle (opt.)"
                      className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModal(null)} className="flex-1 btn-ghost text-sm">Annuler</button>
                    <button onClick={addCycle} className="flex-1 btn-primary text-sm">Créer</button>
                  </div>
                </>
              )}

              {modal.type === 'bloc' && (
                <>
                  <h3 className="font-bold text-text-primary">Nouveau bloc</h3>
                  <div className="space-y-2">
                    <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Nom du bloc (ex: Bloc Force)" autoFocus
                      className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand" />
                    <div className="flex gap-2 flex-wrap">
                      {BLOC_TYPES.map(t => (
                        <button key={t}
                          onClick={() => setForm(p => ({ ...p, type: t }))}
                          className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all capitalize"
                          style={{
                            backgroundColor: form.type === t ? (BLOC_COLORS[t] + '30') : 'transparent',
                            borderColor: form.type === t ? BLOC_COLORS[t] : 'var(--color-border)',
                            color: form.type === t ? BLOC_COLORS[t] : 'var(--color-text-muted)',
                          }}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModal(null)} className="flex-1 btn-ghost text-sm">Annuler</button>
                    <button onClick={addBloc} className="flex-1 btn-primary text-sm">Créer</button>
                  </div>
                </>
              )}

              {modal.type === 'week' && (
                <>
                  <h3 className="font-bold text-text-primary">Nouvelle semaine</h3>
                  <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nom (ex: Semaine 3)" autoFocus
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand" />
                  <div className="flex gap-2">
                    <button onClick={() => setModal(null)} className="flex-1 btn-ghost text-sm">Annuler</button>
                    <button onClick={addWeek} className="flex-1 btn-primary text-sm">Créer</button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── RPE Tab (coach view) ──────────────────────────────────────────────────────
const RPE_COLOR = (v) => v <= 3 ? '#10B981' : v <= 6 ? '#F59E0B' : v <= 8 ? '#F97316' : '#EF4444'
const RPE_LABEL = (v) => v <= 2 ? 'Trop facile' : v <= 4 ? 'Facile' : v <= 6 ? 'Modéré' : v <= 8 ? 'Difficile' : 'Maximal'

function RpeTab({ athleteId }) {
  const debriefs = (() => {
    try { return JSON.parse(localStorage.getItem(`cbl_debriefs_${athleteId}`) || '[]') } catch { return [] }
  })().slice().reverse().slice(0, 20)

  const exRpeList = getRpeExercises(athleteId).slice().reverse().slice(0, 10)

  // Consecutive high/low RPE alert
  const recent = debriefs.slice(0, 4).map(d => d.rpe).filter(Boolean)
  const allHigh = recent.length >= 2 && recent.slice(0, 2).every(r => r >= 8)
  const allLow = recent.length >= 2 && recent.slice(0, 2).every(r => r <= 3)

  if (debriefs.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center border border-dashed border-border">
        <div className="text-text-faint text-sm">Aucun RPE enregistré par le coaché.</div>
        <div className="text-xs text-text-faint mt-1">Le coaché valide ses séances depuis le dashboard.</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alertes */}
      {allHigh && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-danger/5 border border-danger/20">
          <span className="text-lg">⚠️</span>
          <div>
            <div className="text-sm font-semibold text-danger">Charge élevée</div>
            <div className="text-xs text-text-muted">RPE ≥ 8 sur 2 séances consécutives. Envisager un déload.</div>
          </div>
        </div>
      )}
      {allLow && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
          <span className="text-lg">💡</span>
          <div>
            <div className="text-sm font-semibold text-success">Charge faible</div>
            <div className="text-xs text-text-muted">RPE ≤ 3 sur 2 séances consécutives. Possibilité de progresser.</div>
          </div>
        </div>
      )}

      {/* Historique RPE global */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="label">Historique RPE — séances</div>
        <div className="space-y-2">
          {debriefs.map((d, i) => {
            const rpe = d.rpe || 0
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="text-xs text-text-faint w-24 flex-shrink-0">
                  {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
                <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${rpe * 10}%`, backgroundColor: RPE_COLOR(rpe) }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: RPE_COLOR(rpe) }}>{rpe}/10</span>
                <span className="text-[10px] text-text-faint w-20 flex-shrink-0">{d.sessionName}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* RPE par exercice */}
      {exRpeList.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="label">RPE par exercice — dernières séances</div>
          <div className="space-y-4">
            {exRpeList.map((session, si) => (
              <div key={si}>
                <div className="text-xs font-semibold text-text-muted mb-1.5">
                  {session.sessionName} · {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
                <div className="space-y-1.5">
                  {session.exercises.filter(e => e.rpe > 0).map((ex, ei) => (
                    <div key={ei} className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted flex-1 truncate">{ex.name}</span>
                      <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${ex.rpe * 10}%`, backgroundColor: RPE_COLOR(ex.rpe) }} />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums w-4" style={{ color: RPE_COLOR(ex.rpe) }}>{ex.rpe}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Feedback Tab (coach view + reply) ─────────────────────────────────────────
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function CoachAudioRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const getMimeType = () => {
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg']
    return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
  }

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        if (blob.size > 8 * 1024 * 1024) { alert('Audio trop lourd (max 8 MB).'); return }
        // Auto-confirm: convert to base64 immediately on stop
        const b64 = await blobToBase64(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setConfirmed(true)
        onRecorded(b64)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => { if (s >= 299) { stopRec(); return s } return s + 1 }), 1000)
    } catch { alert('Accès micro refusé.') }
  }

  const stopRec = () => {
    recorderRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const clear = () => { setAudioUrl(null); setConfirmed(false); setSeconds(0); onRecorded(null) }

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-2">
      {!audioUrl ? (
        <button
          onClick={recording ? stopRec : start}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
            recording ? 'bg-danger/10 border-danger/30 text-danger' : 'border-border text-text-muted hover:border-brand/30 hover:text-brand'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${recording ? 'bg-danger animate-pulse' : 'bg-text-faint'}`} />
          {recording ? `Arrêter · ${fmt(seconds)}` : '🎙 Enregistrer un retour audio'}
        </button>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-success font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Audio prêt ({fmt(seconds)})
          </div>
          <audio controls src={audioUrl} className="w-full h-8" />
          <button onClick={clear} className="text-[11px] text-text-faint hover:text-danger">Recommencer</button>
        </div>
      )}
    </div>
  )
}

function FeedbackTab({ athleteId }) {
  const [feedbacks, setFeedbacks] = useState(() => getFeedback(athleteId))
  const [replyingId, setReplyingId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyTimestamp, setReplyTimestamp] = useState('')
  const [replyAudio, setReplyAudio] = useState(null)

  const reload = () => setFeedbacks(getFeedback(athleteId))

  const markSeen = (id) => {
    const next = feedbacks.map(f => f.id === id ? { ...f, readByCoach: true } : f)
    saveFeedback(athleteId, next)
    setFeedbacks(next)
  }

  const sendReply = (id) => {
    if (!replyText.trim() && !replyAudio) return
    const next = feedbacks.map(f => f.id === id ? {
      ...f,
      status: 'replied',
      coachReply: replyText.trim(),
      timestamp: replyTimestamp.trim(),
      coachAudioData: replyAudio,
      readByCoach: true,
      readByAthlete: false,
    } : f)
    saveFeedback(athleteId, next)
    setFeedbacks(next)
    setReplyingId(null)
    setReplyText('')
    setReplyTimestamp('')
    setReplyAudio(null)
  }

  if (feedbacks.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center border border-dashed border-border">
        <div className="text-text-faint text-sm">Aucun feedback soumis.</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {feedbacks.map(item => {
        const isNew = !item.readByCoach && item.status === 'pending'
        return (
          <div key={item.id} className="glass rounded-xl border border-border overflow-hidden">
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isNew && <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
                    <span className="text-sm font-semibold text-text-primary">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] capitalize text-text-faint">{item.type}</span>
                    <span className="text-[10px] text-text-faint">
                      {new Date(item.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {item.status === 'replied'
                      ? <span className="text-[10px] text-success font-medium">Répondu</span>
                      : <span className="text-[10px] text-text-faint">En attente</span>}
                  </div>
                </div>
                {isNew && (
                  <button onClick={() => markSeen(item.id)} className="text-[10px] text-brand hover:underline flex-shrink-0">
                    Marquer vu
                  </button>
                )}
              </div>

              {item.context && <p className="text-xs text-text-muted leading-relaxed">{item.context}</p>}

              {item.type === 'video' && item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                  Voir la vidéo
                </a>
              )}
              {item.type === 'audio' && item.audioData && (
                <audio controls src={item.audioData} className="w-full h-8" />
              )}

              {/* Réponse existante */}
              {item.status === 'replied' && item.coachReply && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-2.5 text-xs text-text-muted">
                  <span className="text-success font-semibold">Ton retour : </span>{item.coachReply}
                </div>
              )}

              {/* Zone de réponse */}
              {replyingId === item.id ? (
                <div className="space-y-2 pt-1">
                  {item.type === 'video' && (
                    <input
                      value={replyTimestamp}
                      onChange={e => setReplyTimestamp(e.target.value)}
                      placeholder="Timestamp mm:ss (opt.)"
                      className="w-full bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand"
                    />
                  )}
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Ton commentaire…"
                    rows={3}
                    className="w-full bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-brand placeholder-text-faint"
                  />
                  <CoachAudioRecorder onRecorded={setReplyAudio} />
                  {replyAudio && <p className="text-[10px] text-success">✓ Audio enregistré</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setReplyingId(null); setReplyText(''); setReplyTimestamp(''); setReplyAudio(null) }}
                      className="flex-1 text-xs text-text-faint hover:text-text-muted py-1.5 rounded-lg border border-border">
                      Annuler
                    </button>
                    <button
                      onClick={() => sendReply(item.id)}
                      disabled={!replyText.trim() && !replyAudio}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-brand text-black disabled:opacity-40"
                    >
                      Envoyer le feedback
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setReplyingId(item.id); setReplyText(item.coachReply || '') }}
                  className="text-xs text-brand hover:underline font-medium"
                >
                  {item.status === 'replied' ? 'Modifier le retour' : 'Répondre'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Availability Notifications (coach view) ───────────────────────────────────
function AvailabilityNotifsPanel({ onClose }) {
  const [notifs, setNotifs] = useState(getAvailabilityNotifs)

  const markSeen = (id) => {
    const next = notifs.map(n => n.id === id ? { ...n, seen: true } : n)
    saveAvailabilityNotifs(next)
    setNotifs(next)
  }

  const clearAll = () => {
    const next = notifs.map(n => ({ ...n, seen: true }))
    saveAvailabilityNotifs(next)
    setNotifs(next)
  }

  const DAYS_LABELS = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam', 0: 'Dim' }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass rounded-2xl border border-border p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text-primary">Disponibilités coachés</h3>
        <div className="flex gap-2">
          {notifs.some(n => !n.seen) && (
            <button onClick={clearAll} className="text-xs text-text-faint hover:text-brand">Tout marquer vu</button>
          )}
          <button onClick={onClose} className="text-text-faint hover:text-text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {notifs.length === 0 ? (
        <div className="text-sm text-text-faint text-center py-4">Aucune disponibilité reçue.</div>
      ) : (
        <div className="space-y-2">
          {notifs.slice().reverse().map(n => (
            <div key={n.id} className={`p-3 rounded-xl border transition-all ${n.seen ? 'border-border bg-surface-2/40' : 'border-brand/20 bg-brand/5'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {!n.seen && <div className="w-1.5 h-1.5 rounded-full bg-brand mb-1" />}
                  <div className="text-sm font-medium text-text-primary">{n.athleteName}</div>
                  <div className="text-xs text-text-muted mt-0.5">{n.weekLabel}</div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(n.days || []).map(d => (
                      <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand/10 text-brand font-medium">
                        {DAYS_LABELS[d] || d}
                      </span>
                    ))}
                  </div>
                  {n.constraint && <p className="text-xs text-text-faint mt-1 italic">"{n.constraint}"</p>}
                  <div className="text-[10px] text-text-faint mt-1.5">
                    {new Date(n.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.seen && (
                  <button onClick={() => markSeen(n.id)} className="text-[10px] text-text-faint hover:text-brand flex-shrink-0">Vu</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── Athlete views ─────────────────────────────────────────────────────────────
function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
  } else {
    legacyCopy(text)
  }
}
function legacyCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:absolute;left:-9999px;top:-9999px;font-size:16px'
  document.body.appendChild(ta)
  ta.select()
  ta.setSelectionRange(0, 99999)
  try { document.execCommand('copy') } catch {}
  document.body.removeChild(ta)
}

function InviteCard({ athlete }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/#/login?id=${athlete.id}`
  const pin = athlete.pin || '—'
  const msg = `⚡ CBL COACH PRO\n\nSalut ${athlete.name.split(' ')[0]},\n\nNicolas t'a créé ton espace d'entraînement personnel.\n\n🔗 Accès : ${link}\n🔑 PIN : ${pin}\n\nClique le lien → entre ton code → tu es dans ton espace.\n\nÀ toi de jouer. 💪`

  const handle = () => {
    copyText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="glass rounded-2xl p-4 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="label">Accès athlète</div>
        <motion.button
          onClick={handle}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            copied ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand hover:bg-brand/20'
          }`}
        >
          {copied ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copié !</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier le message</>
          )}
        </motion.button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-2 rounded-xl p-3">
          <div className="text-[10px] text-text-faint mb-1">Code athlète</div>
          <div className="font-mono text-sm text-text-primary font-semibold">{athlete.id}</div>
        </div>
        <div className="bg-brand/5 border border-brand/15 rounded-xl p-3">
          <div className="text-[10px] text-text-faint mb-1">PIN</div>
          <div className="font-mono text-sm text-brand font-bold tracking-widest">{pin}</div>
        </div>
      </div>
      <div className="bg-surface-2 rounded-xl px-3 py-2">
        <div className="text-[10px] text-text-faint mb-1">Lien d'invitation</div>
        <div className="font-mono text-[11px] text-text-muted break-all">{link}</div>
      </div>
    </div>
  )
}

function ProfilTab({ athlete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => ({
    ...athlete,
    prs: { ...(athlete.prs || {}) },
  }))

  const PR_ORDER = ['pullUp', 'muscleUp', 'dips', 'pushUp', 'gobletSquat']
  const PR_LABELS = { pullUp: 'Tractions', muscleUp: 'Muscle-up', dips: 'Dips', pushUp: 'Pompes', gobletSquat: 'Goblet Squat' }

  const startEdit = () => {
    setForm({ ...athlete, prs: { ...(athlete.prs || {}) } })
    setEditing(true)
  }
  const save = () => { onUpdate(form); setEditing(false) }
  const cancel = () => setEditing(false)

  const setPr = (key, field, val) => {
    setForm(f => ({
      ...f,
      prs: {
        ...f.prs,
        [key]: { ...(f.prs[key] || { label: PR_LABELS[key] || key }), [field]: val },
      },
    }))
  }

  return (
    <div className="space-y-5">
      {/* Invite */}
      <InviteCard athlete={athlete} />
      {/* PRs */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="label">Performances actuelles</div>
          {!editing ? (
            <button onClick={startEdit} className="text-xs text-brand hover:underline font-medium">Éditer</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={cancel} className="text-xs text-text-faint hover:text-text-muted">Annuler</button>
              <button onClick={save} className="text-xs font-semibold text-brand hover:underline">Sauvegarder</button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            {PR_ORDER.map(key => {
              const pr = form.prs?.[key] || { label: PR_LABELS[key] || key, value: '', target: '' }
              return (
                <div key={key} className="p-3 bg-surface-2 rounded-xl border border-border space-y-1.5">
                  <div className="text-xs font-semibold text-text-muted">{pr.label || PR_LABELS[key]}</div>
                  <div className="flex gap-2">
                    <input
                      value={pr.value || ''}
                      onChange={e => setPr(key, 'value', e.target.value)}
                      placeholder="Actuel (ex: 23 reps)"
                      className="flex-1 bg-surface-3 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand"
                    />
                    <input
                      value={pr.target || ''}
                      onChange={e => setPr(key, 'target', e.target.value)}
                      placeholder="Objectif"
                      className="flex-1 bg-surface-3 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PR_ORDER.filter(k => athlete.prs?.[k]).map(key => {
              const pr = athlete.prs[key]
              return (
                <div key={key} className="p-3 bg-surface-2 rounded-xl border border-border">
                  <div className="text-xs text-text-faint mb-1">{pr.label}</div>
                  <div className="text-lg font-bold text-text-primary font-mono">{pr.value}</div>
                  {pr.target && <div className="text-xs text-brand mt-0.5">→ {pr.target}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="label">Objectifs</div>
        {editing ? (
          <div className="space-y-2">
            {[
              { key: 'goalShort', label: 'Court terme', color: '#10B981' },
              { key: 'goalMedium', label: 'Moyen terme', color: '#0EA5E9' },
              { key: 'goalLong', label: 'Long terme', color: '#8B5CF6' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color }}>{label}</div>
                <input
                  value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={label}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { key: 'goalShort', label: 'Court terme', color: '#10B981' },
              { key: 'goalMedium', label: 'Moyen terme', color: '#0EA5E9' },
              { key: 'goalLong', label: 'Long terme', color: '#8B5CF6' },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: color }} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color }}>{label}</div>
                  <div className="text-sm text-text-primary">{athlete[key] || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes coach */}
      <div className="glass rounded-2xl p-4">
        <div className="label mb-2">Notes coach</div>
        {editing ? (
          <textarea
            value={form.note || ''}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            rows={3}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand resize-none"
          />
        ) : (
          <p className="text-sm text-text-muted leading-relaxed">{athlete.note || '—'}</p>
        )}
      </div>

      {/* Comp date */}
      <div className="glass rounded-xl p-3 flex items-center gap-3 border border-border">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {editing ? (
          <input
            type="date"
            value={form.compDate || ''}
            onChange={e => setForm(f => ({ ...f, compDate: e.target.value }))}
            className="flex-1 bg-surface-2 border border-border rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-brand"
          />
        ) : (
          <>
            <div>
              <div className="text-xs text-text-faint">Prochaine compétition</div>
              <div className="text-sm font-semibold text-text-primary">{athlete.compDate || '—'}</div>
            </div>
            {athlete.compDate && (
              <div className="ml-auto text-sm font-bold text-brand">
                {Math.max(0, Math.ceil((new Date(athlete.compDate) - new Date()) / 86400000))}j
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AthleteDetail({ athlete, tab, onTab, onBack, onUpdate }) {
  const [program, setProgram] = useState(() => getProgram(athlete.id))

  const feedbackCount = getFeedback(athlete.id).filter(f => !f.readByCoach && f.status === 'pending').length

  const TABS = [
    { id: 'profil', label: 'Profil' },
    { id: 'programmation', label: 'Programme' },
    { id: 'rpe', label: 'RPE' },
    { id: 'feedback', label: 'Feedback', badge: feedbackCount },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full glass border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-text-primary text-lg">{athlete.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {tagPill(athlete.goal, '#0EA5E9')}
            {tagPill(athlete.status === 'active' ? 'Actif' : 'Archivé', athlete.status === 'active' ? '#10B981' : '#6B7280')}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)}
            className={`flex-1 min-w-fit py-2 px-2 rounded-lg text-xs font-medium transition-all relative flex items-center justify-center gap-1.5 ${
              tab === t.id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand text-black text-[9px] font-bold flex items-center justify-center">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'profil' && <ProfilTab athlete={athlete} onUpdate={onUpdate} />}

      {tab === 'programmation' && (
        <ProgramTree
          program={program}
          athleteId={athlete.id}
          onProgramChange={setProgram}
        />
      )}

      {tab === 'rpe' && <RpeTab athleteId={athlete.id} />}

      {tab === 'feedback' && <FeedbackTab athleteId={athlete.id} />}
    </div>
  )
}

function AthleteList({ athletes, onSelect, onAdd, onToggleStatus }) {
  const [tab, setTab] = useState('active')
  const active = athletes.filter(a => a.status === 'active')
  const archived = athletes.filter(a => a.status !== 'active')
  const list = tab === 'active' ? active : archived

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-surface-2 rounded-xl w-fit">
          <button onClick={() => setTab('active')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'active' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted'}`}>
            Actifs ({active.length})
          </button>
          <button onClick={() => setTab('archived')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'archived' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted'}`}>
            Anciens ({archived.length})
          </button>
        </div>
        <button onClick={onAdd} className="btn-primary text-sm flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter
        </button>
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-dashed border-border">
          <div className="text-text-faint text-sm">
            {tab === 'active' ? 'Aucun coaché actif' : 'Aucun ancien coaché'}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map(a => (
            <motion.div
              key={a.id}
              layout
              className="glass rounded-2xl p-4 border border-border hover:border-brand/30 transition-all cursor-pointer group"
              onClick={() => onSelect(a)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-text-primary">{a.name}</div>
                  {a.nickname && <div className="text-xs text-text-muted">{a.nickname}</div>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onToggleStatus(a.id) }}
                  className="text-[10px] text-text-faint hover:text-text-muted px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  {a.status === 'active' ? 'Archiver' : 'Réactiver'}
                </button>
              </div>
              <div className="text-xs text-text-muted leading-relaxed line-clamp-2">{a.goal}</div>
              <div className="flex items-center gap-1 mt-2 text-brand text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Ouvrir la fiche
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const LEVELS = ['Débutant', 'Débutante', 'Amateur', 'Espoir', 'Confirmé', 'Elite']

function genPin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function slugify(name) {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12)
}

function AddAthleteModal({ onSave, onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'invite'
  const [pin] = useState(genPin)
  const [form, setForm] = useState({
    name: '', nickname: '', age: '', level: 'Espoir',
    goal: '', goalShort: '', goalMedium: '', goalLong: '',
    compDate: '', compName: '', note: '',
  })
  const [customDate, setCustomDate] = useState(false)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSave = () => {
    if (!form.name.trim()) return
    const id = slugify(form.name.split(' ')[0]) || uid().slice(0, 8)
    const athlete = {
      id,
      ...form,
      age: form.age ? parseInt(form.age) : undefined,
      name: form.name.trim(),
      pin,
      status: 'active',
      prs: {},
      startDate: new Date().toISOString().split('T')[0],
    }
    onSave(athlete)
    setCreated(athlete)
    setStep('invite')
  }

  const inviteLink = created
    ? `${window.location.origin}/#/login?id=${created.id}`
    : ''

  const inviteMessage = created ? `⚡ CBL COACH PRO

Salut ${created.name.split(' ')[0]},

Nicolas t'a créé ton espace d'entraînement personnel.

🔗 Accès : ${inviteLink}
🔑 PIN : ${pin}

Clique le lien → entre ton code → tu es dans ton espace.

À toi de jouer. 💪` : ''

  const copyLink = () => {
    copyText(inviteMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70" onClick={step === 'invite' ? undefined : onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-2xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {step === 'form' ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary">Nouveau coaché</h3>
              <button onClick={onClose} className="text-text-faint hover:text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Identité */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-text-faint font-semibold">Identité</div>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nom complet *"
                autoFocus
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.nickname}
                  onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                  placeholder="Surnom (opt.)"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
                />
                <input
                  type="number"
                  value={form.age}
                  onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                  placeholder="Âge"
                  min="10" max="80"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </div>
              <select
                value={form.level}
                onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Objectifs */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-text-faint font-semibold">Objectifs</div>
              {[
                { key: 'goal', placeholder: 'Objectif principal' },
                { key: 'goalShort', placeholder: 'Court terme' },
                { key: 'goalMedium', placeholder: 'Moyen terme' },
                { key: 'goalLong', placeholder: 'Long terme' },
              ].map(({ key, placeholder }) => (
                <input
                  key={key}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              ))}
            </div>

            {/* Compétition + notes */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-text-faint font-semibold">Compétition cible</div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { label: 'CBL Open Qualifier 2026', date: '2026-09-01' },
                  { label: 'CBL Autumn Challenge 2026', date: '2026-11-08' },
                  { label: 'CBL Winter Series 2027', date: '2027-02-06' },
                  { label: 'CBL Spring Open 2027', date: '2027-04-17' },
                ].map(comp => {
                  const selected = form.compName === comp.label
                  const diff = Math.ceil((new Date(comp.date) - new Date()) / 86400000)
                  return (
                    <button
                      key={comp.date}
                      type="button"
                      onClick={() => { setForm(p => ({ ...p, compDate: comp.date, compName: comp.label })); setCustomDate(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        selected
                          ? 'border-brand bg-brand/10 text-text-primary'
                          : 'border-border bg-surface-2 text-text-muted hover:border-brand/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        <span className={selected ? 'font-semibold text-text-primary' : ''}>{comp.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-text-faint">{comp.date} · {diff}j</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => { setCustomDate(true); setForm(p => ({ ...p, compName: 'Autre compétition', compDate: '' })) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                    customDate ? 'border-brand bg-brand/10' : 'border-dashed border-border text-text-faint hover:border-brand/40 hover:text-text-muted'
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Autre compétition
                </button>
              </div>
              {customDate && (
                <div className="space-y-1.5">
                  <input
                    placeholder="Nom de la compétition"
                    value={form.compName === 'Autre compétition' ? '' : form.compName}
                    onChange={e => setForm(p => ({ ...p, compName: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
                  />
                  <input
                    type="date"
                    value={form.compDate}
                    onChange={e => setForm(p => ({ ...p, compDate: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
              )}
              <textarea
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Notes coach (contexte, historique…)"
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand resize-none"
              />
            </div>

            {/* PIN généré */}
            <div className="flex items-center gap-3 p-3 bg-brand/5 border border-brand/20 rounded-xl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div className="flex-1">
                <div className="text-[10px] text-text-faint">PIN athlète (auto-généré)</div>
                <div className="font-mono font-bold text-brand tracking-widest">{pin}</div>
              </div>
              <div className="text-[10px] text-text-faint text-right">Transmis<br/>avec le lien</div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 btn-ghost text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.name.trim()} className="flex-1 btn-primary text-sm disabled:opacity-40">
                Créer & générer le lien
              </button>
            </div>
          </>
        ) : (
          /* ── Écran invitation ── */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.22 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 5.72 5.72l.94-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.28 16z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">{created?.name} est prêt</h3>
                <p className="text-xs text-text-muted">Copie le message → colle dans WhatsApp / SMS</p>
              </div>
            </div>

            {/* Aperçu du message */}
            <div className="relative bg-[#0F1923] border border-border rounded-2xl p-4 space-y-1">
              <div className="text-[9px] text-text-faint uppercase tracking-wider mb-2">Aperçu du message</div>
              {inviteMessage.split('\n').map((line, i) => (
                <div key={i} className={`leading-relaxed ${
                  line === '' ? 'h-2' :
                  line.startsWith('⚡') ? 'text-brand font-bold text-sm' :
                  line.startsWith('🔗') || line.startsWith('🔑') ? 'font-mono text-xs text-white/80' :
                  line.startsWith('Salut') ? 'text-white/70 text-sm' :
                  line.startsWith('Nicolas') ? 'text-white/50 text-xs' :
                  line.startsWith('Clique') ? 'text-white/50 text-xs italic' :
                  line.startsWith('À toi') ? 'text-white/80 text-sm font-semibold' :
                  'text-white/40 text-xs'
                }`}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <motion.button
                onClick={copyLink}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? 'bg-success/20 text-success border border-success/30'
                    : 'bg-brand text-black hover:bg-brand/90'
                }`}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Message copié — colle dans WhatsApp !
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copier le message complet
                  </>
                )}
              </motion.button>
              <button onClick={onClose} className="w-full btn-ghost text-sm">Fermer</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Main CoachPanel ───────────────────────────────────────────────────────────
export default function CoachPanel() {
  const [role, setRoleState] = useState(getRole)
  const [section, setSection] = useState('athletes')
  const [athletes, setAthletes] = useState(getAthletes)
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [athleteTab, setAthleteTab] = useState('profil')
  const [showAddAthlete, setShowAddAthlete] = useState(false)
  const [showDisposPanel, setShowDisposPanel] = useState(false)
  const [disposNotifCount, setDisposNotifCount] = useState(() => getAvailabilityNotifs().filter(n => !n.seen).length)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleUnlock = () => {
    persistRole('coach')
    setRoleState('coach')
    if (shouldShowCoachOnboarding()) setShowOnboarding(true)
  }
  const handleExit = () => { persistRole('athlete'); setRoleState('athlete') }

  const saveAthletesList = useCallback((next) => {
    saveAthletes(next)
    setAthletes(next)
  }, [])

  const handleAddAthlete = useCallback((athlete) => {
    const next = [...athletes, athlete]
    saveAthletesList(next)
    setSelectedAthlete(athlete)
    // Ne pas fermer la modal ici — elle affiche l'étape invitation
    // Elle se ferme via son propre bouton "Fermer" → onClose
  }, [athletes, saveAthletesList])

  const handleToggleStatus = useCallback((id) => {
    const next = athletes.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'archived' : 'active' } : a)
    saveAthletesList(next)
    if (selectedAthlete?.id === id) setSelectedAthlete(next.find(a => a.id === id))
  }, [athletes, selectedAthlete, saveAthletesList])

  const handleUpdateAthlete = useCallback((updated) => {
    const next = athletes.map(a => a.id === updated.id ? updated : a)
    saveAthletesList(next)
    setSelectedAthlete(updated)
  }, [athletes, saveAthletesList])

  if (role !== 'coach') {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <CoachLock onUnlock={handleUnlock} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {showOnboarding && <CoachOnboarding onDone={() => setShowOnboarding(false)} />}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="label mb-0.5">Nicolas Natanek</div>
          <h1 className="text-2xl font-bold text-text-primary">Espace Coach</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications dispos */}
          <button
            onClick={() => { setShowDisposPanel(v => !v); setDisposNotifCount(0) }}
            className="relative w-9 h-9 rounded-lg glass border border-border flex items-center justify-center text-text-muted hover:text-brand hover:border-brand/30 transition-colors"
            title="Disponibilités coachés"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {disposNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand text-black text-[9px] font-bold flex items-center justify-center">
                {disposNotifCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowOnboarding(true)}
            className="w-9 h-9 rounded-lg glass border border-border flex items-center justify-center text-text-muted hover:text-brand hover:border-brand/30 transition-colors"
            title="Guide de démarrage"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 text-xs text-text-faint hover:text-text-muted px-3 py-1.5 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Mode athlète
          </button>
        </div>
      </div>

      {/* Panel dispos */}
      <AnimatePresence>
        {showDisposPanel && (
          <AvailabilityNotifsPanel onClose={() => setShowDisposPanel(false)} />
        )}
      </AnimatePresence>

      {/* Section nav */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
        {[
          { id: 'athletes', label: `Coachés (${athletes.filter(a => a.status === 'active').length})` },
          { id: 'standards', label: 'Standards' },
          { id: 'circuits', label: 'Circuits CBL' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => { setSection(s.id); setSelectedAthlete(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              section === s.id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >{s.label}</button>
        ))}
      </div>

      {/* Content */}
      {section === 'athletes' && (
        selectedAthlete ? (
          <AthleteDetail
            athlete={selectedAthlete}
            tab={athleteTab}
            onTab={setAthleteTab}
            onBack={() => { setSelectedAthlete(null); setAthleteTab('profil') }}
            onUpdate={handleUpdateAthlete}
          />
        ) : (
          <AthleteList
            athletes={athletes}
            onSelect={a => { setSelectedAthlete(a); setAthleteTab('profil') }}
            onAdd={() => setShowAddAthlete(true)}
            onToggleStatus={handleToggleStatus}
          />
        )
      )}

      {section === 'standards' && <CoachStandards />}
      {section === 'circuits' && <CoachCircuits />}

      <AnimatePresence>
        {showAddAthlete && (
          <AddAthleteModal
            onSave={handleAddAthlete}
            onClose={() => setShowAddAthlete(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
