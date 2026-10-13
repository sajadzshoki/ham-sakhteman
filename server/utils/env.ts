import { existsSync, readFileSync } from 'node:fs'

export function loadEnvFile(path = '.env') {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split(/\r?\n/)) {
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

/** لینک پیوستن به ساختمان با کد دعوت */
export function invitationLink(code: string) {
  return `${appBaseUrl()}/join?code=${encodeURIComponent(code)}`
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

/** کلید API کاوه‌نگار؛ اگر خالی باشد حالت توسعه (کد ثابت) فعال است */
export function kavenegarApiKey() {
  return process.env.KAVENEGAR_API_KEY?.trim() || ''
}

export function kavenegarSender() {
  return process.env.KAVENEGAR_SENDER?.trim() || ''
}

/** مدت اعتبار کد یک‌بارمصرف به ثانیه (پیش‌فرض ۵ دقیقه) */
export function otpTtlSeconds() {
  const seconds = Number(process.env.OTP_TTL_SECONDS || 300)
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 300
}

/** کد ثابت محیط توسعه وقتی کلید Kavenegar تنظیم نشده است */
export function otpDevCode() {
  const code = process.env.OTP_DEV_CODE?.trim()
  return code && /^\d{4}$/.test(code) ? code : '1111'
}
