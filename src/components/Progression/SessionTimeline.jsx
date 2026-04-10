/**
 * Feature 4a — Scrollable horizontal session timeline
 * Nodes per session, colored by type, click for tooltip.
 * Dotted projection line extending 4 weeks forward.
 */
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_COLORS = {
  force: '#0EA5E9', lactate: '#EF4444', specificity: '#F59E0B',
  simulation: '#EF4444', recovery: '#10B981',
}

const SECRET_MILESTONES = [
  { at: 20, icon: '🔓', label: 'Circuit exclusif débloqué : Guerrier', color: '#F59E0B' },
  { at: 50, icon: '🔓', label: 'Protocole Elite débloqué', color: '#8B5CF6' },
  { at: 100, icon: '🔓', label: 'Mode Compétition activé', color: '#0F1923' },
]

function SessionNode({ session, index, onClick, isSelected }) {
  const color = TYPE_COLORS[session.type] || '#94A3B8'
  const d = new Date(session.date)

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <button
        onClick={() => onClick(session)}
        className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          background: session.completed ? color : 'transparent',
          borderColor: color,
          boxShadow: isSelected ? `0 0 0 3px ${color}33` : 'none',
          transform: isSelected ? 'scale(1.15)' : 'none',
        }}
      >
        {session.completed && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </button>
      <div className="text-[9px] text-text-faint tabular-nums">
        {d.getDate()}/{d.getMonth() + 1}
      </div>
    </div>
  )
}

function MilestoneNode({ milestone, unlocked }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-base border-2"
        style={{
          background: unlocked ? milestone.color + '15' : '#F1F5F9',
          borderColor: unlocked ? milestone.color : '#CBD5E1',
          opacity: unlocked ? 1 : 0.5,
        }}
      >
        {unlocked ? milestone.icon : '🔒'}
      </div>
      <div className="text-[9px] text-center max-w-[70px]" style={{ color: unlocked ? milestone.color : '#94A3B8' }}>
        {milestone.at} séances
      </div>
    </div>
  )
}

function SessionTooltip({ session, onClose }) {
  if (!session) return null
  const d = new Date(session.date)
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const color = TYPE_COLORS[session.type] || '#94A3B8'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="mt-3 rounded-xl border p-3 bg-white shadow-card"
      style={{ borderColor: color + '30' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-text-primary capitalize">{dateStr}</div>
        <button onClick={onClose} className="text-text-faint text-xs">✕</button>
      </div>
      <div className="text-sm font-medium text-text-primary mb-1">{session.label}</div>
      <div className="flex gap-3 text-xs text-text-muted flex-wrap">
        {session.duration > 0 && <span>⏱ {session.duration} min</span>}
        {session.rpe > 0 && <span>🔥 RPE {session.rpe}/10</span>}
        {session.completed && <span className="text-success font-semibold">✓ Complété</span>}
      </div>
    </motion.div>
  )
}

export default function SessionTimeline({ sessions }) {
  const scrollRef = useRef(null)
  const [selectedSession, setSelectedSession] = useState(null)

  const done = sessions.filter(s => s.completed)
  const totalDone = done.length

  // Compute avg sessions/week over last 4 weeks for projection
  const now = new Date()
  const fourWeeksAgo = new Date(now - 28 * 86400 * 1000)
  const recentDone = done.filter(s => new Date(s.date) >= fourWeeksAgo)
  const avgPerWeek = recentDone.length / 4

  // Build projection nodes (next 4 weeks)
  const projectionNodes = []
  if (avgPerWeek > 0) {
    for (let w = 1; w <= 4; w++) {
      const sessionsInWeek = Math.round(avgPerWeek)
      for (let i = 0; i < sessionsInWeek; i++) {
        const d = new Date(now)
        d.setDate(now.getDate() + w * 7 - 3 + i * 2)
        projectionNodes.push({ date: d, w, i })
      }
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-text-faint text-sm">
        Aucune séance enregistrée.<br/>
        <span className="text-xs">Commence à valider des séances pour voir ta timeline !</span>
      </div>
    )
  }

  return (
    <div>
      {/* Scrollable timeline */}
      <div
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar pb-2"
      >
        <div className="flex items-end gap-2 min-w-max px-2">
          {/* Session nodes (oldest to newest = left to right) */}
          {done.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map((session, idx) => {
            // Check if a milestone is right before this node
            const milestone = SECRET_MILESTONES.find(m => m.at === idx + 1)
            const milestoneUnlocked = totalDone >= (milestone?.at || 0)

            return (
              <div key={session.id || idx} className="flex items-end gap-2">
                {milestone && (
                  <>
                    {/* connector line */}
                    <div className="w-6 h-px self-center" style={{ background: milestoneUnlocked ? milestone.color : '#E2E8F0' }} />
                    <MilestoneNode milestone={milestone} unlocked={milestoneUnlocked} />
                    <div className="w-6 h-px self-center" style={{ background: milestoneUnlocked ? milestone.color : '#E2E8F0' }} />
                  </>
                )}
                <SessionNode
                  session={session}
                  index={idx}
                  onClick={s => setSelectedSession(s === selectedSession ? null : s)}
                  isSelected={selectedSession?.id === session.id}
                />
                {/* Connector line between nodes */}
                {idx < done.length - 1 && (
                  <div
                    className="w-4 h-0.5 self-center mb-4"
                    style={{
                      background: `linear-gradient(90deg, ${TYPE_COLORS[session.type] || '#CBD5E1'}, ${TYPE_COLORS[done[idx + 1]?.type] || '#CBD5E1'})`,
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Projection nodes (dotted) */}
          {projectionNodes.length > 0 && (
            <>
              <div className="w-8 self-center mb-4" style={{ borderTop: '2px dashed #CBD5E1' }} />
              {projectionNodes.map((node, idx) => (
                <div key={`proj-${idx}`} className="flex items-end gap-2">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className="w-6 h-6 rounded-full border-2"
                      style={{ borderColor: '#CBD5E1', borderStyle: 'dashed', background: '#F8FAFC' }}
                    />
                    <div className="text-[9px] text-text-faint">prév.</div>
                  </div>
                  {idx < projectionNodes.length - 1 && (
                    <div className="w-4 h-px self-center mb-4" style={{ borderTop: '2px dashed #CBD5E1' }} />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Session tooltip */}
      <AnimatePresence>
        {selectedSession && (
          <SessionTooltip session={selectedSession} onClose={() => setSelectedSession(null)} />
        )}
      </AnimatePresence>

      {/* Secret milestone unlocks */}
      <div className="mt-4 space-y-2">
        {SECRET_MILESTONES.map(m => {
          const unlocked = totalDone >= m.at
          if (!unlocked) return null
          return (
            <motion.div
              key={m.at}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ background: m.color + '08', borderColor: m.color + '30' }}
            >
              <span className="text-lg">{m.icon}</span>
              <div className="text-sm font-semibold" style={{ color: m.color }}>{m.label}</div>
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: m.color + '15', color: m.color }}>
                ⭐ Débloqué
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
