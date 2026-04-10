import * as XLSX from "xlsx"

export interface ContactRow {
  name: string
  phone: string
  extra?: Record<string, unknown>
}

const NAME_KEYS = ["nombre", "name", "cliente", "contacto"]
const PHONE_KEYS = ["telefono", "teléfono", "phone", "celular", "movil", "móvil", "whatsapp"]

function normalizePhone(raw: string): string {
  // Strip all non-digit characters except leading +
  let phone = String(raw).trim()
  // Remove spaces, dashes, parentheses
  phone = phone.replace(/[\s\-().]/g, "")
  // If starts with 0, remove it
  if (phone.startsWith("0")) phone = phone.slice(1)
  // If doesn't start with +, assume Chile (+56)
  if (!phone.startsWith("+")) phone = "+56" + phone
  return phone
}

function findKey(obj: Record<string, unknown>, candidates: string[]): string | undefined {
  const lowerKeys = Object.keys(obj).map((k) => k.toLowerCase())
  for (const candidate of candidates) {
    const idx = lowerKeys.indexOf(candidate)
    if (idx !== -1) return Object.keys(obj)[idx]
  }
  return undefined
}

export function parseContactsExcel(buffer: Buffer): ContactRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })

  const contacts: ContactRow[] = []

  for (const row of rows) {
    const nameKey = findKey(row, NAME_KEYS)
    const phoneKey = findKey(row, PHONE_KEYS)

    if (!phoneKey) continue

    const rawPhone = String(row[phoneKey] ?? "").trim()
    if (!rawPhone) continue

    const name = nameKey ? String(row[nameKey] ?? "").trim() : rawPhone

    // Collect extra fields
    const usedKeys = new Set([nameKey, phoneKey].filter(Boolean))
    const extra: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(row)) {
      if (!usedKeys.has(k) && v !== "" && v !== null && v !== undefined) {
        extra[k] = v
      }
    }

    contacts.push({
      name,
      phone: normalizePhone(rawPhone),
      extra: Object.keys(extra).length > 0 ? extra : undefined,
    })
  }

  return contacts
}
