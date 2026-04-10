import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Speech synthesis ──────────────────────────────────────────────────────────
let _bestVoice = null

function getBestFrenchVoice() {
  if (_bestVoice) return _bestVoice
  const voices = window.speechSynthesis.getVoices()
  // Priority: Google French > Apple Amélie/Thomas > any fr-FR
  const priority = ['Google français', 'Amélie', 'Thomas', 'Marie', 'fr-FR', 'fr_FR']
  for (const name of priority) {
    const v = voices.find(v => v.name.includes(name) || v.lang === name)
    if (v) { _bestVoice = v; return v }
  }
  return voices.find(v => v.lang.startsWith('fr')) || null
}

function speak(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'fr-FR'
  utter.rate = 1.0
  utter.pitch = 0.95
  utter.volume = 1
  const voice = getBestFrenchVoice()
  if (voice) utter.voice = voice
  window.speechSynthesis.speak(utter)
}

// ── Workout parser ────────────────────────────────────────────────────────────
export function parseWorkout(text) {
  const t = text.toLowerCase()

  const amrap = t.match(/amrap\s+(\d+)\s*min/)
  if (amrap) return { type: 'amrap', totalDuration: parseInt(amrap[1]) * 60 }

  const emom = t.match(/emom\s+(\d+)\s*min/)
  if (emom) return { type: 'emom', totalDuration: parseInt(emom[1]) * 60, roundDuration: 60 }

  const tabataRounds = t.match(/x\s*(\d+)/)
  const workMatch = t.match(/(\d+)s\s*on/)
  const restMatch = t.match(/(\d+)s\s*off/)
  if (t.includes('tabata') || tabataRounds) {
    return {
      type: 'tabata',
      rounds: tabataRounds ? parseInt(tabataRounds[1]) : 8,
      workTime: workMatch ? parseInt(workMatch[1]) : 20,
      restTime: restMatch ? parseInt(restMatch[1]) : 10,
    }
  }

  return null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function RingTimer({ pct, label, sublabel, color = '#00D4FF', pulse = false }) {
  const r = 80
  const circ = 2 * Math.PI * r
  return (
    <div className="relative w-52 h-52 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#1A1A1A" strokeWidth="10" />
        <circle
          cx="90" cy="90" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(1, Math.max(0, pct)))}
          style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <div
          className="text-5xl font-bold font-mono tabular-nums"
          style={{ color, animation: pulse ? 'pulse 1s infinite' : 'none' }}
        >
          {label}
        </div>
        {sublabel && <div className="text-xs text-text-muted mt-1 tracking-widest uppercase">{sublabel}</div>}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WorkoutVoiceTimer({ exercise, onClose }) {
  const exerciseText = exercise?.exercise || exercise || ''
  const workout = parseWorkout(exerciseText)

  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const announcedRef = useRef(new Set())
  const intervalRef = useRef(null)

  // Stop timer when done
  useEffect(() => {
    if (done) {
      clearInterval(intervalRef.current)
      setRunning(false)
    }
  }, [done])

  // Main ticker
  useEffect(() => {
    if (running && !done) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, done])

  // Announcement engine
  const fire = useCallback((key, text) => {
    if (announcedRef.current.has(key)) return
    announcedRef.current.add(key)
    speak(text)
  }, [])

  useEffect(() => {
    if (!running || done || !workout) return
    const { type } = workout

    if (type === 'amrap') {
      const { totalDuration } = workout
      const remaining = totalDuration - elapsed
      const halfway = Math.floor(totalDuration / 2)

      if (elapsed === halfway) fire('half', 'Mi-temps!')
      if (remaining === 60 && totalDuration > 120) fire('1min', 'Une minute restante!')
      if (remaining === 30 && totalDuration > 60) fire('30s', 'Trente secondes!')
      if (remaining === 10) fire('10s', 'Dix secondes!')
      if (remaining === 5) fire('c5', 'Cinq')
      if (remaining === 4) fire('c4', 'Quatre')
      if (remaining === 3) fire('c3', 'Trois')
      if (remaining === 2) fire('c2', 'Deux')
      if (remaining === 1) fire('c1', 'Un')
      if (elapsed >= totalDuration) { fire('done', 'Temps! Stop! Beau travail!'); setDone(true) }
    }

    if (type === 'emom') {
      const { totalDuration, roundDuration } = workout
      const totalRounds = Math.floor(totalDuration / roundDuration)
      const roundIndex = Math.floor(elapsed / roundDuration)
      const roundElapsed = elapsed % roundDuration
      const FR_NUMS = ['un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix',
        'onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf','vingt']
      const roundLabel = FR_NUMS[roundIndex] || String(roundIndex + 1)

      if (roundElapsed === 0 && roundIndex < totalRounds) {
        fire(`r${roundIndex}`, `Round ${roundLabel}. Allez!`)
      }
      if (roundElapsed === Math.floor(roundDuration / 2)) {
        fire(`half${roundIndex}`, 'Mi-temps!')
      }
      if (roundElapsed === roundDuration - 10 && roundDuration > 15) {
        fire(`10s${roundIndex}`, 'Dix secondes!')
      }
      if (roundElapsed === roundDuration - 5) fire(`c5${roundIndex}`, 'Cinq')
      if (roundElapsed === roundDuration - 4) fire(`c4${roundIndex}`, 'Quatre')
      if (roundElapsed === roundDuration - 3) fire(`c3${roundIndex}`, 'Trois')
      if (roundElapsed === roundDuration - 2) fire(`c2${roundIndex}`, 'Deux')
      if (roundElapsed === roundDuration - 1) fire(`c1${roundIndex}`, 'Un')
      if (elapsed >= totalDuration) { fire('done', 'EMOM terminé! Excellent!'); setDone(true) }
    }

    if (type === 'tabata') {
      const { rounds, workTime, restTime } = workout
      const intervalDuration = workTime + restTime
      const total = rounds * intervalDuration
      const roundIndex = Math.floor(elapsed / intervalDuration)
      const intervalElapsed = elapsed % intervalDuration
      const isRest = intervalElapsed >= workTime

      if (intervalElapsed === 0 && roundIndex < rounds) {
        fire(`work${roundIndex}`, `Round ${roundIndex + 1}. Allez!`)
      }
      if (intervalElapsed === workTime && roundIndex < rounds) {
        fire(`rest${roundIndex}`, 'Repos!')
      }
      // Countdown before next work interval
      if (isRest && restTime >= 4) {
        const restElapsed = intervalElapsed - workTime
        const restRemaining = restTime - restElapsed
        if (restRemaining === 3 && roundIndex < rounds - 1) fire(`pre3${roundIndex}`, 'Trois')
        if (restRemaining === 2 && roundIndex < rounds - 1) fire(`pre2${roundIndex}`, 'Deux')
        if (restRemaining === 1 && roundIndex < rounds - 1) fire(`pre1${roundIndex}`, 'Un')
      }
      if (elapsed >= total) { fire('done', 'Tabata terminé! Super boulot!'); setDone(true) }
    }
  }, [elapsed, running, done, workout, fire])

  const toggle = useCallback(() => {
    if (!running && elapsed === 0 && workout) {
      // First start — announce immediately
      const { type, totalDuration, rounds } = workout
      if (type === 'emom') {
        const mins = totalDuration ? totalDuration / 60 : '?'
        speak(`EMOM, ${mins} minutes. Round un. Allez!`)
        announcedRef.current.add('r0')
      } else if (type === 'tabata') {
        speak(`Tabata, ${rounds || 8} rounds. Round un. Allez!`)
        announcedRef.current.add('work0')
      } else if (type === 'amrap') {
        const mins = totalDuration ? totalDuration / 60 : '?'
        speak(`AMRAP, ${mins} minutes. C'est parti!`)
      } else {
        speak("Allez, c'est parti!")
      }
    }
    setRunning(r => !r)
  }, [running, elapsed, workout])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    setElapsed(0)
    setRunning(false)
    setDone(false)
    announcedRef.current = new Set()
    window.speechSynthesis.cancel()
  }, [])

  if (!workout) return null

  // ── Display state ──
  const { type } = workout
  let displayTime = ''
  let statusText = ''
  let roundInfo = ''
  let pct = 0
  let ringColor = '#00D4FF'
  let pulse = false

  if (type === 'amrap') {
    const { totalDuration } = workout
    const remaining = totalDuration - elapsed
    displayTime = formatTime(remaining)
    pct = 1 - elapsed / totalDuration
    statusText = done ? 'TERMINÉ' : 'AMRAP'
    ringColor = remaining < 30 ? '#FF3D3D' : remaining < 60 ? '#FF9500' : '#00D4FF'
    pulse = remaining <= 5 && remaining > 0
  }

  if (type === 'emom') {
    const { totalDuration, roundDuration } = workout
    const totalRounds = totalDuration / roundDuration
    const roundIndex = Math.min(Math.floor(elapsed / roundDuration), totalRounds - 1)
    const roundElapsed = elapsed % roundDuration
    const roundRemaining = roundDuration - roundElapsed
    displayTime = formatTime(roundRemaining)
    pct = 1 - roundElapsed / roundDuration
    statusText = done ? 'TERMINÉ' : `EMOM — Round ${roundIndex + 1}/${totalRounds}`
    roundInfo = `${totalDuration / 60} min total`
    ringColor = roundRemaining < 10 ? '#FF3D3D' : roundRemaining < 20 ? '#FF9500' : '#00D4FF'
    pulse = roundRemaining <= 5 && roundRemaining > 0
  }

  if (type === 'tabata') {
    const { rounds, workTime, restTime } = workout
    const intervalDuration = workTime + restTime
    const total = rounds * intervalDuration
    const roundIndex = Math.min(Math.floor(elapsed / intervalDuration), rounds - 1)
    const intervalElapsed = elapsed % intervalDuration
    const isWork = intervalElapsed < workTime
    const phaseElapsed = isWork ? intervalElapsed : intervalElapsed - workTime
    const phaseTotal = isWork ? workTime : restTime
    const phaseRemaining = phaseTotal - phaseElapsed
    displayTime = formatTime(phaseRemaining)
    pct = 1 - phaseElapsed / phaseTotal
    statusText = done ? 'TERMINÉ' : (isWork ? '🔥 WORK' : '💤 REPOS')
    roundInfo = `Round ${roundIndex + 1}/${rounds}`
    ringColor = done ? '#00D47A' : isWork ? '#FF3D3D' : '#00D47A'
    pulse = !isWork && phaseRemaining <= 3 && phaseRemaining > 0
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.25 }}
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-5 pt-safe pt-6">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="text-center">
            <div className="text-xs text-white/50 uppercase tracking-widest font-medium">Minuteur vocal</div>
          </div>
          <div className="w-9" />
        </div>

        {/* Exercise name */}
        <div className="px-6 text-center">
          <div className="text-white/60 text-sm leading-relaxed line-clamp-2">{exerciseText}</div>
        </div>

        {/* Ring timer */}
        <div className="flex flex-col items-center gap-4">
          <RingTimer pct={pct} label={displayTime} sublabel={undefined} color={ringColor} pulse={pulse} />
          <div className="text-center space-y-1">
            <div
              className="text-xl font-bold tracking-wide"
              style={{ color: ringColor }}
            >
              {statusText}
            </div>
            {roundInfo && <div className="text-sm text-white/50">{roundInfo}</div>}
          </div>
        </div>

        {/* Tip */}
        {!running && !done && elapsed === 0 && (
          <div className="px-8 text-center">
            <div className="text-xs text-white/30 leading-relaxed">
              Le chrono va annoncer vocalement la mi-temps,<br />
              les alertes et le décompte 5-4-3-2-1
            </div>
          </div>
        )}

        {done && (
          <div className="px-8 text-center">
            <div className="text-2xl font-bold text-green-400">GG! 💪</div>
            <div className="text-sm text-white/50 mt-1">Exercice terminé</div>
          </div>
        )}

        {!done && running && <div className="h-12" />}

        {/* Controls */}
        <div className="w-full px-8 pb-safe pb-10 space-y-3">
          <button
            onClick={toggle}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
            style={{
              background: running ? '#1A1A1A' : ringColor,
              color: running ? 'white' : 'black',
              border: running ? '1px solid #333' : 'none',
            }}
          >
            {running ? '⏸ Pause' : done ? '✓ Terminé' : elapsed > 0 ? '▶ Reprendre' : '▶ Go!'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              ↺ Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
