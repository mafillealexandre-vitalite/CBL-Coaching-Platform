/**
 * Feature 1c — Monthly preview + surprise mechanic
 * Locked circuit cards, mystery sessions revealed 48h before.
 */

const NEXT_MONTH_CIRCUITS = [
  { id: 'nm-1', name: 'Circuit Force Maximale', division: 'Espoir', date: '2026-05-03', isMystery: false },
  { id: 'nm-2', name: 'Session Mystère', division: '???', date: '2026-05-07', isMystery: true },
  { id: 'nm-3', name: 'Protocole Lactique', division: 'Confirmé', date: '2026-05-12', isMystery: false },
  { id: 'nm-4', name: 'Session Mystère', division: '???', date: '2026-05-17', isMystery: true },
  { id: 'nm-5', name: 'Finisher Elite', division: 'Elite', date: '2026-05-24', isMystery: false },
]

function isRevealedYet(dateStr) {
  const targetDate = new Date(dateStr)
  const now = new Date()
  const diff = (targetDate - now) / (1000 * 60 * 60)
  return diff <= 48
}

function daysUntil(dateStr) {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export default function NextMonthPreview() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-xs font-bold tracking-widest uppercase text-text-faint">Mois prochain</div>
        <div className="flex-1 h-px bg-border" />
        <div className="text-[10px] text-text-faint">Mai 2026</div>
      </div>

      <div className="space-y-2">
        {NEXT_MONTH_CIRCUITS.map(circuit => {
          const revealed = !circuit.isMystery || isRevealedYet(circuit.date)
          const days = daysUntil(circuit.date)

          return (
            <div
              key={circuit.id}
              className="relative rounded-xl border overflow-hidden"
              style={{
                background: revealed ? '#FFFFFF' : 'rgba(15,25,35,0.04)',
                borderColor: circuit.isMystery ? 'rgba(139,92,246,0.3)' : '#E2E8F0',
              }}
            >
              {/* Blurred content for locked mystery sessions */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ filter: !revealed ? 'blur(3px)' : 'none', userSelect: !revealed ? 'none' : 'auto' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">
                    {revealed ? circuit.name : '████████████'}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {revealed ? circuit.division : '████'}
                    {' · '}
                    {new Date(circuit.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {circuit.isMystery && revealed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                    ⚡ Mystère
                  </span>
                )}
              </div>

              {/* Overlay for locked mystery sessions */}
              {!revealed && (
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔒</span>
                    <span className="text-xs font-semibold" style={{ color: '#8B5CF6' }}>⚡ Session mystère</span>
                  </div>
                  <div
                    className="text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}
                  >
                    {days > 0 ? `Se débloque dans ${days}j` : 'Bientôt !'}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
