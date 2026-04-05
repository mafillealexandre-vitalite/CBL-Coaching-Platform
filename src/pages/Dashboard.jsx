import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import athlete from '../data/athlete.json'
import plan from '../data/coaching-plan.json'
import StoryCard from '../components/ui/StoryCard'

const DAYS = [
  { id: 1, short: 'Lun', label: 'Lundi' },
  { id: 2, short: 'Mar', label: 'Mardi' },
  { id: 3, short: 'Mer', label: 'Mercredi' },
  { id: 4, short: 'Jeu', label: 'Jeudi' },
  { id: 5, short: 'Ven', label: 'Vendredi' },
  { id: 6, short: 'Sam', label: 'Samedi' },
  { id: 0, short: 'Dim', label: 'Dimanche' },
]

const SESSION_TYPES = {
  force: { label: 'Force', color: '#00D4FF', bg: 'bg-brand/10 border-brand/20 text-brand' },
  lactate: { label: 'Lactique', color: '#FF3D3D', bg: 'bg-danger/10 border-danger/20 text-danger' },
  specificity: { label: 'Spécificité', color: '#FF9500', bg: 'bg-warn/10 border-warn/20 text-warn' },
  simulation: { label: 'Simulation', color: '#FF3D3D', bg: 'bg-danger/10 border-danger/20 text-danger' },
  recovery: { label: 'Récup', color: '#00D47A', bg: 'bg-success/10 border-success/20 text-success' },
  rest: { label: 'Repos', color: '#444', bg: 'bg-surface-3 border-border text-text-faint' },
}

function getWeekNumber(date) {
  const start = new Date(plan.meta.startDate)
  const diff = (date - start) / (1000 * 60 * 60 * 24)
  return Math.max(1, Math.ceil(diff / 7))
}

function getPhaseForWeek(week) {
  return plan.macroPhases.find(p => p.weeks.includes(week))
}

function getTemplateForWeek(week) {
  if (week <= 4) return plan.weekTemplates['m1-standard']
  if (week <= 8) return plan.weekTemplates['m2-standard']
  if (week <= 10) return plan.weekTemplates['m3-peak']
  return plan.weekTemplates['deload']
}

function assignSessionsToDays(availability, template) {
  const sessions = template?.sessions || []
  const map = {}
  sessions.forEach((s, idx) => {
    const dayId = availability[idx % availability.length]
    if (!map[dayId]) map[dayId] = []
    map[dayId].push(s)
  })
  return map
}

function AvailabilityPicker({ availability, onChange }) {
  const toggle = (dayId) => {
    if (availability.includes(dayId)) {
      if (availability.length > 1) onChange(availability.filter(d => d !== dayId))
    } else {
      onChange([...availability, dayId].sort())
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label mb-1">Mes dispos cette semaine</div>
          <div className="text-xs text-text-muted">Coche les jours où tu peux t'entraîner — le plan s'adapte</div>
        </div>
        <div className="text-sm font-mono text-brand">{availability.length}j / sem</div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {DAYS.map(day => {
          const active = availability.includes(day.id)
          return (
            <motion.button
              key={day.id}
              onClick={() => toggle(day.id)}
              whileTap={{ scale: 0.93 }}
              className={`flex-1 min-w-[2.5rem] py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                active
                  ? 'bg-brand text-black border-brand'
                  : 'bg-surface-2 text-text-muted border-border hover:border-text-faint'
              }`}
            >
              {day.short}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function WeekPlan({ availability, sessionMap }) {
  const today = new Date().getDay()

  return (
    <div className="glass rounded-2xl p-5">
      <div className="label mb-4">Planning de la semaine</div>
      <div className="space-y-2">
        {DAYS.map(day => {
          const sessions = sessionMap[day.id] || []
          const isAvailable = availability.includes(day.id)
          const isToday = day.id === today
          const hasSession = sessions.length > 0

          return (
            <div
              key={day.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isToday
                  ? 'border-brand/30 bg-brand/5'
                  : 'border-border bg-surface-2/50'
              }`}
            >
              {/* Day label */}
              <div className={`w-12 text-sm font-semibold flex-shrink-0 ${isToday ? 'text-brand' : 'text-text-muted'}`}>
                {day.short}
                {isToday && <div className="text-[9px] text-brand/70 font-normal uppercase tracking-wider">Auj.</div>}
              </div>

              {/* Session pill(s) */}
              <div className="flex-1 flex flex-wrap gap-1.5">
                {isAvailable && hasSession ? (
                  sessions.map((s, i) => {
                    const st = SESSION_TYPES[s.type] || SESSION_TYPES.rest
                    return (
                      <Link key={i} to="/session" className={`tag px-2.5 py-1 text-xs font-medium rounded-lg border ${st.bg}`}>
                        {s.name}
                      </Link>
                    )
                  })
                ) : isAvailable ? (
                  <span className="text-xs text-text-faint">Repos</span>
                ) : (
                  <span className="text-xs text-text-faint italic">Indisponible</span>
                )}
              </div>

              {/* Availability toggle dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isAvailable ? 'bg-success' : 'bg-surface-3'}`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatBadge({ label, current, target, unit = '' }) {
  const pct = Math.round((current / target) * 100)
  return (
    <div className="glass glass-hover rounded-xl p-4">
      <div className="label mb-2">{label}</div>
      <div className="flex items-end gap-1.5 mb-2">
        <span className="text-2xl font-bold tabular-nums">{current}</span>
        <span className="text-sm text-text-muted mb-0.5">/ {target}{unit}</span>
      </div>
      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full bg-brand rounded-full"
        />
      </div>
      <div className="text-[10px] text-text-muted mt-1">{pct}% de l'objectif</div>
    </div>
  )
}

function useKPIs() {
  const [kpis, setKpis] = useState(null)
  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('cbl_session_log') || '[]')
    const coachLog = JSON.parse(localStorage.getItem('cbl_coach_log') || '[]')
    const diagnostic = JSON.parse(localStorage.getItem('cbl_diagnostic') || 'null')
    const now = new Date()

    // Régularité 28j
    const last28Sessions = sessions.filter(s => (now - new Date(s.date)) < 28 * 86400 * 1000)
    const done28 = last28Sessions.filter(s => s.completed).length
    const regularite = last28Sessions.length > 0 ? Math.round((done28 / last28Sessions.length) * 100) : null

    // Séances cette semaine
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const thisWeekSessions = sessions.filter(s => new Date(s.date) >= startOfWeek)
    const thisWeekDone = thisWeekSessions.filter(s => s.completed).length

    // RPE moyen 7j
    const last7 = coachLog.filter(l => (now - new Date(l.date)) < 7 * 86400 * 1000)
    const rpeAvg = last7.length > 0
      ? (last7.reduce((sum, l) => sum + (l.metrics?.rpe || 7), 0) / last7.length).toFixed(1)
      : null

    // Streak
    let streak = 0
    const completedDates = [...new Set(sessions.filter(s => s.completed).map(s => new Date(s.date).toDateString()))]
    const sorted = completedDates.sort((a, b) => new Date(b) - new Date(a))
    let prev = new Date(now)
    prev.setHours(0, 0, 0, 0)
    for (const d of sorted) {
      const diff = Math.round((prev - new Date(d)) / 86400000)
      if (diff <= 1) { streak++; prev = new Date(d) }
      else break
    }

    setKpis({
      regularite,
      thisWeekDone,
      rpeAvg,
      streak,
      diagnosticScore: diagnostic?.profile?.overall ?? null,
      hasDiagnostic: !!diagnostic,
    })
  }, [])
  return kpis
}

function KPIGrid({ kpis, onStory }) {
  if (!kpis) return null

  const items = [
    {
      label: 'Régularité 28j',
      value: kpis.regularite != null ? `${kpis.regularite}%` : '—',
      sub: kpis.regularite != null ? (kpis.regularite >= 75 ? 'En bonne voie' : 'À améliorer') : 'Pas encore de données',
      color: kpis.regularite == null ? '#666' : kpis.regularite >= 75 ? '#00D47A' : '#FF9500',
    },
    {
      label: 'Séances cette semaine',
      value: `${kpis.thisWeekDone}`,
      sub: kpis.thisWeekDone === 0 ? 'Aucune encore' : `${kpis.thisWeekDone} complétée${kpis.thisWeekDone > 1 ? 's' : ''}`,
      color: kpis.thisWeekDone > 0 ? '#00D4FF' : '#666',
    },
    {
      label: 'RPE moyen 7j',
      value: kpis.rpeAvg ?? '—',
      sub: kpis.rpeAvg != null
        ? kpis.rpeAvg > 8.5 ? '⚠ Charge élevée' : kpis.rpeAvg < 5 ? 'Sous-charge' : 'Zone optimale'
        : 'Pas de débriefs récents',
      color: kpis.rpeAvg == null ? '#666' : kpis.rpeAvg > 8.5 ? '#FF3D3D' : kpis.rpeAvg < 5 ? '#FF9500' : '#00D47A',
    },
    {
      label: 'Streak entraînement',
      value: `${kpis.streak}j`,
      sub: kpis.streak === 0 ? 'Lance une séance' : kpis.streak >= 5 ? 'En feu 🔥' : 'Continue !',
      color: kpis.streak >= 3 ? '#FF9500' : kpis.streak > 0 ? '#00D4FF' : '#666',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="label">KPIs</div>
        <button
          onClick={onStory}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand transition-colors px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-brand/30"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12" y2="18"/>
          </svg>
          Story 9:16
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className="glass rounded-xl p-4">
            <div className="label mb-1 text-[11px]">{item.label}</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-[11px] text-text-faint mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>
      {/* Diagnostic CTA if not done */}
      {!kpis.hasDiagnostic && (
        <Link
          to="/diagnostic"
          className="mt-3 flex items-center gap-3 p-3.5 rounded-xl bg-brand/5 border border-brand/20 hover:bg-brand/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0 text-brand">
            ⚡
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Faire le test diagnostique</div>
            <div className="text-xs text-text-muted">Calcule ton profil CBL sur 4 axes — ~45 min</div>
          </div>
          <svg className="ml-auto text-text-faint flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      )}
      {kpis.hasDiagnostic && kpis.diagnosticScore != null && (
        <Link
          to="/diagnostic"
          className="mt-3 flex items-center gap-3 p-3.5 rounded-xl bg-surface-2 border border-border hover:border-brand/20 transition-colors"
        >
          <div className="text-2xl font-bold text-brand tabular-nums">{kpis.diagnosticScore}</div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Score diagnostic</div>
            <div className="text-xs text-text-muted">Voir le profil complet →</div>
          </div>
        </Link>
      )}
    </div>
  )
}

export default function Dashboard() {
  const today = new Date()
  const currentWeek = getWeekNumber(today)
  const phase = getPhaseForWeek(currentWeek)
  const template = getTemplateForWeek(currentWeek)
  const [storyOpen, setStoryOpen] = useState(false)
  const kpis = useKPIs()

  const storageKey = 'cbl_availability'
  const [availability, setAvailability] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : athlete.defaultWeeklyAvailability
    } catch { return athlete.defaultWeeklyAvailability }
  })

  const handleAvailabilityChange = (newAvail) => {
    setAvailability(newAvail)
    localStorage.setItem(storageKey, JSON.stringify(newAvail))
  }

  const sessionMap = assignSessionsToDays(availability, template)

  const maxes = athlete.maxes
  const targets = athlete.targets3months

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <StoryCard isOpen={storyOpen} onClose={() => setStoryOpen(false)} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="label mb-1">Semaine {currentWeek} / 12</div>
          <h1 className="text-2xl font-bold tracking-tight">
            {phase ? phase.name : 'Plan CBL'}
          </h1>
          {phase && (
            <p className="text-sm text-text-muted mt-1 max-w-md">{phase.objective}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {phase && (
            <div
              className="text-xs font-mono px-2.5 py-1 rounded-lg border"
              style={{ color: phase.color, borderColor: phase.color + '40', backgroundColor: phase.color + '10' }}
            >
              {phase.focus.join(' · ')}
            </div>
          )}
          <Link to="/plan" className="text-xs text-text-muted hover:text-brand transition-colors mt-1">
            Voir le plan complet →
          </Link>
        </div>
      </div>

      {/* Phase progress bar */}
      {phase && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Progression macro</span>
            <span className="text-xs font-mono text-text-muted">
              {phase.weeks.indexOf(currentWeek) + 1} / {phase.weeks.length} semaines
            </span>
          </div>
          <div className="flex gap-1">
            {plan.macroPhases.map((p, pi) => (
              <div key={p.id} className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: p.color,
                    width: p.id === phase.id
                      ? `${((phase.weeks.indexOf(currentWeek) + 1) / phase.weeks.length) * 100}%`
                      : p.weeks[p.weeks.length - 1] < currentWeek ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {plan.macroPhases.map(p => (
              <span key={p.id} className="text-[10px]" style={{ color: p.color + 'AA' }}>{p.name.split('—')[0].trim()}</span>
            ))}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Availability picker */}
        <AvailabilityPicker availability={availability} onChange={handleAvailabilityChange} />

        {/* Weekly plan */}
        <WeekPlan availability={availability} sessionMap={sessionMap} />
      </div>

      {/* Today's session CTA */}
      {(() => {
        const todaySessions = sessionMap[today.getDay()] || []
        if (todaySessions.length === 0) return null
        const s = todaySessions[0]
        const st = SESSION_TYPES[s.type] || SESSION_TYPES.rest
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 border border-brand/20 bg-brand/5 brand-glow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="label mb-1" style={{ color: '#00D4FF' }}>Séance du jour</div>
                <div className="text-lg font-bold">{s.name}</div>
                <div className={`inline-block tag mt-2 ${st.bg}`}>{st.label}</div>
              </div>
              <Link to="/session" className="btn-primary flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Démarrer
              </Link>
            </div>
          </motion.div>
        )
      })()}

      {/* Performance targets */}
      <div>
        <div className="label mb-3">Objectifs 3 mois</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBadge label="Tractions" current={maxes.pullUp.value} target={targets.pullUp.value} unit=" reps" />
          <StatBadge label="Muscle-up" current={maxes.muscleUp.value} target={targets.muscleUp.value} unit=" reps" />
          <StatBadge label="Dips" current={maxes.dips.value} target={targets.dips.value} unit=" reps" />
          <StatBadge label="Pompes" current={maxes.pushUp.value} target={targets.pushUp.value} unit=" reps" />
          <StatBadge label="Goblet @16kg" current={maxes.gobletSquat.value} target={targets.gobletSquat.value} unit=" reps" />
          <Link to="/stats" className="glass glass-hover rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-brand transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span className="text-xs font-medium">Voir les stats</span>
          </Link>
        </div>
      </div>

      {/* KPIs — Feature 4 */}
      <KPIGrid kpis={kpis} onStory={() => setStoryOpen(true)} />

      {/* Quick access */}
      <div>
        <div className="label mb-3">Accès rapide</div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/circuits" className="glass glass-hover rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warn/10 border border-warn/20 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">Circuits CBL</div>
              <div className="text-xs text-text-muted">11 circuits importés</div>
            </div>
          </Link>
          <Link to="/plan" className="glass glass-hover rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">Plan 3 mois</div>
              <div className="text-xs text-text-muted">Macro · Méso · Micro</div>
            </div>
          </Link>
          <Link to="/diagnostic" className="glass glass-hover rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
              <span className="text-base">⚡</span>
            </div>
            <div>
              <div className="text-sm font-semibold">Diagnostic</div>
              <div className="text-xs text-text-muted">Test profil 4 axes</div>
            </div>
          </Link>
          <Link to="/coach" className="glass glass-hover rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warn/10 border border-warn/20 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">Coach</div>
              <div className="text-xs text-text-muted">Débrief · 18 scénarios</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
