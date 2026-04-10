import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFeedback, saveFeedback, uid, getCurrentAthleteId } from '../utils/coachStore'

const MAX_RECORDING_MS = 3 * 60 * 1000 // 3 min

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }) {
  return status === 'replied'
    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium">Retour reçu</span>
    : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-text-faint font-medium">En attente</span>
}

// ── Audio Recorder ────────────────────────────────────────────────────────────
function AudioRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const getMimeType = () => {
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg']
    return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
  }

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s >= MAX_RECORDING_MS / 1000 - 1) { stop(); return s }
          return s + 1
        })
      }, 1000)
    } catch {
      alert('Accès micro refusé. Autorise le microphone dans les réglages du navigateur.')
    }
  }

  const stop = () => {
    recorderRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const clear = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setSeconds(0)
    onRecorded(null)
  }

  const confirm = async () => {
    if (!audioBlob) return
    if (audioBlob.size > 8 * 1024 * 1024) {
      alert('Audio trop lourd (max 8 MB). Raccourcis l\'enregistrement.')
      return
    }
    const b64 = await blobToBase64(audioBlob)
    onRecorded(b64)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-2">
      {!audioUrl ? (
        <button
          onClick={recording ? stop : start}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            recording
              ? 'bg-danger/10 border-danger/30 text-danger'
              : 'bg-surface-2 border-border text-text-muted hover:border-brand/30 hover:text-brand'
          }`}
        >
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${recording ? 'bg-danger animate-pulse' : 'bg-text-faint'}`} />
          {recording ? `Arrêter · ${fmt(seconds)}` : 'Enregistrer un audio (max 3 min)'}
        </button>
      ) : (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="w-full h-10" />
          <div className="flex gap-2">
            <button onClick={clear} className="text-xs text-text-faint hover:text-danger transition-colors px-2 py-1">
              Recommencer
            </button>
            <button onClick={confirm} className="text-xs text-brand font-semibold hover:underline px-2 py-1">
              Utiliser cet audio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Submission Form ───────────────────────────────────────────────────────────
function SubmitForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [type, setType] = useState('video')
  const [url, setUrl] = useState('')
  const [videoFile, setVideoFile] = useState(null) // local file preview (not persisted)
  const [videoInputMode, setVideoInputMode] = useState('url') // 'url' | 'file'
  const [audioData, setAudioData] = useState(null)
  const [audioConfirmed, setAudioConfirmed] = useState(false)

  const handleRecorded = (b64) => {
    setAudioData(b64)
    setAudioConfirmed(!!b64)
  }

  const handleVideoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      alert('Fichier trop lourd (max 50 MB). Utilise un lien YouTube ou Drive à la place.')
      return
    }
    setVideoFile(file)
    setUrl(URL.createObjectURL(file))
  }

  const videoReady = videoInputMode === 'url' ? url.trim() : !!videoFile
  const canSubmit = title.trim() && (type === 'video' ? videoReady : audioConfirmed)

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      id: uid(),
      title: title.trim(),
      context: context.trim(),
      type,
      url: type === 'video' ? (videoInputMode === 'url' ? url.trim() : '') : '',
      videoLocalName: type === 'video' && videoFile ? videoFile.name : '',
      audioData: type === 'audio' ? audioData : null,
      status: 'pending',
      coachReply: '',
      coachAudioData: null,
      submittedAt: new Date().toISOString(),
      readByCoach: false,
      readByAthlete: false,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-border space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text-primary">Nouveau feedback</h3>
        <button onClick={onCancel} className="text-text-faint hover:text-text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div>
        <label className="label block mb-1">Titre <span className="text-danger">*</span></label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="ex: Muscle-up — problème à la transition"
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
        />
      </div>

      <div>
        <label className="label block mb-1">Contexte (optionnel)</label>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Décris la situation, à quel moment dans la séance, ce que tu ressens…"
          rows={3}
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-brand placeholder-text-faint"
        />
      </div>

      <div>
        <label className="label block mb-2">Type de média</label>
        <div className="flex gap-2">
          {[
            { id: 'video', label: 'Vidéo', icon: '🎬' },
            { id: 'audio', label: 'Audio', icon: '🎙' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                type === t.id ? 'bg-brand/10 border-brand/40 text-brand' : 'border-border text-text-muted hover:border-brand/20'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {type === 'video' && (
        <div className="space-y-2">
          <label className="label block">Vidéo <span className="text-danger">*</span></label>
          <div className="flex gap-1 p-1 bg-surface-3/60 rounded-xl border border-border">
            <button
              onClick={() => { setVideoInputMode('url'); setVideoFile(null); setUrl('') }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${videoInputMode === 'url' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted'}`}
            >Lien URL</button>
            <button
              onClick={() => { setVideoInputMode('file'); setUrl('') }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${videoInputMode === 'file' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted'}`}
            >Ma galerie</button>
          </div>
          {videoInputMode === 'url' ? (
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="YouTube, Drive, Instagram (lien non listé)…"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          ) : (
            <div>
              <label className="block w-full cursor-pointer">
                <div className={`w-full py-3 rounded-xl border-2 border-dashed text-center text-sm transition-all ${
                  videoFile ? 'border-success/40 bg-success/5' : 'border-border text-text-muted hover:border-brand/30 hover:text-brand'
                }`}>
                  {videoFile ? (
                    <span className="text-success font-medium">✓ {videoFile.name}</span>
                  ) : (
                    <span>Choisir une vidéo (max 50 MB)</span>
                  )}
                </div>
                <input type="file" accept="video/*" onChange={handleVideoFile} className="hidden" />
              </label>
              <p className="text-[10px] text-text-faint mt-1">Note : les vidéos locales ne persistent pas après rechargement. Pour partager définitivement, utilise un lien.</p>
            </div>
          )}
        </div>
      )}

      {type === 'audio' && (
        <div>
          <label className="label block mb-2">Enregistrement <span className="text-danger">*</span></label>
          {audioConfirmed ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Audio enregistré
              <button onClick={() => { setAudioData(null); setAudioConfirmed(false) }} className="text-xs text-text-faint hover:text-danger ml-2">Changer</button>
            </div>
          ) : (
            <AudioRecorder onRecorded={handleRecorded} />
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 btn-ghost text-sm">Annuler</button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 btn-primary text-sm disabled:opacity-40"
        >
          Envoyer au coach
        </button>
      </div>
    </motion.div>
  )
}

// ── Feedback Card ─────────────────────────────────────────────────────────────
function FeedbackCard({ item, onMarkRead }) {
  const [expanded, setExpanded] = useState(false)
  const hasNewReply = item.status === 'replied' && !item.readByAthlete

  useEffect(() => {
    if (hasNewReply && expanded) onMarkRead(item.id)
  }, [expanded, hasNewReply])

  return (
    <motion.div layout className="glass rounded-xl border border-border overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{item.title}</span>
            {hasNewReply && <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-text-faint capitalize">{item.type}</span>
            <span className="text-[10px] text-text-faint">{formatDate(item.submittedAt)}</span>
            <StatusBadge status={item.status} />
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`flex-shrink-0 mt-0.5 text-text-faint transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              {item.context && (
                <p className="text-sm text-text-muted leading-relaxed">{item.context}</p>
              )}

              {/* Contenu soumis */}
              {item.type === 'video' && item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand hover:underline"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                  Ouvrir la vidéo
                </a>
              )}
              {item.type === 'audio' && item.audioData && (
                <div>
                  <div className="text-xs text-text-faint mb-1">Ton enregistrement</div>
                  <audio controls src={item.audioData} className="w-full h-10" />
                </div>
              )}

              {/* Réponse du coach */}
              {item.status === 'replied' && (
                <div className="rounded-xl bg-success/5 border border-success/20 p-3 space-y-2">
                  <div className="text-xs font-semibold text-success uppercase tracking-wider">Retour coach</div>
                  {item.coachReply && <p className="text-sm text-text-primary leading-relaxed">{item.coachReply}</p>}
                  {item.timestamp && <p className="text-[11px] text-text-faint">Timestamp : {item.timestamp}</p>}
                  {item.coachAudioData && (
                    <div>
                      <div className="text-xs text-text-faint mb-1">Audio du coach</div>
                      <audio controls src={item.coachAudioData} className="w-full h-10" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const ATHLETE_ID = getCurrentAthleteId() || 'alexandre'
  const [feedbacks, setFeedbacks] = useState(() => getFeedback(ATHLETE_ID))
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const unreadReplies = feedbacks.filter(f => f.status === 'replied' && !f.readByAthlete).length

  const handleSubmit = (item) => {
    const next = [item, ...feedbacks]
    saveFeedback(ATHLETE_ID, next)
    setFeedbacks(next)
    setShowForm(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const handleMarkRead = (id) => {
    const next = feedbacks.map(f => f.id === id ? { ...f, readByAthlete: true } : f)
    saveFeedback(ATHLETE_ID, next)
    setFeedbacks(next)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Feedback vidéo / audio</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Envoie une vidéo ou un audio à Nicolas — il te répondra directement ici.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm flex items-center gap-2 flex-shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouveau
          </button>
        )}
      </div>

      {/* Badge nouveaux retours */}
      {unreadReplies > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-success/10 border border-success/20">
          <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
          <span className="text-sm text-success font-medium">
            {unreadReplies} nouveau{unreadReplies > 1 ? 'x' : ''} retour{unreadReplies > 1 ? 's' : ''} de ton coach
          </span>
        </div>
      )}

      {/* Confirmation */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brand/10 border border-brand/20 text-brand text-sm font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Feedback envoyé à Nicolas !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <SubmitForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {feedbacks.length === 0 ? (
        <div className="space-y-3">
          <div className="glass rounded-2xl p-5 border border-dashed border-border space-y-4">
            <div className="text-sm font-semibold text-text-primary">Qu'est-ce que tu peux envoyer ?</div>
            <div className="space-y-3">
              {[
                { icon: '🎥', title: 'Ta technique en vidéo', desc: 'Filme ton muscle-up, tes tractions, tes dips — Nicolas corrige les fautes techniques.' },
                { icon: '🎙', title: 'Un ressenti vocal', desc: 'Comment s\'est passée la séance ? Une zone de douleur ? Un exercice qui bloque ?' },
                { icon: '❓', title: 'Une question sur ton plan', desc: 'Tu ne comprends pas un exercice, une charge, un nombre de reps ? Demande.' },
              ].map((ex, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="text-xl flex-shrink-0">{ex.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{ex.title}</div>
                    <div className="text-xs text-text-muted mt-0.5">{ex.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-brand text-black hover:bg-brand/90 transition-all"
            >
              Envoyer mon premier feedback
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {feedbacks.map(item => (
              <FeedbackCard key={item.id} item={item} onMarkRead={handleMarkRead} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
