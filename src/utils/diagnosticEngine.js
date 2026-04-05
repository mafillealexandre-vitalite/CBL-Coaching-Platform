/**
 * Diagnostic Engine — computes 4-axis athlete profile from test results.
 *
 * Axes:
 *  1. Force Brute       — strength (isolated max reps vs CBL Espoir targets)
 *  2. Endurance Force   — muscular endurance (high-rep tolerance)
 *  3. Résistance Lactique — lactate resistance (circuit performance vs isolated max)
 *  4. Équilibre Push/Pull — push/pull balance (ratio for injury prevention + CBL perf)
 */

const ESPOIR_TARGETS = {
  pullUp: 30,
  muscleUp: 12,
  dips: 40,
  pushUp: 65,
  gobletSquat: 40,
  circuitTime: 360, // 6 min target
}

/** Clamps a value between 0 and 100 */
const pct = (value, max) => Math.min(100, Math.max(0, Math.round((value / max) * 100)))

/**
 * Computes athlete profile from raw test inputs.
 *
 * @param {Object} tests - { pullUp, muscleUp, dips, pushUp, gobletSquat, circuitReps, circuitTime, rpe }
 * @returns {Object} - profile with scores (0-100) and labels
 */
export function computeProfile(tests) {
  const {
    pullUp = 0,
    muscleUp = 0,
    dips = 0,
    pushUp = 0,
    gobletSquat = 0,
    circuitReps = 0,
    circuitTime = 0,
    rpe = 7,
  } = tests

  const CIRCUIT_TOTAL_REPS = 80 // 10 pull + 20 dips + 30 push + 20 squat

  // 1. Force Brute — pulling-based strength (most CBL-specific)
  const pullScore = pct(pullUp, ESPOIR_TARGETS.pullUp)
  const muScore = pct(muscleUp, ESPOIR_TARGETS.muscleUp)
  const forceBrute = Math.round((pullScore * 0.5 + muScore * 0.5))

  // 2. Endurance de Force — high-rep endurance movements
  const dipsScore = pct(dips, ESPOIR_TARGETS.dips)
  const pushScore = pct(pushUp, ESPOIR_TARGETS.pushUp)
  const gobletScore = pct(gobletSquat, ESPOIR_TARGETS.gobletSquat)
  const enduranceForce = Math.round((dipsScore * 0.4 + pushScore * 0.4 + gobletScore * 0.2))

  // 3. Résistance Lactique — circuit performance vs isolated max
  // Completion score = reps done / total reps
  const completionPct = circuitReps > 0 ? pct(circuitReps, CIRCUIT_TOTAL_REPS) : 0
  // Time score: under 4 min = 100, at 6 min = 60, over 6 min = less
  const timeScore = circuitTime > 0
    ? Math.max(0, Math.min(100, Math.round(((ESPOIR_TARGETS.circuitTime * 1.5) - circuitTime) / (ESPOIR_TARGETS.circuitTime * 1.5) * 100)))
    : 0
  // RPE penalty: high RPE despite not finishing = poor lactate system
  const rpePenalty = rpe >= 9 && completionPct < 80 ? -15 : 0
  const resistanceLactique = Math.min(100, Math.max(0, Math.round((completionPct * 0.5 + timeScore * 0.5) + rpePenalty)))

  // 4. Équilibre Push/Pull — ratio (CBL circuits are roughly 50/50)
  const pushTotal = dips + pushUp
  const pullTotal = pullUp + muscleUp * 2 // muscle-up counts double (pull + transition)
  let equilibre = 50 // default neutral
  if (pullTotal > 0) {
    const ratio = pushTotal / pullTotal
    // Ideal ratio is 1.2–1.5 (slightly more push in CBL circuits)
    if (ratio >= 1.1 && ratio <= 1.6) {
      equilibre = 90
    } else if (ratio >= 0.9 && ratio < 1.1) {
      equilibre = 75 // slightly pull-dominant (good for safety)
    } else if (ratio > 1.6 && ratio <= 2.0) {
      equilibre = 60 // push-dominant (manageable)
    } else if (ratio > 2.0) {
      equilibre = 30 // severely push-dominant (injury risk)
    } else {
      equilibre = 45 // pull-dominant (unusual)
    }
  }

  const scores = {
    forceBrute,
    enduranceForce,
    resistanceLactique,
    equilibre,
  }

  const labels = {
    forceBrute: 'Force Brute',
    enduranceForce: 'Endurance Force',
    resistanceLactique: 'Résistance Lactique',
    equilibre: 'Équilibre Push/Pull',
  }

  const levels = Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [
      k,
      v >= 80 ? 'Elite' : v >= 60 ? 'Confirmé' : v >= 40 ? 'Amateur' : 'En construction'
    ])
  )

  const overall = Math.round(
    forceBrute * 0.3 +
    enduranceForce * 0.25 +
    resistanceLactique * 0.35 +
    equilibre * 0.1
  )

  const weakestAxis = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0]

  return {
    scores,
    labels,
    levels,
    overall,
    weakestAxis,
    raw: tests,
    timestamp: Date.now(),
  }
}

/**
 * Computes deltas between two diagnostic results (% change per metric).
 */
export function computeDeltas(prev, current) {
  if (!prev || !current) return null
  const delta = {}
  const keys = ['pullUp', 'muscleUp', 'dips', 'pushUp', 'gobletSquat', 'circuitTime', 'rpe']
  for (const k of keys) {
    const p = prev[k] || 0
    const c = current[k] || 0
    delta[k] = p > 0 ? Math.round(((c - p) / p) * 100) : 0
  }
  // circuit time: negative delta is good (faster)
  delta.circuitTimeImprovement = -delta.circuitTime
  return delta
}

/** Returns a text diagnosis summary for the dashboard */
export function getDiagnosisSummary(profile) {
  if (!profile) return null
  const { scores, weakestAxis, labels, overall } = profile
  const level = overall >= 70 ? 'Confirmé' : overall >= 50 ? 'Amateur' : 'Débutant avancé'
  return {
    level,
    overall,
    priority: `Axe prioritaire : ${labels[weakestAxis]} (${scores[weakestAxis]}/100)`,
    message: `Profil global ${level} — axe le plus limitant en compétition : ${labels[weakestAxis]}.`
  }
}
