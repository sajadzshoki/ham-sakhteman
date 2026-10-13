import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getRequestIP, setCookie } from 'h3'
import { sessionTtlMs } from './env'
import { consumeRateLimit } from './rate-limit'

export const SESSION_COOKIE = 'hs_session'

export function readSessionCookie(event: H3Event) {
  return getCookie(event, SESSION_COOKIE) || null
}

function isSecureRequest(event: H3Event) {
  const proto = String(event.node.req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    ?.trim()
    .toLowerCase()
  if (proto === 'https') return true
  if (proto === 'http') return false
  return Boolean(event.node.req.socket && (event.node.req.socket as { encrypted?: boolean }).encrypted)
}

export function writeSessionCookie(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(event),
    path: '/',
    maxAge: Math.floor(sessionTtlMs() / 1000),
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function assertRateLimit(event: H3Event, action: string, limit = 10, windowMs = 60_000) {
  // پشت پراکسی، آی‌پی واقعی در X-Forwarded-For است؛ محدودیت اصلی OTP روی شماره‌ی موبایل هم اعمال می‌شود
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  consumeRateLimit(`${action}:${ip}`, limit, windowMs)
}