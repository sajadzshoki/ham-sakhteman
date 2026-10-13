import { readBody } from 'h3'
import { loginUser } from '../../services/auth.service'
import { defineApi } from '../../utils/api'
import { assertRateLimit, writeSessionCookie } from '../../utils/http'

export default defineApi(async (event) => {
  assertRateLimit(event, 'login')
  const result = await loginUser(await readBody(event))
  writeSessionCookie(event, result.token)
  return { user: result.user }
})
