/**
 * Feature 3 — Garmin Workout Export (.tcx)
 * Inline collapsible panel with sliders + download button.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function generateTCX(circuit, secsPerRep, restSeconds) {
  const escXML = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const steps = circuit.exercises.map((ex, i) => {
    // Estimate reps from label (heuristic: grab first number found)
    const repsMatch = ex.label.match(/(\d+)/)
    const reps = repsMatch ? parseInt(repsMatch[1]) : 10
    const exSeconds = reps * secsPerRep

    return `
      <Step xsi:type="WorkoutStep_t">
        <StepId>${i * 2 + 1}</StepId>
        <Name>${escXML(ex.label)}</Name>
        <Duration xsi:type="Time_t">
          <Seconds>${exSeconds}</Seconds>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="None_t"/>
      </Step>
      <Step xsi:type="WorkoutStep_t">
        <StepId>${i * 2 + 2}</StepId>
        <Name>Repos</Name>
        <Duration xsi:type="Time_t">
          <Seconds>${restSeconds}</Seconds>
        </Duration>
        <Intensity>Resting</Intensity>
        <Target xsi:type="None_t"/>
      </Step>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts>
    <Workout Sport="Other">
      <Name>${escXML(circuit.name)} — CBL ${escXML(circuit.division)}</Name>
      <Step xsi:type="Repeat_t">
        <Repetitions>1</Repetitions>
        ${steps}
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`
}

function computeDuration(circuit, secsPerRep, restSeconds) {
  let total = 0
  for (const ex of circuit.exercises) {
    const repsMatch = ex.label.match(/(\d+)/)
    const reps = repsMatch ? parseInt(repsMatch[1]) : 10
    total += reps * secsPerRep + restSeconds
  }
  return Math.round(total / 60)
}

export default function GarminExport({ circuit }) {
  const [open, setOpen] = useState(false)
  const [secsPerRep, setSecsPerRep] = useState(3)
  const [restSeconds, setRestSeconds] = useState(60)

  const estimatedMin = computeDuration(circuit, secsPerRep, restSeconds)

  const handleDownload = () => {
    const xml = generateTCX(circuit, secsPerRep, restSeconds)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CBL_${circuit.name.replace(/[^a-zA-Z0-9]/g, '_')}.tcx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{
          background: open ? '#F0EFE9' : '#FAFAF8',
          border: '1px solid #E2E8F0',
          color: '#4A5568',
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 3H19a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2H9"/>
            <polyline points="12 15 15 15 15 18 12 18"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
          Exporter pour Garmin (.tcx)
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-1 rounded-xl p-4 space-y-4"
              style={{ background: '#F0EFE9', border: '1px solid #E2E8F0' }}
            >
              {/* Slider: secs per rep */}
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-2">
                  <span>Secondes / répétition</span>
                  <span className="font-bold text-text-primary">{secsPerRep}s</span>
                </div>
                <input
                  type="range"
                  min={2} max={6} step={1}
                  value={secsPerRep}
                  onChange={e => setSecsPerRep(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-[10px] text-text-faint mt-1">
                  <span>2s</span><span>6s</span>
                </div>
              </div>

              {/* Slider: rest */}
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-2">
                  <span>Repos entre exercices</span>
                  <span className="font-bold text-text-primary">{restSeconds}s</span>
                </div>
                <input
                  type="range"
                  min={30} max={120} step={10}
                  value={restSeconds}
                  onChange={e => setRestSeconds(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-[10px] text-text-faint mt-1">
                  <span>30s</span><span>120s</span>
                </div>
              </div>

              {/* Estimated duration */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-text-muted">Durée estimée :</span>
                <span className="font-bold text-brand ml-auto">{estimatedMin} min</span>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
                style={{ background: '#0F1923', boxShadow: '0 2px 8px rgba(15,25,35,0.15)' }}
              >
                Télécharger pour Garmin (.tcx)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
