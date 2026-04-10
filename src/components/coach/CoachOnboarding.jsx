import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'cbl_coach_onboarded_v1'

// ── Animated tutorial player ──────────────────────────────────────────────────
// Simulates a screen recording of the coach workflow

const TUTORIAL_FRAMES = [
  {
    title: "Ajouter un athlète",
    subtitle: "Clique sur « Ajouter » pour créer un profil",
    highlight: 'add-btn',
    cursor: { x: 72, y: 14 },
    click: true,
  },
  {
    title: "Remplis le profil",
    subtitle: "Nom, niveau, objectifs — le PIN est auto-généré",
    highlight: 'form',
    cursor: { x: 50, y: 45 },
    click: false,
  },
  {
    title: "Envoie le lien d'invitation",
    subtitle: "1 clic pour copier le lien → WhatsApp, SMS",
    highlight: 'invite',
    cursor: { x: 50, y: 78 },
    click: true,
  },
  {
    title: "Crée le programme",
    subtitle: "Cycle → Bloc → Semaine → Sessions par jour",
    highlight: 'program',
    cursor: { x: 30, y: 50 },
    click: false,
  },
  {
    title: "Publie la semaine",
    subtitle: "L'athlète reçoit instantanément ses séances",
    highlight: 'publish',
    cursor: { x: 75, y: 62 },
    click: true,
  },
]

function TutorialPlayer() {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 })
  const intervalRef = useRef(null)
  const current = TUTORIAL_FRAMES[frame]

  useEffect(() => {
    setCursorPos(current.cursor)
  }, [frame])

  useEffect(() => {
    if (!playing) return
    intervalRef.current = setInterval(() => {
      setFrame(f => (f + 1) % TUTORIAL_FRAMES.length)
    }, 2600)
    return () => clearInterval(intervalRef.current)
  }, [playing])

  const MockUI = () => (
    <div className="relative w-full h-full bg-[#0F1923] rounded-xl overflow-hidden text-[8px]">
      {/* Sidebar mock */}
      <div className="absolute left-0 top-0 bottom-0 w-14 bg-[#1A2332] border-r border-white/5 flex flex-col items-center py-3 gap-3">
        <div className="w-7 h-7 rounded-lg bg-brand/80 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        {['M','P','S','F'].map((l, i) => (
          <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[7px] font-bold ${i === 0 ? 'bg-brand/20 text-brand' : 'text-white/30'}`}>{l}</div>
        ))}
      </div>

      {/* Main area */}
      <div className="absolute left-14 right-0 top-0 bottom-0 p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/40 text-[7px]">Nicolas Natanek</div>
            <div className="text-white font-bold text-[10px]">Espace Coach</div>
          </div>
          {/* Add button */}
          <motion.div
            animate={current.highlight === 'add-btn' ? {
              boxShadow: ['0 0 0 0px rgba(14,165,233,0)', '0 0 0 4px rgba(14,165,233,0.4)', '0 0 0 0px rgba(14,165,233,0)']
            } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="bg-brand text-black text-[7px] font-bold px-2 py-1 rounded-md"
          >
            + Ajouter
          </motion.div>
        </div>

        {/* Athlete cards */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {['Alexandre M.', 'Lucas F.', 'Jade M.'].slice(0, frame >= 2 ? 3 : 2).map((name, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/8">
              <div className="text-white text-[8px] font-medium">{name}</div>
              <div className="text-white/40 text-[6px] mt-0.5">Espoir · Actif</div>
              {current.highlight === 'program' && i === 0 && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-brand text-[6px] mt-1"
                >Ouvrir la fiche →</motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Form mock */}
        <AnimatePresence>
          {current.highlight === 'form' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-3 top-16 bg-[#1A2332] border border-brand/30 rounded-xl p-3 space-y-1.5 z-10"
            >
              <div className="text-white text-[9px] font-bold mb-2">Nouveau coaché</div>
              {['Nom complet', 'Niveau', 'Objectif'].map((p, i) => (
                <div key={i} className="bg-white/5 rounded-lg px-2 py-1 text-white/40 text-[7px]">{p}…</div>
              ))}
              <div className="flex items-center gap-1.5 bg-brand/10 border border-brand/20 rounded-lg px-2 py-1 mt-1">
                <div className="text-[6px] text-white/40">PIN auto</div>
                <div className="text-brand font-mono font-bold text-[9px] ml-auto">1234</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invite screen mock */}
        <AnimatePresence>
          {current.highlight === 'invite' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-3 top-16 bg-[#1A2332] border border-brand/30 rounded-xl p-3 space-y-2 z-10 text-center"
            >
              <div className="text-white text-[9px] font-bold">Profil créé !</div>
              <div className="bg-white/5 rounded-lg px-2 py-1.5">
                <div className="text-white/40 text-[6px]">Lien d'accès</div>
                <div className="text-brand text-[6px] font-mono mt-0.5">app.cbl.com/login?id=lucas</div>
              </div>
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="bg-brand text-black text-[7px] font-bold py-1.5 rounded-lg"
              >
                Copier le lien d'invitation
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Program mock */}
        <AnimatePresence>
          {current.highlight === 'program' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1 mt-1"
            >
              {['Cycle Force', 'Bloc Intensité', 'Semaine 1'].map((label, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                  <div className="w-1 h-4 rounded-full bg-brand/60" style={{ marginLeft: i * 8 }} />
                  <div className="text-white/70 text-[7px]">{label}</div>
                  {i === 2 && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="ml-auto text-brand text-[6px]"
                    >+ Session</motion.div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Publish mock */}
        <AnimatePresence>
          {current.highlight === 'publish' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-3 bottom-3 bg-[#1A2332] border border-white/10 rounded-xl p-2 z-10"
            >
              <div className="text-white/60 text-[7px] mb-1.5">Semaine 1 · 3 sessions</div>
              {['Lun · Force', 'Mer · Volume', 'Ven · Circuit'].map((s, i) => (
                <div key={i} className="text-white/40 text-[6px] py-0.5 border-b border-white/5">{s}</div>
              ))}
              <motion.div
                animate={{ boxShadow: ['0 0 0 0px rgba(14,165,233,0)', '0 0 0 6px rgba(14,165,233,0.3)', '0 0 0 0px rgba(14,165,233,0)'] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-2 bg-brand text-black text-[7px] font-bold py-1 rounded-lg text-center"
              >
                Publier la semaine
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Animated cursor */}
      <motion.div
        animate={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="absolute z-20 pointer-events-none"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          animate={current.click ? { scale: [1, 0.7, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5, repeat: current.click ? 2 : 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>
            <path d="M4 3l16 7-7 3-3 7z"/>
          </svg>
        </motion.div>
        {current.click && (
          <motion.div
            animate={{ scale: [0, 2], opacity: [0.6, 0] }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="absolute inset-0 w-3 h-3 rounded-full bg-brand/60"
            style={{ top: 2, left: 2 }}
          />
        )}
      </motion.div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <motion.div
          key={frame}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.6, ease: 'linear' }}
          className="h-full bg-brand"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Screen */}
      <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height: 200 }}>
        <MockUI />
      </div>

      {/* Caption */}
      <AnimatePresence mode="wait">
        <motion.div
          key={frame}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-center"
        >
          <div className="text-white text-sm font-semibold">{current.title}</div>
          <div className="text-white/50 text-xs mt-0.5">{current.subtitle}</div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setPlaying(p => !p)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          {playing
            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          }
        </button>
        <div className="flex gap-1">
          {TUTORIAL_FRAMES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFrame(i); setPlaying(false) }}
              className={`h-1.5 rounded-full transition-all ${i === frame ? 'w-4 bg-brand' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    color: '#0EA5E9',
    title: 'Bienvenue, Nicolas',
    body: "Ton espace coach est prêt. En moins de 5 minutes tu peux avoir ton premier athlète connecté et sa semaine de programme publiée.",
    extra: null,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
    color: '#10B981',
    title: 'Ajouter un athlète',
    body: null,
    checklist: [
      'Clique sur "Ajouter" → remplis nom, niveau, objectif',
      'Le PIN est généré automatiquement',
      'Copie le lien d\'invitation → envoie par WhatsApp',
      'L\'athlète clique, entre son PIN → il est connecté',
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: '#F59E0B',
    title: 'Créer le programme',
    body: null,
    checklist: [
      'Ouvre la fiche athlète → onglet "Programme"',
      'Crée un Cycle (ex: Préparation Sept 2026)',
      'Ajoute un Bloc (Force, Volume, Peak…)',
      'Crée les semaines et assigne des sessions par jour',
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: '#EF4444',
    title: 'Publier & suivre',
    body: null,
    checklist: [
      'Clique "Publier" sur une semaine → l\'athlète la reçoit',
      'Il voit ses séances, lance les timers vocaux',
      'Il envoie des feedbacks vidéo/audio',
      'Tu réponds depuis l\'onglet Feedback',
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    color: '#A78BFA',
    title: 'Tuto interactif',
    body: 'Regarde le déroulé complet en action :',
    extra: 'tutorial',
  },
]

// ── Main modal ────────────────────────────────────────────────────────────────
export default function CoachOnboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F1923 60%, #111E2C)' }}
      >
        {/* Top accent */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${current.color}, ${current.color}80)` }} />

        <div className="p-6 space-y-5">
          {/* Step header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Icon + title */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${current.color}18`, color: current.color, border: `1.5px solid ${current.color}30` }}>
                  {current.icon}
                </div>
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                    {step === 0 ? 'Guide démarrage' : `Étape ${step} / ${STEPS.length - 2}`}
                  </div>
                  <div className="text-white font-bold text-lg leading-tight">{current.title}</div>
                </div>
              </div>

              {/* Content */}
              {current.body && (
                <p className="text-white/60 text-sm leading-relaxed">{current.body}</p>
              )}

              {current.checklist && (
                <div className="space-y-2">
                  {current.checklist.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold"
                        style={{ background: `${current.color}20`, color: current.color }}>
                        {i + 1}
                      </div>
                      <span className="text-white/70 text-sm leading-snug">{item}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {current.extra === 'tutorial' && <TutorialPlayer />}
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  background: i === step ? current.color : 'rgba(255,255,255,0.15)'
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="w-9 h-10 rounded-xl border border-white/10 text-white/40 hover:text-white/70 flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => step === 0 ? setStep(1) : isLast ? finish() : setStep(s => s + 1)}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all text-black"
              style={{ background: current.color }}
            >
              {step === 0 ? 'Commencer le guide →' : isLast ? 'Accéder à mon espace' : 'Étape suivante →'}
            </button>
            {step === 0 && (
              <button
                onClick={finish}
                className="px-3 py-2.5 rounded-xl text-white/30 text-xs hover:text-white/50 transition-colors"
              >
                Passer
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function shouldShowCoachOnboarding() {
  return !localStorage.getItem(STORAGE_KEY)
}
