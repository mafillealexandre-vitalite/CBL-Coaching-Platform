import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSessionLog, getPlanWeek } from '../utils/sessionUtils'
import MonthlySummaryCard from '../components/Progression/MonthlySummaryCard'
import PostSessionDebrief, { getDebrief } from '../components/Debrief/PostSessionDebrief'

const TYPE_COLORS = {
  force: '#00D4FF', lactate: '#FF3D3D', specificity: '#FF9500',
  simulation: '#FF3D3D', recovery: '#00D47A',
}
const TYPE_LABELS = {
  force: 'Force', lactate: 'Lactique', specificity: 'Circuit',
  simulation: 'Simulation', recovery: 'Récup',
}

const WEEK_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function Calendar({ year, month, sessionLog, onDayClick }) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()

  // Build a map: "YYYY-MM-DD" → session[]
  const dayMap = {}
  for (const s of sessionLog) {
    const d = new Date(s.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate()
      if (!dayMap[key]) dayMap[key] = []
      dayMap[key].push(s)
    }
  }

  // Build plan week map for context
  const planStart = new Date('2026-04-07')

  const getDayStatus = (day) => {
    const d = new Date(year, month, day)
    if (d > today) return 'future'
    const sessions = dayMap[day] || []
    if (sessions.length === 0) {
      // Was this a planned training day? Heuristic: if it's a weekday
      if (d.getDay() !== 0) return 'missed' // could be rest or missed
      return 'rest'
    }
    if (sessions.some(s => s.completed)) return 'done'
    return 'logged'
  }

  const cells = []
  // Empty cells for offset
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e${i}`} />)
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const status = getDayStatus(day)
    const sessions = dayMap[day] || []
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

    cells.push(
      <button
        key={day}
        onClick={() => sessions.length > 0 && onDayClick(sessions, day)}
        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all
          ${isToday ? 'ring-2 ring-brand ring-offset-1 ring-offset-white' : ''}
          ${status === 'done' ? 'bg-success/20 text-success' : ''}
          ${status === 'missed' ? 'bg-surface-2 text-text-faint' : ''}
          ${status === 'rest' ? 'bg-surface-2/50 text-text-faint' : ''}
          ${status === 'future' ? 'bg-surface-2/30 text-text-faint/50' : ''}
          ${sessions.length > 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}
        `}
      >
        <span className={`font-semibold ${isToday ? 'text-brand' : ''}`}>{day}</span>
        {sessions.length > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {sessions.slice(0, 3).map((s, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: TYPE_COLORS[s.type] || '#888' }}
              />
            ))}
          </div>
        )}
      </button>
    )
  }

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-[11px] text-text-faint font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {[
          { color: 'bg-success/20 text-success', label: 'Réalisée' },
          { color: 'bg-surface-2 text-text-faint', label: 'Repos/Manquée' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-text-faint">
            <div className={`w-3 h-3 rounded ${l.color.split(' ')[0]}`} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Session detail drawer ─────────────────────────────────────────────────────

function SessionDetail({ sessions, day, month, year, onClose }) {
  const date = new Date(year, month, day)
  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-white rounded-2xl border border-border p-5 space-y-3 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-text-primary capitalize">{dateStr}</div>
        <button onClick={onClose} className="text-text-faint hover:text-text-muted text-sm">✕</button>
      </div>
      {sessions.map((s, i) => (
        <div key={i} className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[s.type] || '#888' }} />
            <div className="font-medium text-sm text-text-primary">{s.label}</div>
            {s.completed && (
              <span className="ml-auto text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-semibold">✓ Fait</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
            {s.duration > 0 && <span>⏱ {s.duration} min</span>}
            {s.rpe > 0 && <span>🔥 RPE {s.rpe}/10</span>}
            {s.type && <span className="capitalize" style={{ color: TYPE_COLORS[s.type] }}>{TYPE_LABELS[s.type]}</span>}
            {s.week && <span>Semaine {s.week}</span>}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ─── Session list ──────────────────────────────────────────────────────────────

function SessionList({ sessions }) {
  const [debriefSession, setDebriefSession] = useState(null)

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-text-faint text-sm">
        Aucune séance enregistrée.<br />
        <span className="text-xs">Utilise "J'ai fait ma séance" sur le dashboard pour commencer.</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {sessions.slice().reverse().map((s, i) => {
          const d = new Date(s.date)
          const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
          const isRecord = s.isRecord
          const hasDebrief = s.id ? !!getDebrief(s.id) : false
          return (
            <motion.div
              key={s.id || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border shadow-card"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.completed ? 'bg-success' : 'bg-surface-3'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{s.label}</div>
                <div className="text-xs text-text-faint capitalize">{dateStr}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.duration > 0 && <span className="text-xs text-text-muted">{s.duration}min</span>}
                {s.rpe > 0 && (
                  <span className={`text-xs font-bold tabular-nums ${s.rpe >= 9 ? 'text-danger' : s.rpe >= 7 ? 'text-warn' : 'text-success'}`}>
                    {s.rpe}/10
                  </span>
                )}
                {s.type && (
                  <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[s.type] || '#888' }} />
                )}
                {isRecord && <span className="text-[10px] bg-warn/10 text-warn px-1.5 py-0.5 rounded font-bold">PR</span>}
                {s.completed && (
                  <button
                    onClick={() => setDebriefSession(s)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all"
                    style={{
                      color: hasDebrief ? '#10B981' : '#94A3B8',
                      borderColor: hasDebrief ? '#10B981' : '#E2E8F0',
                      background: hasDebrief ? '#D1FAE5' : '#F8FAFC',
                    }}
                  >
                    {hasDebrief ? '✓ Débriefé' : 'Débriefer'}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {debriefSession && (
        <PostSessionDebrief
          session={debriefSession}
          onClose={() => setDebriefSession(null)}
          onSaved={() => setDebriefSession(null)}
        />
      )}
    </>
  )
}

// ─── Stats summary bar ────────────────────────────────────────────────────────

function StatsSummary({ sessions }) {
  const done = sessions.filter(s => s.completed)
  const totalMin = done.reduce((sum, s) => sum + (s.duration || 0), 0)
  const rpeAvg = done.length > 0
    ? (done.reduce((sum, s) => sum + (s.rpe || 7), 0) / done.length).toFixed(1)
    : '—'
  const streak = (() => {
    let s = 0
    const dates = [...new Set(done.map(s => new Date(s.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a))
    let prev = new Date(); prev.setHours(0,0,0,0)
    for (const d of dates) {
      const diff = Math.round((prev - new Date(d)) / 86400000)
      if (diff <= 1) { s++; prev = new Date(d) } else break
    }
    return s
  })()

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        { label: 'Séances', value: done.length, color: '#00D4FF' },
        { label: 'Temps total', value: totalMin >= 60 ? `${Math.floor(totalMin / 60)}h${totalMin % 60}m` : `${totalMin}m`, color: '#00D47A' },
        { label: 'Streak', value: `${streak}j`, color: '#FF9500' },
      ].map(item => (
        <div key={item.label} className="bg-white rounded-xl p-3 text-center border border-border shadow-card">
          <div className="text-xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</div>
          <div className="text-[11px] text-text-faint">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Progression() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [sessionLog, setSessionLog] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSessions, setSelectedSessions] = useState([])
  const [tab, setTab] = useState(() => localStorage.getItem('cbl_progression_tab') || 'calendar')

  useEffect(() => {
    setSessionLog(getSessionLog())
  }, [])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const handleDayClick = (sessions, day) => {
    setSelectedSessions(sessions)
    setSelectedDay(day)
  }

  const monthName = new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Progression</h1>
        <p className="text-text-muted text-sm mt-0.5">Historique de toutes tes séances</p>
      </div>

      {/* Empty state for brand new users */}
      {sessionLog.length === 0 && (
        <div className="glass rounded-2xl p-6 border border-dashed border-border flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Ton historique commence ici</div>
            <div className="text-xs text-text-muted mt-1 leading-relaxed">
              Dès que tu valides ta première séance avec "C'est fait ✓" sur le dashboard, elle apparaîtra dans ce calendrier. Chaque jour d'entraînement sera une case verte.
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <StatsSummary sessions={sessionLog} />

      {/* Monthly summary auto-card */}
      <MonthlySummaryCard />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
        {[
          { id: 'calendar', label: '📅 Calendrier' },
          { id: 'list', label: 'Liste' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); localStorage.setItem('cbl_progression_tab', t.id) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="font-semibold text-text-primary capitalize">{monthName}</div>
            <button onClick={nextMonth} className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border shadow-card">
            <Calendar
              year={year}
              month={month}
              sessionLog={sessionLog}
              onDayClick={handleDayClick}
            />
          </div>

          {/* Day detail */}
          <AnimatePresence>
            {selectedDay !== null && selectedSessions.length > 0 && (
              <SessionDetail
                sessions={selectedSessions}
                day={selectedDay}
                month={month}
                year={year}
                onClose={() => setSelectedDay(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {tab === 'list' && (
        <SessionList sessions={sessionLog} />
      )}
    </div>
  )
}
