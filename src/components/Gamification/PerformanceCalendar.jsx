/**
 * Feature 1a — Performance Calendar (heatmap)
 * Mon–Sun columns, intensity-colored cells, inline session detail slide-in.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Intensity colors (sky palette)
const INTENSITY = {
  none:   '#F1F5F9',
  light:  '#BAE6FD',
  medium: '#0EA5E9',
  intense: '#0369A1',
}

function getIntensity(rpe) {
  if (!rpe) return 'light'
  if (rpe <= 5) return 'light'
  if (rpe <= 7) return 'medium'
  return 'intense'
}

function getDayKey(date) {
  return date.toISOString().slice(0, 10)
}

function buildDayMap(sessionLog) {
  const map = {}
  for (const s of sessionLog) {
    const key = getDayKey(new Date(s.date))
    if (!map[key]) map[key] = []
    map[key].push(s)
  }
  return map
}

// Returns array of {date, dayNum} for the month grid (Mon-first)
function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Mon=0…Sun=6
  const offset = (firstDay.getDay() + 6) % 7
  const grid = []
  for (let i = 0; i < offset; i++) grid.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    grid.push(new Date(year, month, d))
  }
  return grid
}

const WEEK_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function SessionDetailPanel({ sessions, date, onClose }) {
  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mt-3 rounded-2xl border border-border bg-white p-4 shadow-card space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm text-text-primary capitalize">{dateStr}</div>
        <button onClick={onClose} className="text-text-faint hover:text-text-muted text-base leading-none">✕</button>
      </div>
      {sessions.map((s, i) => (
        <div key={i} className="rounded-xl bg-bg-surface border border-border p-3 space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: INTENSITY[getIntensity(s.rpe)] }}
            />
            <div className="text-sm font-medium text-text-primary flex-1 truncate">{s.label}</div>
            {s.completed && (
              <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-bold">✓</span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-text-muted flex-wrap">
            {s.duration > 0 && <span>⏱ {s.duration} min</span>}
            {s.rpe > 0 && <span>🔥 RPE {s.rpe}/10</span>}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

export default function PerformanceCalendar({ sessionLog }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedKey, setSelectedKey] = useState(null)

  const dayMap = buildDayMap(sessionLog)
  const grid = buildMonthGrid(year, month)

  const todayKey = getDayKey(now)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedKey(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedKey(null)
  }

  const selectedSessions = selectedKey ? (dayMap[selectedKey] || []) : []
  const selectedDate = selectedKey ? new Date(selectedKey + 'T12:00:00') : null

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-muted transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="font-semibold text-sm text-text-primary">
          {MONTH_NAMES_FR[month]} {year}
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-muted transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1.5">
        {WEEK_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-text-faint font-medium py-0.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const key = getDayKey(date)
          const sessions = dayMap[key] || []
          const isToday = key === todayKey
          const isFuture = date > now
          const hasSessions = sessions.length > 0
          const intensity = hasSessions
            ? getIntensity(Math.max(...sessions.map(s => s.rpe || 0)))
            : 'none'
          const isSelected = key === selectedKey

          return (
            <button
              key={key}
              onClick={() => {
                if (!hasSessions) return
                setSelectedKey(isSelected ? null : key)
              }}
              className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                hasSessions ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${isFuture ? 'opacity-30' : ''}`}
              style={{
                background: hasSessions ? INTENSITY[intensity] : INTENSITY.none,
                outline: isToday ? '2px solid #F59E0B' : isSelected ? '2px solid #0EA5E9' : 'none',
                outlineOffset: '2px',
              }}
            >
              <span style={{
                color: intensity === 'intense' ? '#FFFFFF'
                     : intensity === 'medium' ? '#FFFFFF'
                     : '#4A5568'
              }}>
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          { color: INTENSITY.none,    label: 'Repos' },
          { color: INTENSITY.light,   label: 'Léger' },
          { color: INTENSITY.medium,  label: 'Modéré' },
          { color: INTENSITY.intense, label: 'Intense' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1 text-[10px] text-text-faint">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color, border: '1px solid #E2E8F0' }} />
            {l.label}
          </div>
        ))}
        <div className="flex items-center gap-1 text-[10px] text-text-faint ml-auto">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ outline: '2px solid #F59E0B', outlineOffset: '1px' }} />
          Aujourd'hui
        </div>
      </div>

      {/* Session detail panel */}
      <AnimatePresence>
        {selectedKey && selectedSessions.length > 0 && (
          <SessionDetailPanel
            key={selectedKey}
            sessions={selectedSessions}
            date={selectedDate}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
