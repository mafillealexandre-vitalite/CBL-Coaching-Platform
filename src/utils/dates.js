/**
 * Centralized date utilities — single source of truth for plan/competition dates.
 * Never hardcode dates in components: import from here.
 */
import plan from '../data/coaching-plan.json'
import athlete from '../data/athlete.json'

export const PLAN_START = new Date(plan.meta.startDate)
export const COMP_DATE = new Date(athlete.competitionDate || '2026-09-01')

/** Current plan week number (1-based, capped at 1 min) */
export function getPlanWeekNum(date = new Date()) {
  return Math.max(1, Math.ceil((date - PLAN_START) / (1000 * 60 * 60 * 24 * 7)))
}

/** Days until competition from today */
export function daysToComp() {
  return Math.ceil((COMP_DATE - new Date()) / (1000 * 60 * 60 * 24))
}

/** Weeks until competition from today */
export function weeksToComp() {
  return Math.ceil((COMP_DATE - new Date()) / (1000 * 60 * 60 * 24 * 7))
}

/** Week template key based on plan week number */
export function getWeekTemplateKey(weekNum) {
  const phases = plan.macroPhases || []
  for (const phase of phases) {
    if (phase.weeks?.includes(weekNum)) return phase.templateKey || null
  }
  // Fallback to hardcoded thresholds from plan meta
  const dur = plan.meta?.durationWeeks || 12
  if (weekNum <= Math.floor(dur / 3)) return 'm1-standard'
  if (weekNum <= Math.floor((dur * 2) / 3)) return 'm2-standard'
  if (weekNum <= dur - 2) return 'm3-peak'
  return 'deload'
}
