import { randomBytes } from 'node:crypto'

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
  }
  return name.trim().slice(0, 2)
}

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeInvitationCode() {
  const bytes = randomBytes(6)
  let code = ''
  for (const byte of bytes) code += alphabet[byte % alphabet.length]
  return code
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}
