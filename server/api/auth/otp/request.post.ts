import { readBody } from 'h3'
import { requestOtp } from '../../../services/otp.service'
import { defineApi } from '../../../utils/api'
import { assertRateLimit } from '../../../utils/http'

export default defineApi(async (event) => {
  assertRateLimit(event, 'otp-request', 60, 10 * 60_000)
  return requestOtp(await readBody(event))
})
