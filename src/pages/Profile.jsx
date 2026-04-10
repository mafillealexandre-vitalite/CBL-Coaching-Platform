import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import athleteStatic from '../data/athlete.json'
import plan from '../data/coaching-plan.json'
import { getAthletes, getCurrentAthleteId } from '../utils/coachStore'

// Merge static data with the current athlete from the store
function useProfileData() {
  const id = getCurrentAthleteId() || 'alexandre'
  const stored = getAthletes().find(a => a.id === id)
  if (!stored) return { athlete: athleteStatic, prs: null }

  // Parse numeric from strings like "23 reps" or "30 @16kg"
  const parseNum = (str) => {
    if (!str) return null
    const m = String(str).match(/\d+/)
    return m ? parseInt(m[0]) : null
  }

  const prs = stored.prs ? Object.fromEntries(
    Object.entries(stored.prs).map(([k, v]) => [k, {
      value: parseNum(v.value),
      valueStr: v.value,
      target: parseNum(v.target),
      targetStr: v.target,
      label: v.label,
      unit: 'reps',
    }])
  ) : null

  return {
    athlete: {
      ...athleteStatic,
      name: stored.name,
      goal: stored.goal,
      context: stored.note || athleteStatic.context,
      weakPoint: stored.goalShort ? `Objectif court terme : ${stored.goalShort}` : athleteStatic.weakPoint,
      competitionDate: stored.compDate || athleteStatic.competitionDate,
    },
    prs,
  }
}

// Keep backward compat alias
const athlete = athleteStatic

function ProfileAvatar() {
  const [photo, setPhoto] = useState(() => localStorage.getItem('cbl_profile_photo') || null)
  const inputRef = useRef(null)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Photo trop lourde (max 2 Mo)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => { setPhoto(ev.target.result); localStorage.setItem('cbl_profile_photo', ev.target.result) }
    reader.readAsDataURL(file)
  }
  const handleRemove = (e) => { e.stopPropagation(); setPhoto(null); localStorage.removeItem('cbl_profile_photo') }
  return (
    <div className="relative flex-shrink-0">
      <button onClick={() => inputRef.current?.click()} className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-brand text-white text-2xl font-bold hover:opacity-80 transition-opacity relative group" title="Changer la photo">
        {photo ? <img src={photo} alt="Profil" className="w-full h-full object-cover" /> : <span>{athlete.name?.[0] || 'A'}</span>}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
      </button>
      {photo && <button onClick={handleRemove} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white text-[10px] flex items-center justify-center hover:bg-danger/80 transition-colors" title="Supprimer">✕</button>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

function ProgressRing({ value, max, color, size = 80, strokeWidth = 6 }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(1, value / max))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function MaxCard({ label, current, target, unit, color }) {
  const pct = Math.round((current / target) * 100)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-xl p-4 flex flex-col items-center text-center gap-2"
    >
      <div className="relative">
        <ProgressRing value={current} max={target} color={color} size={72} strokeWidth={5} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums">{current}</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {unit && <div className="text-xs text-text-muted">{unit}</div>}
        <div className="text-xs font-mono mt-0.5" style={{ color }}>{pct}%</div>
      </div>
    </motion.div>
  )
}

function CompetitionProgress() {
  const start = new Date(plan.meta.startDate)
  const comp = new Date(athlete.competitionDate)
  const today = new Date()
  const totalDays = (comp - start) / (1000 * 60 * 60 * 24)
  const elapsed = (today - start) / (1000 * 60 * 60 * 24)
  const remaining = Math.max(0, Math.ceil((comp - today) / (1000 * 60 * 60 * 24)))
  const pct = Math.min(100, Math.max(0, (elapsed / totalDays) * 100))

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="label mb-1">Countdown compétition</div>
          <div className="text-xl font-bold">{athlete.nextCompetition}</div>
          <div className="text-xs text-text-muted mt-0.5">{athlete.competitionDate}</div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums text-brand">{remaining}</div>
          <div className="text-xs text-text-muted">jours</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-text-muted">
          <span>Début plan: {plan.meta.startDate}</span>
          <span>{Math.round(pct)}% du chemin</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-brand rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>{Math.floor(elapsed)} j écoulés</span>
          <span>Compétition</span>
        </div>
      </div>
    </div>
  )
}

const MAXES_DISPLAY = [
  { key: 'pullUp', label: 'Tractions', color: '#00D4FF' },
  { key: 'muscleUp', label: 'Muscle-up', color: '#FF9500' },
  { key: 'dips', label: 'Dips', color: '#FF3D3D' },
  { key: 'pushUp', label: 'Pompes', color: '#00D47A' },
  { key: 'gobletSquat', label: 'Goblet', color: '#A78BFA' },
]

export default function Profile() {
  const { athlete: currentAthlete, prs } = useProfileData()

  const maxData = (key) => {
    if (prs?.[key]) return { value: prs[key].value, target: prs[key].target, unit: prs[key].unit, valueStr: prs[key].valueStr, targetStr: prs[key].targetStr }
    return { value: currentAthlete.maxes?.[key]?.value, target: currentAthlete.targets3months?.[key]?.value, unit: currentAthlete.maxes?.[key]?.unit }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Hero */}
      <div className="glass rounded-2xl p-6 flex items-center gap-5">
        <ProfileAvatar />
        <div>
          <h1 className="text-xl font-bold">{currentAthlete.name}</h1>
          <div className="text-sm text-text-muted mt-0.5">{currentAthlete.goal}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="tag border-brand/40 text-brand bg-brand/5 text-xs px-2 py-0.5">CBL Athlete</span>
            <span className="tag border-warn/40 text-warn bg-warn/5 text-xs px-2 py-0.5">Calisthenics</span>
          </div>
        </div>
      </div>

      {/* Countdown */}
      <CompetitionProgress />

      {/* Context */}
      <div className="glass rounded-2xl p-5 border-l-2 border-danger">
        <div className="label mb-2" style={{ color: '#FF3D3D' }}>Contexte — pourquoi ce plan</div>
        <p className="text-sm text-text-muted leading-relaxed">{currentAthlete.context}</p>
        {currentAthlete.weakPoint && (
          <div className="mt-3 p-3 bg-danger/5 border border-danger/20 rounded-xl">
            <div className="text-xs font-semibold text-danger mb-1">Point faible identifié</div>
            <div className="text-sm">{currentAthlete.weakPoint}</div>
          </div>
        )}
      </div>

      {/* Maxes + targets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="label">Mes maxima → Objectifs 3 mois</div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {MAXES_DISPLAY.map(m => {
            const d = maxData(m.key)
            return (
              <MaxCard
                key={m.key}
                label={prs?.[m.key]?.label || m.label}
                current={d.value}
                target={d.target}
                unit={d.unit}
                color={m.color}
              />
            )
          })}
        </div>
        <div className="text-xs text-text-muted mt-2 text-center">
          Le cercle représente ta progression vers l'objectif cible
        </div>
      </div>

      {/* Detailed maxes table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <div className="label">Détail des performances</div>
        </div>
        <div className="divide-y divide-border">
          {MAXES_DISPLAY.map(m => {
            const d = maxData(m.key)
            const label = prs?.[m.key]?.label || m.label
            if (prs) {
              // Show string values from store
              return (
                <div key={m.key} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                  <div className="flex-1 text-sm font-medium">{label}</div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums">{prs[m.key]?.valueStr || '—'} → {prs[m.key]?.targetStr || '—'}</div>
                    <div className="text-[10px] text-text-muted">actuel → objectif</div>
                  </div>
                </div>
              )
            }
            const cur = d.value
            const tgt = d.target
            const unit = d.unit || 'reps'
            const delta = tgt - cur
            return (
              <div key={m.key} className="flex items-center gap-4 px-5 py-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                <div className="flex-1 text-sm font-medium">{label}</div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums">{cur} → {tgt}</div>
                  <div className="text-[10px] text-text-muted">{unit} · +{delta} à gagner</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan summary */}
      <div className="glass rounded-2xl p-5">
        <div className="label mb-3">Résumé du plan</div>
        <div className="grid grid-cols-2 gap-3">
          {plan.macroPhases.map(phase => (
            <div key={phase.id} className="bg-surface-2 rounded-xl p-3 border border-border">
              <div className="text-[10px] font-mono mb-1" style={{ color: phase.color }}>
                Semaines {phase.weeks[0]}–{phase.weeks[phase.weeks.length - 1]}
              </div>
              <div className="text-xs font-semibold leading-tight">{phase.name.split('—')[1]?.trim()}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {phase.focus.map(f => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: phase.color, backgroundColor: phase.color + '15' }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
