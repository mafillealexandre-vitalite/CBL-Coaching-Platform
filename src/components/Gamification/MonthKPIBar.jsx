/**
 * Feature 1b — Month-over-month KPI bar
 * 4 stat cards: sessions this vs last month, total reps, streak, level %
 */
import { getLevel, getLevelProgress, getNextLevel } from './LevelSystem'
import { getSessionLog } from '../../utils/sessionUtils'

function getMonthSessions(log, monthOffset = 0) {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
  return log.filter(s => {
    const d = new Date(s.date)
    return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && s.completed
  })
}

function computeStreak(log) {
  const done = log.filter(s => s.completed)
  const dates = [...new Set(done.map(s => new Date(s.date).toDateString()))].sort((a, b) => new Date(b) - new Date(a))
  let streak = 0
  let prev = new Date(); prev.setHours(0, 0, 0, 0)
  for (const d of dates) {
    const diff = Math.round((prev - new Date(d)) / 86400000)
    if (diff <= 1) { streak++; prev = new Date(d) } else break
  }
  return streak
}

function ChangeBadge({ current, previous }) {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{
        background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        color: up ? '#10B981' : '#EF4444',
      }}
    >
      {up ? '+' : ''}{pct}%
    </span>
  )
}

export default function MonthKPIBar() {
  const log = getSessionLog()
  const thisMonth = getMonthSessions(log, 0)
  const lastMonth = getMonthSessions(log, 1)
  const totalDone = log.filter(s => s.completed).length
  const streak = computeStreak(log)
  const level = getLevel(totalDone)
  const next = getNextLevel(totalDone)
  const levelPct = getLevelProgress(totalDone)

  const items = [
    {
      label: 'Séances ce mois',
      value: thisMonth.length,
      badge: <ChangeBadge current={thisMonth.length} previous={lastMonth.length} />,
      sub: lastMonth.length > 0 ? `vs ${lastMonth.length} le mois passé` : 'Premier mois',
      color: '#0EA5E9',
    },
    {
      label: 'Total séances',
      value: totalDone,
      sub: 'depuis le début',
      color: '#10B981',
    },
    {
      label: 'Streak',
      value: `${streak}j`,
      sub: streak >= 5 ? 'En feu 🔥' : streak > 0 ? 'Continue !' : 'Lance une séance',
      color: streak >= 3 ? '#F59E0B' : streak > 0 ? '#0EA5E9' : '#94A3B8',
    },
    {
      label: next ? `→ ${next.name}` : level.name,
      value: `${levelPct}%`,
      sub: next ? `${level.name} · ${level.icon}` : `Niveau max ${level.icon}`,
      color: level.color,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(item => (
        <div key={item.label} className="bg-white rounded-xl p-3.5 border border-border shadow-card">
          <div className="text-[11px] text-text-faint mb-1 flex items-center gap-1.5">
            {item.label}
            {item.badge}
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>
            {item.value}
          </div>
          <div className="text-[11px] text-text-faint mt-0.5">{item.sub}</div>
        </div>
      ))}
    </div>
  )
}
