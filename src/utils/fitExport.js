/**
 * fitExport.js — Encodeur FIT workout minimal pour CBL Coach Pro
 *
 * Génère un fichier .fit valide contenant un workout structuré (exercices + repos)
 * importable dans Garmin Connect (web ou mobile) et poussable sur montre Garmin.
 *
 * Format FIT : binaire little-endian, CRC-16 Garmin
 * Référence spec : https://developer.garmin.com/fit/protocol/
 */

// ─── CRC-16 Garmin ────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Array(16)
  for (let i = 0; i < 16; i++) {
    let crc = i
    for (let j = 0; j < 4; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xB2AA : crc >>> 1
    }
    t[i] = crc
  }
  return t
})()

function updateCRC(crc, byte) {
  let tmp = CRC_TABLE[crc & 0x0F]
  crc = (crc >>> 4) & 0x0FFF
  crc = crc ^ tmp ^ CRC_TABLE[byte & 0x0F]
  tmp = CRC_TABLE[crc & 0x0F]
  crc = (crc >>> 4) & 0x0FFF
  crc = crc ^ tmp ^ CRC_TABLE[(byte >>> 4) & 0x0F]
  return crc
}

function computeCRC(bytes, start = 0, end = bytes.length) {
  let crc = 0
  for (let i = start; i < end; i++) crc = updateCRC(crc, bytes[i])
  return crc
}

// ─── Writer helper ────────────────────────────────────────────────────────────

class FitWriter {
  constructor() { this._buf = [] }

  u8(v)  { this._buf.push(v & 0xFF) }
  u16(v) { this.u8(v & 0xFF); this.u8((v >>> 8) & 0xFF) }
  u32(v) { this.u16(v & 0xFFFF); this.u16((v >>> 16) & 0xFFFF) }

  string(s, len) {
    for (let i = 0; i < len; i++) {
      this.u8(i < s.length ? s.charCodeAt(i) & 0x7F : 0x00)
    }
  }

  bytes() { return new Uint8Array(this._buf) }
  length() { return this._buf.length }

  writeCRC() {
    const crc = computeCRC(this._buf)
    this.u16(crc)
  }
}

// ─── FIT message IDs ──────────────────────────────────────────────────────────

const MESG_FILE_ID        = 0
const MESG_WORKOUT        = 26
const MESG_WORKOUT_STEP   = 27

// ─── Local msg numbers (0-15 per definition) ─────────────────────────────────

const LOCAL_FILE_ID      = 0
const LOCAL_WORKOUT      = 1
const LOCAL_WORKOUT_STEP = 2

// ─── Field base types ─────────────────────────────────────────────────────────

const TYPE_ENUM   = 0x00  // 1 byte
const TYPE_UINT16 = 0x84  // 2 bytes
const TYPE_UINT32 = 0x86  // 4 bytes
const TYPE_STRING = 0x07  // 1 byte/char

// ─── Definition message builder ──────────────────────────────────────────────

function writeDefinition(w, localMsgNum, globalMsgNum, fields) {
  // Header byte: 0b01000000 | localMsgNum
  w.u8(0x40 | (localMsgNum & 0x0F))
  w.u8(0x00)           // reserved
  w.u8(0x00)           // arch: little-endian
  w.u16(globalMsgNum)  // global mesg num
  w.u8(fields.length)  // num fields

  for (const [fieldNum, size, baseType] of fields) {
    w.u8(fieldNum)
    w.u8(size)
    w.u8(baseType)
  }
}

// ─── File ID message ─────────────────────────────────────────────────────────

function writeFileId(w) {
  // Definition
  writeDefinition(w, LOCAL_FILE_ID, MESG_FILE_ID, [
    [0, 1, TYPE_ENUM],   // type
    [1, 2, TYPE_UINT16], // manufacturer
    [2, 2, TYPE_UINT16], // product
  ])

  // Data header
  w.u8(LOCAL_FILE_ID & 0x0F)
  w.u8(5)     // type = workout (5)
  w.u16(0)    // manufacturer = 0
  w.u16(0)    // product = 0
}

// ─── Workout message ─────────────────────────────────────────────────────────

// sport: 0=generic, 4=fitness_equipment, 10=training
function writeWorkout(w, name, numSteps, sport = 0) {
  const nameTrimmed = name.slice(0, 15)

  writeDefinition(w, LOCAL_WORKOUT, MESG_WORKOUT, [
    [8,  4, TYPE_UINT32], // num_valid_steps
    [5, 16, TYPE_STRING], // wkt_name (16 bytes max)
    [4,  1, TYPE_ENUM],   // sport
  ])

  w.u8(LOCAL_WORKOUT & 0x0F)
  w.u32(numSteps)
  w.string(nameTrimmed, 16)
  w.u8(sport)
}

// ─── Workout step message ─────────────────────────────────────────────────────
//
// duration_type:
//   0 = time (duration_value in ms)
//   1 = distance (in cm)
//   5 = open (manual next)
//
// target_type:
//   0 = speed
//   1 = heart_rate
//   2 = cadence
//   5 = open (no target)
//
// intensity:
//   0 = active
//   1 = rest
//   2 = warmup
//   3 = cooldown

function writeWorkoutStep(w, stepIdx, noteName, durationSec, intensity = 0) {
  const FIELDS = [
    [6,  2, TYPE_UINT16], // message_index
    [0,  4, TYPE_UINT32], // duration_value (ms)
    [2,  4, TYPE_UINT32], // target_value_low
    [3,  4, TYPE_UINT32], // target_value_high
    [1,  1, TYPE_ENUM],   // duration_type
    [4,  1, TYPE_ENUM],   // target_type
    [5,  1, TYPE_ENUM],   // intensity
    [7, 16, TYPE_STRING], // notes (16 bytes)
  ]

  // Only write definition once — we detect via stepIdx
  if (stepIdx === 0) {
    writeDefinition(w, LOCAL_WORKOUT_STEP, MESG_WORKOUT_STEP, FIELDS)
  }

  const durationMs = durationSec > 0 ? durationSec * 1000 : 0
  const durationType = durationSec > 0 ? 0 : 5  // time or open

  w.u8(LOCAL_WORKOUT_STEP & 0x0F)
  w.u16(stepIdx)
  w.u32(durationMs)
  w.u32(0)        // target_value_low
  w.u32(0)        // target_value_high
  w.u8(durationType)
  w.u8(5)         // target_type = open
  w.u8(intensity)
  w.string(noteName.slice(0, 15), 16)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Converts a CBL session template into a FIT workout file.
 *
 * @param {object} session - Session template from coaching-plan.json
 * @returns {Uint8Array} Raw FIT file bytes
 */
export function sessionToFit(session) {
  if (!session) throw new Error('Session is required')

  // Build step list from session sections
  const steps = []

  const addSteps = (exercises, intensity) => {
    for (const ex of exercises || []) {
      const name = (ex.exercise || ex.label || '').slice(0, 15)
      const durSec = ex.sets && ex.rest
        ? ex.sets * ((ex.reps || 6) * 3 + (ex.rest || 90))
        : ex.duration
        ? Number(ex.duration)
        : 0
      steps.push({ name, durSec, intensity })
      // Add rest between sets if defined
      if (ex.rest && ex.sets > 1) {
        steps.push({ name: `Récup ${ex.rest}s`, durSec: ex.rest, intensity: 1 })
      }
    }
  }

  addSteps(session.warmup, 2)   // warmup
  addSteps(session.main, 0)     // active
  addSteps(session.finisher, 0) // active
  if (steps.length === 0) {
    steps.push({ name: 'Séance CBL', durSec: 2700, intensity: 0 })
  }

  const w = new FitWriter()

  // ── Body (before header) ──
  const body = new FitWriter()
  writeFileId(body)
  writeWorkout(body, session.name || 'CBL', steps.length)
  steps.forEach((s, i) => writeWorkoutStep(body, i, s.name, s.durSec, s.intensity))
  body.writeCRC()

  const bodyBytes = body.bytes()
  const dataSize = bodyBytes.length - 2 // exclude trailing CRC from data_size count
  // Actually in FIT spec, data_size = total bytes of all data messages + definition messages
  // The final file CRC is NOT counted in data_size
  // But here bodyBytes already contains the CRC at the end, so dataSize = bodyBytes.length - 2

  // ── File header (14 bytes) ──
  const header = new FitWriter()
  header.u8(14)          // header size
  header.u8(0x10)        // protocol version 1.0
  header.u16(2132)       // profile version (21.32)
  header.u32(bodyBytes.length - 2)  // data size (excl. header and body CRC)
  // ".FIT" magic
  header.u8(0x2E); header.u8(0x46); header.u8(0x49); header.u8(0x54)
  // Header CRC (2 bytes — optional but recommended)
  const hBytes = header.bytes()
  const hCRC = computeCRC(hBytes)
  header.u16(hCRC)

  // ── Assemble final file ──
  const headerBytes = header.bytes()
  const out = new Uint8Array(headerBytes.length + bodyBytes.length)
  out.set(headerBytes, 0)
  out.set(bodyBytes, headerBytes.length)

  return out
}

/**
 * Triggers a .fit file download in the browser.
 *
 * @param {Uint8Array} fitBytes
 * @param {string} filename
 */
export function downloadFit(fitBytes, filename = 'workout.fit') {
  const blob = new Blob([fitBytes], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
