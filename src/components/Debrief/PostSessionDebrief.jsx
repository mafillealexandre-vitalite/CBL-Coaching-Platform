/**
 * Feature 2 — Post-session debrief panel
 * RPE slider + vocal feedback + written note
 * Stored in localStorage: cbl_debrief_[sessionId]
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Ressenti scale: 1–10, with emoji anchors at key intensities
const RESSENTI_EMOJI = [
  { max: 2, emoji: '😌', label: 'Très facile' },
  { max: 4, emoji: '🙂', label: 'Facile' },
  { max: 6, emoji: '😐', label: 'Modéré' },
  { max: 8, emoji: '😤', label: 'Difficile' },
  { max: 9, emoji: '🥵', label: 'Très difficile' },
  { max: 10, emoji: '💀', label: 'Maximum' },
]

function getRessenti(v) {
  return RESSENTI_EMOJI.find(r => v <= r.max) || RESSENTI_EMOJI[RESSENTI_EMOJI.length - 1]
}

function getRessentiValue(label) {
  // Convert old string label → numeric default
  if (label === 'facile') return 3
  if (label === 'correct') return 6
  if (label === 'dur') return 9
  return null
}

function WaveformVisualizer({ analyser }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!analyser || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#EF4444'
      ctx.beginPath()
      const sliceWidth = canvas.width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      className="w-full rounded-lg bg-red-50"
    />
  )
}

function RessentiScale({ value, onChange }) {
  const current = getRessenti(value)
  // Color transitions: green → amber → red
  const trackColor = value <= 4 ? '#10B981' : value <= 7 ? '#F59E0B' : '#EF4444'
  const pct = ((value - 1) / 9) * 100

  return (
    <div className="space-y-2">
      {/* Scale row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          {/* Track background */}
          <div className="h-2 rounded-full bg-surface-3 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${pct}%`, background: trackColor }}
            />
          </div>

          {/* Tick marks */}
          <div className="absolute top-0 left-0 right-0 flex justify-between px-0 pointer-events-none" style={{ top: -1 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <div
                key={n}
                className="w-px h-4 rounded-full"
                style={{ background: n <= value ? 'transparent' : '#E2E8F0' }}
              />
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            style={{ margin: 0 }}
          />
        </div>

        {/* Emoji at far right */}
        <motion.div
          key={current.emoji}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 300 }}
          className="text-2xl flex-shrink-0 w-9 text-center"
        >
          {current.emoji}
        </motion.div>
      </div>

      {/* Labels row */}
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] text-text-faint">1 — Très facile</span>
        <span
          className="text-[11px] font-semibold tabular-nums transition-colors duration-200"
          style={{ color: trackColor }}
        >
          {value}/10 · {current.label}
        </span>
        <span className="text-[10px] text-text-faint">10 — Maximum</span>
      </div>
    </div>
  )
}

export function getDebrief(sessionId) {
  try { return JSON.parse(localStorage.getItem(`cbl_debrief_${sessionId}`) || 'null') }
  catch { return null }
}

export function saveDebrief(sessionId, data) {
  const existing = getDebrief(sessionId) || {}
  localStorage.setItem(`cbl_debrief_${sessionId}`, JSON.stringify({ ...existing, ...data, timestamp: new Date().toISOString() }))
}

export function getAllDebriefs() {
  const debriefs = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('cbl_debrief_')) {
      try {
        const d = JSON.parse(localStorage.getItem(key))
        if (d) debriefs.push({ sessionId: key.replace('cbl_debrief_', ''), ...d })
      } catch {}
    }
  }
  return debriefs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export default function PostSessionDebrief({ session, onClose, onSaved }) {
  const [rpe, setRpe] = useState(7)
  const [ressenti, setRessenti] = useState(5)
  const [note, setNote] = useState('')
  const [audioState, setAudioState] = useState('idle') // idle | recording | saved | playing
  const [audioBase64, setAudioBase64] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [showMicModal, setShowMicModal] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [saved, setSaved] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  // Load existing debrief if any
  useEffect(() => {
    if (!session?.id) return
    const existing = getDebrief(session.id)
    if (existing) {
      if (existing.rpe) setRpe(existing.rpe)
      if (existing.ressenti) {
        const num = typeof existing.ressenti === 'number' ? existing.ressenti : getRessentiValue(existing.ressenti)
        if (num) setRessenti(num)
      }
      if (existing.note) setNote(existing.note)
      if (existing.audioBase64) { setAudioBase64(existing.audioBase64); setAudioState('saved') }
    }
  }, [session?.id])

  // Elapsed timer during recording
  useEffect(() => {
    if (audioState === 'recording') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [audioState])

  // Stop recording after 2 min
  useEffect(() => {
    if (elapsed >= 120 && audioState === 'recording') stopRecording()
  }, [elapsed, audioState])

  const startRecording = async () => {
    setShowMicModal(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Waveform analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyserNode = audioCtx.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      setAnalyser(analyserNode)

      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          setAudioBase64(reader.result)
          setAudioState('saved')
          setAnalyser(null)
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setAudioState('recording')
    } catch {
      alert("Accès micro refusé. Vérifie les autorisations du navigateur.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const playAudio = () => {
    if (!audioBase64) return
    audioRef.current = new Audio(audioBase64)
    audioRef.current.onended = () => setAudioState('saved')
    audioRef.current.play()
    setAudioState('playing')
  }

  const stopAudio = () => {
    audioRef.current?.pause()
    setAudioState('saved')
  }

  const deleteAudio = () => {
    audioRef.current?.pause()
    setAudioBase64(null)
    setAudioState('idle')
  }

  const handleSave = () => {
    if (!session?.id) return
    saveDebrief(session.id, {
      rpe,
      ressenti,
      note,
      audioBase64,
      sessionLabel: session.label,
      sessionDate: session.date,
      coachConfirmed: false,
    })
    setSaved(true)
    setTimeout(() => { onSaved?.(); onClose?.() }, 900)
  }

  const fmtElapsed = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-modal overflow-hidden"
          initial={{ y: 60, scale: 0.97 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-text-faint">Débrief séance</div>
                <div className="font-bold text-text-primary mt-0.5">{session?.label || 'Séance'}</div>
                {session?.date && (
                  <div className="text-xs text-text-faint mt-0.5">
                    {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                )}
              </div>
              <button onClick={onClose} className="text-text-faint hover:text-text-muted p-1">✕</button>
            </div>
          </div>

          <div className="px-5 py-4 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* RPE Slider */}
            <div>
              <div className="label mb-3">Effort perçu (RPE)</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-faint w-4">1</span>
                <input
                  type="range" min={1} max={10} value={rpe}
                  onChange={e => setRpe(Number(e.target.value))}
                  className="flex-1 accent-brand"
                />
                <span className="text-xs text-text-faint w-4">10</span>
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{
                    background: rpe >= 9 ? '#FEE2E2' : rpe >= 7 ? '#FEF3C7' : '#D1FAE5',
                    color: rpe >= 9 ? '#EF4444' : rpe >= 7 ? '#F59E0B' : '#10B981',
                  }}
                >
                  {rpe}
                </span>
              </div>
            </div>

            {/* Ressenti */}
            <div>
              <div className="label mb-3">Ressenti global</div>
              <RessentiScale value={ressenti} onChange={setRessenti} />
            </div>

            {/* Vocal feedback */}
            <div>
              <div className="label mb-3">Feedback vocal</div>
              <div className="bg-surface-2 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-text-muted">Laisse un message vocal à ton coach (max 2 min)</p>

                {audioState === 'recording' && <WaveformVisualizer analyser={analyser} />}

                <div className="flex items-center gap-3">
                  {/* Mic button */}
                  {audioState === 'idle' && (
                    <button
                      onClick={() => setShowMicModal(true)}
                      className="relative w-14 h-14 rounded-full bg-white border-2 border-border flex items-center justify-center shadow-card hover:border-brand transition-all"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    </button>
                  )}

                  {audioState === 'recording' && (
                    <button
                      onClick={stopRecording}
                      className="relative w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                    >
                      <div className="absolute inset-0 rounded-full bg-red-400 pulse-ring-anim" />
                      <div className="w-4 h-4 bg-white rounded-sm" />
                    </button>
                  )}

                  {audioState === 'saved' && (
                    <button
                      onClick={playAudio}
                      className="w-14 h-14 rounded-full bg-success/10 border-2 border-success flex items-center justify-center"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#10B981">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </button>
                  )}

                  {audioState === 'playing' && (
                    <button
                      onClick={stopAudio}
                      className="w-14 h-14 rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center"
                    >
                      <div className="w-3 h-3 bg-brand rounded-sm" />
                    </button>
                  )}

                  <div className="flex-1">
                    {audioState === 'idle' && <span className="text-xs text-text-faint">Appuie pour enregistrer</span>}
                    {audioState === 'recording' && (
                      <div>
                        <div className="text-sm font-bold text-red-500 tabular-nums">{fmtElapsed(elapsed)} / 2:00</div>
                        <div className="text-xs text-text-faint">Appuie sur ⏹ pour arrêter</div>
                      </div>
                    )}
                    {(audioState === 'saved' || audioState === 'playing') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-success font-semibold">✓ Vocal enregistré</span>
                        <button onClick={deleteAudio} className="text-[10px] text-text-faint hover:text-danger">suppr.</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Written note */}
            <div>
              <div className="label mb-2">Note écrite (optionnelle)</div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Comment tu t'es senti ?"
                rows={3}
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder-text-faint resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSave}
              disabled={saved}
              className="w-full btn-primary py-3 text-base rounded-xl"
            >
              {saved ? '✓ Envoyé au coach' : 'Envoyer au coach'}
            </button>
          </div>
        </motion.div>

        {/* Mic permission modal */}
        <AnimatePresence>
          {showMicModal && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white rounded-2xl shadow-modal p-6 mx-4 max-w-sm text-center space-y-4">
                <div className="text-4xl">🎙️</div>
                <div className="font-bold text-text-primary">Accès au microphone</div>
                <p className="text-sm text-text-muted">
                  Pour laisser un feedback vocal, l'app a besoin d'accéder à ton microphone. Ton audio est stocké localement.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setShowMicModal(false)} className="flex-1 btn-ghost">Annuler</button>
                  <button onClick={startRecording} className="flex-1 btn-primary">Autoriser</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
