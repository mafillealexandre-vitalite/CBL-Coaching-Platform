import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import circuits from '../../data/circuits.json'
import { getCircuitTimes, saveCircuitTimes, getAthletes, formatSeconds, parseTimeInput, uid } from '../../utils/coachStore'

function TimeCell({ athleteId, circuit, times, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const [noteInput, setNoteInput] = useState('')

  const entries = times[athleteId]?.[circuit.id] || []
  const best = entries.length
    ? entries.reduce((a, b) => (a.time < b.time ? a : b))
    : null

  const save = () => {
    const parsed = parseTimeInput(input)
    if (!parsed) { setEditing(false); return }
    onUpdate(athleteId, circuit.id, { id: uid(), time: parsed, date: new Date().toISOString().slice(0, 10), note: noteInput.trim() })
    setEditing(false)
    setInput('')
    setNoteInput('')
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 p-1">
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder="3:45"
          className="w-20 bg-surface-2 border border-brand rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none"
        />
        <input
          value={noteInput}
          onChange={e => setNoteInput(e.target.value)}
          placeholder="Note (opt.)"
          className="w-20 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-muted focus:outline-none"
        />
        <div className="flex gap-1">
          <button onClick={save} className="text-[10px] text-brand font-semibold px-1.5 py-0.5 rounded hover:bg-brand/10">OK</button>
          <button onClick={() => setEditing(false)} className="text-[10px] text-text-faint px-1.5 py-0.5">✕</button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group w-full h-full flex flex-col items-center justify-center gap-0.5 py-2 hover:bg-brand/5 transition-colors rounded"
    >
      {best ? (
        <>
          <span className="text-sm font-bold font-mono text-text-primary">{formatSeconds(best.time)}</span>
          <span className="text-[10px] text-text-faint">{best.date}</span>
          {entries.length > 1 && (
            <span className="text-[9px] text-text-faint">{entries.length} essais</span>
          )}
        </>
      ) : (
        <span className="text-text-faint text-xs group-hover:text-brand transition-colors">+</span>
      )}
    </button>
  )
}

function AthleteHistoryModal({ athleteId, athleteName, circuit, times, onClose, onDelete }) {
  const entries = (times[athleteId]?.[circuit.id] || []).slice().sort((a, b) => a.time - b.time)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl p-5 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <div className="text-xs text-text-faint mb-0.5">{athleteName}</div>
          <div className="font-bold text-text-primary">{circuit.name}</div>
          <div className="text-xs text-text-muted">Time cap : {Math.floor(circuit.timeCap / 60)}min</div>
        </div>
        {entries.length === 0 ? (
          <div className="text-center text-text-faint text-sm py-4">Aucun temps enregistré</div>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2 border border-border">
                {i === 0 && <span className="text-[10px] bg-warn/20 text-warn px-1 rounded">PR</span>}
                <span className="font-mono font-bold text-text-primary">{formatSeconds(e.time)}</span>
                <span className="text-xs text-text-faint">{e.date}</span>
                {e.note && <span className="text-xs text-text-muted italic flex-1 truncate">{e.note}</span>}
                <button onClick={() => onDelete(athleteId, circuit.id, e.id)} className="text-text-faint hover:text-danger transition-colors ml-auto">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="w-full btn-ghost text-sm">Fermer</button>
      </motion.div>
    </div>
  )
}

export default function CoachCircuits() {
  const [times, setTimes] = useState(getCircuitTimes)
  const [athletes] = useState(getAthletes)
  const [filter, setFilter] = useState('')
  const [historyModal, setHistoryModal] = useState(null) // { athleteId, circuit }

  const activeAthletes = athletes.filter(a => a.status === 'active')
  const allCircuits = circuits.circuits
  const filtered = filter
    ? allCircuits.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.division?.toLowerCase().includes(filter.toLowerCase()))
    : allCircuits

  const handleUpdate = useCallback((athleteId, circuitId, entry) => {
    setTimes(prev => {
      const next = { ...prev }
      if (!next[athleteId]) next[athleteId] = {}
      if (!next[athleteId][circuitId]) next[athleteId][circuitId] = []
      next[athleteId][circuitId] = [...next[athleteId][circuitId], entry]
      saveCircuitTimes(next)
      return next
    })
  }, [])

  const handleDelete = useCallback((athleteId, circuitId, entryId) => {
    setTimes(prev => {
      const next = { ...prev }
      if (next[athleteId]?.[circuitId]) {
        next[athleteId][circuitId] = next[athleteId][circuitId].filter(e => e.id !== entryId)
      }
      saveCircuitTimes(next)
      return next
    })
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Circuits CBL</h2>
          <p className="text-xs text-text-muted mt-0.5">Meilleurs temps par athlète — cliquer + pour ajouter</p>
        </div>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filtrer circuits…"
          className="ml-auto bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left px-4 py-3 text-text-faint font-medium text-xs min-w-52">Circuit</th>
                {activeAthletes.map(a => (
                  <th key={a.id} className="px-3 py-3 text-center text-text-faint font-medium text-xs min-w-28">
                    {a.nickname || a.name.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((circuit, ci) => (
                <tr key={circuit.id} className={ci % 2 === 0 ? 'bg-surface-2/30' : ''} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-2">
                    <div className="text-xs font-medium text-text-primary leading-tight">{circuit.name}</div>
                    <div className="text-[10px] text-text-faint mt-0.5">
                      {circuit.division} · {Math.floor(circuit.timeCap / 60)}min cap
                    </div>
                  </td>
                  {activeAthletes.map(a => (
                    <td key={a.id} className="px-1 py-1 text-center">
                      <div className="flex items-center justify-center">
                        <TimeCell
                          athleteId={a.id}
                          circuit={circuit}
                          times={times}
                          onUpdate={handleUpdate}
                        />
                        {(times[a.id]?.[circuit.id]?.length > 0) && (
                          <button
                            onClick={() => setHistoryModal({ athleteId: a.id, athleteName: a.name, circuit })}
                            className="ml-1 text-text-faint hover:text-brand transition-colors flex-shrink-0"
                            title="Voir historique"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-text-faint text-center">
        Cliquer sur une cellule pour saisir un temps (format 3:45 ou 225s). Cliquer l'icône horloge pour voir l'historique.
      </div>

      <AnimatePresence>
        {historyModal && (
          <AthleteHistoryModal
            {...historyModal}
            times={times}
            onClose={() => setHistoryModal(null)}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
