import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getAthletes, setCurrentAthleteId, setRole, getRole } from '../utils/coachStore'

// ── Step 1 : saisie du code athlète ──────────────────────────────────────────
function IdStep({ onFound }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const athletes = getAthletes()

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = code.trim().toLowerCase()
    const found = athletes.find(a =>
      a.id.toLowerCase() === q ||
      a.name.toLowerCase().split(' ')[0] === q ||
      (a.nickname || '').toLowerCase() === q
    )
    if (found) {
      onFound(found)
    } else {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <motion.form
      key="id-step"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <p className="text-center text-text-muted text-sm leading-relaxed">
        Ton coach t'a envoyé un lien d'accès.<br />Entre ton prénom ci-dessous.
      </p>

      <div>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false) }}
          placeholder="Ton prénom (ex : Lucas, Marie…)"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none transition-colors placeholder:text-text-faint ${
            error ? 'border-danger' : 'border-border focus:border-brand'
          }`}
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-danger mt-1.5 text-center"
            >
              Code non reconnu — demande-le à ton coach
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={!code.trim()}
        className="w-full btn-primary disabled:opacity-40"
      >
        Continuer
      </button>
    </motion.form>
  )
}

// ── Step 2 : saisie du PIN ────────────────────────────────────────────────────
function PinStep({ athlete, onBack }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()
  const hiddenRef = useRef(null)

  useEffect(() => { hiddenRef.current?.focus() }, [])

  const submit = (code) => {
    if (code === athlete.pin) {
      setRole('athlete')
      setCurrentAthleteId(athlete.id)
      navigate('/dashboard')
    } else {
      setError(true)
      setTimeout(() => { setPin(''); setError(false) }, 600)
    }
  }

  const handleDigit = (d) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) submit(next)
  }

  const handleDelete = () => setPin(p => p.slice(0, -1))

  const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <motion.div
      key="pin-step"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Hidden input for keyboard / mobile — onChange only to avoid double-submit */}
      <input
        ref={hiddenRef}
        type="tel"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={e => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 4)
          setPin(val)
          setError(false)
          if (val.length === 4) submit(val)
        }}
        className="absolute opacity-0 w-0 h-0"
        aria-hidden
      />

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-muted text-sm hover:text-text-primary transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour
      </button>

      <div className="text-center space-y-1">
        <div className="text-text-primary font-semibold">{athlete.name}</div>
        <div className="text-text-muted text-sm">Entre ton code PIN à 4 chiffres</div>
        <div className="text-[10px] text-text-faint">(clavier ou pavé ci-dessous)</div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-4">
        {[0,1,2,3].map(i => (
          <motion.div
            key={i}
            animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length
                ? (error ? 'border-red-500 bg-red-500' : 'border-brand bg-brand')
                : 'border-border bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
        {DIGITS.map((d, i) =>
          d === '' ? (
            <div key={i} />
          ) : d === '⌫' ? (
            <button
              key={i}
              onClick={handleDelete}
              className="h-14 rounded-xl border border-border bg-surface-1 text-text-muted text-xl font-medium hover:bg-surface-2 hover:border-brand/30 transition-all active:scale-95"
            >
              {d}
            </button>
          ) : (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-xl border border-border bg-surface-1 text-text-primary text-xl font-semibold hover:bg-brand/10 hover:border-brand/30 transition-all active:scale-95"
            >
              {d}
            </button>
          )
        )}
      </div>

      {error && (
        <p className="text-center text-red-400 text-sm font-medium">Code incorrect</p>
      )}
    </motion.div>
  )
}

// ── Accès coach ───────────────────────────────────────────────────────────────
function CoachSection() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const tryCoach = () => {
    if (code === 'CBL2026') {
      setRole('coach')
      navigate('/coach-panel')
    } else {
      setError(true)
      setCode('')
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className="pt-4 border-t border-border">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="coach-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-text-faint text-sm hover:border-purple-500/30 hover:text-purple-400 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Accès Coach
          </motion.button>
        ) : (
          <motion.div
            key="coach-form"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <input
              type="password"
              value={code}
              onChange={e => { setCode(e.target.value); setError(false) }}
              onKeyDown={e => e.key === 'Enter' && tryCoach()}
              placeholder="Code coach"
              autoFocus
              className={`w-full bg-surface-2 border rounded-xl px-4 py-3 text-sm text-text-primary text-center tracking-widest focus:outline-none transition-colors ${
                error ? 'border-danger' : 'border-border focus:border-brand'
              }`}
            />
            {error && <p className="text-xs text-danger text-center">Code incorrect</p>}
            <div className="flex gap-2">
              <button onClick={() => { setOpen(false); setCode('') }} className="flex-1 btn-ghost text-sm">
                Annuler
              </button>
              <button
                onClick={tryCoach}
                disabled={!code}
                className="flex-1 btn-primary text-sm disabled:opacity-40"
              >
                Accéder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AthleteLogin() {
  const [selected, setSelected] = useState(null)
  const [searchParams] = useSearchParams()
  const athletes = getAthletes()

  // Support lien d'invitation : /login?id=alexandre
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const found = athletes.find(a => a.id === id)
      if (found) setSelected(found)
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-text-primary">
            CBL <span style={{ color: '#0EA5E9' }}>COACH</span> PRO
          </h1>
          <p className="text-text-muted text-sm">
            {selected
              ? `Bonjour ${selected.name.split(' ')[0]} 👋`
              : 'Identifie-toi pour accéder à ton espace'
            }
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!selected
            ? <IdStep key="id" onFound={setSelected} />
            : <PinStep key={`pin-${selected.id}`} athlete={selected} onBack={() => setSelected(null)} />
          }
        </AnimatePresence>

        {!selected && <CoachSection />}
      </div>
    </div>
  )
}
