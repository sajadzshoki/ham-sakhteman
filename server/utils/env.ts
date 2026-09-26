import { existsSync, readFileSync } from 'node:fs'

export function loadEnvFile(path = '.env') {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export function appBaseUrl() {
  return (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function invitationLink(code: string) {
  return `${appBaseUrl()}/buildings?code=${encodeURIComponent(code)}`
}

export function sessionTtlMs() {
  const days = Number(process.env.SESSION_TTL_DAYS || 14)
  if (!Number.isFinite(days) || days <= 0) return 14 * 86400000
  return days * 86400000
}

export function requireSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}
