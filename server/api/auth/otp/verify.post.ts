import { readBody } from 'h3'
import { verifyOtp } from '../../../services/otp.service'
import { defineApi } from '../../../utils/api'
import { assertRateLimit, writeSessionCookie } from '../../../utils/http'

export default defineApi(async (event) => {
  assertRateLimit(event, 'otp-verify', 120, 10 * 60_000)
  const result = await verifyOtp(await readBody(event))
  writeSessionCookie(event, result.token)
  return { user: result.user }
})
