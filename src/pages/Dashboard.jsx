import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import athlete from '../data/athlete.json'
import plan from '../data/coaching-plan.json'
import StoryCard from '../components/ui/StoryCard'
import WelcomeModal from '../components/ui/WelcomeModal'
import Accordion from '../components/ui/Accordion'
import SessionCompleteModal from '../components/ui/SessionCompleteModal'
import { WeeklyRecap, MonthlyRecap } from '../components/ui/WeeklyRecap'
import { estimateSessionDuration, getSessionLog, getPlanWeek } from '../utils/sessionUtils'
import { uid, getAvailabilityNotifs, saveAvailabilityNotifs, getCoachSessionsForToday, getCurrentAthleteId } from '../utils/coachStore'

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
  force:      { label: 'Force',       color: '#00D4FF', bg: 'bg-brand/10 border-brand/20 text-brand' },
  lactate:    { label: 'Lactique',    color: '#FF3D3D', bg: 'bg-danger/10 border-danger/20 text-danger' },
  specificity:{ label: 'Spécificité', color: '#FF9500', bg: 'bg-warn/10 border-warn/20 text-warn' },
  simulation: { label: 'Simulation',  color: '#FF3D3D', bg: 'bg-danger/10 border-danger/20 text-danger' },
  recovery:   { label: 'Récup',       color: '#00D47A', bg: 'bg-success/10 border-success/20 text-success' },
  rest:       { label: 'Repos',       color: '#444',    bg: 'bg-surface-3 border-border text-text-faint' },
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

// ─── "J'ai fait ma séance" validation check ───────────────────────────────────

function useSessionValidatedToday() {
  const [validated, setValidated] = useState(null) // null = loading
  const refresh = () => {
    const log = getSessionLog()
    const today = new Date().toDateString()
    const todayEntry = log.filter(s => new Date(s.date).toDateString() === today && s.completed)
    setValidated(todayEntry.length > 0 ? todayEntry[todayEntry.length - 1] : null)
  }
  useEffect(refresh, [])
  return [validated, refresh]
}

// ─── Availability + Week plan ─────────────────────────────────────────────────

function AvailabilityPicker({ availability, onChange }) {
  const toggle = (dayId) => {
    if (availability.includes(dayId)) {
      if (availability.length > 1) onChange(availability.filter(d => d !== dayId))
    } else {
      onChange([...availability, dayId].sort())
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-text-muted">Coche les jours où tu peux t'entraîner</div>
        <div className="text-sm font-mono text-brand">{availability.length}j / sem</div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {DAYS.map(day => {
          const active = availability.includes(day.id)
          return (
            <motion.button
              key={day.id}
              onClick={() => toggle(day.id)}
              whileTap={{ scale: 0.93 }}
              className={`flex-1 min-w-[2.2rem] py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                active ? 'bg-brand text-black border-brand' : 'bg-surface-2 text-text-muted border-border'
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
    <div className="space-y-1.5 mt-4">
      {DAYS.map(day => {
        const sessions = sessionMap[day.id] || []
        const isAvailable = availability.includes(day.id)
        const isToday = day.id === today

        return (
          <div key={day.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
            isToday ? 'border-brand/30 bg-brand/5' : 'border-border bg-surface-2/30'
          }`}>
            <div className={`w-10 text-sm font-semibold flex-shrink-0 ${isToday ? 'text-brand' : 'text-text-muted'}`}>
              {day.short}
            </div>
            <div className="flex-1 flex flex-wrap gap-1.5">
              {isAvailable && sessions.length > 0 ? (
                sessions.map((s, i) => {
                  const st = SESSION_TYPES[s.type] || SESSION_TYPES.rest
                  const est = estimateSessionDuration(s)
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <Link to="/session" className={`tag px-2 py-0.5 text-xs font-medium rounded-lg border ${st.bg}`}>
                        {s.name}
                      </Link>
                      {est && (
                        <span className="text-[10px] text-text-faint">⏱ ~{est}min</span>
                      )}
                    </div>
                  )
                })
              ) : isAvailable ? (
                <span className="text-xs text-text-faint">Repos</span>
              ) : (
                <span className="text-xs text-text-faint italic">Indisponible</span>
              )}
            </div>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAvailable ? 'bg-success' : 'bg-surface-3'}`} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Citations ────────────────────────────────────────────────────────────────

const CITATIONS = [
  "La régularité bat l'intensité, toujours.",
  "Tu ne t'entraînes pas pour hier. Tu t'entraînes pour dans 90 jours.",
  "La discipline, c'est choisir ce qu'on veut le plus sur ce qu'on veut maintenant.",
  "Chaque répétition compte. Même celle dont tu n'avais pas envie.",
  "La fatigue est temporaire. L'abandon est permanent.",
  "Ce que tu fais aujourd'hui décide de ce que tu peux faire demain.",
  "Pas d'élan sans constance.",
  "Le progrès n'est pas visible chaque jour. Il est là quand même.",
  "Un athlète se construit dans les séances ordinaires.",
  "Reste dans le processus. Les résultats suivent.",
  "La douleur d'aujourd'hui, la performance de demain.",
  "Ce n'est pas la motivation qui te fera progresser. C'est l'habitude.",
]
function getWeekCitation(week) { return CITATIONS[(week - 1) % CITATIONS.length] }

// ─── Day strip ────────────────────────────────────────────────────────────────

function DayStrip({ availability, sessionMap }) {
  const today = new Date().getDay()
  const log = getSessionLog()
  const now = new Date()
  return (
    <div className="flex gap-1 mt-3">
      {DAYS.map(day => {
        const isToday = day.id === today
        const hasSession = (sessionMap[day.id] || []).length > 0 && availability.includes(day.id)
        const done = day.id === today && log.some(s => new Date(s.date).toDateString() === now.toDateString() && s.completed)
        return (
          <div key={day.id} className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${isToday ? 'bg-brand/10 text-brand' : 'text-text-faint'}`}>
            <span>{day.short}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-success' : hasSession && isToday ? 'bg-brand' : hasSession ? 'bg-border' : 'bg-transparent'}`} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Mes chiffres (ex KPIs) ───────────────────────────────────────────────────

function useKPIs(refreshKey) {
  const [kpis, setKpis] = useState(null)
  useEffect(() => {
    const sessions = getSessionLog()
    const coachLog = JSON.parse(localStorage.getItem('cbl_coach_log') || '[]')
    const diagnostic = JSON.parse(localStorage.getItem('cbl_diagnostic') || 'null')
    const now = new Date()

    const last28Sessions = sessions.filter(s => (now - new Date(s.date)) < 28 * 86400 * 1000)
    const done28 = last28Sessions.filter(s => s.completed).length
    const regularite = last28Sessions.length > 0 ? Math.round((done28 / last28Sessions.length) * 100) : null

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const thisWeekDone = sessions.filter(s => new Date(s.date) >= startOfWeek && s.completed).length

    const last7 = sessions.filter(s => (now - new Date(s.date)) < 7 * 86400 * 1000 && s.rpe)
    const rpeAvg = last7.length > 0
      ? (last7.reduce((sum, s) => sum + (s.rpe || 7), 0) / last7.length).toFixed(1)
      : null

    let streak = 0
    const completedDates = [...new Set(sessions.filter(s => s.completed).map(s => new Date(s.date).toDateString()))]
    const sorted = completedDates.sort((a, b) => new Date(b) - new Date(a))
    let prev = new Date(now); prev.setHours(0, 0, 0, 0)
    for (const d of sorted) {
      const diff = Math.round((prev - new Date(d)) / 86400000)
      if (diff <= 1) { streak++; prev = new Date(d) } else break
    }

    setKpis({
      regularite, thisWeekDone, rpeAvg, streak,
      diagnosticScore: diagnostic?.profile?.overall ?? null,
      hasDiagnostic: !!diagnostic,
    })
  }, [refreshKey])
  return kpis
}

function MesChiffres({ kpis, onStory, currentWeek, currentMonthIndex }) {
  const [showWeekRecap, setShowWeekRecap] = useState(false)
  const [showMonthRecap, setShowMonthRecap] = useState(false)
  if (!kpis) return null

  const items = [
    {
      label: 'Constance',
      value: kpis.regularite != null ? `${kpis.regularite}%` : '—',
      sub: kpis.regularite != null ? (kpis.regularite >= 75 ? 'En bonne voie' : 'À améliorer') : 'Pas de données',
      color: kpis.regularite == null ? '#666' : kpis.regularite >= 75 ? '#00D47A' : '#FF9500',
    },
    {
      label: 'Cette semaine',
      value: kpis.thisWeekDone > 0 ? `${kpis.thisWeekDone}` : '—',
      sub: kpis.thisWeekDone === 0 ? 'Lance ta première' : `${kpis.thisWeekDone} faite${kpis.thisWeekDone > 1 ? 's' : ''}`,
      color: kpis.thisWeekDone > 0 ? '#00D4FF' : '#666',
    },
    {
      label: 'Charge ressentie',
      value: kpis.rpeAvg ?? '—',
      sub: kpis.rpeAvg != null ? (kpis.rpeAvg > 8.5 ? '⚠ Haute' : kpis.rpeAvg < 5 ? 'Légère' : 'Zone optimale') : '7 derniers jours',
      color: kpis.rpeAvg == null ? '#666' : kpis.rpeAvg > 8.5 ? '#FF3D3D' : kpis.rpeAvg < 5 ? '#FF9500' : '#00D47A',
    },
    {
      label: 'Streak',
      value: kpis.streak > 0 ? `${kpis.streak}j` : '—',
      sub: kpis.streak === 0 ? 'Lance une séance' : kpis.streak >= 7 ? `${kpis.streak}j sans briser la chaîne` : 'Continue !',
      color: kpis.streak >= 3 ? '#FF9500' : kpis.streak > 0 ? '#00D4FF' : '#666',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className="glass rounded-xl p-3.5">
            <div className="text-[11px] text-text-faint mb-1">{item.label}</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[11px] text-text-faint mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Recap buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowWeekRecap(s => !s)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-2 border border-border text-xs font-medium text-text-muted hover:text-text-primary hover:border-brand/20 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          </svg>
          Récap semaine {currentWeek}
        </button>
        <button
          onClick={() => setShowMonthRecap(s => !s)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-2 border border-border text-xs font-medium text-text-muted hover:text-text-primary hover:border-brand/20 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 20h20M2 14h20M2 8h20M2 2h20"/>
          </svg>
          Récap mois {currentMonthIndex + 1}
        </button>
        <button
          onClick={onStory}
          className="px-3 py-2 rounded-xl bg-surface-2 border border-border text-text-faint hover:text-brand hover:border-brand/20 transition-all"
          title="Story 9:16"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {showWeekRecap && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <WeeklyRecap weekNum={currentWeek} onClose={() => setShowWeekRecap(false)} />
          </motion.div>
        )}
        {showMonthRecap && !showWeekRecap && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <MonthlyRecap monthIndex={currentMonthIndex} onClose={() => setShowMonthRecap(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnostic link */}
      {!kpis.hasDiagnostic ? (
        <Link to="/diagnostic" className="flex items-center gap-3 p-3.5 rounded-xl bg-brand/5 border border-brand/20 hover:bg-brand/10 transition-colors">
          <span className="text-brand text-base">⚡</span>
          <div>
            <div className="text-sm font-semibold text-text-primary">Faire le test diagnostique</div>
            <div className="text-xs text-text-muted">Profil CBL sur 4 axes — ~45 min</div>
          </div>
          <svg className="ml-auto text-text-faint" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      ) : kpis.diagnosticScore != null && (
        <Link to="/diagnostic" className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border hover:border-brand/20 transition-colors">
          <div className="text-2xl font-bold text-brand tabular-nums">{kpis.diagnosticScore}</div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Score diagnostic</div>
            <div className="text-xs text-text-muted">Voir le profil →</div>
          </div>
        </Link>
      )}
    </div>
  )
}

// ─── Stat badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, current, target, unit = '' }) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <div className="glass glass-hover rounded-xl p-4">
      <div className="label mb-2">{label}</div>
      <div className="flex items-end gap-1.5 mb-2">
        <span className="text-2xl font-bold tabular-nums">{current}</span>
        <span className="text-sm text-text-muted mb-0.5">/ {target}{unit}</span>
      </div>
      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
          className="h-full bg-brand rounded-full"
        />
      </div>
      <div className="text-[10px] text-text-muted mt-1">{pct}% de l'objectif</div>
    </div>
  )
}

// ─── Competition countdown ────────────────────────────────────────────────────

function CompetitionBlock() {
  const compDate = new Date('2026-09-01')
  const today = new Date()
  const diff = Math.ceil((compDate - today) / (1000 * 60 * 60 * 24))
  const pct = Math.max(5, Math.min(95, (1 - diff / 150) * 100))

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="text-5xl font-bold text-brand tabular-nums">{diff}</div>
        <div className="text-text-muted pb-1">jours</div>
      </div>
      <div className="text-sm text-text-muted">CBL Open Qualifier 2026 — 1 sept. 2026</div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <Link to="/profile" className="text-xs text-text-faint hover:text-brand transition-colors">
        Voir le profil compétition →
      </Link>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const today = new Date()
  const currentWeek = getWeekNumber(today)
  const phase = getPhaseForWeek(currentWeek)
  const template = getTemplateForWeek(currentWeek)
  const currentMonthIndex = Math.min(2, Math.floor((currentWeek - 1) / 4))

  const [storyOpen, setStoryOpen] = useState(false)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [validatedToday, refreshValidated] = useSessionValidatedToday()
  const [showNextWeek, setShowNextWeek] = useState(false)

  const _aid = getCurrentAthleteId() || 'alexandre'
  const nextWeekKey = `cbl_availability_next_${_aid}`
  const [nextAvailability, setNextAvailability] = useState(() => {
    try { const s = localStorage.getItem(nextWeekKey); return s ? JSON.parse(s) : athlete.defaultWeeklyAvailability } catch { return athlete.defaultWeeklyAvailability }
  })
  const handleNextAvailabilityChange = (v) => { setNextAvailability(v); localStorage.setItem(nextWeekKey, JSON.stringify(v)) }

  const kpis = useKPIs(refreshKey)

  const storageKey = `cbl_availability_${_aid}`
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

  const [disposSent, setDisposSent] = useState(false)
  const activeAvail = showNextWeek ? nextAvailability : availability
  const sessionMap = assignSessionsToDays(availability, template)
  // S1: activeSessionMap removed — sessions no longer auto-assigned to days
  // Feature 3: prefer coach-published sessions for today, fallback to JSON plan
  const coachSessionsToday = getCoachSessionsForToday(getCurrentAthleteId() || 'alexandre')
  const todaySessions = coachSessionsToday.length ? coachSessionsToday : (sessionMap[today.getDay()] || [])
  const todaySession = todaySessions[0] || null
  const maxes = athlete.maxes
  const targets = athlete.targets3months

  const handleSessionSaved = () => {
    setRefreshKey(k => k + 1)
    refreshValidated()
  }

  const handleSendDispos = () => {
    const DAYS_LABELS = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam', 0: 'Dim' }
    const notif = {
      id: uid(),
      athleteId: getCurrentAthleteId() || 'alexandre',
      athleteName: athlete.name || 'Athlète',
      days: activeAvail,
      daysLabels: activeAvail.map(d => DAYS_LABELS[d]).join(', '),
      weekLabel: showNextWeek ? 'Semaine suivante' : 'Cette semaine',
      submittedAt: new Date().toISOString(),
      seen: false,
    }
    const existing = getAvailabilityNotifs()
    saveAvailabilityNotifs([...existing, notif])
    localStorage.setItem(`cbl_dispos_sent_at_${_aid}`, new Date().toISOString())
    setDisposSent(true)
    setTimeout(() => setDisposSent(false), 3000)
  }

  const navigate = useNavigate()
  const citation = getWeekCitation(currentWeek)

  const handleGoSession = () => {
    if (todaySession?._fromCoach) {
      localStorage.setItem('cbl_active_session_override', JSON.stringify(todaySession))
    }
    navigate('/session')
  }

  // Plan week accordion icon
  const planIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  const kpiIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  const trophyIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
  const targetIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <WelcomeModal />
      <StoryCard isOpen={storyOpen} onClose={() => setStoryOpen(false)} />
      <SessionCompleteModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        session={todaySession}
        onSaved={handleSessionSaved}
      />

      {/* Header — condensé 1 ligne */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text-muted">
          Sem.&nbsp;<span className="text-text-primary font-bold">{currentWeek}</span>
          {phase && <span className="text-text-faint"> · {phase.name.split('—')[0].trim()}</span>}
        </div>
        <Link to="/plan" className="text-xs text-text-faint hover:text-brand transition-colors">Plan complet →</Link>
      </div>


      {/* Today's session CTA + "J'ai fait ma séance" */}
      {todaySession && (
        <div className="glass rounded-2xl p-5 border border-brand/20 bg-brand/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="label" style={{ color: '#00D4FF' }}>Séance du jour</div>
                {todaySession._fromCoach && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#10B98120', color: '#10B981' }}>DU COACH</span>
                )}
              </div>
              <div className="text-lg font-bold truncate">{todaySession.name}</div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {(() => {
                  const st = SESSION_TYPES[todaySession.type] || SESSION_TYPES.rest
                  const est = estimateSessionDuration(todaySession)
                  return (
                    <>
                      <span className={`tag text-xs px-2 py-0.5 rounded border ${st.bg}`}>{st.label}</span>
                      {est && <span className="text-xs text-text-faint">⏱ ~{est} min</span>}
                    </>
                  )
                })()}
              </div>
              {todaySession.intention && (
                <p className="text-xs text-text-muted italic mt-2 leading-relaxed line-clamp-2">
                  "{todaySession.intention}"
                </p>
              )}
            </div>
            <button onClick={handleGoSession} className="btn-primary flex items-center gap-2 flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Go
            </button>
          </div>

          {/* Strip jours */}
          <DayStrip availability={availability} sessionMap={sessionMap} />

          {/* Validation */}
          <div className="mt-4 pt-4 border-t border-border/50">
            {validatedToday ? (
              <div className="flex items-center gap-2 text-sm text-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="font-semibold">Séance validée</span>
                <span className="text-text-faint">· {validatedToday.duration}min · RPE {validatedToday.rpe}</span>
              </div>
            ) : (
              <button
                onClick={() => setSessionModalOpen(true)}
                className="w-full py-3 rounded-xl font-bold text-sm bg-brand text-black hover:bg-brand/90 active:scale-98 transition-all"
              >
                C'est fait ✓
              </button>
            )}
          </div>
        </div>
      )}

      {/* No session today */}
      {!todaySession && (
        <div className="glass rounded-2xl p-5 border border-dashed border-border space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-primary">Pas de séance aujourd'hui</div>
              <div className="text-xs text-text-muted mt-0.5">Ton coach n'a pas encore publié de programme, ou c'est ton jour de repos.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSessionModalOpen(true)} className="py-2.5 rounded-xl text-xs font-semibold bg-surface-2 border border-border hover:border-brand/30 hover:text-brand text-text-muted transition-all">
              Valider une séance libre
            </button>
            <a href="/circuits" className="py-2.5 rounded-xl text-xs font-semibold bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-all text-center">
              Explorer les circuits
            </a>
          </div>
        </div>
      )}

      {/* ACCORDION: Ma semaine */}
      <Accordion id="planSemaine" title="Ma semaine" icon={planIcon} badge={`${activeAvail.length}j`} defaultOpen={true}>
        {/* Toggle semaine courante / suivante */}
        <div className="flex gap-1 p-1 bg-surface-3/60 border border-border rounded-xl mb-4">
          <button onClick={() => setShowNextWeek(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${!showNextWeek ? 'bg-brand text-black' : 'text-text-muted'}`}>Cette semaine</button>
          <button onClick={() => setShowNextWeek(true)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${showNextWeek ? 'bg-brand text-black' : 'text-text-muted'}`}>Semaine suivante</button>
        </div>
        <AvailabilityPicker availability={activeAvail} onChange={showNextWeek ? handleNextAvailabilityChange : handleAvailabilityChange} />
        <button
          onClick={handleSendDispos}
          className={`w-full mt-3 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            disposSent
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-surface-2 border-border text-text-muted hover:border-brand/40 hover:text-brand'
          }`}
        >
          {disposSent ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Dispos envoyées au coach
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Envoyer mes dispos au coach
            </>
          )}
        </button>
        {(() => {
          const sentAt = localStorage.getItem(`cbl_dispos_sent_at_${getCurrentAthleteId() || 'alexandre'}`)
          if (!sentAt) return null
          const mins = Math.round((Date.now() - new Date(sentAt)) / 60000)
          const label = mins < 1 ? 'à l\'instant' : mins < 60 ? `il y a ${mins} min` : `il y a ${Math.floor(mins/60)}h`
          return (
            <p className="text-[11px] text-success/70 text-center mt-1">
              ✓ Dispos envoyées {label} — ton coach adaptera ton plan.
            </p>
          )
        })()}
      </Accordion>

      {/* ACCORDION: Mes chiffres */}
      <Accordion id="kpis" title="Mes chiffres" icon={kpiIcon} defaultOpen={false}>
        <MesChiffres
          kpis={kpis}
          onStory={() => setStoryOpen(true)}
          currentWeek={currentWeek}
          currentMonthIndex={currentMonthIndex}
        />
      </Accordion>

      {/* ACCORDION: Mes objectifs */}
      <Accordion id="trajectoire" title="Mes objectifs" icon={targetIcon} defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBadge label="Tractions" current={maxes.pullUp.value} target={targets.pullUp.value} unit=" reps" />
          <StatBadge label="Muscle-up" current={maxes.muscleUp.value} target={targets.muscleUp.value} unit=" reps" />
          <StatBadge label="Dips" current={maxes.dips.value} target={targets.dips.value} unit=" reps" />
          <StatBadge label="Pompes" current={maxes.pushUp.value} target={targets.pushUp.value} unit=" reps" />
          <StatBadge label="Goblet @16kg" current={maxes.gobletSquat.value} target={targets.gobletSquat.value} unit=" reps" />
          <Link to="/stats" className="glass glass-hover rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-brand transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span className="text-xs font-medium">Toutes les stats</span>
          </Link>
        </div>
      </Accordion>

      {/* ACCORDION: Prochaine compétition */}
      <Accordion id="competition" title="Prochaine compétition" icon={trophyIcon} defaultOpen={false}>
        <CompetitionBlock />
      </Accordion>

      {/* Quick access */}
      <div>
        <div className="label mb-3">Accès rapide</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { to: '/circuits', label: 'Circuits CBL', sub: '11 circuits', icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>, color: '#FF9500', bg: 'bg-warn/10 border-warn/20' },
            { to: '/progression', label: 'Progression', sub: 'Calendrier + historique', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, color: '#00D47A', bg: 'bg-success/10 border-success/20' },
            { to: '/diagnostic', label: 'Diagnostic', sub: 'Profil 4 axes', text: '⚡', color: '#00D4FF', bg: 'bg-brand/10 border-brand/20' },
            { to: '/coach', label: 'Coach', sub: 'Débrief séance', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>, color: '#FF9500', bg: 'bg-warn/10 border-warn/20' },
          ].map(item => (
            <Link key={item.to} to={item.to} className="glass glass-hover rounded-xl p-3.5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                {item.text ? (
                  <span style={{ fontSize: 14, color: item.color }}>{item.text}</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round">
                    {item.icon}
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs text-text-muted">{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Citation */}
      <div className="pt-2 pb-4 text-center">
        <p className="text-[11px] text-text-faint italic leading-relaxed max-w-xs mx-auto">"{citation}"</p>
      </div>
    </div>
  )
}
