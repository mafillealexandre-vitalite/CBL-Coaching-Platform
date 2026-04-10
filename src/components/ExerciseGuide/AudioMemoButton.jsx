/**
 * Feature 2a — Floating audio memo button
 * States: idle → recording → saved → playing
 * Stores base64 audio in localStorage: cbl_audio_[exerciseId]
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )
}
function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  )
}

// Permission modal shown before requesting mic
function MicPermissionModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0"
      style={{ background: 'rgba(15,25,35,0.5)' }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal"
      >
        <div className="text-4xl mb-3 text-center">🎙️</div>
        <h3 className="text-base font-bold text-text-primary text-center mb-2">
          Accès au micro
        </h3>
        <p className="text-sm text-text-muted text-center mb-5">
          Pour enregistrer une note vocale sur cet exercice, CBL Coach Pro a besoin d'accéder à ton microphone. L'audio reste stocké uniquement sur ton appareil.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted bg-white">
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: '#0F1923' }}>
            Autoriser
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AudioMemoButton({ exerciseId }) {
  const storageKey = `cbl_audio_${exerciseId}`
  const [state, setState] = useState(() =>
    localStorage.getItem(storageKey) ? 'saved' : 'idle'
  )
  const [showPermModal, setShowPermModal] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          localStorage.setItem(storageKey, reader.result)
          setState('saved')
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setState('recording')
    } catch {
      setState('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const playAudio = () => {
    const data = localStorage.getItem(storageKey)
    if (!data) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setState('saved')
      return
    }
    const audio = new Audio(data)
    audioRef.current = audio
    setState('playing')
    audio.onended = () => { audioRef.current = null; setState('saved') }
    audio.play()
  }

  const handleClick = () => {
    if (state === 'idle') {
      setShowPermModal(true)
    } else if (state === 'recording') {
      stopRecording()
    } else if (state === 'saved') {
      playAudio()
    } else if (state === 'playing') {
      playAudio() // toggles off
    }
  }

  const buttonStyle = {
    idle:      { bg: '#FFFFFF', border: '#CBD5E1', color: '#94A3B8' },
    recording: { bg: '#EF4444', border: '#EF4444', color: '#FFFFFF' },
    saved:     { bg: '#10B981', border: '#10B981', color: '#FFFFFF' },
    playing:   { bg: '#0EA5E9', border: '#0EA5E9', color: '#FFFFFF' },
  }[state]

  return (
    <>
      <AnimatePresence>
        {showPermModal && (
          <MicPermissionModal
            onConfirm={() => { setShowPermModal(false); startRecording() }}
            onCancel={() => setShowPermModal(false)}
          />
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        title={
          state === 'idle' ? 'Enregistrer une note vocale'
          : state === 'recording' ? 'Arrêter l\'enregistrement'
          : state === 'saved' ? 'Écouter la note'
          : 'Arrêter la lecture'
        }
        className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: buttonStyle.bg,
          border: `1.5px solid ${buttonStyle.border}`,
          color: buttonStyle.color,
          boxShadow: state !== 'idle' ? '0 2px 8px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {state === 'recording' && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(239,68,68,0.35)',
              animation: 'pulseRing 1.5s ease-out infinite',
            }}
          />
        )}
        {state === 'idle' && <MicIcon />}
        {state === 'recording' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1"/>
          </svg>
        )}
        {state === 'saved' && <PlayIcon />}
        {state === 'playing' && <StopIcon />}
      </motion.button>
    </>
  )
}
