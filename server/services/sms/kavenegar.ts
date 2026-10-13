import { ApiError } from '../../utils/errors'
import { kavenegarApiKey, kavenegarSender } from '../../utils/env'

export function isKavenegarConfigured() {
  return Boolean(kavenegarApiKey())
}

/**
 * ارسال پیامک ساده با Kavenegar (`sms/send.json`).
 * @see https://kavenegar.com/rest.html
 */
export async function sendKavenegarSms(receptor: string, message: string) {
  const key = kavenegarApiKey()
  if (!key) throw new Error('KAVENEGAR_API_KEY is not set')

  const body = new URLSearchParams({ receptor, message })
  const sender = kavenegarSender()
  if (sender) body.set('sender', sender)

  let response: Response
  try {
    response = await fetch(`https://api.kavenegar.com/v1/${encodeURIComponent(key)}/sms/send.json`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    console.error('Kavenegar request failed', error)
    throw new ApiError(502, 'SMS_FAILED', 'ارسال پیامک ممکن نشد. دوباره تلاش کنید.')
  }

  const payload = await response.json().catch(() => null) as { return?: { status?: number, message?: string } } | null
  if (!response.ok || payload?.return?.status !== 200) {
    console.error('Kavenegar rejected the message', response.status, payload?.return)
    throw new ApiError(502, 'SMS_FAILED', 'ارسال پیامک ممکن نشد. دوباره تلاش کنید.')
  }
}
