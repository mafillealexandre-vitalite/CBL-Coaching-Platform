/**
 * Bouton "Exporter" unifié — un seul point d'entrée, modal avec toutes les options.
 * Garmin (.tcx) · Apple / Agenda (.ics) · Fiche PNG
 */
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { estimateSessionDuration } from '../../utils/sessionUtils'

// ─── TCX ─────────────────────────────────────────────────────────────────────

function buildTCX(session) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const allEx = [...(session.warmup || []), ...(session.main || []), ...(session.finisher || [])]
  let sid = 1
  const steps = allEx.map(ex => {
    const label = ex.exercise || ex.label || 'Exercice'
    const reps = typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps) || 8
    const sets = ex.sets || 1
    const dur = ex.duration || reps * 3
    const rest = ex.rest || 60
    return `
      <Step xsi:type="WorkoutStep_t">
        <StepId>${sid++}</StepId>
        <Name>${esc(label)}${ex.sets ? ` × ${sets} séries` : ''}</Name>
        <Duration xsi:type="Time_t"><Seconds>${sets * dur}</Seconds></Duration>
        <Intensity>Active</Intensity><Target xsi:type="None_t"/>
      </Step>
      <Step xsi:type="WorkoutStep_t">
        <StepId>${sid++}</StepId>
        <Name>Récupération</Name>
        <Duration xsi:type="Time_t"><Seconds>${rest}</Seconds></Duration>
        <Intensity>Resting</Intensity><Target xsi:type="None_t"/>
      </Step>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts><Workout Sport="Other">
    <Name>${esc(session.name || 'CBL Session')}</Name>
    <Step xsi:type="Repeat_t"><StepId>1</StepId><Repetitions>1</Repetitions>${steps}</Step>
  </Workout></Workouts>
</TrainingCenterDatabase>`
}

// ─── ICS ─────────────────────────────────────────────────────────────────────

function buildICS(session, estimatedMin) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0)
  const end = new Date(start.getTime() + (estimatedMin || 60) * 60000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const allEx = [
    ...(session.warmup || []).map(e => `• ${e.exercise || e.label}${e.sets ? ` — ${e.sets}×${e.reps}` : ''}`),
    ...(session.main || []).map(e => `• ${e.exercise || e.label}${e.sets ? ` — ${e.sets}×${e.reps}` : ''}${e.weight && e.weight !== 'bodyweight' ? ` (${e.weight})` : ''}`),
    ...(session.finisher || []).map(e => `• ${e.exercise || e.label}`),
  ]
  const desc = [
    `Type : ${session.type || 'Entraînement'}`,
    `Durée estimée : ${estimatedMin || '—'} min`,
    session.intention ? `Intention : ${session.intention}` : '',
    '', 'Programme :', ...allEx, '', 'CBL Coach Pro — Alexandre Mafille',
  ].join('\\n')
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CBL Coach Pro//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nBEGIN:VEVENT\nUID:cbl-${Date.now()}@cbl-coach-pro\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:CBL — ${session.name || 'Séance'}\nDESCRIPTION:${desc}\nCATEGORIES:SPORT,FITNESS\nSTATUS:CONFIRMED\nBEGIN:VALARM\nTRIGGER:-PT30M\nACTION:DISPLAY\nDESCRIPTION:Ta séance CBL commence dans 30 min\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`
}

// ─── PNG sheet ────────────────────────────────────────────────────────────────

const TYPE_COLORS = { force:'#0EA5E9', lactate:'#EF4444', specificity:'#F59E0B', simulation:'#EF4444', recovery:'#10B981' }
const TYPE_LABELS = { force:'FORCE', lactate:'LACTIQUE', specificity:'CIRCUIT CBL', simulation:'SIMULATION', recovery:'RÉCUPÉRATION' }

function SessionSheet({ session, week, date }) {
  const accent = TYPE_COLORS[session?.type] || '#0EA5E9'
  const est = estimateSessionDuration(session)
  let totalReps = 0
  for (const s of ['warmup','main','finisher']) {
    for (const ex of session?.[s] || []) {
      if (ex.sets && ex.reps) totalReps += ex.sets * (typeof ex.reps === 'string' ? 6 : parseInt(ex.reps))
    }
  }
  const row = (label, mono) => (
    <div style={{ display:'flex', alignItems:'baseline', gap:12, padding:'5px 0', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize:13, fontWeight:600, flex:1, color:'#111' }}>{label}</div>
      {mono && <div style={{ fontSize:11, color:'#666', fontFamily:'monospace', whiteSpace:'nowrap' }}>{mono}</div>}
    </div>
  )
  const section = (title, exs, bg) => exs?.length > 0 && (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:10, color:'#888', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{title}</div>
      <div style={{ background:bg, borderRadius:8, padding:'4px 14px' }}>
        {exs.map((ex,i) => row(ex.exercise||ex.label, [ex.sets&&ex.reps?`${ex.sets}×${ex.reps}`:null, ex.weight&&ex.weight!=='bodyweight'?ex.weight:null, ex.rest?`récup ${ex.rest}s`:null].filter(Boolean).join('  ·  ')))}
      </div>
    </div>
  )
  return (
    <div style={{ width:595, minHeight:842, background:'#fff', fontFamily:'system-ui,-apple-system,Helvetica,sans-serif', padding:'40px 48px', boxSizing:'border-box', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:accent }} />
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, color:'#888', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>{date} · Semaine {week}/12</div>
        <div style={{ fontSize:26, fontWeight:800, color:'#111', lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:8 }}>{session?.name}</div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:accent, background:accent+'15', padding:'3px 8px', borderRadius:4 }}>{TYPE_LABELS[session?.type]||session?.type?.toUpperCase()}</span>
          {est && <span style={{ fontSize:11, color:'#888' }}>⏱ {est} min estimées</span>}
        </div>
      </div>
      {session?.intention && (
        <div style={{ margin:'0 0 20px', padding:'12px 16px', background:accent+'0A', borderLeft:`3px solid ${accent}`, borderRadius:'0 8px 8px 0' }}>
          <div style={{ fontSize:10, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Intention</div>
          <div style={{ fontSize:13, color:'#333', fontStyle:'italic', lineHeight:1.5 }}>"{session.intention}"</div>
        </div>
      )}
      {section('Échauffement', session?.warmup, '#F8F8F8')}
      {section('Programme principal', session?.main, '#F8F8F8')}
      {section('Finisher', session?.finisher, '#F8F8F8')}
      {totalReps > 0 && (
        <div style={{ display:'flex', gap:24, padding:'10px 0', borderTop:'1px solid rgba(0,0,0,0.08)', marginTop:8 }}>
          <div><div style={{ fontSize:10, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em' }}>Reps totales</div><div style={{ fontSize:20, fontWeight:700, color:accent, fontFamily:'monospace' }}>~{totalReps}</div></div>
          {est && <div style={{ marginLeft:'auto' }}><div style={{ fontSize:10, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em' }}>Durée</div><div style={{ fontSize:20, fontWeight:700, color:'#111', fontFamily:'monospace' }}>{est} min</div></div>}
        </div>
      )}
      <div style={{ position:'absolute', bottom:28, left:48, right:48, display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(0,0,0,0.08)', paddingTop:10 }}>
        <div style={{ fontSize:10, color:'#aaa' }}>CBL Amateur → Espoir Pro</div>
        <div style={{ fontSize:10, color:'#aaa', display:'flex', alignItems:'center', gap:5 }}><div style={{ width:5, height:5, borderRadius:'50%', background:accent }} />CBL COACH PRO</div>
      </div>
    </div>
  )
}

// ─── Download helper ──────────────────────────────────────────────────────────

function dl(content, name, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: name }).click()
  URL.revokeObjectURL(url)
}

// ─── Export option row ────────────────────────────────────────────────────────

function ExportRow({ icon, title, subtitle, onClick, status, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left active:scale-[0.98] disabled:opacity-60"
      style={{ background: '#FAFAF8', borderColor: status === 'done' ? '#10B981' : '#E2E8F0' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-border">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        <div className="text-xs text-text-faint mt-0.5 leading-snug">{subtitle}</div>
      </div>
      <div className="flex-shrink-0">
        {loading ? (
          <div className="w-5 h-5 border-2 border-text-faint border-t-brand rounded-full animate-spin" />
        ) : status === 'done' ? (
          <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
      </div>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SessionFitnessExport({ session, week }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState({})
  const [pngLoading, setPngLoading] = useState(false)
  const sheetRef = useRef(null)

  const estimatedMin = estimateSessionDuration(session)
  const slug = (session?.name || 'seance').replace(/[^a-zA-Z0-9]/g, '_')
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const mark = key => setDone(p => ({ ...p, [key]: true }))

  const exportGarmin = () => { dl(buildTCX(session), `CBL_${slug}.tcx`, 'application/xml'); mark('garmin') }
  const exportCalendar = () => { dl(buildICS(session, estimatedMin), `CBL_${slug}.ics`, 'text/calendar'); mark('calendar') }
  const exportPNG = async () => {
    if (!sheetRef.current) return
    setPngLoading(true)
    try {
      const canvas = await html2canvas(sheetRef.current, { scale:2, backgroundColor:'#FFFFFF', useCORS:true, logging:false })
      const a = document.createElement('a')
      a.download = `CBL_Fiche_${slug}_S${week}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
      mark('png')
    } catch(e) { console.error(e) }
    finally { setPngLoading(false) }
  }

  if (!session) return null

  return (
    <>
      {/* Single trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-text-muted hover:text-text-primary hover:border-brand/30 transition-all"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        Exporter
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-modal overflow-hidden"
              initial={{ y: 48, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              {/* Handle bar — mobile */}
              <div className="flex justify-center pt-3 pb-0 md:hidden">
                <div className="w-8 h-1 rounded-full bg-border" />
              </div>

              <div className="px-5 pt-4 pb-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-text-primary">Exporter la séance</h3>
                    <p className="text-xs text-text-faint mt-0.5">
                      {session.name}{estimatedMin ? ` · ~${estimatedMin} min` : ''}
                    </p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-text-faint hover:text-text-muted p-1 -mr-1 -mt-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <ExportRow
                    icon={
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0F1923" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    }
                    title="Garmin Connect"
                    subtitle="Fichier .tcx — importe dans l'app ou garmin.com/connect"
                    onClick={exportGarmin}
                    status={done.garmin ? 'done' : null}
                  />
                  <ExportRow
                    icon={
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
                      </svg>
                    }
                    title="Apple Fitness / Agenda"
                    subtitle="Fichier .ics — s'ouvre dans Calendrier, Rappels ou toute app agenda"
                    onClick={exportCalendar}
                    status={done.calendar ? 'done' : null}
                  />
                  <ExportRow
                    icon={
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    }
                    title="Fiche PNG"
                    subtitle="Export haute résolution de la fiche complète de la séance"
                    onClick={exportPNG}
                    status={done.png ? 'done' : null}
                    loading={pngLoading}
                  />
                </div>

                <p className="text-[11px] text-text-faint text-center leading-relaxed">
                  Exports générés localement — aucune donnée transmise
                </p>
              </div>

              {/* Hidden sheet for PNG rendering */}
              <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', opacity: 0 }}>
                <div ref={sheetRef}>
                  <SessionSheet session={session} week={week} date={today} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
