/**
 * Feature 3 — /standards route
 * Exercise Standards Library — the athlete's "bible" of CBL movement standards.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOVEMENT_STANDARDS } from '../data/movementStandards'
import { getStandards, getCurrentAthleteId } from '../utils/coachStore'

const CAT_TIP_COLORS = {
  technique: '#0EA5E9', nutrition: '#10B981', récup: '#8B5CF6',
  mental: '#F59E0B', programmation: '#EF4444', autre: '#6B7280',
}

function CoachTips() {
  const athleteId = getCurrentAthleteId() || 'alexandre'
  const tips = getStandards().filter(s => !s.assignedTo?.length || s.assignedTo.includes(athleteId))
  if (tips.length === 0) return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-purple-400" />
        <span className="label">Conseils de ton coach</span>
      </div>
      <div className="glass rounded-xl p-5 border border-dashed border-border flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">Conseils personnalisés à venir</div>
          <div className="text-xs text-text-muted mt-0.5 leading-relaxed">Ton coach publiera ici ses notes de technique, conseils de récupération et points clés à travailler. En attendant, explore les standards de mouvement ci-dessous.</div>
        </div>
      </div>
    </div>
  )
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-purple-400" />
        <span className="label">Conseils de ton coach</span>
        <span className="text-xs text-text-faint">({tips.length})</span>
      </div>
      <div className="space-y-2">
        {tips.map(tip => {
          const color = CAT_TIP_COLORS[tip.category] || '#6B7280'
          return (
            <details key={tip.id} className="glass rounded-xl border border-border overflow-hidden group">
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-text-primary flex-1">{tip.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: color + '20', color }}>
                  {tip.category}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  className="flex-shrink-0 text-text-faint transition-transform group-open:rotate-180">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 border-t border-border">
                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{tip.content}</p>
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}

const CATEGORY_COLORS = {
  PULL: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  PUSH: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  LEGS: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  CORE: { bg: '#FAF5FF', text: '#9333EA', border: '#E9D5FF' },
  CARDIO: { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
}

const CATEGORIES = ['PULL', 'PUSH', 'LEGS', 'CORE', 'CARDIO']

// ─── Coach audio for standards ────────────────────────────────────────────────

function CoachAudioButton({ standardId, coachMode = false }) {
  const [state, setState] = useState('idle')
  const [audioBase64, setAudioBase64] = useState(null)
  const [showMicModal, setShowMicModal] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)
  const storageKey = `cbl_audio_standard_${standardId}`

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) { setAudioBase64(saved); setState('saved') }
  }, [storageKey])

  const startRecording = async () => {
    setShowMicModal(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          localStorage.setItem(storageKey, reader.result)
          setAudioBase64(reader.result)
          setState('saved')
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setState('recording')
    } catch {
      alert("Accès micro refusé.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const play = () => {
    if (!audioBase64) return
    audioRef.current = new Audio(audioBase64)
    audioRef.current.onended = () => setState('saved')
    audioRef.current.play()
    setState('playing')
  }

  const stop = () => { audioRef.current?.pause(); setState('saved') }

  const del = () => {
    audioRef.current?.pause()
    localStorage.removeItem(storageKey)
    setAudioBase64(null)
    setState('idle')
  }

  if (state === 'idle') {
    if (!coachMode) {
      return (
        <div className="flex items-center gap-2 text-xs text-text-faint py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          </svg>
          Aucune consigne audio
        </div>
      )
    }
    return (
      <button
        onClick={() => setShowMicModal(true)}
        className="flex items-center gap-2 text-xs font-medium text-brand hover:text-brand-dim transition-colors py-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        </svg>
        Enregistrer une consigne
        {showMicModal && (
          <span className="ml-2 inline-flex">
            <button
              onClick={e => { e.stopPropagation(); setShowMicModal(false) }}
              className="text-text-faint mr-1"
            >Annuler ·</button>
            <button onClick={e => { e.stopPropagation(); startRecording() }} className="text-brand font-bold">Démarrer</button>
          </span>
        )}
      </button>
    )
  }

  if (state === 'recording') {
    return (
      <button onClick={stopRecording} className="flex items-center gap-2 text-xs font-semibold text-red-500 py-2">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-400 pulse-ring-anim" />
          <div className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
        </div>
        Arrêter l'enregistrement
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <button
        onClick={state === 'playing' ? stop : play}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: state === 'playing' ? '#0EA5E9' : '#D1FAE5', border: '2px solid', borderColor: state === 'playing' ? '#0EA5E9' : '#10B981' }}
      >
        {state === 'playing'
          ? <div className="w-2 h-2 bg-white rounded-sm" />
          : <svg width="8" height="8" viewBox="0 0 24 24" fill="#10B981"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        }
      </button>
      <span className="text-xs text-text-muted">Consigne audio</span>
      {coachMode && (
        <button onClick={del} className="text-[10px] text-text-faint hover:text-danger ml-auto">suppr.</button>
      )}
    </div>
  )
}

// ─── Movement detail modal ────────────────────────────────────────────────────

function MovementModal({ standard, onClose }) {
  const cat = CATEGORY_COLORS[standard.category] || CATEGORY_COLORS.PULL

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-modal overflow-hidden max-h-[92vh] flex flex-col"
          initial={{ y: 40, scale: 0.97 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-border">
            <button onClick={onClose} className="text-text-faint hover:text-text-muted mr-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">{standard.name}</h2>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
            >
              {standard.category}
            </span>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {/* SVG + Criteria — stacked on mobile, side-by-side on desktop */}
            <div className="md:flex p-5 gap-6">
              {/* Illustration placeholder */}
              <div
                className="md:w-2/5 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 mb-4 md:mb-0"
                style={{ background: '#FAFAF8', border: '1px solid #E2E8F0', minHeight: 180 }}
              >
                <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#CBD5E1"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-text-faint">Illustration</div>
                  <div className="text-xs text-text-faint mt-0.5">Bientôt disponible</div>
                </div>
              </div>

              {/* Criteria */}
              <div className="md:w-3/5 space-y-3">
                <div className="label">Critères CBL officiels</div>
                <ul className="space-y-2.5">
                  {standard.criteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      <span className="text-text-muted leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>

                {/* No-rep list */}
                {standard.noRep && standard.noRep.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[11px] font-bold tracking-widest uppercase text-danger/70 mb-2">No-rep CBL officiel</div>
                    <ul className="space-y-1.5">
                      {standard.noRep.map((nr, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                          <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-danger/50" />
                          {nr}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {standard.coachTip && (
                  <div className="mt-3 p-3 rounded-xl bg-warn/5 border border-warn/20">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-warn mb-1">Coach tip</div>
                    <p className="text-xs text-text-muted leading-relaxed italic">{standard.coachTip}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coach audio */}
            <div className="px-5 pb-2 border-t border-border">
              <div className="pt-3">
                <div className="label mb-2">🎙️ Consigne audio du coach</div>
                <CoachAudioButton standardId={standard.id} coachMode={false} />
              </div>
            </div>

            {/* Technique validated toggle */}
            <TechniqueValidationToggle standardId={standard.id} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function TechniqueValidationToggle({ standardId }) {
  const key = `cbl_technique_validated_${standardId}`
  const [validated, setValidated] = useState(() => !!localStorage.getItem(key))

  const toggle = () => {
    if (validated) {
      localStorage.removeItem(key)
      setValidated(false)
    } else {
      localStorage.setItem(key, '1')
      setValidated(true)
    }
  }

  return (
    <div className="px-5 pb-5 pt-3 flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-text-primary">Technique validée</div>
        <div className="text-xs text-text-faint mt-0.5">Marque ce standard comme maîtrisé</div>
      </div>
      <button
        onClick={toggle}
        className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: validated ? '#10B981' : '#CBD5E1' }}
      >
        <div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: validated ? 'translateX(24px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}

// ─── Movement card ────────────────────────────────────────────────────────────

function MovementCard({ standard, onClick }) {
  const cat = CATEGORY_COLORS[standard.category] || CATEGORY_COLORS.PULL
  const validated = !!localStorage.getItem(`cbl_technique_validated_${standard.id}`)

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-2xl border border-border shadow-card p-4 text-left w-full space-y-3 relative overflow-hidden"
    >
      {validated && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
      <span
        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
        style={{ background: cat.bg, color: cat.text }}
      >
        {standard.category}
      </span>

      {/* Illustration placeholder */}
      <div
        className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl"
        style={{ height: 90, background: '#F8FAFC' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="#CBD5E1"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span className="text-[9px] text-text-faint font-medium">Bientôt</span>
      </div>

      <div>
        <div className="font-bold text-text-primary text-sm">{standard.name}</div>
        <div className="text-xs text-text-faint mt-0.5">{standard.criteria.length} critères</div>
      </div>

      <div className="flex items-center gap-1 text-xs text-brand font-medium">
        Voir le standard
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </motion.button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Standards() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [selectedStandard, setSelectedStandard] = useState(null)

  const filtered = MOVEMENT_STANDARDS.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCategory || m.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Standards CBL</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Critères officiels de réalisation — Appuie sur un mouvement pour voir la technique
        </p>
      </div>

      {/* Coach tips */}
      <CoachTips />

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un mouvement…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder-text-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
          style={{
            background: !activeCategory ? '#0EA5E9' : '#F8FAFC',
            color: !activeCategory ? 'white' : '#64748B',
            borderColor: !activeCategory ? '#0EA5E9' : '#E2E8F0',
          }}
        >
          Tous ({MOVEMENT_STANDARDS.length})
        </button>
        {CATEGORIES.map(cat => {
          const c = CATEGORY_COLORS[cat]
          const count = MOVEMENT_STANDARDS.filter(m => m.category === cat).length
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? null : cat)}
              className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all"
              style={{
                background: isActive ? c.text : c.bg,
                color: isActive ? 'white' : c.text,
                borderColor: isActive ? c.text : c.border,
              }}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-faint text-sm">
          Aucun mouvement trouvé pour "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(standard => (
            <MovementCard
              key={standard.id}
              standard={standard}
              onClick={() => setSelectedStandard(standard)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedStandard && (
          <MovementModal
            standard={selectedStandard}
            onClose={() => setSelectedStandard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
