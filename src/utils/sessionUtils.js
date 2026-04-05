/**
 * Session utility functions — V5
 * Estimation de durée, volume, intentions, log helpers.
 */

import plan from '../data/coaching-plan.json'

// ─── Duration estimation ──────────────────────────────────────────────────────

const REPS_DURATION_SEC = 3   // ~3s per rep
const DEFAULT_REST_SEC = 90
const TEXT_EXERCISE_SEC = 180 // text-only finisher/drill → 3 min default

function processExercise(ex) {
  if (!ex) return 0
  if (ex.duration) return Number(ex.duration)
  if (ex.sets && ex.reps) {
    const repsNum = typeof ex.reps === 'string'
      ? (ex.reps.includes('max') ? 6 : parseInt(ex.reps))
      : parseInt(ex.reps)
    const rest = ex.rest ?? DEFAULT_REST_SEC
    return ex.sets * (repsNum * REPS_DURATION_SEC + rest)
  }
  if (ex.timeCap) return ex.timeCap + (ex.rest || 180)
  return TEXT_EXERCISE_SEC
}

/** Returns estimated duration in minutes for a session template object */
export function estimateSessionDuration(session) {
  if (!session) return null
  let totalSec = 0
  for (const section of ['warmup', 'main', 'finisher']) {
    for (const ex of session[section] || []) {
      totalSec += processExercise(ex)
    }
  }
  return Math.max(5, Math.round(totalSec / 60))
}

// ─── Volume computation ───────────────────────────────────────────────────────

const MOVEMENT_MAP = {
  pullUp:     ['traction', 'pull-up', 'pull up', 'chest-to-bar', 'australian'],
  muscleUp:   ['muscle-up', 'muscle up', 'mu'],
  dips:       ['dips', 'dip'],
  pushUp:     ['pompe', 'push-up', 'push up', 'pike'],
  gobletSquat:['goblet', 'squat'],
}

function matchMovement(exerciseName) {
  if (!exerciseName) return null
  const lower = exerciseName.toLowerCase()
  for (const [key, patterns] of Object.entries(MOVEMENT_MAP)) {
    if (patterns.some(p => lower.includes(p))) return key
  }
  return null
}

/** Computes volume (reps) per movement for a single session template */
export function computeSessionVolume(session) {
  const volume = { pullUp: 0, muscleUp: 0, dips: 0, pushUp: 0, gobletSquat: 0 }
  for (const section of ['warmup', 'main', 'finisher']) {
    for (const ex of session[section] || []) {
      const movement = matchMovement(ex.exercise || ex.label || '')
      if (!movement) continue
      const reps = typeof ex.reps === 'string'
        ? (ex.reps.includes('max') ? 6 : parseInt(ex.reps))
        : parseInt(ex.reps) || 0
      const sets = ex.sets || 1
      volume[movement] += sets * reps
    }
  }
  return volume
}

/** Aggregates volume across multiple sessions */
export function aggregateVolume(sessions) {
  const total = { pullUp: 0, muscleUp: 0, dips: 0, pushUp: 0, gobletSquat: 0 }
  for (const s of sessions) {
    const v = computeSessionVolume(s)
    for (const k of Object.keys(total)) total[k] += v[k]
  }
  return total
}

// ─── Session log helpers ──────────────────────────────────────────────────────

export function getSessionLog() {
  try { return JSON.parse(localStorage.getItem('cbl_session_log') || '[]') }
  catch { return [] }
}

export function saveSessionLog(log) {
  localStorage.setItem('cbl_session_log', JSON.stringify(log))
}

/** Appends a completed session to the log */
export function logSession({ label, type, rpe, duration, week, templateName }) {
  const log = getSessionLog()
  log.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    label,
    type,
    rpe,
    duration,
    week,
    templateName,
    completed: true,
  })
  saveSessionLog(log)
}

/** Returns sessions in a given ISO week number and year */
export function getSessionsForWeek(weekNum, year) {
  const log = getSessionLog()
  return log.filter(s => {
    const d = new Date(s.date)
    return getISOWeek(d) === weekNum && d.getFullYear() === year
  })
}

/** Returns sessions in a given calendar month */
export function getSessionsForMonth(month, year) {
  const log = getSessionLog()
  return log.filter(s => {
    const d = new Date(s.date)
    return d.getMonth() === month && d.getFullYear() === year
  })
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/** Gets the plan week number (1-12) for a given date */
export function getPlanWeek(date) {
  const start = new Date(plan.meta.startDate)
  const diff = (date - start) / (1000 * 60 * 60 * 24)
  return Math.max(1, Math.ceil(diff / 7))
}

/** Finds the session template by name in the plan */
export function findSessionTemplate(sessionName) {
  for (const template of Object.values(plan.weekTemplates)) {
    for (const s of template.sessions) {
      if (s.name === sessionName) return s
    }
  }
  return null
}

// ─── Weekly stats ─────────────────────────────────────────────────────────────

/** Computes weekly stats from session log for display in recap carousel */
export function computeWeekStats(weekNum) {
  const now = new Date()
  const planStart = new Date(plan.meta.startDate)

  // Get all sessions for this plan week
  const weekStart = new Date(planStart)
  weekStart.setDate(planStart.getDate() + (weekNum - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const log = getSessionLog()
  const weekSessions = log.filter(s => {
    const d = new Date(s.date)
    return d >= weekStart && d < weekEnd
  })

  const done = weekSessions.filter(s => s.completed)
  const totalMinutes = done.reduce((sum, s) => sum + (s.duration || 0), 0)
  const rpeAvg = done.length > 0
    ? parseFloat((done.reduce((sum, s) => sum + (s.rpe || 7), 0) / done.length).toFixed(1))
    : null

  // Compute volume from templates
  let volume = { pullUp: 0, muscleUp: 0, dips: 0, pushUp: 0, gobletSquat: 0 }
  for (const s of done) {
    const tpl = findSessionTemplate(s.label)
    if (tpl) {
      const v = computeSessionVolume(tpl)
      for (const k of Object.keys(volume)) volume[k] += v[k]
    }
  }

  // Time by type
  const timeByType = {}
  for (const s of done) {
    timeByType[s.type] = (timeByType[s.type] || 0) + (s.duration || 0)
  }

  // Planned sessions count for this week
  const template = (() => {
    if (weekNum <= 4) return plan.weekTemplates['m1-standard']
    if (weekNum <= 8) return plan.weekTemplates['m2-standard']
    if (weekNum <= 10) return plan.weekTemplates['m3-peak']
    return plan.weekTemplates['deload']
  })()
  const planned = template.sessions.length

  const phase = plan.macroPhases.find(p => p.weeks.includes(weekNum))
  const meso = plan.mesoBlocks.find(b => b.weeks.includes(weekNum))

  return {
    weekNum,
    phaseName: phase?.name || '',
    mesoName: meso?.name || '',
    totalMinutes,
    sessionsDone: done.length,
    sessionsPlanned: planned,
    rpeAvg,
    volume,
    timeByType,
  }
}

/** Computes monthly stats aggregated from 4 weeks */
export function computeMonthStats(monthIndex) {
  // monthIndex: 0=months 1-4, 1=months 5-8, 2=months 9-12
  const startWeek = monthIndex * 4 + 1
  const weeks = [startWeek, startWeek + 1, startWeek + 2, startWeek + 3]
  const stats = weeks.map(w => computeWeekStats(w))

  const totalMinutes = stats.reduce((sum, s) => sum + s.totalMinutes, 0)
  const done = stats.reduce((sum, s) => sum + s.sessionsDone, 0)
  const planned = stats.reduce((sum, s) => sum + s.sessionsPlanned, 0)
  const rpeValues = stats.filter(s => s.rpeAvg !== null).map(s => s.rpeAvg)
  const rpeAvg = rpeValues.length > 0
    ? parseFloat((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1))
    : null

  const volume = { pullUp: 0, muscleUp: 0, dips: 0, pushUp: 0, gobletSquat: 0 }
  for (const s of stats) {
    for (const k of Object.keys(volume)) volume[k] += s.volume[k]
  }

  return {
    monthIndex,
    phaseName: stats[0]?.phaseName || '',
    totalMinutes,
    sessionsDone: done,
    sessionsPlanned: planned,
    rpeAvg,
    volume,
    weeks: stats,
  }
}
