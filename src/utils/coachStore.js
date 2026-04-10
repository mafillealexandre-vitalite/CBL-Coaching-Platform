// ── Coach data store — localStorage only ─────────────────────────────────────

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Role ──────────────────────────────────────────────────────────────────────
export function getRole() {
  return localStorage.getItem('cbl_role') || 'athlete'
}
export function setRole(role) {
  localStorage.setItem('cbl_role', role)
}

// ── Current athlete session ────────────────────────────────────────────────────
export function getCurrentAthleteId() {
  return localStorage.getItem('cbl_current_athlete_id') || null
}
export function setCurrentAthleteId(id) {
  localStorage.setItem('cbl_current_athlete_id', id)
}
export function logoutAthlete() {
  localStorage.removeItem('cbl_current_athlete_id')
}

// ── Athletes ──────────────────────────────────────────────────────────────────
const ATHLETES_KEY = 'cbl_coach_athletes'

function seedAthletes() {
  const athletes = [
    {
      id: 'alexandre',
      name: 'Alexandre Mafille',
      nickname: 'Alex',
      pin: '1234',
      status: 'active',
      age: 32,
      level: 'Espoir',
      goal: 'Niveau Espoir (Div 3) CBL',
      goalShort: 'Top 3 en pool',
      goalMedium: 'Passer les quarts de finale',
      goalLong: 'Atteindre le niveau Elite',
      compDate: '2026-09-01',
      startDate: '2026-04-07',
      note: "Enseignant EPS. Première CBL perdue en pool: Set1 en 5'24 sur 6', Set2 non terminé. Point faible: accumulation lactique en circuit.",
      prs: {
        pullUp:      { value: '23 reps', label: 'Tractions',    target: '30 reps' },
        muscleUp:    { value: '7 reps',  label: 'Muscle-up',    target: '12 reps' },
        dips:        { value: '30 reps', label: 'Dips',         target: '40 reps' },
        pushUp:      { value: '52 reps', label: 'Pompes',       target: '65 reps' },
        gobletSquat: { value: '30 @16kg',label: 'Goblet Squat', target: '40 @16kg' },
      },
    },
    {
      id: 'lucas',
      name: 'Lucas Fontaine',
      nickname: 'Luke',
      pin: '5678',
      status: 'active',
      age: 26,
      level: 'Confirmé',
      goal: 'Podium Division 1 CBL',
      goalShort: 'Qualification Top 8',
      goalMedium: 'Passer les demi-finales',
      goalLong: 'Atteindre le niveau Elite national',
      compDate: '2026-09-01',
      startDate: '2026-03-01',
      note: "Athlète confirmé, 3 saisons CBL. Point fort: endurance musculaire. Point faible: muscle-up strict sous fatigue.",
      prs: {
        pullUp:      { value: '30 reps', label: 'Tractions',    target: '38 reps' },
        muscleUp:    { value: '11 reps', label: 'Muscle-up',    target: '16 reps' },
        dips:        { value: '42 reps', label: 'Dips',         target: '55 reps' },
        pushUp:      { value: '68 reps', label: 'Pompes',       target: '80 reps' },
        gobletSquat: { value: '40 @20kg',label: 'Goblet Squat', target: '50 @20kg' },
      },
    },
    {
      id: 'jade',
      name: 'Jade Moreau',
      nickname: 'Jade',
      pin: '9012',
      status: 'active',
      age: 22,
      level: 'Débutante',
      goal: 'Terminer son premier circuit CBL',
      goalShort: 'Compléter le Set 1 en temps',
      goalMedium: 'Enchaîner Set 1 + Set 2',
      goalLong: 'Atteindre le niveau Espoir en 2 saisons',
      compDate: '2026-09-01',
      startDate: '2026-04-07',
      note: "Première saison CBL. Bonne base cardio (crossfit 2 ans). Doit progresser sur tractions et muscle-up. Très motivée.",
      prs: {
        pullUp:      { value: '8 reps',  label: 'Tractions',    target: '15 reps' },
        muscleUp:    { value: '1 rep',   label: 'Muscle-up',    target: '5 reps' },
        dips:        { value: '18 reps', label: 'Dips',         target: '28 reps' },
        pushUp:      { value: '35 reps', label: 'Pompes',       target: '50 reps' },
        gobletSquat: { value: '25 @12kg',label: 'Goblet Squat', target: '35 @16kg' },
      },
    },
  ]
  localStorage.setItem(ATHLETES_KEY, JSON.stringify(athletes))
  return athletes
}

export function getAthletes() {
  try {
    const data = JSON.parse(localStorage.getItem(ATHLETES_KEY))
    return data?.length ? data : seedAthletes()
  } catch {
    return seedAthletes()
  }
}

export function saveAthletes(athletes) {
  localStorage.setItem(ATHLETES_KEY, JSON.stringify(athletes))
}

// ── Programs ──────────────────────────────────────────────────────────────────
export function getProgram(athleteId) {
  try {
    return JSON.parse(localStorage.getItem(`cbl_coach_program_${athleteId}`)) || { cycles: [] }
  } catch {
    return { cycles: [] }
  }
}

export function saveProgram(athleteId, program) {
  localStorage.setItem(`cbl_coach_program_${athleteId}`, JSON.stringify(program))
}

// ── Standards (coach tips) ────────────────────────────────────────────────────
export function getStandards() {
  try {
    return JSON.parse(localStorage.getItem('cbl_coach_standards')) || []
  } catch {
    return []
  }
}

export function saveStandards(standards) {
  localStorage.setItem('cbl_coach_standards', JSON.stringify(standards))
}

// ── Circuit times ─────────────────────────────────────────────────────────────
// Structure: { [athleteId]: { [circuitId]: [{ time, date, note }] } }
export function getCircuitTimes() {
  try {
    return JSON.parse(localStorage.getItem('cbl_coach_circuit_times')) || {}
  } catch {
    return {}
  }
}

export function saveCircuitTimes(times) {
  localStorage.setItem('cbl_coach_circuit_times', JSON.stringify(times))
}

// ── Feedback (athlete submissions + coach replies) ─────────────────────────────
// [{id, title, context, type:'video'|'audio', url, audioData, status:'pending'|'replied',
//   coachReply, coachAudioData, submittedAt, readByCoach, readByAthlete}]
export function getFeedback(athleteId = 'alexandre') {
  try { return JSON.parse(localStorage.getItem(`cbl_feedback_${athleteId}`)) || [] }
  catch { return [] }
}
export function saveFeedback(athleteId = 'alexandre', list) {
  localStorage.setItem(`cbl_feedback_${athleteId}`, JSON.stringify(list))
}

// ── Availability notifications ─────────────────────────────────────────────────
// [{id, athleteId, athleteName, days:[1,2,4], weekLabel, constraint, submittedAt, seen}]
export function getAvailabilityNotifs() {
  try { return JSON.parse(localStorage.getItem('cbl_availability_notifs')) || [] }
  catch { return [] }
}
export function saveAvailabilityNotifs(notifs) {
  localStorage.setItem('cbl_availability_notifs', JSON.stringify(notifs))
}

// ── RPE per exercise (per athlete) ────────────────────────────────────────────
// [{sessionName, date, exercises:[{name, rpe}]}]
export function getRpeExercises(athleteId) {
  const id = athleteId || getCurrentAthleteId() || 'alexandre'
  try { return JSON.parse(localStorage.getItem(`cbl_rpe_exercises_${id}`)) || [] }
  catch { return [] }
}
export function saveRpeExercises(list, athleteId) {
  const id = athleteId || getCurrentAthleteId() || 'alexandre'
  localStorage.setItem(`cbl_rpe_exercises_${id}`, JSON.stringify(list))
}

// ── Session templates (coach reuse library) ───────────────────────────────────
// [{id, name, type, exercises:[{name,sets,reps,weight,note,format?}], savedAt}]
export function getSessionTemplates() {
  try { return JSON.parse(localStorage.getItem('cbl_session_templates')) || [] }
  catch { return [] }
}
export function saveSessionTemplates(list) {
  localStorage.setItem('cbl_session_templates', JSON.stringify(list))
}

// ── Coach sessions for today (athlete-side) ───────────────────────────────────
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

// Build exercise label that embeds format info so WorkoutVoiceTimer.parseWorkout() can detect it
function coachExToAthleteLabel(ex) {
  const f = ex.format || 'classic'
  const dur = ex.duration || '?'
  const reps = ex.reps || '?'
  const name = ex.name || ''
  if (f === 'emom')    return `EMOM ${dur}min — ${reps} reps ${name}`
  if (f === 'amrap')   return `AMRAP ${dur}min — ${reps} reps ${name}`
  if (f === 'tabata')  return `Tabata x${ex.sets || 8} ${name}`
  if (f === 'fortime') return `${reps} reps ${name}${dur !== '?' ? ` (cap ${dur}min)` : ''}`
  return name
}

function coachExToAthlete(ex) {
  return {
    exercise: coachExToAthleteLabel(ex),
    sets: ex.sets,
    reps: ex.reps,
    weight: ex.weight || '',
    note: ex.note || '',
    format: ex.format || 'classic',
    duration: ex.duration || '',
  }
}

export function getCoachSessionsForToday(athleteId = 'alexandre') {
  const todayName = DAY_NAMES[new Date().getDay()]
  const program = getProgram(athleteId)
  const allPublished = (program.cycles || []).flatMap(c =>
    (c.blocs || []).flatMap(b =>
      (b.weeks || [])
        .filter(w => w.status === 'published')
        .map(w => ({ ...w, blocType: b.type, cycleName: c.name }))
    )
  )
  if (!allPublished.length) return []
  const latest = allPublished[allPublished.length - 1]
  return (latest.sessions || [])
    .filter(s => s.day === todayName)
    .map(s => ({
      id: s.id,
      name: `${s.day} — ${latest.name}`,
      type: latest.blocType || 'force',
      intention: s.coachNote || '',
      warmup: [],
      main: (s.exercises || []).map(coachExToAthlete),
      finisher: [],
      _fromCoach: true,
      _weekName: latest.name,
    }))
}

export function getCoachWeekSessions(athleteId = 'alexandre') {
  const program = getProgram(athleteId)
  const allPublished = (program.cycles || []).flatMap(c =>
    (c.blocs || []).flatMap(b =>
      (b.weeks || [])
        .filter(w => w.status === 'published')
        .map(w => ({ ...w, blocType: b.type, cycleName: c.name }))
    )
  )
  if (!allPublished.length) return []
  const latest = allPublished[allPublished.length - 1]
  return {
    weekName: latest.name,
    blocType: latest.blocType || 'force',
    sessions: (latest.sessions || []).map(s => ({
      id: s.id,
      name: `${s.day}`,
      fullName: `${s.day} — ${latest.name}`,
      type: latest.blocType || 'force',
      intention: s.coachNote || '',
      warmup: [],
      main: (s.exercises || []).map(coachExToAthlete),
      finisher: [],
      _fromCoach: true,
      _weekName: latest.name,
    })),
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatSeconds(s) {
  if (!s && s !== 0) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function parseTimeInput(str) {
  // Accepts "3:45" or "3'45" or "225" (seconds)
  str = str.trim()
  const colonMatch = str.match(/^(\d+)[:'"](\d{1,2})$/)
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
  const justSeconds = parseInt(str)
  return isNaN(justSeconds) ? null : justSeconds
}
