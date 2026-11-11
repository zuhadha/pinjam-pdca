#!/usr/bin/env node
/**
 * Import rooms, room photos and bookings from the old Laravel "COE Rooms" MySQL
 * database into the Supabase tables created by
 * supabase/migrations/20261110_add_room_booking.sql.
 *
 * Safe to re-run: every row keeps its old MySQL id in `legacy_id`, and rows that
 * were already imported are skipped.
 *
 * Source (pick one):
 *   --sql ./coe.sql                              phpMyAdmin / mysqldump .sql export
 *   --mysql "mysql://user:pass@host:3306/coe"   needs `npm i -D mysql2` once
 *   --json ./coe.json                            phpMyAdmin "JSON" export (one file holding the
 *                                                rooms, room_images and borrow_rooms tables), or a
 *                                                folder of export files / rooms.json,
 *                                                room_images.json, borrow_rooms.json arrays
 * Options:
 *   --images-dir ../garudafood-space/public/rooms   upload room photos from here
 *   --from 2026-01-01                               only bookings on/after this date
 *   --dry-run                                       read and map, write nothing
 *
 * Target: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment or .env.local.
 *
 * Example:
 *   node scripts/import-rooms-from-mysql.mjs --sql ~/Downloads/coe.sql \
 *     --images-dir ../garudafood-space/public/rooms --dry-run
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// ─── Arguments and environment ───────────────────────────────────────────────

const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const flag = (name) => args.includes(`--${name}`)

const MYSQL_URL = opt('mysql') ?? process.env.MYSQL_URL
const JSON_DIR = opt('json')
const SQL_FILE = opt('sql')
const IMAGES_DIR = opt('images-dir')
const FROM_DATE = opt('from')
const DRY = flag('dry-run')

try {
  process.loadEnvFile?.('.env.local')
} catch {
  /* no .env.local; rely on the environment */
}

if (!MYSQL_URL && !JSON_DIR && !SQL_FILE) {
  console.error('Give a source: --sql <file>, --json <file or folder> or --mysql <url>. See the header of this file.')
  process.exit(1)
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Read the MySQL tables ───────────────────────────────────────────────────

/**
 * Reads tables from JSON: a phpMyAdmin export (any number of tables in one file),
 * or a plain array of rows named after its table (rooms.json, borrow_rooms.json, ...).
 * JSON_DIR may be one file or a folder of such files.
 */
function readJsonTables() {
  const stat = fs.statSync(JSON_DIR, { throwIfNoEntry: false })
  if (!stat) {
    console.error(`Not found: ${JSON_DIR}`)
    process.exit(1)
  }
  const files = stat.isDirectory()
    ? fs.readdirSync(JSON_DIR).filter((f) => f.toLowerCase().endsWith('.json')).map((f) => path.join(JSON_DIR, f))
    : [JSON_DIR]
  const tables = {}
  for (const file of files) {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (Array.isArray(parsed) && parsed.some((x) => x && x.type === 'table')) {
      for (const t of parsed.filter((x) => x && x.type === 'table')) tables[t.name] = t.data ?? []
    } else if (Array.isArray(parsed)) {
      tables[path.basename(file, '.json')] = parsed
    }
  }
  return tables
}

/**
 * Reads the INSERT rows of a .sql dump (phpMyAdmin or mysqldump) into
 * { tableName: [{ column: value }] }. Values come back as strings (numbers too)
 * or null, the same shape the JSON export gives. Column names are taken from the
 * INSERT column list, or from the table's CREATE TABLE when the list is missing.
 */
function readSqlDump(file) {
  const sql = fs.readFileSync(file, 'utf8')
  const tables = {}
  const createColumns = {}

  // Column order from CREATE TABLE, for INSERTs written without a column list
  for (const m of sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi)) {
    createColumns[m[1]] = m[2]
      .split('\n')
      .map((line) => line.trim().match(/^`(\w+)`\s/))
      .filter(Boolean)
      .map((x) => x[1])
  }

  const ESCAPES = { 0: '\0', b: '\b', n: '\n', r: '\r', t: '\t', Z: '\x1a' }
  const insertRe = /INSERT\s+(?:IGNORE\s+)?INTO\s+`?(\w+)`?\s*(?:\(([^)]*)\))?\s*VALUES\s*/gi
  let m
  while ((m = insertRe.exec(sql))) {
    const table = m[1]
    const columns = m[2] ? m[2].split(',').map((c) => c.trim().replace(/`/g, '')) : createColumns[table]
    if (!columns) throw new Error(`No column list for ${table}`)
    const rows = (tables[table] ??= [])
    let i = insertRe.lastIndex
    // Parse ( ... ), ( ... ) ... ; one value at a time
    while (i < sql.length) {
      while (/\s|,/.test(sql[i])) i++
      if (sql[i] === ';') break
      if (sql[i] !== '(') throw new Error(`Unexpected "${sql.slice(i, i + 20)}" in INSERT into ${table}`)
      i++
      const values = []
      for (;;) {
        while (/\s/.test(sql[i])) i++
        if (sql[i] === "'") {
          let v = ''
          i++
          for (;;) {
            const c = sql[i]
            if (c === '\\') {
              const n = sql[i + 1]
              v += ESCAPES[n] ?? n
              i += 2
            } else if (c === "'" && sql[i + 1] === "'") {
              v += "'"
              i += 2
            } else if (c === "'") {
              i++
              break
            } else {
              v += c
              i++
            }
          }
          values.push(v)
        } else {
          let j = i
          while (sql[j] !== ',' && sql[j] !== ')') j++
          const raw = sql.slice(i, j).trim()
          values.push(/^null$/i.test(raw) ? null : raw)
          i = j
        }
        while (/\s/.test(sql[i])) i++
        if (sql[i] === ',') {
          i++
          continue
        }
        if (sql[i] === ')') {
          i++
          break
        }
        throw new Error(`Unexpected "${sql.slice(i, i + 20)}" in INSERT into ${table}`)
      }
      rows.push(Object.fromEntries(columns.map((c, k) => [c, values[k] ?? null])))
    }
    insertRe.lastIndex = i
  }
  return tables
}

async function loadSource() {
  if (SQL_FILE) {
    if (!fs.existsSync(SQL_FILE)) {
      console.error(`Not found: ${SQL_FILE}`)
      process.exit(1)
    }
    const tables = readSqlDump(SQL_FILE)
    if (!tables.borrow_rooms && !tables.rooms) {
      console.error(`No rooms or borrow_rooms rows found in ${SQL_FILE}. Tables seen: ${Object.keys(tables).join(', ') || 'none'}`)
      process.exit(1)
    }
    return { rooms: tables.rooms ?? [], images: tables.room_images ?? [], bookings: tables.borrow_rooms ?? [] }
  }
  if (JSON_DIR) {
    const tables = readJsonTables()
    if (!tables.borrow_rooms && !tables.rooms) {
      console.error(`No rooms or borrow_rooms table found in ${JSON_DIR}. Tables seen: ${Object.keys(tables).join(', ') || 'none'}`)
      process.exit(1)
    }
    return {
      rooms: tables.rooms ?? [],
      images: tables.room_images ?? [],
      bookings: tables.borrow_rooms ?? [],
    }
  }
  let mysql
  try {
    mysql = await import('mysql2/promise')
  } catch {
    console.error('mysql2 is not installed. Run `npm i -D mysql2` or use --json.')
    process.exit(1)
  }
  const conn = await mysql.createConnection({ uri: MYSQL_URL, dateStrings: true })
  const [rooms] = await conn.query('SELECT * FROM rooms')
  const [images] = await conn.query('SELECT * FROM room_images').catch(() => [[]])
  const [bookings] = await conn.query('SELECT * FROM borrow_rooms ORDER BY id')
  await conn.end()
  return { rooms, images, bookings }
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

const DAY_TO_ISO = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 }
const isDeleted = (row) => row.deleted_at !== null && row.deleted_at !== undefined && row.deleted_at !== ''
const datePart = (dt) => (dt ? String(dt).slice(0, 10) : null)
const timePart = (dt) => (dt ? String(dt).slice(11, 16) : null)
const hhmm = (t) => (t ? String(t).slice(0, 5) : null)
const toInt = (v) => (v === null || v === undefined || v === '' ? null : Number.parseInt(v, 10))
const str = (v) => (v === null || v === undefined ? null : String(v).trim() || null)

function parseSettings(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function recurrenceOf(row) {
  const type = ['daily', 'weekly', 'monthly'].includes(row.recurrence_type) ? row.recurrence_type : 'none'
  const settings = parseSettings(row.recurrence_settings)
  const weekdays =
    type === 'weekly' && Array.isArray(settings.days)
      ? settings.days.map((d) => DAY_TO_ISO[String(d).toLowerCase()]).filter(Boolean)
      : null
  return {
    recurrence_type: type,
    recurrence_weekdays: weekdays?.length ? weekdays : null,
    recurrence_until: type === 'none' ? null : datePart(row.recurring_until),
    recurrence_count: type === 'none' ? null : toInt(row.recurring_count),
  }
}

function statusOf(row) {
  const s = toInt(row.admin_approval_status)
  if (s === 1) return 'confirmed'
  if (s === 2) return 'cancelled'
  return 'waitlisted'
}

// ─── Import steps ────────────────────────────────────────────────────────────

const report = { rooms: 0, roomsMatched: 0, images: 0, reservations: 0, bookings: 0, movedToWaitlist: [], skipped: [] }

async function importRooms(rows) {
  const { data: existing, error } = await supabase.from('rooms').select('id, name, legacy_id')
  if (error) throw error
  const byLegacy = new Map(existing.filter((r) => r.legacy_id).map((r) => [Number(r.legacy_id), r.id]))
  const byName = new Map(existing.filter((r) => !r.legacy_id).map((r) => [r.name.toLowerCase(), r.id]))
  const map = new Map() // mysql id -> supabase id

  for (const r of rows) {
    const legacyId = Number(r.id)
    if (byLegacy.has(legacyId)) {
      map.set(legacyId, byLegacy.get(legacyId))
      continue
    }
    const row = {
      name: String(r.name).trim(),
      area: str(r.area ?? r.notes),
      max_people: toInt(r.max_people),
      facilities: str(r.facilities),
      status: toInt(r.status) === 3 ? 'maintenance' : 'available',
      legacy_id: legacyId,
      deleted_at: isDeleted(r) ? r.deleted_at : null,
    }
    const sameName = byName.get(row.name.toLowerCase())
    if (DRY) {
      map.set(legacyId, sameName ?? -legacyId)
      sameName ? report.roomsMatched++ : report.rooms++
      continue
    }
    if (sameName) {
      // A seeded room with the same name: take over its row (MySQL values win) instead of duplicating it
      const { error: e } = await supabase.from('rooms').update(row).eq('id', sameName)
      if (e) throw e
      map.set(legacyId, sameName)
      report.roomsMatched++
    } else {
      const { data, error: e } = await supabase.from('rooms').insert(row).select('id').single()
      if (e) throw e
      map.set(legacyId, data.id)
      report.rooms++
    }
  }
  return map
}

async function importImages(rows, roomMap) {
  if (!IMAGES_DIR) {
    if (rows.length) console.log(`Skipping ${rows.length} photos: pass --images-dir to upload them.`)
    return
  }
  const { data: existing } = await supabase.from('room_images').select('legacy_id')
  const done = new Set((existing ?? []).map((r) => Number(r.legacy_id)))
  const order = new Map()

  for (const img of rows) {
    const legacyId = Number(img.id)
    const roomId = roomMap.get(Number(img.room_id))
    if (done.has(legacyId) || !roomId) continue
    const file = path.join(IMAGES_DIR, img.path)
    if (!fs.existsSync(file)) {
      report.skipped.push(`photo ${img.path}: file not found`)
      continue
    }
    const displayOrder = order.get(roomId) ?? 0
    order.set(roomId, displayOrder + 1)
    if (DRY) {
      report.images++
      continue
    }
    const ext = path.extname(img.path).toLowerCase()
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    const storagePath = `${roomId}/legacy-${legacyId}${ext || '.jpg'}`
    const { error: upErr } = await supabase.storage
      .from('room-images')
      .upload(storagePath, fs.readFileSync(file), { contentType, upsert: true })
    if (upErr) {
      report.skipped.push(`photo ${img.path}: ${upErr.message}`)
      continue
    }
    const { data: pub } = supabase.storage.from('room-images').getPublicUrl(storagePath)
    const { error } = await supabase.from('room_images').insert({
      room_id: roomId,
      storage_path: storagePath,
      public_url: pub.publicUrl,
      display_order: displayOrder,
      legacy_id: legacyId,
    })
    if (error) report.skipped.push(`photo ${img.path}: ${error.message}`)
    else report.images++
  }
}

async function importBookings(rows, roomMap) {
  const live = rows.filter((r) => !isDeleted(r))
  const byId = new Map(live.map((r) => [Number(r.id), r]))

  const [{ data: doneRes }, { data: doneBook }] = await Promise.all([
    supabase.from('room_reservations').select('id, legacy_id').not('legacy_id', 'is', null),
    supabase.from('room_bookings').select('legacy_id').not('legacy_id', 'is', null),
  ])
  const reservationIds = new Map((doneRes ?? []).map((r) => [Number(r.legacy_id), r.id]))
  const bookedLegacy = new Set((doneBook ?? []).map((r) => Number(r.legacy_id)))

  // Oldest first: an earlier booking keeps the slot, later clashes go to the waiting list
  const ordered = [...live].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)) || a.id - b.id)

  for (const row of ordered) {
    const legacyId = Number(row.id)
    if (bookedLegacy.has(legacyId)) continue

    const date = datePart(row.borrow_at)
    const start = hhmm(row.start_time) ?? timePart(row.borrow_at)
    const end = hhmm(row.end_time) ?? timePart(row.until_at)
    const roomId = roomMap.get(Number(row.room_id))
    if (!date || !start || !end || start >= end) {
      report.skipped.push(`booking ${legacyId}: invalid date or time (${date} ${start}-${end})`)
      continue
    }
    if (!roomId) {
      report.skipped.push(`booking ${legacyId}: room ${row.room_id} not imported`)
      continue
    }
    if (FROM_DATE && date < FROM_DATE) continue

    // Recurring instances join their parent's reservation
    const parent = row.parent_booking_id && byId.get(Number(row.parent_booking_id))
    const owner = parent || row
    const ownerLegacy = Number(owner.id)

    let reservationId = reservationIds.get(ownerLegacy)
    if (!reservationId) {
      const reservation = {
        borrower_name: str(owner.borrower_name) ?? 'Tanpa nama',
        department: str(owner.department) ?? '-',
        phone_number: str(owner.phone_number) ?? '-',
        email: null,
        agenda: str(owner.activity_category) ?? str(owner.notes) ?? 'Booking',
        participants: str(owner.participants),
        people_count: toInt(owner.people_count) || null,
        notes: str(owner.notes),
        ...recurrenceOf(owner),
        manage_token: crypto.randomBytes(32).toString('hex'),
        legacy_id: ownerLegacy,
        created_at: owner.created_at ?? undefined,
      }
      if (DRY) {
        reservationId = -ownerLegacy
      } else {
        const { data, error } = await supabase.from('room_reservations').insert(reservation).select('id').single()
        if (error) {
          report.skipped.push(`booking ${legacyId}: reservation failed (${error.message})`)
          continue
        }
        reservationId = data.id
      }
      reservationIds.set(ownerLegacy, reservationId)
      report.reservations++
    }

    const booking = {
      reservation_id: reservationId,
      room_id: roomId,
      booking_date: date,
      start_time: start,
      end_time: end,
      status: statusOf(row),
      cancelled_by: statusOf(row) === 'cancelled' ? 'admin' : null,
      legacy_id: legacyId,
      created_at: row.created_at ?? undefined,
    }
    if (DRY) {
      report.bookings++
      continue
    }
    let { error } = await supabase.from('room_bookings').insert(booking)
    if (error?.code === '23P01') {
      // Old data had an overlap the new rules forbid: keep it, as a waiting-list entry
      ;({ error } = await supabase.from('room_bookings').insert({ ...booking, status: 'waitlisted' }))
      if (!error) report.movedToWaitlist.push(`booking ${legacyId} on ${date} ${start}-${end}`)
    }
    if (error) report.skipped.push(`booking ${legacyId}: ${error.message}`)
    else report.bookings++
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const source = await loadSource()
console.log(
  `Source: ${source.rooms.length} rooms, ${source.images.length} photos, ${source.bookings.length} bookings${DRY ? ' (dry run)' : ''}`
)

const roomMap = await importRooms(source.rooms)
await importImages(source.images, roomMap)
await importBookings(source.bookings, roomMap)

console.log(`
Rooms inserted:          ${report.rooms}
Rooms matched by name:   ${report.roomsMatched}
Photos uploaded:         ${report.images}
Reservations created:    ${report.reservations}
Bookings imported:       ${report.bookings}
Moved to waiting list:   ${report.movedToWaitlist.length}
Skipped:                 ${report.skipped.length}`)
for (const line of report.movedToWaitlist) console.log(`  waitlist  ${line}`)
for (const line of report.skipped) console.log(`  skipped   ${line}`)
if (DRY) console.log('\nDry run: nothing was written.')
