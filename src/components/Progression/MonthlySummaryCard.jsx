/**
 * Feature 4b — Monthly summary auto-card
 * Auto-generated at start of each month from localStorage data.
 */
import { getSessionsForMonth } from '../../utils/sessionUtils'

const CATEGORY_LABELS = {
  force: 'Force', lactate: 'Lactique', specificity: 'Circuit',
  simulation: 'Simulation', recovery: 'Récup',
}

function getTopCategory(sessions) {
  const counts = {}
  for (const s of sessions) {
    if (s.type) counts[s.type] = (counts[s.type] || 0) + 1
  }
  if (Object.keys(counts).length === 0) return null
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

const MONTH_NAMES_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export default function MonthlySummaryCard() {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // This month
  const thisSessions = getSessionsForMonth(currentMonth, currentYear).filter(s => s.completed)
  // Last month
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const prevSessions = getSessionsForMonth(prevMonth, prevYear).filter(s => s.completed)

  if (thisSessions.length === 0 && prevSessions.length === 0) return null

  const topCategory = getTopCategory(thisSessions)
  const repCount = thisSessions.reduce((sum, s) => sum + (s.reps || 0), 0)

  const diff = thisSessions.length - prevSessions.length
  const diffPct = prevSessions.length > 0
    ? Math.round((diff / prevSessions.length) * 100)
    : null

  return (
    <div
      className="rounded-2xl bg-white border-l-4 p-4 shadow-card"
      style={{ borderLeftColor: '#F59E0B', borderColor: '#E2E8F0' }}
    >
      <div className="text-[10px] font-bold tracking-widest uppercase text-text-faint mb-2">
        Bilan {MONTH_NAMES_FR[currentMonth]} {currentYear}
      </div>
      <p className="text-sm font-medium text-text-primary leading-relaxed">
        En {MONTH_NAMES_FR[currentMonth]}, tu as réalisé{' '}
        <span className="font-bold text-brand">{thisSessions.length} séance{thisSessions.length !== 1 ? 's' : ''}</span>
        {topCategory && (
          <>, avec une dominante <span className="font-bold" style={{ color: '#F59E0B' }}>{CATEGORY_LABELS[topCategory] || topCategory}</span></>
        )}
        .
      </p>

      {/* vs previous month */}
      {prevSessions.length > 0 && (
        <div className="flex items-center gap-2 mt-3">
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: diff >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: diff >= 0 ? '#10B981' : '#EF4444',
            }}
          >
            {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)} vs {MONTH_NAMES_FR[prevMonth]}
            {diffPct !== null && <span className="ml-1">({diffPct > 0 ? '+' : ''}{diffPct}%)</span>}
          </div>
          {topCategory && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(14,165,233,0.1)', color: '#0EA5E9' }}
            >
              {CATEGORY_LABELS[topCategory] || topCategory} dominant
            </span>
          )}
        </div>
      )}
    </div>
  )
}
