import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import athlete from '../data/athlete.json'
import { getCurrentAthleteId, getAthletes } from '../utils/coachStore'

const MOVES = [
  { key: 'pullUp', label: 'Tractions', color: '#0EA5E9', unit: 'reps' },
  { key: 'muscleUp', label: 'Muscle-up', color: '#F59E0B', unit: 'reps' },
  { key: 'dips', label: 'Dips', color: '#EF4444', unit: 'reps' },
  { key: 'pushUp', label: 'Pompes', color: '#10B981', unit: 'reps' },
  { key: 'gobletSquat', label: 'Goblet @16kg', color: '#A78BFA', unit: 'reps' },
]

// Intentionally modest example values — so athletes feel strong when they do better
const EXAMPLE_ENTRY = {
  date: new Date().toISOString().split('T')[0],
  label: 'Exemple — à remplacer',
  isExample: true,
  pullUp: 3, muscleUp: 1, dips: 5, pushUp: 10, gobletSquat: 8,
}

const parseNum = (str) => {
  const m = String(str || '').match(/\d+/)
  return m ? parseInt(m[0]) : null
}

function perfsKey() {
  return `cbl_perfs_${getCurrentAthleteId() || 'alexandre'}`
}

function loadPerfs() {
  const id = getCurrentAthleteId() || 'alexandre'
  try {
    const saved = localStorage.getItem(perfsKey())
    if (saved) return JSON.parse(saved)
  } catch {}
  // Alexandre: keep real baseline
  if (id === 'alexandre') {
    return [{ date: '2026-04-04', label: 'Baseline', pullUp: 23, muscleUp: 7, dips: 30, pushUp: 52, gobletSquat: 30 }]
  }
  // Others: show example data (intentionally low)
  return [EXAMPLE_ENTRY]
}

function savePerfs(perfs) {
  localStorage.setItem(perfsKey(), JSON.stringify(perfs))
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl p-3 border border-border text-xs shadow-sm">
      <div className="font-semibold mb-2 text-text-muted">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-text-muted">{MOVES.find(m => m.key === p.dataKey)?.label}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function AddEntryForm({ onAdd }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [label, setLabel] = useState('')
  const [values, setValues] = useState({ pullUp: '', muscleUp: '', dips: '', pushUp: '', gobletSquat: '' })
  const [open, setOpen] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const entry = {
      date,
      label: label || `Test ${date}`,
      ...Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v ? parseInt(v) : null])
      )
    }
    onAdd(entry)
    setOpen(false)
    setValues({ pullUp: '', muscleUp: '', dips: '', pushUp: '', gobletSquat: '' })
    setLabel('')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Ajouter un test
      </button>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-5 space-y-4 border border-border"
    >
      <div className="flex items-center justify-between">
        <div className="label">Nouveau test</div>
        <button type="button" onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="label block mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="ex: Fin Mois 1"
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand placeholder:text-text-faint"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MOVES.map(move => (
          <div key={move.key}>
            <label className="text-xs mb-1 block" style={{ color: move.color }}>{move.label}</label>
            <input
              type="number"
              value={values[move.key]}
              onChange={e => setValues(prev => ({ ...prev, [move.key]: e.target.value }))}
              placeholder="reps"
              min="0" max="200"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-brand placeholder:text-text-faint"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Annuler</button>
        <button type="submit" className="btn-primary">Enregistrer</button>
      </div>
    </motion.form>
  )
}

function DeltaBadge({ current, baseline, target }) {
  if (!baseline || !current) return null
  const gained = current - baseline
  const remaining = target != null ? target - current : null
  const pct = target != null ? Math.round(((current - baseline) / (target - baseline)) * 100) : null
  const isGain = gained >= 0

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-xs font-mono font-semibold ${isGain ? 'text-success' : 'text-danger'}`}>
        {isGain ? '+' : ''}{gained}
      </span>
      <span className="text-xs text-text-muted">depuis baseline</span>
      {remaining != null && remaining > 0 && (
        <span className="text-xs text-text-muted">· {remaining} pour atteindre l'objectif</span>
      )}
    </div>
  )
}

export default function Stats() {
  const athleteId = getCurrentAthleteId() || 'alexandre'
  const athletes = getAthletes()
  const isAlexandre = athleteId === 'alexandre' || !athletes.find(a => a.id === athleteId)
  const storedAthlete = athletes.find(a => a.id === athleteId)

  const [perfs, setPerfs] = useState(loadPerfs)
  const [activeMove, setActiveMove] = useState('pullUp')

  useEffect(() => {
    savePerfs(perfs)
  }, [perfs])

  const addEntry = (entry) => {
    // When user adds first real entry, remove the example placeholder
    setPerfs(prev => {
      const withoutExample = prev.filter(p => !p.isExample)
      return [...withoutExample, entry].sort((a, b) => a.date.localeCompare(b.date))
    })
  }

  const deleteEntry = (realIndex) => {
    const entry = perfs[realIndex]
    if (realIndex === 0 && !entry?.isExample) return // protect real baseline only
    setPerfs(prev => prev.filter((_, i) => i !== realIndex))
  }

  // baseline & target: Alexandre → static data, others → store PRs or null
  const baseline = isAlexandre
    ? athlete.maxes[activeMove]?.value
    : (storedAthlete?.prs?.[activeMove] ? parseNum(storedAthlete.prs[activeMove].value) : null)

  const targetVal = isAlexandre
    ? athlete.targets3months[activeMove]?.value
    : (storedAthlete?.prs?.[activeMove] ? parseNum(storedAthlete.prs[activeMove].target) : null)

  const move = MOVES.find(m => m.key === activeMove)
  const realPerfs = perfs.filter(p => !p.isExample)
  const latestVal = [...realPerfs].reverse().find(p => p[activeMove] != null)?.[activeMove]
  const hasOnlyExample = perfs.length > 0 && perfs.every(p => p.isExample)

  // Chart data (exclude example entries)
  const chartData = realPerfs
    .filter(p => p[activeMove] != null)
    .map(p => ({ date: p.label || p.date, [activeMove]: p[activeMove] }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="label mb-1">Suivi progression</div>
          <h1 className="text-2xl font-bold tracking-tight">Mes Stats</h1>
          <p className="text-sm text-text-muted mt-1">
            {realPerfs.length} test{realPerfs.length > 1 ? 's' : ''} enregistré{realPerfs.length > 1 ? 's' : ''}
          </p>
        </div>
        <AddEntryForm onAdd={addEntry} />
      </div>

      {/* Banner exemple */}
      {hasOnlyExample && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl border border-warn/30 bg-warn/5"
        >
          <span className="text-warn text-lg flex-shrink-0">💡</span>
          <div>
            <div className="text-sm font-semibold text-warn">Ces chiffres sont des exemples</div>
            <div className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Clique sur <strong>Ajouter un test</strong> pour entrer tes vraies performances. Les exemples disparaîtront automatiquement.
            </div>
          </div>
        </motion.div>
      )}

      {/* Move selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MOVES.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMove(m.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              activeMove === m.key ? 'text-white border-transparent' : 'border-border text-text-muted hover:border-text-faint'
            }`}
            style={activeMove === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Current move stats */}
      {move && (
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="label mb-1" style={{ color: move.color }}>{move.label}</div>
              <div className="text-4xl font-bold tabular-nums">
                {latestVal ?? baseline ?? '—'}
              </div>
              {!hasOnlyExample && <DeltaBadge current={latestVal} baseline={baseline} target={targetVal} />}
            </div>
            {targetVal != null && (
              <div className="text-right">
                <div className="label mb-1">Objectif 3 mois</div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: move.color }}>{targetVal}</div>
              </div>
            )}
          </div>

          {/* Progress bar — only if we have a target */}
          {targetVal != null && (
            <>
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((latestVal ?? baseline ?? 0) / targetVal) * 100)}%` }}
                  transition={{ duration: 0.7 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: move.color }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>Baseline: {baseline ?? '—'}</span>
                <span>Cible: {targetVal}</span>
              </div>
            </>
          )}

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="mt-5 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  {targetVal != null && (
                    <ReferenceLine y={targetVal} stroke={move.color} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Objectif', position: 'right', fontSize: 9, fill: move.color }} />
                  )}
                  <Line
                    type="monotone"
                    dataKey={activeMove}
                    stroke={move.color}
                    strokeWidth={2}
                    dot={{ fill: move.color, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length <= 1 && (
            <div className="mt-4 p-4 rounded-xl border border-dashed border-border text-center space-y-2">
              <div className="text-sm font-semibold text-text-primary">Ton graphe apparaîtra ici</div>
              <div className="text-xs text-text-muted leading-relaxed">
                Après chaque test de performance, clique sur "Ajouter un test" pour voir ta courbe de progression se construire au fil des semaines.
              </div>
            </div>
          )}
        </div>
      )}

      {/* All metrics overview */}
      <div>
        <div className="label mb-3">Vue d'ensemble</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MOVES.map(m => {
            const cur = [...realPerfs].reverse().find(p => p[m.key] != null)?.[m.key]
              ?? (isAlexandre ? athlete.maxes[m.key]?.value : null)
            const tgt = isAlexandre
              ? athlete.targets3months[m.key]?.value
              : (storedAthlete?.prs?.[m.key] ? parseNum(storedAthlete.prs[m.key].target) : null)
            const pct = cur != null && tgt != null ? Math.round((cur / tgt) * 100) : null
            return (
              <button
                key={m.key}
                onClick={() => setActiveMove(m.key)}
                className={`bg-white rounded-xl p-4 text-left border transition-all hover:shadow-sm ${
                  activeMove === m.key ? 'border-opacity-50' : 'border-border'
                }`}
                style={activeMove === m.key ? { borderColor: m.color + '60' } : {}}
              >
                <div className="text-xs text-text-muted mb-1">{m.label}</div>
                <div className="text-xl font-bold tabular-nums">{cur ?? '—'}</div>
                {pct != null ? (
                  <>
                    <div className="h-1 bg-surface-3 rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: m.color }} />
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">{pct}% · cible {tgt}</div>
                  </>
                ) : (
                  <div className="text-[10px] text-text-faint mt-2">Pas d'objectif défini</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* History log */}
      <div>
        <div className="label mb-3">Historique</div>
        <div className="space-y-2">
          {[...perfs].reverse().map((entry, reversedIdx) => {
            const realIdx = perfs.indexOf(entry)
            return (
              <div key={reversedIdx} className={`border rounded-xl p-4 flex items-center gap-4 ${entry.isExample ? 'bg-warn/5 border-warn/20' : 'bg-white border-border'}`}>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{entry.label || entry.date}</div>
                    {entry.isExample && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warn/15 text-warn font-bold border border-warn/25">EXEMPLE</span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted font-mono">{entry.date}</div>
                </div>
                <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
                  {MOVES.map(m => entry[m.key] != null && (
                    <div key={m.key} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-xs text-text-muted">{m.label.split(' ')[0]}:</span>
                      <span className={`text-xs font-mono font-semibold ${entry.isExample ? 'text-text-faint' : ''}`}>{entry[m.key]}</span>
                    </div>
                  ))}
                </div>
                {(realIdx > 0 || entry.isExample) && (
                  <button
                    onClick={() => deleteEntry(realIdx)}
                    className="text-text-faint hover:text-danger transition-colors flex-shrink-0"
                    title={entry.isExample ? 'Supprimer l\'exemple' : 'Supprimer'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
