import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentAthleteId } from '../utils/coachStore'
import { matchCoachRules, computePlanAdjustments } from '../utils/coachEngine'
import { computeDeltas } from '../utils/diagnosticEngine'
import plan from '../data/coaching-plan.json'

const COLOR_MAP = {
  danger: { bg: 'bg-danger/10', border: 'border-danger/20', text: 'text-danger', dot: 'bg-danger' },
  warn: { bg: 'bg-warn/10', border: 'border-warn/20', text: 'text-warn', dot: 'bg-warn' },
  success: { bg: 'bg-success/10', border: 'border-success/20', text: 'text-success', dot: 'bg-success' },
  brand: { bg: 'bg-brand/10', border: 'border-brand/20', text: 'text-brand', dot: 'bg-brand' },
}

function CoachCard({ response, index }) {
  const c = COLOR_MAP[response.color] || COLOR_MAP.brand
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
      className={`p-4 rounded-xl border ${c.bg} ${c.border} space-y-3`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{response.tag}</span>
      </div>
      <p className="text-text-primary text-sm leading-relaxed">{response.coach_message}</p>
      <div className="flex gap-2 items-start">
        <span className="text-xs text-text-faint mt-0.5 flex-shrink-0">→</span>
        <p className="text-xs text-text-muted leading-relaxed">{response.conseil_cle}</p>
      </div>
    </motion.div>
  )
}

function AdjustmentCard({ adjustment }) {
  return (
    <div className="p-3 rounded-xl bg-warn/5 border border-warn/20">
      <div className="text-xs text-warn font-semibold mb-1">Ajustement plan détecté</div>
      <p className="text-sm text-text-primary">{adjustment.description}</p>
      {adjustment.deltaPullup !== undefined && (
        <div className="mt-2 text-xs text-text-faint">
          Δ tractions: {adjustment.deltaPullup.toFixed(1)}% · Δ circuit: {adjustment.deltaCircuit?.toFixed(1)}% · RPE moy: {adjustment.rpeAvg}
        </div>
      )}
    </div>
  )
}

function SessionLog() {
  const [sessions, setSessions] = useState([])
  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('cbl_session_log') || '[]')
    setSessions(s.slice(-8).reverse())
  }, [])
  if (sessions.length === 0) return (
    <div className="text-center text-text-faint text-sm py-6">
      Aucune séance enregistrée. Complète des séances pour voir l'historique.
    </div>
  )
  return (
    <div className="space-y-2">
      {sessions.map((s, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.completed ? 'bg-success' : 'bg-danger'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary truncate">{s.label || 'Séance'}</div>
            <div className="text-xs text-text-faint">{s.date ? new Date(s.date).toLocaleDateString('fr-FR') : ''}</div>
          </div>
          {s.rpe && <div className="text-sm font-bold text-text-muted tabular-nums">RPE {s.rpe}</div>}
        </div>
      ))}
    </div>
  )
}

export default function Coach() {
  const [tab, setTab] = useState('debrief') // debrief | history | adjustments
  const [debriefText, setDebriefText] = useState('')
  const [rpe, setRpe] = useState(7)
  const [circuitCompletion, setCircuitCompletion] = useState(100)
  const [deltaReps, setDeltaReps] = useState(0)
  const [consistency, setConsistency] = useState(80)
  const [responses, setResponses] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [adjustments, setAdjustments] = useState([])
  const [showMetrics, setShowMetrics] = useState(false)

  // Compute weeks to comp
  const compDate = new Date('2026-09-01')
  const weeksToComp = Math.ceil((compDate - new Date()) / (1000 * 60 * 60 * 24 * 7))

  // Compute week for week type
  const startDate = new Date(plan.meta.startDate)
  const weekNum = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24 * 7)))
  const weekType = weekNum > 11 ? 'deload' : 'standard'

  // Load plan adjustments from meso test history
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('cbl_meso_tests') || '[]')
    if (history.length >= 2) {
      const prev = history[history.length - 2].raw
      const curr = history[history.length - 1].raw
      const adj = computePlanAdjustments(prev, curr)
      setAdjustments(adj)
    }
  }, [])

  // Auto-compute consistency from session log
  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('cbl_session_log') || '[]')
    if (sessions.length > 0) {
      const last28 = sessions.filter(s => {
        const d = new Date(s.date)
        return (new Date() - d) < 28 * 24 * 3600 * 1000
      })
      const done = last28.filter(s => s.completed).length
      const planned = last28.length
      if (planned > 0) setConsistency(Math.round((done / planned) * 100))
    }
  }, [])

  const analyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      const matched = matchCoachRules(
        { rpe, circuitCompletion, deltaReps, consistency, weeksToComp, weekType },
        debriefText
      )
      setResponses(matched)
      setIsAnalyzing(false)

      // Save debrief to log
      const log = JSON.parse(localStorage.getItem('cbl_coach_log') || '[]')
      log.push({
        date: new Date().toISOString(),
        text: debriefText,
        metrics: { rpe, circuitCompletion, deltaReps },
        responseIds: matched.map(r => r.id),
      })
      localStorage.setItem('cbl_coach_log', JSON.stringify(log.slice(-50)))
    }, 700) // slight delay for UX
  }

  const reset = () => {
    setResponses(null)
    setDebriefText('')
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Coach IA</h1>
        <p className="text-text-muted text-sm mt-1">Ton coach personnel CBL. Décris ta séance, reçois un retour.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
        {[
          { id: 'debrief', label: 'Débrief' },
          { id: 'history', label: 'Historique' },
          { id: 'adjustments', label: `Ajustements${adjustments.length > 0 ? ` (${adjustments.length})` : ''}` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'debrief' && (
        <div className="space-y-4">
          {!responses ? (
            <>
              {/* Debrief text */}
              <div>
                <label className="label mb-2 block">Comment s'est passée la séance ?</label>
                <textarea
                  value={debriefText}
                  onChange={e => setDebriefText(e.target.value)}
                  placeholder="Décris librement : les sensations, ce qui a bloqué, ce qui était fort…"
                  rows={4}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary text-sm resize-none focus:outline-none focus:border-brand placeholder-text-faint"
                />
                <p className="text-xs text-text-faint mt-1">Compatible Wispr / dictée vocale</p>
              </div>

              {/* RPE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">RPE de la séance</label>
                  <span className="text-brand font-bold">{rpe}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" step="1" value={rpe}
                  onChange={e => setRpe(Number(e.target.value))}
                  className="w-full accent-brand"
                />
              </div>

              {/* Toggle advanced metrics */}
              <button
                onClick={() => setShowMetrics(m => !m)}
                className="text-xs text-text-faint hover:text-text-muted flex items-center gap-1"
              >
                <span>{showMetrics ? '▾' : '▸'}</span>
                Métriques avancées
              </button>

              <AnimatePresence>
                {showMetrics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="label">Complétion circuit</label>
                          <span className="text-brand font-bold">{circuitCompletion}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" step="5" value={circuitCompletion}
                          onChange={e => setCircuitCompletion(Number(e.target.value))}
                          className="w-full accent-brand"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="label">Delta reps vs séance précédente</label>
                          <span className={`font-bold text-sm ${deltaReps > 0 ? 'text-success' : deltaReps < 0 ? 'text-danger' : 'text-text-muted'}`}>
                            {deltaReps > 0 ? '+' : ''}{deltaReps}
                          </span>
                        </div>
                        <input
                          type="range" min="-10" max="20" step="1" value={deltaReps}
                          onChange={e => setDeltaReps(Number(e.target.value))}
                          className="w-full accent-brand"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={analyze}
                disabled={isAnalyzing}
                className="btn-primary w-full"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Analyse en cours…
                  </span>
                ) : 'Analyser la séance'}
              </button>
            </>
          ) : (
            <AnimatePresence>
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    {responses.length} analyse{responses.length > 1 ? 's' : ''}
                  </span>
                  <button onClick={reset} className="text-xs text-text-faint hover:text-text-muted underline">
                    Nouveau débrief
                  </button>
                </div>
                {responses.length > 0 ? (
                  responses.map((r, i) => <CoachCard key={r.id} response={r} index={i} />)
                ) : (
                  <div className="p-4 rounded-xl bg-surface-2 border border-border text-center text-text-muted text-sm">
                    RPE {rpe}/10 — Séance standard. Continue sur ce rythme.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="font-semibold text-text-primary">Débriefs athlète</h2>
            <AthleteDebriefs />
          </div>
          <div className="space-y-3">
            <h2 className="font-semibold text-text-primary">Historique séances</h2>
            <SessionLog />
            <CoachLogList />
          </div>
        </div>
      )}

      {tab === 'adjustments' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-text-primary">Ajustements du plan</h2>
            <p className="text-xs text-text-muted mt-1">
              Calculés automatiquement à partir des tests diagnostiques de fin de bloc.
            </p>
          </div>

          {adjustments.length > 0 ? (
            <div className="space-y-3">
              {adjustments.map((adj, i) => <AdjustmentCard key={i} adjustment={adj} />)}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-surface-2 border border-border text-center">
              <div className="text-text-faint text-sm">Aucun ajustement détecté.</div>
              <div className="text-xs text-text-faint mt-1">
                Complète au moins 2 tests diagnostiques (fin de bloc méso) pour voir les recommandations.
              </div>
            </div>
          )}

          {/* Weight progression reference */}
          <WeightProgressionTable />
        </div>
      )}
    </div>
  )
}

const SESSION_TYPE_COLORS_DEBRIEF = { force: '#0EA5E9', lactate: '#EF4444', specificity: '#F59E0B', simulation: '#EF4444', recovery: '#10B981' }

function AthleteDebriefs() {
  const [debriefs, setDebriefs] = useState([])
  const [expanded, setExpanded] = useState(null)
  useEffect(() => {
    const id = getCurrentAthleteId() || 'alexandre'
    const d = JSON.parse(localStorage.getItem(`cbl_debriefs_${id}`) || '[]')
    setDebriefs(d.slice().reverse())
  }, [])
  if (debriefs.length === 0) return (
    <div className="p-5 rounded-xl bg-surface-2 border border-border text-center">
      <div className="text-text-faint text-sm">Aucun débrief encore.</div>
      <div className="text-xs text-text-faint mt-1">Après chaque séance, clique sur "C'est fait ✓" pour enregistrer ton retour.</div>
    </div>
  )
  return (
    <div className="space-y-2">
      {debriefs.map((d, i) => {
        const color = SESSION_TYPE_COLORS_DEBRIEF[d.sessionType] || '#94A3B8'
        const isExp = expanded === d.id
        return (
          <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-xl border border-border overflow-hidden">
            <button className="w-full flex items-center gap-3 p-3.5 text-left" onClick={() => setExpanded(isExp ? null : d.id)}>
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: color, minHeight: 16 }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{d.sessionName}</div>
                <div className="text-xs text-text-faint">{new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}{d.week ? ` · Sem. ${d.week}` : ''}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono text-text-muted">{d.duration}min</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ color, backgroundColor: color + '20' }}>{d.rpe}/10</span>
              </div>
            </button>
            {isExp && d.note && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-3 border-t border-border overflow-hidden">
                <p className="text-sm text-text-muted pt-3 italic">"{d.note}"</p>
              </motion.div>
            )}
          </motion.div>
        )
      })}
      <div className="pt-2 text-center">
        <p className="text-[11px] text-text-faint italic">"Chaque répétition compte. Même celle dont tu n'avais pas envie."</p>
      </div>
    </div>
  )
}

function CoachLogList() {
  const [log, setLog] = useState([])
  useEffect(() => {
    const l = JSON.parse(localStorage.getItem('cbl_coach_log') || '[]')
    setLog(l.slice(-5).reverse())
  }, [])
  if (log.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-primary">Debriefs récents</h3>
      {log.map((entry, i) => (
        <div key={i} className="p-3 rounded-lg bg-surface-2 border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-faint">
              {new Date(entry.date).toLocaleDateString('fr-FR')}
            </span>
            <span className="text-xs font-bold text-text-muted">RPE {entry.metrics?.rpe}/10</span>
          </div>
          {entry.text && (
            <p className="text-xs text-text-muted line-clamp-2">{entry.text}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function WeightProgressionTable() {
  const rows = [
    { mouvement: 'Muscle-up lesté', b1: '0 kg', b2: '+5 kg', b3: '+10 kg' },
    { mouvement: 'Dips lestés (sem 1–2)', b1: '0 kg', b2: '+10 kg', b3: '+15 kg' },
    { mouvement: 'Dips lestés (sem 3–4)', b1: '+5 kg', b2: '+10 kg', b3: '+15 kg' },
  ]
  return (
    <div className="glass p-4 rounded-xl border border-border">
      <div className="text-sm font-semibold text-text-primary mb-3">Charges programmées</div>
      <div className="text-xs text-text-faint mb-2">Disponibles : 0 / 5 / 10 / 15 / 20 / 30 kg</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-faint border-b border-border">
              <th className="text-left pb-2">Mouvement</th>
              <th className="text-center pb-2">Bloc 1</th>
              <th className="text-center pb-2">Bloc 2</th>
              <th className="text-center pb-2">Bloc 3</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(r => (
              <tr key={r.mouvement}>
                <td className="py-2 text-text-muted">{r.mouvement}</td>
                <td className="py-2 text-center font-mono text-text-primary">{r.b1}</td>
                <td className="py-2 text-center font-mono text-warn">{r.b2}</td>
                <td className="py-2 text-center font-mono text-danger">{r.b3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
