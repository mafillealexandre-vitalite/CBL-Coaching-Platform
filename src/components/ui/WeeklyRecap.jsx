import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { computeWeekStats, computeMonthStats } from '../../utils/sessionUtils'
import { matchCoachRules } from '../../utils/coachEngine'

// ─── Carousel wrapper ─────────────────────────────────────────────────────────

function Carousel({ slides }) {
  const [current, setCurrent] = useState(0)
  const startX = useRef(null)

  const prev = () => setCurrent(c => Math.max(0, c - 1))
  const next = () => setCurrent(c => Math.min(slides.length - 1, c + 1))

  const onPointerDown = (e) => { startX.current = e.clientX }
  const onPointerUp = (e) => {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev()
    startX.current = null
  }

  return (
    <div className="space-y-3">
      {/* Dots */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? 'w-5 h-1.5 bg-brand' : 'w-1.5 h-1.5 bg-surface-3'}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={prev} disabled={current === 0} className="p-1.5 rounded-lg bg-surface-2 disabled:opacity-30 hover:bg-surface-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={next} disabled={current === slides.length - 1} className="p-1.5 rounded-lg bg-surface-2 disabled:opacity-30 hover:bg-surface-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Slide */}
      <div
        className="overflow-hidden rounded-2xl"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Volume bar ───────────────────────────────────────────────────────────────

const MOVEMENT_LABELS = {
  pullUp: 'Tractions',
  muscleUp: 'Muscle-up',
  dips: 'Dips',
  pushUp: 'Pompes',
  gobletSquat: 'Goblet Squat',
}

function VolumeBar({ label, reps, maxReps }) {
  if (reps === 0) return null
  const pct = maxReps > 0 ? (reps / maxReps) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-text-muted flex-shrink-0">{label}</div>
      <div className="flex-1 relative h-5 flex items-center">
        <div
          className="absolute left-0 top-0 bottom-0 rounded bg-brand/15"
          style={{ width: `${pct}%` }}
        />
        <span className="relative text-xs font-mono text-text-primary z-10 px-1.5">{reps} reps</span>
      </div>
    </div>
  )
}

// ─── Donut chart (SVG) ────────────────────────────────────────────────────────

const TYPE_COLORS = { force: '#0EA5E9', lactate: '#EF4444', specificity: '#F59E0B', simulation: '#EF4444', recovery: '#10B981' }
const TYPE_LABELS = { force: 'Force', lactate: 'Lactique', specificity: 'Circuit', simulation: 'Simulation', recovery: 'Récup' }

function DonutChart({ data, size = 100 }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (total === 0) return <div className="text-xs text-text-faint text-center py-4">Pas encore de données</div>

  const r = 36
  const circ = 2 * Math.PI * r
  let offset = 0
  const segments = []

  for (const [type, minutes] of Object.entries(data)) {
    if (minutes === 0) continue
    const pct = minutes / total
    const color = TYPE_COLORS[type] || '#888'
    segments.push({ type, minutes, pct, offset, color })
    offset += pct
  }

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1A1A1A" strokeWidth="12" />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${seg.pct * circ} ${circ}`}
            strokeDashoffset={-seg.offset * circ}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"
          />
        ))}
        <text x={size/2} y={size/2 + 2} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fill="#888" fontFamily="system-ui">
          {Math.round(total)} min
        </text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {segments.map(seg => (
          <div key={seg.type} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-text-muted flex-1">{TYPE_LABELS[seg.type] || seg.type}</span>
            <span className="font-mono text-text-primary">{seg.minutes} min</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Slide cards ─────────────────────────────────────────────────────────────

function Card1({ stats }) {
  const doneRatio = stats.sessionsPlanned > 0 ? stats.sessionsDone / stats.sessionsPlanned : 0
  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-4">
      <div>
        <div className="text-xs text-text-faint uppercase tracking-wider mb-0.5">
          Semaine {stats.weekNum}
        </div>
        <div className="text-lg font-bold text-text-primary leading-tight">
          {stats.mesoName || stats.phaseName}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2">
          <span className="text-base">⏱</span>
          <div>
            <div className="text-sm font-bold text-text-primary">
              {stats.totalMinutes >= 60
                ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}min`
                : `${stats.totalMinutes} min`}
            </div>
            <div className="text-[11px] text-text-faint">d'entraînement</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2">
          <span className="text-base">💪</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-text-primary">
              {stats.sessionsDone} / {stats.sessionsPlanned} séances
            </div>
            <div className="h-1 bg-surface-3 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${Math.round(doneRatio * 100)}%` }}
              />
            </div>
          </div>
        </div>
        {stats.rpeAvg !== null && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2">
            <span className="text-base">🔥</span>
            <div>
              <div className="text-sm font-bold text-text-primary">RPE moyen : {stats.rpeAvg}</div>
              <div className="text-[11px] text-text-faint">
                {stats.rpeAvg > 8.5 ? 'Charge élevée' : stats.rpeAvg < 5 ? 'Sous-charge' : 'Zone optimale'}
              </div>
            </div>
          </div>
        )}
        {stats.totalMinutes === 0 && stats.rpeAvg === null && (
          <div className="text-xs text-text-faint text-center py-3">
            Valide tes séances avec "J'ai fait ma séance" pour voir les stats ici.
          </div>
        )}
      </div>
    </div>
  )
}

function Card2({ stats }) {
  const maxReps = Math.max(...Object.values(stats.volume), 1)
  const hasData = Object.values(stats.volume).some(v => v > 0)
  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-4">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Volume par mouvement</div>
      {hasData ? (
        <div className="space-y-2.5">
          {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
            <VolumeBar key={key} label={label} reps={stats.volume[key]} maxReps={maxReps} />
          ))}
        </div>
      ) : (
        <div className="text-xs text-text-faint py-4 text-center">
          Volume calculé depuis les séances validées.<br/>
          Pas encore de données cette semaine.
        </div>
      )}
    </div>
  )
}

function Card3({ stats }) {
  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-4">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Répartition du temps</div>
      <DonutChart data={stats.timeByType} />
    </div>
  )
}

function Card4({ stats }) {
  const metrics = {
    rpe: stats.rpeAvg || 7,
    consistency: stats.sessionsPlanned > 0 ? Math.round((stats.sessionsDone / stats.sessionsPlanned) * 100) : 75,
    deltaReps: 0,
    circuitCompletion: 100,
    weeksToComp: 20,
  }
  const responses = matchCoachRules(metrics, '')
  const coach = responses[0]

  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-4">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Coach de la semaine</div>
      {coach ? (
        <div>
          <div className={`inline-block text-xs font-bold px-2 py-0.5 rounded mb-3 ${
            coach.color === 'success' ? 'bg-success/10 text-success' :
            coach.color === 'danger' ? 'bg-danger/10 text-danger' :
            coach.color === 'warn' ? 'bg-warn/10 text-warn' :
            'bg-brand/10 text-brand'
          }`}>{coach.tag}</div>
          <p className="text-sm text-text-primary leading-relaxed mb-3">{coach.coach_message}</p>
          <div className="flex gap-2 items-start">
            <span className="text-text-faint text-xs mt-0.5 flex-shrink-0">→</span>
            <p className="text-xs text-text-muted leading-relaxed">{coach.conseil_cle}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-muted">Continue sur ce rythme. La régularité est la clé.</p>
      )}
    </div>
  )
}

// ─── Weekly Recap main component ──────────────────────────────────────────────

export function WeeklyRecap({ weekNum, onClose }) {
  const stats = computeWeekStats(weekNum)
  const slides = [
    <Card1 key="1" stats={stats} />,
    <Card2 key="2" stats={stats} />,
    <Card3 key="3" stats={stats} />,
    <Card4 key="4" stats={stats} />,
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-faint">Récap</div>
          <div className="font-bold text-text-primary">Semaine {weekNum}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-faint hover:text-text-muted text-xs underline">
            Fermer
          </button>
        )}
      </div>
      <Carousel slides={slides} />
    </div>
  )
}

// ─── Monthly Recap ────────────────────────────────────────────────────────────

function MonthCard1({ stats }) {
  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-4">
      <div>
        <div className="text-xs text-text-faint uppercase tracking-wider mb-0.5">Mois {stats.monthIndex + 1}</div>
        <div className="text-lg font-bold text-text-primary leading-tight">{stats.phaseName}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Temps total', value: stats.totalMinutes >= 60 ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m` : `${stats.totalMinutes}m`, color: '#0EA5E9' },
          { label: 'Séances', value: `${stats.sessionsDone}/${stats.sessionsPlanned}`, color: '#10B981' },
          { label: 'RPE moyen', value: stats.rpeAvg ?? '—', color: '#F59E0B' },
          { label: 'Régularité', value: stats.sessionsPlanned > 0 ? `${Math.round((stats.sessionsDone / stats.sessionsPlanned) * 100)}%` : '—', color: '#10B981' },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-surface-2">
            <div className="text-[11px] text-text-faint mb-1">{item.label}</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthCard2({ stats }) {
  const maxReps = Math.max(...Object.values(stats.volume), 1)
  const hasData = Object.values(stats.volume).some(v => v > 0)
  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-3">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Volume mensuel</div>
      {hasData ? (
        <div className="space-y-2.5">
          {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
            <VolumeBar key={key} label={label} reps={stats.volume[key]} maxReps={maxReps} />
          ))}
        </div>
      ) : (
        <div className="text-xs text-text-faint py-4 text-center">Pas encore de données ce mois.</div>
      )}
    </div>
  )
}

function MonthCard3({ stats }) {
  // Aggregate timeByType over all weeks
  const timeByType = {}
  for (const week of stats.weeks) {
    for (const [type, mins] of Object.entries(week.timeByType || {})) {
      timeByType[type] = (timeByType[type] || 0) + mins
    }
  }
  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-4">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Répartition mensuelle</div>
      <DonutChart data={timeByType} size={110} />
    </div>
  )
}

function MonthCard4({ stats }) {
  // Weekly evolution: sessions done per week
  const maxDone = Math.max(...stats.weeks.map(w => w.sessionsDone), 1)
  return (
    <div className="bg-white border border-border p-5 rounded-2xl space-y-4">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Progression par semaine</div>
      <div className="space-y-2">
        {stats.weeks.map(week => (
          <div key={week.weekNum} className="flex items-center gap-3">
            <div className="text-xs text-text-faint w-12">S{week.weekNum}</div>
            <div className="flex-1 h-4 bg-surface-2 rounded overflow-hidden relative">
              <motion.div
                className="h-full bg-brand/60 rounded"
                initial={{ width: 0 }}
                animate={{ width: `${(week.sessionsDone / (week.sessionsPlanned || 1)) * 100}%` }}
                transition={{ duration: 0.6, delay: week.weekNum * 0.05 }}
              />
            </div>
            <div className="text-xs font-mono text-text-muted w-12 text-right">
              {week.sessionsDone}/{week.sessionsPlanned}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MonthlyRecap({ monthIndex, onClose }) {
  const stats = computeMonthStats(monthIndex)
  const slides = [
    <MonthCard1 key="1" stats={stats} />,
    <MonthCard2 key="2" stats={stats} />,
    <MonthCard3 key="3" stats={stats} />,
    <MonthCard4 key="4" stats={stats} />,
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-text-faint">Récap</div>
          <div className="font-bold text-text-primary">Mois {monthIndex + 1} — {stats.phaseName.split('—')[0].trim()}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-faint hover:text-text-muted text-xs underline">
            Fermer
          </button>
        )}
      </div>
      <Carousel slides={slides} />
    </div>
  )
}
