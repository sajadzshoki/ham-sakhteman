import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getRequestIP, setCookie } from 'h3'
import { ApiError } from './errors'
import { sessionTtlMs } from './env'

export const SESSION_COOKIE = 'hs_session'

export function readSessionCookie(event: H3Event) {
  return getCookie(event, SESSION_COOKIE) || null
}

export function writeSessionCookie(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(sessionTtlMs() / 1000),
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

const buckets = new Map<string, { count: number, reset: number }>()

export function resetRateLimits() {
  buckets.clear()
}

export function consumeRateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return
  }
  current.count += 1
  if (current.count > limit) {
    throw new ApiError(429, 'RATE_LIMITED', 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.')
  }
}

export function assertRateLimit(event: H3Event, action: string, limit = 10, windowMs = 60_000) {
  const ip = getRequestIP(event, { xForwardedFor: false }) || 'unknown'
  consumeRateLimit(`${action}:${ip}`, limit, windowMs)
}
