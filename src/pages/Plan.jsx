import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import plan from '../data/coaching-plan.json'
import { getProgram, getCurrentAthleteId } from '../utils/coachStore'

const PHASE_COLORS = { m1: '#00D4FF', m2: '#FF9500', m3: '#FF3D3D' }
const TYPE_STYLES = {
  force: 'bg-brand/10 border-brand/30 text-brand',
  lactate: 'bg-danger/10 border-danger/30 text-danger',
  specificity: 'bg-warn/10 border-warn/30 text-warn',
  simulation: 'bg-danger/10 border-danger/30 text-danger',
  recovery: 'bg-success/10 border-success/30 text-success',
}

function IntensityBar({ value, label, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function MesoCard({ block, isExpanded, onToggle }) {
  const phase = plan.macroPhases.find(p => p.weeks.some(w => block.weeks.includes(w)))
  const color = phase ? PHASE_COLORS[phase.id] : '#888'

  return (
    <div className="glass rounded-xl overflow-hidden border border-border hover:border-border/80 transition-colors">
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={onToggle}
      >
        <div
          className="w-1 rounded-full self-stretch min-h-[40px]"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text-muted mb-0.5">
            Semaines {block.weeks[0]}–{block.weeks[block.weeks.length - 1]}
            {block.deload && <span className="ml-2 text-success border border-success/30 rounded px-1 text-[10px]">DELOAD</span>}
          </div>
          <div className="font-semibold text-sm">{block.name}</div>
          <div className="text-xs text-text-muted mt-0.5 truncate">{block.objective}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs font-mono text-text-faint">{block.intensity}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border">
              <div className="pt-3 space-y-3">
                <p className="text-sm text-text-muted">{block.objective}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="label mb-1">Volume</div>
                    <div className="text-sm font-semibold">{block.volume}</div>
                  </div>
                  <div>
                    <div className="label mb-1">Intensité</div>
                    <div className="text-sm font-semibold">{block.intensity}</div>
                  </div>
                </div>
                <div>
                  <div className="label mb-2">Métriques clés</div>
                  <ul className="space-y-1">
                    {block.keyMetrics.map((m, i) => (
                      <li key={i} className="text-xs text-text-muted flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProgressionObjectives() {
  const byWeek = {}
  plan.progressionObjectives.forEach(obj => {
    if (!byWeek[obj.week]) byWeek[obj.week] = []
    byWeek[obj.week].push(obj)
  })

  return (
    <div className="space-y-3">
      {Object.entries(byWeek).map(([week, objectives]) => (
        <div key={week} className="glass rounded-xl p-4">
          <div className="label mb-3">Semaine {week} — Jalons</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {objectives.map((obj, i) => (
              <div key={i} className="bg-surface-2 rounded-lg p-2.5 border border-border">
                <div className="text-xs text-text-muted">{obj.exercise}</div>
                <div className="text-lg font-bold tabular-nums text-brand">{obj.target}</div>
                <div className="text-[10px] text-text-muted">{obj.note}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function WeekDetail({ week }) {
  const template = (() => {
    if (week <= 4) return plan.weekTemplates['m1-standard']
    if (week <= 8) return plan.weekTemplates['m2-standard']
    if (week <= 10) return plan.weekTemplates['m3-peak']
    return plan.weekTemplates['deload']
  })()

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  return (
    <div className="space-y-2">
      <div className="label mb-3">Modèle — Semaine {week} ({template.sessionCount} séances)</div>
      {template.sessions.map((session, i) => {
        const typeStyle = TYPE_STYLES[session.type] || ''
        const exercises = [...(session.warmup || []), ...(session.main || []), ...(session.finisher || [])]
        return (
          <div key={i} className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className={`tag ${typeStyle}`}>{session.type}</span>
              <span className="font-semibold text-sm">{session.name}</span>
              <span className="text-xs text-text-muted ml-auto">Créneau {session.daySlot}</span>
            </div>
            <div className="space-y-1.5">
              {exercises.slice(0, 5).map((ex, j) => (
                <div key={j} className="flex items-start gap-2 text-xs">
                  <span className="text-text-faint tabular-nums w-4 flex-shrink-0">{j + 1}.</span>
                  <span className="text-text-muted flex-1">{ex.exercise || ex.label}</span>
                  {ex.sets && <span className="font-mono text-text-faint">{ex.sets}×{ex.reps}</span>}
                  {ex.weight && <span className="font-mono text-warn/70">{ex.weight}</span>}
                  {ex.rest && <span className="font-mono text-text-faint">⏱{ex.rest}s</span>}
                </div>
              ))}
              {exercises.length > 5 && (
                <div className="text-xs text-text-faint">+ {exercises.length - 5} autres exercices…</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Programme du Coach ───────────────────────────────────────────────────────

const WEEK_DAY_COLORS = {
  Lundi: '#0EA5E9', Mardi: '#10B981', Mercredi: '#F59E0B',
  Jeudi: '#8B5CF6', Vendredi: '#EF4444', Samedi: '#06B6D4', Dimanche: '#6B7280',
}

function CoachProgramView() {
  const program = getProgram(getCurrentAthleteId() || 'alexandre')
  const [expandedCycles, setExpandedCycles] = useState(new Set())
  const [expandedBlocs, setExpandedBlocs] = useState(new Set())
  const [selectedWeek, setSelectedWeek] = useState(null)

  const publishedCycles = (program.cycles || []).map(c => ({
    ...c,
    blocs: (c.blocs || []).map(b => ({
      ...b,
      weeks: (b.weeks || []).filter(w => w.status === 'published'),
    })).filter(b => b.weeks.length > 0),
  })).filter(c => c.blocs.length > 0)

  if (publishedCycles.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center border border-dashed border-border space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div>
          <div className="text-text-primary font-semibold mb-1">Ton programme arrive bientôt</div>
          <div className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
            Ton coach prépare ton plan d'entraînement personnalisé. Il apparaîtra ici dès qu'il sera publié.
          </div>
        </div>
        <div className="text-[10px] text-text-faint">En attendant, tu peux explorer les circuits CBL et envoyer tes disponibilités.</div>
      </div>
    )
  }

  const toggleCycle = (id) => setExpandedCycles(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleBloc = (id) => setExpandedBlocs(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="space-y-3">
      {publishedCycles.map(cycle => (
        <div key={cycle.id} className="glass rounded-2xl border border-border overflow-hidden">
          <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggleCycle(cycle.id)}>
            <div className="flex-1">
              <div className="font-semibold text-text-primary text-sm">{cycle.name}</div>
              {cycle.objective && <div className="text-xs text-text-muted mt-0.5">{cycle.objective}</div>}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`flex-shrink-0 text-text-faint transition-transform ${expandedCycles.has(cycle.id) ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <AnimatePresence>
            {expandedCycles.has(cycle.id) && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="border-t border-border space-y-1 p-3">
                  {cycle.blocs.map(bloc => (
                    <div key={bloc.id}>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-2 text-left transition-colors" onClick={() => toggleBloc(bloc.id)}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#0EA5E9' }} />
                        <span className="text-sm font-medium text-text-primary flex-1">{bloc.name}</span>
                        <span className="text-[10px] text-text-faint">{bloc.weeks.length} sem.</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className={`flex-shrink-0 text-text-faint transition-transform ${expandedBlocs.has(bloc.id) ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>

                      <AnimatePresence>
                        {expandedBlocs.has(bloc.id) && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden ml-4">
                            <div className="space-y-1 py-1">
                              {bloc.weeks.map(week => (
                                <div key={week.id}>
                                  <button
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm ${
                                      selectedWeek?.id === week.id ? 'bg-brand/10 border border-brand/30 text-brand' : 'hover:bg-surface-2 text-text-muted'
                                    }`}
                                    onClick={() => setSelectedWeek(selectedWeek?.id === week.id ? null : week)}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                    <span className="flex-1 font-medium">{week.name}</span>
                                    <span className="text-[10px]">{(week.sessions || []).length} séance{(week.sessions||[]).length!==1?'s':''}</span>
                                  </button>

                                  <AnimatePresence>
                                    {selectedWeek?.id === week.id && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="ml-2 mt-1 mb-2 space-y-2">
                                          {(week.sessions || []).map(session => (
                                            <div key={session.id} className="glass rounded-xl p-3 border border-border">
                                              <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: WEEK_DAY_COLORS[session.day] || '#888' }} />
                                                <span className="text-sm font-semibold text-text-primary">{session.day}</span>
                                                <span className="text-xs text-text-faint ml-auto">{(session.exercises||[]).length} exercice{(session.exercises||[]).length!==1?'s':''}</span>
                                              </div>
                                              {session.coachNote && (
                                                <p className="text-xs text-text-muted italic mb-2 leading-relaxed">"{session.coachNote}"</p>
                                              )}
                                              <div className="space-y-1">
                                                {(session.exercises || []).map((ex, i) => (
                                                  <div key={ex.id || i} className="flex items-center gap-2 text-xs">
                                                    <span className="text-text-faint w-4 tabular-nums">{i+1}.</span>
                                                    <span className="text-text-primary flex-1 font-medium">{ex.name}</span>
                                                    {ex.sets && <span className="font-mono text-text-muted">{ex.sets}×{ex.reps}</span>}
                                                    {ex.weight && <span className="font-mono text-warn/80">{ex.weight}</span>}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                          {(week.sessions||[]).length === 0 && (
                                            <div className="text-xs text-text-faint px-3 py-2">Aucune séance dans cette semaine.</div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ─── Plan component ───────────────────────────────────────────────────────────

export default function Plan() {
  const [activeTab, setActiveTab] = useState('coach')
  const [expandedMeso, setExpandedMeso] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(1)

  const tabs = [
    { id: 'coach', label: 'Du Coach' },
    { id: 'macro', label: 'Macro' },
    { id: 'objectives', label: 'Jalons' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <div className="label mb-1">Plan d'entraînement</div>
        <h1 className="text-2xl font-bold tracking-tight">3 mois vers l'Espoir</h1>
        <p className="text-sm text-text-muted mt-1">
          {plan.meta.startDate} · {plan.meta.durationWeeks} semaines · Objectif: {plan.meta.goal}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-brand text-black'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Macro view */}
      {activeTab === 'macro' && (
        <motion.div key="macro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {plan.macroPhases.map(phase => {
            const color = PHASE_COLORS[phase.id]
            return (
              <div key={phase.id} className="glass rounded-2xl p-5" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs font-mono mb-1" style={{ color }}>
                      Semaines {phase.weeks[0]}–{phase.weeks[phase.weeks.length - 1]}
                    </div>
                    <h3 className="font-bold text-base">{phase.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    {phase.focus.map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color, borderColor: color + '40' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-text-muted mb-4">{phase.objective}</p>
                <div className="grid grid-cols-2 gap-3">
                  <IntensityBar value={phase.intensity} label="Intensité" color={color} />
                  <IntensityBar value={phase.volume} label="Volume" color={color} />
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Meso view */}
      {activeTab === 'meso' && (
        <motion.div key="meso" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {plan.mesoBlocks.map(block => (
            <MesoCard
              key={block.id}
              block={block}
              isExpanded={expandedMeso === block.id}
              onToggle={() => setExpandedMeso(expandedMeso === block.id ? null : block.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Micro view */}
      {activeTab === 'micro' && (
        <motion.div key="micro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Week selector */}
          <div>
            <div className="label mb-2">Sélectionne une semaine</div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
                const phase = plan.macroPhases.find(p => p.weeks.includes(w))
                const color = phase ? PHASE_COLORS[phase.id] : '#888'
                return (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-all ${
                      selectedWeek === w
                        ? 'text-black border-transparent'
                        : 'text-text-muted border-border hover:border-text-faint'
                    }`}
                    style={selectedWeek === w ? { backgroundColor: color, borderColor: color } : {}}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
          </div>
          <WeekDetail week={selectedWeek} />
        </motion.div>
      )}

      {/* Objectives */}
      {activeTab === 'objectives' && (
        <motion.div key="objectives" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <ProgressionObjectives />
        </motion.div>
      )}

      {/* Du Coach */}
      {activeTab === 'coach' && (
        <motion.div key="coach" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div>
            <p className="text-sm text-text-muted">Programme publié par Nicolas Natanek — lecture seule.</p>
            <p className="text-xs text-text-faint mt-0.5">Seules les semaines validées et envoyées sont visibles ici.</p>
          </div>
          <CoachProgramView />
        </motion.div>
      )}

      {/* Citation */}
      <div className="pt-2 pb-4 text-center">
        <p className="text-[11px] text-text-faint italic">"Ce que tu fais aujourd'hui décide de ce que tu peux faire demain."</p>
      </div>
    </div>
  )
}
