import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStandards, saveStandards, getAthletes, uid } from '../../utils/coachStore'

const CATEGORIES = ['technique', 'nutrition', 'récup', 'mental', 'programmation', 'autre']
const CAT_COLORS = {
  technique:     { bg: '#0EA5E9', text: '#0EA5E9' },
  nutrition:     { bg: '#10B981', text: '#10B981' },
  récup:         { bg: '#8B5CF6', text: '#8B5CF6' },
  mental:        { bg: '#F59E0B', text: '#F59E0B' },
  programmation: { bg: '#EF4444', text: '#EF4444' },
  autre:         { bg: '#6B7280', text: '#6B7280' },
}

function StandardCard({ standard, athletes, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const c = CAT_COLORS[standard.category] || CAT_COLORS.autre
  const assignedNames = standard.assignedTo?.length
    ? athletes.filter(a => standard.assignedTo.includes(a.id)).map(a => a.nickname || a.name.split(' ')[0])
    : ['Tous']

  return (
    <motion.div
      layout
      className="glass rounded-xl border border-border overflow-hidden"
    >
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: c.bg, minHeight: 16 }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary">{standard.title}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: c.bg + '20', color: c.text }}>
              {standard.category}
            </span>
            <span className="text-[10px] text-text-faint">→ {assignedNames.join(', ')}</span>
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" className={`flex-shrink-0 mt-0.5 text-text-faint transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
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
            <div className="px-4 pb-4 border-t border-border space-y-3 pt-3">
              <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{standard.content}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(standard)}
                  className="text-xs text-brand hover:underline flex items-center gap-1"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Modifier
                </button>
                <button
                  onClick={() => onDelete(standard.id)}
                  className="text-xs text-danger hover:underline flex items-center gap-1"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StandardModal({ standard, athletes, onSave, onClose }) {
  const [title, setTitle] = useState(standard?.title || '')
  const [category, setCategory] = useState(standard?.category || 'technique')
  const [content, setContent] = useState(standard?.content || '')
  const [assignedTo, setAssignedTo] = useState(standard?.assignedTo || [])

  const toggleAthlete = (id) => {
    setAssignedTo(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return
    onSave({
      id: standard?.id || uid(),
      title: title.trim(),
      category,
      content: content.trim(),
      assignedTo,
      createdAt: standard?.createdAt || new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-2xl p-5 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary">{standard ? 'Modifier le standard' : 'Créer un standard'}</h3>
          <button onClick={onClose} className="text-text-faint hover:text-text-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label block mb-1">Titre</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Technique muscle-up — la transition"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="label block mb-1">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const c = CAT_COLORS[cat]
                const active = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all capitalize"
                    style={{
                      backgroundColor: active ? c.bg + '30' : 'transparent',
                      borderColor: active ? c.bg : 'var(--color-border)',
                      color: active ? c.text : 'var(--color-text-muted)',
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label block mb-1">Contenu</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Détails, conseils, références techniques…"
              rows={6}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-brand placeholder-text-faint"
            />
          </div>

          <div>
            <label className="label block mb-2">Assigné à</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAssignedTo([])}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                  assignedTo.length === 0 ? 'bg-brand/20 border-brand/40 text-brand' : 'border-border text-text-muted'
                }`}
              >
                Tous
              </button>
              {athletes.filter(a => a.status === 'active').map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleAthlete(a.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    assignedTo.includes(a.id) ? 'bg-brand/20 border-brand/40 text-brand' : 'border-border text-text-muted'
                  }`}
                >
                  {a.nickname || a.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 btn-ghost text-sm">Annuler</button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            className="flex-1 btn-primary text-sm disabled:opacity-40"
          >
            {standard ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function CoachStandards() {
  const [standards, setStandards] = useState(getStandards)
  const [athletes] = useState(getAthletes)
  const [showModal, setShowModal] = useState(false)
  const [editingStandard, setEditingStandard] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

  const handleSave = useCallback((standard) => {
    setStandards(prev => {
      const idx = prev.findIndex(s => s.id === standard.id)
      const next = idx >= 0
        ? prev.map((s, i) => i === idx ? standard : s)
        : [standard, ...prev]
      saveStandards(next)
      return next
    })
    setShowModal(false)
    setEditingStandard(null)
  }, [])

  const handleDelete = useCallback((id) => {
    setStandards(prev => {
      const next = prev.filter(s => s.id !== id)
      saveStandards(next)
      return next
    })
  }, [])

  const handleEdit = useCallback((standard) => {
    setEditingStandard(standard)
    setShowModal(true)
  }, [])

  const filtered = filterCat === 'all'
    ? standards
    : standards.filter(s => s.category === filterCat)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Standards & Conseils</h2>
          <p className="text-xs text-text-muted mt-0.5">{standards.length} fiche{standards.length !== 1 ? 's' : ''} — visibles par les coachés assignés</p>
        </div>
        <button
          onClick={() => { setEditingStandard(null); setShowModal(true) }}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Créer un standard
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat('all')}
          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
            filterCat === 'all' ? 'bg-brand/20 border-brand/40 text-brand' : 'border-border text-text-muted hover:border-text-faint'
          }`}
        >
          Tous ({standards.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = standards.filter(s => s.category === cat).length
          if (count === 0) return null
          const c = CAT_COLORS[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all capitalize`}
              style={{
                backgroundColor: filterCat === cat ? c.bg + '30' : 'transparent',
                borderColor: filterCat === cat ? c.bg : 'var(--color-border)',
                color: filterCat === cat ? c.text : 'var(--color-text-muted)',
              }}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center border border-dashed border-border">
          <div className="text-text-faint text-sm">
            {standards.length === 0
              ? 'Aucune fiche créée — crée ton premier standard pour le partager avec tes coachés.'
              : 'Aucune fiche dans cette catégorie.'}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(s => (
              <StandardCard
                key={s.id}
                standard={s}
                athletes={athletes}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <StandardModal
            standard={editingStandard}
            athletes={athletes}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingStandard(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
