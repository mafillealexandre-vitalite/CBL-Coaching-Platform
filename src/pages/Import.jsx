import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { parseTSV, rowsToSession, saveImportedSession, loadImportedSessions, deleteImportedSession } from '../utils/excelParser'

const COLUMN_LABELS = {
  exercise: 'Exercice',
  sets: 'Séries',
  reps: 'Reps',
  weight: 'Charge',
  rest: 'Repos',
  note: 'Note',
  section: 'Section',
  duration: 'Durée',
}

const SECTION_COLORS = {
  warmup: '#10B981',
  main: '#0EA5E9',
  finisher: '#F59E0B',
}

const SECTION_LABELS = {
  warmup: 'Échauffement',
  main: 'Principal',
  finisher: 'Finisher',
}

const TEMPLATE_TSV = `Section\tExercice\tSéries\tReps\tCharge\tRepos (sec)\tNote
Échauffement\tMobilité épaules + poignets\t2\t10\t\t60\tFaire lentement
Échauffement\tTractions légères\t2\t8\t\t60\t
Principal\tTractions lestées\t5\t5\t+5kg\t180\tQualité > quantité
Principal\tMuscle-up strict\t4\tmax-2\t\t180\tStoppe avant l'échec
Principal\tDips lestés\t4\t8\t+10kg\t120\t
Principal\tChest-to-bar pull-up\t3\t10\t\t90\t
Finisher\tAMRAP 5min: 5 Pull-up + 10 Push-up\t\t\t\t\tPace régulier`

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_TSV], { type: 'text/tab-separated-values;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template-seance-cbl.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function ExercisePreviewRow({ ex, index }) {
  const color = SECTION_COLORS[ex._section] || SECTION_COLORS.main
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
        style={{ background: color + '20', color }}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{ex.exercise}</div>
        <div className="flex flex-wrap gap-2 mt-0.5">
          {ex.sets && <span className="text-xs text-text-muted">{ex.sets} × {ex.reps}</span>}
          {ex.weight && <span className="text-xs font-mono" style={{ color: '#F59E0B' }}>{ex.weight}</span>}
          {ex.rest && <span className="text-xs text-text-muted">{ex.rest}s récup</span>}
          {ex.duration && <span className="text-xs text-text-muted">{ex.duration}s</span>}
          {ex.note && <span className="text-xs text-text-muted italic truncate max-w-[120px]">{ex.note}</span>}
        </div>
      </div>
      <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
        style={{ background: color + '15', color }}>
        {SECTION_LABELS[ex._section] || 'Principal'}
      </span>
    </div>
  )
}

function SessionCard({ session, onDelete, onLaunch }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(session.importedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const warmup = session.warmup || []
  const main = session.main || []
  const finisher = session.finisher || []
  const total = warmup.length + main.length + finisher.length

  const sections = [
    { label: 'Échauffement', color: '#10B981', items: warmup },
    { label: 'Principal', color: '#0EA5E9', items: main },
    { label: 'Finisher', color: '#F59E0B', items: finisher },
  ].filter(s => s.items.length > 0)

  return (
    <motion.div layout className="glass rounded-xl overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#A78BFA20' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{session.name}</div>
            <div className="text-xs text-text-muted">{total} exercices · {date}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`flex-shrink-0 text-text-muted transition-transform mr-1 ${expanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Launch button */}
        <button
          onClick={() => onLaunch(session)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
          style={{ background: '#0EA5E9', color: 'white' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Lancer
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border space-y-3">
              {sections.map(({ label, color, items }) => (
                <div key={label} className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color }}>{label}</div>
                  <div className="space-y-1">
                    {items.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm py-1">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="font-medium flex-1">{ex.exercise}</span>
                        {ex.sets && <span className="text-xs text-text-muted font-mono">{ex.sets}×{ex.reps}</span>}
                        {ex.weight && <span className="text-xs font-mono" style={{ color: '#F59E0B' }}>{ex.weight}</span>}
                        {ex.rest && <span className="text-xs text-text-muted">{ex.rest}s</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => onDelete(session.id)}
                className="mt-2 text-xs text-danger hover:text-danger/70 transition-colors flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                </svg>
                Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Import() {
  const navigate = useNavigate()
  const dropRef = useRef(null)
  const [step, setStep] = useState('paste') // paste | preview | saved
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [sessionName, setSessionName] = useState('')
  const [savedSessions, setSavedSessions] = useState(() => loadImportedSessions())
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  const analyze = useCallback((text) => {
    setError('')
    const result = parseTSV(text)
    if (result.rows.length === 0) {
      setError('Aucune donnée détectée. Vérifie que tu as bien copié des cellules depuis Excel.')
      return
    }
    setParsed(result)
    setStep('preview')
  }, [])

  const handlePaste = useCallback((e) => {
    const text = e.clipboardData?.getData('text') || e.target.value
    setRawText(text)
    if (text.trim()) analyze(text)
  }, [analyze])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      setRawText(text)
      analyze(text)
    }
    reader.readAsText(file, 'UTF-8')
  }, [analyze])

  const handleSave = () => {
    if (!parsed) return
    const name = sessionName.trim() || 'Séance importée'
    const session = rowsToSession(parsed.rows, name)
    const updated = saveImportedSession(session)
    setSavedSessions(updated)
    setLastSaved(session)
    setStep('saved')
    setRawText('')
    setParsed(null)
    setSessionName('')
  }

  const handleLaunch = (session) => {
    localStorage.setItem('cbl_active_session_override', JSON.stringify(session))
    navigate('/session')
  }

  const handleDelete = (id) => {
    const updated = deleteImportedSession(id)
    setSavedSessions(updated)
  }

  const handleReset = () => {
    setStep('paste')
    setRawText('')
    setParsed(null)
    setError('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Import Excel</h1>
          <p className="text-sm text-text-muted mt-1">
            Copie tes cellules depuis Excel et colle ici. Zéro modification de ton workflow.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border hover:border-brand/40 hover:text-brand transition-all text-text-muted flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Template
        </button>
      </div>

      {/* How it works */}
      <div className="glass rounded-xl p-4">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">3 secondes chrono</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '📋', text: 'Sélectionne tes cellules Excel' },
            { icon: '⌨️', text: 'Copie avec Cmd+C' },
            { icon: '📲', text: 'Colle ici avec Cmd+V' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs text-text-muted leading-tight">{s.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <div className="text-[10px] text-text-muted w-full mb-0.5">Colonnes reconnues :</div>
          {Object.entries(COLUMN_LABELS).map(([, label]) => (
            <span key={label} className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand">{label}</span>
          ))}
        </div>
        <div className="text-[10px] text-text-muted mt-1.5">
          Colonne "Section" → valeurs : <span className="text-success">Échauffement</span> / <span className="text-brand">Principal</span> / <span className="text-warn">Finisher</span>
        </div>
      </div>

      {/* Step: Paste */}
      {step === 'paste' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 transition-all ${
              isDragging ? 'border-brand bg-brand/5' : 'border-dashed border-border'
            }`}
          >
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              onPaste={handlePaste}
              placeholder={`Colle tes données Excel ici (Cmd+V)...\n\nOu glisse-dépose un fichier CSV directement.\n\nFormat attendu (avec ou sans en-têtes) :\nExercice        Séries  Reps  Charge   Repos\nTractions       5       5     +5kg     180\nDips lestés     4       8     +10kg    120`}
              className="w-full h-44 px-4 py-3 rounded-xl bg-transparent text-sm font-mono resize-none focus:outline-none text-text placeholder-text-muted"
              style={{ lineHeight: '1.6' }}
            />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand/10 pointer-events-none">
                <div className="text-brand font-semibold text-sm">Dépose le fichier ici</div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          {rawText.trim() && (
            <button
              onClick={() => analyze(rawText)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: '#0EA5E9', color: 'white' }}
            >
              Analyser →
            </button>
          )}
        </motion.div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && parsed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">
                {parsed.rows.length} exercices détectés
                {parsed.hasHeaders && <span className="ml-2 text-xs text-text-muted">(en-têtes reconnus)</span>}
              </div>
              <button onClick={handleReset} className="text-xs text-text-muted hover:text-text transition-colors">← Recommencer</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parsed.columns.map(col => (
                <span key={col} className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                  ✓ {COLUMN_LABELS[col] || col}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Aperçu</div>
            </div>
            <div className="px-4 divide-y divide-border">
              {parsed.rows.map((ex, i) => (
                <ExercisePreviewRow key={i} ex={ex} index={i} />
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                Nom de la séance
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Ex: Force Pull S3"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 text-text"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: '#0EA5E9', color: 'white' }}
            >
              Sauvegarder la séance
            </button>
          </div>
        </motion.div>
      )}

      {/* Step: Saved */}
      {step === 'saved' && lastSaved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#10B98120' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div className="font-bold">{lastSaved.name}</div>
              <div className="text-xs text-text-muted">Sauvegardée avec succès</div>
            </div>
          </div>

          <button
            onClick={() => handleLaunch(lastSaved)}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: '#0EA5E9', color: 'white' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Lancer cette séance maintenant
          </button>

          <button
            onClick={handleReset}
            className="w-full py-2 text-sm text-text-muted hover:text-text transition-colors"
          >
            Importer une autre séance
          </button>
        </motion.div>
      )}

      {/* Saved sessions list */}
      {savedSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              Séances sauvegardées
              <span className="ml-2 text-xs font-mono text-text-muted">{savedSessions.length}</span>
            </div>
          </div>
          {savedSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={handleDelete}
              onLaunch={handleLaunch}
            />
          ))}
        </div>
      )}

    </div>
  )
}
