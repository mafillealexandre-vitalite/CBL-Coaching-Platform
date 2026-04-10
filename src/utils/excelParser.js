/**
 * Excel → Session parser
 * Handles TSV (tab-separated) data pasted from Excel/Numbers/Google Sheets
 */

const COLUMN_ALIASES = {
  exercise: ['exercice', 'exercise', 'mouvement', 'movement', 'nom', 'ex', 'name'],
  sets: ['séries', 'series', 'sets', 'set', 'série'],
  reps: ['reps', 'répétitions', 'repetitions', 'rep', 'répét'],
  weight: ['charge', 'poids', 'weight', 'kg', 'load', 'lest', 'intensité'],
  rest: ['repos', 'rest', 'récup', 'recuperation', 'pause', 'recup'],
  note: ['note', 'notes', 'commentaire', 'commentaires', 'remarque', 'info', 'consigne'],
  section: ['section', 'partie', 'phase', 'bloc', 'block', 'type', 'catégorie'],
  duration: ['durée', 'duree', 'duration', 'temps', 'time', 'sec', 'secondes'],
}

const SECTION_ALIASES = {
  warmup: ['échauffement', 'echauffement', 'chauffe', 'warmup', 'warm-up', 'warm up', 'prep', 'préparation'],
  main: ['principal', 'main', 'travail', 'corps', 'body', 'core', 'bloc principal', 'entraînement', 'entrainement'],
  finisher: ['finisher', 'finisseur', 'fin', 'burnout', 'metcon', 'conditionnement'],
}

function normalizeHeader(h) {
  return h.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]/g, '') // keep alphanumeric only
}

function detectColumnIndex(headers, aliases) {
  const normalized = headers.map(normalizeHeader)
  for (const alias of aliases) {
    const aliasNorm = normalizeHeader(alias)
    const idx = normalized.findIndex(h => h === aliasNorm || h.includes(aliasNorm))
    if (idx !== -1) return idx
  }
  return -1
}

function detectSection(value) {
  if (!value) return 'main'
  const v = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [section, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some(a => v.includes(a.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return section
    }
  }
  return 'main'
}

function parseRest(val) {
  if (!val) return undefined
  const n = parseInt(val)
  if (isNaN(n)) return undefined
  // If value > 10, assume seconds. If ≤ 10, assume minutes → convert
  return n <= 10 ? n * 60 : n
}

/**
 * Parse TSV text (from Excel copy-paste) into a session object
 * @param {string} tsv - raw pasted text
 * @returns {{ rows: object[], columns: string[], hasHeaders: boolean, error?: string }}
 */
export function parseTSV(tsv) {
  if (!tsv || !tsv.trim()) return { rows: [], columns: [], hasHeaders: false }

  const lines = tsv.trim().split('\n').map(l => l.trimEnd())
  if (lines.length === 0) return { rows: [], columns: [], hasHeaders: false }

  // Split by tabs (Excel TSV), fallback to semicolons (French Excel), then commas
  const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const rawRows = lines.map(l => l.split(separator).map(c => c.trim().replace(/^"|"$/g, '')))

  // Detect if first row is headers
  const firstRow = rawRows[0]
  const isHeader = firstRow.some(cell => {
    const n = normalizeHeader(cell)
    return Object.values(COLUMN_ALIASES).flat().some(alias => normalizeHeader(alias) === n || n.includes(normalizeHeader(alias)))
  })

  const headers = isHeader ? firstRow : null
  const dataRows = isHeader ? rawRows.slice(1) : rawRows

  // Build column mapping
  const colMap = {}
  if (headers) {
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      colMap[field] = detectColumnIndex(headers, aliases)
    }
  } else {
    // No headers — try positional guessing (exercise, sets, reps, weight, rest, note)
    const positions = ['exercise', 'sets', 'reps', 'weight', 'rest', 'note']
    positions.forEach((field, i) => { colMap[field] = i < rawRows[0].length ? i : -1 })
    colMap.section = -1
  }

  // Parse rows into exercise objects
  const rows = dataRows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const get = (field) => colMap[field] >= 0 ? (row[colMap[field]] || '').trim() : ''
      const exercise = get('exercise')
      if (!exercise) return null

      const obj = { exercise }

      const sets = parseInt(get('sets'))
      if (!isNaN(sets) && sets > 0) obj.sets = sets

      const repsRaw = get('reps')
      if (repsRaw) {
        const repsNum = parseInt(repsRaw)
        obj.reps = isNaN(repsNum) ? repsRaw : repsNum
      }

      const weight = get('weight')
      if (weight) obj.weight = weight

      const rest = parseRest(get('rest'))
      if (rest) obj.rest = rest

      const duration = parseInt(get('duration'))
      if (!isNaN(duration) && duration > 0) obj.duration = duration

      const note = get('note')
      if (note) obj.note = note

      const sectionRaw = get('section')
      obj._section = detectSection(sectionRaw)

      return obj
    })
    .filter(Boolean)

  const detectedColumns = Object.entries(colMap)
    .filter(([, idx]) => idx >= 0)
    .map(([field]) => field)

  return {
    rows,
    columns: detectedColumns,
    hasHeaders: !!headers,
    rawHeaders: headers,
  }
}

/**
 * Convert parsed rows into a session object matching coaching-plan.json format
 */
export function rowsToSession(rows, name = 'Séance importée') {
  const warmup = rows.filter(r => r._section === 'warmup').map(({ _section, ...r }) => r)
  const main = rows.filter(r => r._section === 'main').map(({ _section, ...r }) => r)
  const finisher = rows.filter(r => r._section === 'finisher').map(({ _section, ...r }) => r)

  // If nothing was labeled warmup/finisher, split first 2 as warmup if total > 4
  if (warmup.length === 0 && main.length > 4) {
    const allMain = rows.map(({ _section, ...r }) => r)
    return {
      id: `import-${Date.now()}`,
      name,
      type: 'force',
      intention: '',
      warmup: allMain.slice(0, 2),
      main: allMain.slice(2, -1),
      finisher: allMain.slice(-1),
      importedAt: new Date().toISOString(),
    }
  }

  return {
    id: `import-${Date.now()}`,
    name,
    type: 'force',
    intention: '',
    warmup,
    main: main.length > 0 ? main : rows.map(({ _section, ...r }) => r),
    finisher,
    importedAt: new Date().toISOString(),
  }
}

/**
 * Save session to localStorage
 */
export function saveImportedSession(session) {
  const existing = JSON.parse(localStorage.getItem('cbl_imported_sessions') || '[]')
  const updated = [session, ...existing]
  localStorage.setItem('cbl_imported_sessions', JSON.stringify(updated))
  return updated
}

export function loadImportedSessions() {
  return JSON.parse(localStorage.getItem('cbl_imported_sessions') || '[]')
}

export function deleteImportedSession(id) {
  const existing = loadImportedSessions()
  const updated = existing.filter(s => s.id !== id)
  localStorage.setItem('cbl_imported_sessions', JSON.stringify(updated))
  return updated
}
