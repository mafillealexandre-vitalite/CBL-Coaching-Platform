import rules from '../data/coach-rules.json'

const KEYWORDS_WEIGHTS = {
  crampe: 'fatigue_lactique_haute', crampes: 'fatigue_lactique_haute',
  brûle: 'fatigue_lactique_haute', brûlait: 'fatigue_lactique_haute',
  acide: 'fatigue_lactique_haute', 'jambes lourdes': 'fatigue_lactique_haute',
  'bras morts': 'fatigue_lactique_haute',
  mieux: 'progression_forte', 'plus facile': 'progression_forte',
  progressé: 'progression_forte', fort: 'progression_forte',
  facile: 'rpe_trop_bas',
  pareil: 'stagnation', stagne: 'stagnation', bloqué: 'stagnation',
  dips: 'dips_faiblesse', triceps: 'dips_faiblesse',
  'muscle-up': 'muscleup_blockage', 'muscle up': 'muscleup_blockage',
  transition: 'muscleup_blockage',
  tractions: 'pullup_faiblesse', dos: 'pullup_faiblesse',
  régulier: 'bonne_regularite', discipline: 'bonne_regularite',
  raté: 'regularite_faible', manqué: 'regularite_faible', skip: 'regularite_faible',
  'pas fini': 'circuit_incomplet', incomplet: 'circuit_incomplet',
  arrêté: 'circuit_incomplet',
  juste: 'circuit_temps_limite', limite: 'circuit_temps_limite',
  épuisé: 'rpe_tres_eleve', crevé: 'rpe_tres_eleve', vide: 'rpe_tres_eleve',
  'trop facile': 'rpe_trop_bas', léger: 'rpe_trop_bas',
  'un peu mieux': 'progression_moderee', progrès: 'progression_moderee',
  reposé: 'bonne_recuperation', frais: 'bonne_recuperation',
  compétition: 'peaking_approche', bientôt: 'peaking_approche',
  déload: 'deload_actif',
  'premier circuit': 'premier_circuit_complete',
}

/**
 * Extracts keyword-based scenario hints from free text.
 * Returns array of rule ids (most relevant first).
 */
function extractKeywordSignals(text) {
  if (!text) return []
  const lower = text.toLowerCase()
  const hits = {}
  for (const [kw, ruleId] of Object.entries(KEYWORDS_WEIGHTS)) {
    if (lower.includes(kw)) {
      hits[ruleId] = (hits[ruleId] || 0) + 1
    }
  }
  return Object.entries(hits).sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/**
 * Main matching function.
 *
 * @param {Object} metrics - { rpe, circuitCompletion (0-100), deltaReps, deltaPullup, deltaDips, consistency, weeksToComp, weekType, firstComplete }
 * @param {string} debriefText - free-form text from athlete
 * @returns {Array} - sorted list of matching rule responses (priority order)
 */
export function matchCoachRules(metrics = {}, debriefText = '') {
  const {
    rpe = 7,
    circuitCompletion = 100,
    deltaReps = 0,
    deltaPullup = 0,
    consistency = 75,
    weeksToComp = 20,
    weekType = 'standard',
    firstComplete = false,
  } = metrics

  const keywordHints = extractKeywordSignals(debriefText)
  const matched = new Set()
  const results = []

  const tryAdd = (ruleId) => {
    if (!matched.has(ruleId) && rules.responses[ruleId]) {
      matched.add(ruleId)
      results.push({ ...rules.responses[ruleId] })
    }
  }

  // 1. Metric-based matching (hard triggers)
  if (firstComplete) tryAdd('premier_circuit_complete')
  if (rpe >= 9.5) tryAdd('rpe_tres_eleve')
  if (rpe >= 9 && circuitCompletion < 80) tryAdd('fatigue_lactique_haute')
  if (rpe <= 5) tryAdd('rpe_trop_bas')
  if (weekType === 'deload') tryAdd('deload_actif')
  if (weeksToComp <= 4) tryAdd('peaking_approche')
  if (circuitCompletion < 75) tryAdd('circuit_incomplet')
  if (deltaReps >= 10) tryAdd('progression_forte')
  if (deltaReps >= 3 && deltaReps < 10) tryAdd('progression_moderee')
  if (deltaReps <= 2) tryAdd('stagnation')
  if (consistency >= 85) tryAdd('bonne_regularite')
  if (consistency < 60) tryAdd('regularite_faible')
  if (deltaPullup < 5 && deltaReps > 0) tryAdd('pullup_faiblesse')

  // 2. Keyword-based matching (soft triggers)
  for (const ruleId of keywordHints) {
    tryAdd(ruleId)
  }

  // 3. Sort by priority (lower number = higher priority)
  results.sort((a, b) => (a.priority || 99) - (b.priority || 99))

  // Return max 3 results to avoid info overload
  return results.slice(0, 3)
}

/**
 * Computes plan adjustments for next meso block based on test delta.
 */
export function computePlanAdjustments(prevTest, currentTest) {
  if (!prevTest || !currentTest) return []
  const adjustments = []

  const deltaPullup = prevTest.pullUp > 0
    ? ((currentTest.pullUp - prevTest.pullUp) / prevTest.pullUp) * 100
    : 0
  const deltaCircuit = prevTest.circuitTime > 0
    ? ((prevTest.circuitTime - currentTest.circuitTime) / prevTest.circuitTime) * 100
    : 0
  const rpeAvg = currentTest.rpe || 7
  const pushScore = (currentTest.dips || 0) + (currentTest.pushUp || 0)
  const pullScore = ((currentTest.pullUp || 0) + (currentTest.muscleUp || 0) * 2)
  const pushPullRatio = pullScore > 0 ? pushScore / pullScore : 1

  for (const rule of rules.plan_adjustment_rules) {
    let triggered = false
    if (rule.condition === 'delta_pullup_pct < 5' && deltaPullup < 5) triggered = true
    if (rule.condition === 'delta_circuit_pct < 10' && deltaCircuit < 10) triggered = true
    if (rule.condition === 'rpe_avg > 8.5' && rpeAvg > 8.5) triggered = true
    if (rule.condition === 'push_pull_ratio > 1.4' && pushPullRatio > 1.4) triggered = true
    if (triggered) adjustments.push({ ...rule, deltaPullup, deltaCircuit, rpeAvg, pushPullRatio })
  }

  return adjustments
}

/**
 * Returns the appropriate weight for a given movement and meso block.
 */
export function getWeightForBlock(movement, blockId) {
  const prog = rules.weight_progression[movement]
  if (!prog) return 0
  return prog[blockId] ?? 0
}

export const AVAILABLE_WEIGHTS = rules.available_weights
