import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { estimateSessionDuration } from '../../utils/sessionUtils'
import { sessionToFit, downloadFit } from '../../utils/fitExport'

// ─── Bouton export Garmin (FIT) ───────────────────────────────────────────────

export function GarminExportButton({ session }) {
  const [status, setStatus] = useState('idle') // idle | ok | error

  const handleExport = () => {
    try {
      const fitBytes = sessionToFit(session)
      const filename = `CBL-${(session?.name || 'seance').replace(/\s+/g, '-')}.fit`
      downloadFit(fitBytes, filename)
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      console.error('FIT export error:', e)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
          status === 'ok'
            ? 'border-success/30 bg-success/10 text-success'
            : status === 'error'
            ? 'border-danger/30 bg-danger/10 text-danger'
            : 'border-border bg-surface-2 text-text-primary hover:border-brand/30 hover:text-brand'
        }`}
      >
        {/* Garmin icon approximé */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
        {status === 'ok' ? 'Fichier .fit téléchargé ✓' : status === 'error' ? 'Erreur export' : 'Exporter pour Garmin (.fit)'}
      </button>

      {status === 'ok' && (
        <div className="text-xs text-text-faint leading-relaxed space-y-1">
          <div className="font-semibold text-text-muted">Comment l'envoyer sur ta montre :</div>
          <div>1. Ouvre <span className="text-brand">Garmin Connect</span> (web ou mobile)</div>
          <div>2. Menu → Entraînements → Importer</div>
          <div>3. Sélectionne le fichier <code className="text-brand font-mono text-[10px]">.fit</code></div>
          <div>4. Sync ta montre — la séance apparaît dans "Entraînements planifiés"</div>
        </div>
      )}
    </div>
  )
}

const TYPE_COLORS = {
  force: '#00D4FF', lactate: '#FF3D3D', specificity: '#FF9500',
  simulation: '#FF3D3D', recovery: '#00D47A',
}
const TYPE_LABELS = {
  force: 'FORCE', lactate: 'LACTIQUE', specificity: 'CIRCUIT CBL',
  simulation: 'SIMULATION', recovery: 'RÉCUPÉRATION',
}

function ExRow({ ex, idx }) {
  const weight = ex.weight && ex.weight !== 'bodyweight' ? ex.weight : null
  const sets = ex.sets ? `${ex.sets} × ${ex.reps}` : ex.duration ? `${ex.duration}s` : null
  const rest = ex.rest ? `récup ${ex.rest}s` : null
  const tempo = ex.tempo || null

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, flex: 1, color: '#111' }}>
        {ex.exercise || ex.label}
      </div>
      <div style={{ fontSize: 12, color: '#555', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
        {[sets, weight, rest, tempo].filter(Boolean).join('  ·  ')}
      </div>
    </div>
  )
}

function SessionSheet({ session, week, date, darkMode }) {
  const bg = darkMode ? '#0A0A0A' : '#FFFFFF'
  const text1 = darkMode ? '#FFFFFF' : '#111111'
  const text2 = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
  const border = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const rowBorder = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const sectionBg = darkMode ? '#141414' : '#F8F8F8'
  const accentColor = TYPE_COLORS[session?.type] || '#00D4FF'
  const estimatedMin = estimateSessionDuration(session)

  // Compute total theoretical volume (sets × reps)
  let totalVolume = 0
  let totalReps = 0
  for (const section of ['warmup', 'main', 'finisher']) {
    for (const ex of session?.[section] || []) {
      if (ex.sets && ex.reps) {
        const reps = typeof ex.reps === 'string' ? 6 : parseInt(ex.reps)
        const weight = ex.weight && ex.weight !== 'bodyweight' ? parseInt(ex.weight) || 0 : 0
        totalVolume += ex.sets * reps * (weight || 1)
        totalReps += ex.sets * reps
      }
    }
  }

  const warmupCount = (session?.warmup || []).length
  const mainCount = (session?.main || []).length
  const finisherCount = (session?.finisher || []).length

  return (
    <div style={{
      width: 595, minHeight: 842,
      background: bg,
      fontFamily: 'system-ui, -apple-system, Helvetica, sans-serif',
      padding: '40px 48px',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accentColor }} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: text2, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {date} · Semaine {week}/12
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: text1, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 6 }}>
          {session?.name || 'Séance'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: accentColor,
            background: accentColor + '15',
            padding: '3px 8px', borderRadius: 4,
          }}>
            {TYPE_LABELS[session?.type] || session?.type?.toUpperCase()}
          </span>
          {estimatedMin && (
            <span style={{ fontSize: 11, color: text2 }}>⏱ Durée estimée : {estimatedMin} min</span>
          )}
        </div>
      </div>

      {/* Intention */}
      {session?.intention && (
        <div style={{
          margin: '0 0 24px',
          padding: '14px 16px',
          background: accentColor + '0A',
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: '0 8px 8px 0',
        }}>
          <div style={{ fontSize: 11, color: text2, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Intention
          </div>
          <div style={{ fontSize: 13, color: text1, fontStyle: 'italic', lineHeight: 1.5 }}>
            "{session.intention}"
          </div>
        </div>
      )}

      {/* Warmup */}
      {warmupCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: text2, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Échauffement · {warmupCount > 0 ? '8–10 min' : ''}
          </div>
          <div style={{ background: sectionBg, borderRadius: 8, padding: '4px 14px' }}>
            {(session.warmup || []).map((ex, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: i < warmupCount - 1 ? `1px solid ${rowBorder}` : 'none', alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, color: text1, flex: 1 }}>{ex.exercise || ex.label}</div>
                <div style={{ fontSize: 11, color: text2, fontFamily: 'monospace' }}>
                  {ex.sets ? `${ex.sets} × ${ex.reps}` : ex.duration ? `${ex.duration}s` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      <div style={{ height: 1, background: border, margin: '0 0 20px' }} />

      {/* Main */}
      {mainCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: text2, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Programme principal
          </div>
          <div style={{ background: sectionBg, borderRadius: 8, padding: '4px 14px' }}>
            {(session.main || []).map((ex, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: i < mainCount - 1 ? `1px solid ${rowBorder}` : 'none' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: ex.note ? 2 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text1, flex: 1 }}>
                    {ex.exercise || ex.label}
                  </div>
                  <div style={{ fontSize: 11, color: text2, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {[
                      ex.sets && ex.reps ? `${ex.sets} × ${ex.reps}` : null,
                      ex.weight && ex.weight !== 'bodyweight' ? ex.weight : null,
                      ex.rest ? `récup ${ex.rest}s` : null,
                      ex.timeCap ? `cap ${ex.timeCap / 60}min` : null,
                    ].filter(Boolean).join('  ·  ')}
                  </div>
                </div>
                {ex.note && (
                  <div style={{ fontSize: 10, color: accentColor, marginTop: 1, paddingLeft: 2 }}>
                    ↳ {ex.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finisher */}
      {finisherCount > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 1, background: border, margin: '0 0 20px' }} />
          <div style={{ fontSize: 10, color: text2, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Finisher
          </div>
          <div style={{ background: sectionBg, borderRadius: 8, padding: '8px 14px' }}>
            {(session.finisher || []).map((ex, i) => (
              <div key={i} style={{ fontSize: 12, color: text1, lineHeight: 1.5 }}>
                {ex.exercise || ex.label}
                {ex.note && <span style={{ color: text2, fontSize: 11 }}> — {ex.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volume total */}
      {totalReps > 0 && (
        <div style={{
          display: 'flex', gap: 16, padding: '12px 0',
          borderTop: `1px solid ${border}`, marginBottom: 24,
        }}>
          <div>
            <div style={{ fontSize: 10, color: text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reps totales</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: accentColor, fontFamily: 'monospace' }}>~{totalReps}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Volume lesté</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: text1, fontFamily: 'monospace' }}>~{totalVolume} kg</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontSize: 10, color: text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Durée estimée</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: text1, fontFamily: 'monospace' }}>{estimatedMin} min</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 28, left: 48, right: 48,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `1px solid ${border}`, paddingTop: 12,
      }}>
        <div style={{ fontSize: 10, color: text2 }}>CBL Amateur → Espoir Pro</div>
        <div style={{ fontSize: 10, color: text2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />
          CBL COACH
        </div>
      </div>
    </div>
  )
}

/** Button + export logic — embed this on any page */
export default function SessionExport({ session, week }) {
  const [open, setOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [exporting, setExporting] = useState(false)
  const sheetRef = useRef(null)

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const exportPNG = async () => {
    if (!sheetRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        backgroundColor: darkMode ? '#0A0A0A' : '#FFFFFF',
        useCORS: true,
        logging: false,
        windowWidth: 595,
      })
      const link = document.createElement('a')
      link.download = `CBL-Seance-${session?.name?.replace(/\s+/g, '-') || 'session'}-S${week}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  const printSheet = () => window.print()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 btn-ghost text-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Exporter la séance
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center py-6 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl px-4 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white text-sm">✕ Fermer</button>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setDarkMode(d => !d)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20"
                  >
                    {darkMode ? '☀ Mode clair' : '🌙 Mode sombre'}
                  </button>
                  <button
                    onClick={exportPNG}
                    disabled={exporting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-black text-sm font-bold hover:bg-brand/90 disabled:opacity-60"
                  >
                    {exporting ? (
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                    PNG haute résolution
                  </button>
                </div>
              </div>

              {/* Sheet preview */}
              <div
                className="rounded-xl overflow-hidden shadow-2xl"
                style={{ transform: 'scale(1)', transformOrigin: 'top center' }}
              >
                <div
                  ref={sheetRef}
                  style={{
                    width: 595,
                    minHeight: 842,
                    margin: '0 auto',
                    transformOrigin: 'top left',
                    transform: `scale(${Math.min(1, (window.innerWidth - 32) / 595)})`,
                  }}
                >
                  <SessionSheet session={session} week={week} date={today} darkMode={darkMode} />
                </div>
              </div>

              <p className="text-xs text-white/30 text-center">
                Fais une capture d'écran ou utilise le bouton PNG pour exporter en haute résolution.
              </p>

              {/* Export Garmin */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-xs text-white/50 mb-3 font-semibold uppercase tracking-wider">Export Garmin</div>
                <GarminExportButton session={session} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
