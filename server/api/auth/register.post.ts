import { readBody } from 'h3'
import { registerUser } from '../../services/auth.service'
import { created, defineApi } from '../../utils/api'
import { assertRateLimit, writeSessionCookie } from '../../utils/http'

export default defineApi(async (event) => {
  assertRateLimit(event, 'register')
  const result = await registerUser(await readBody(event))
  writeSessionCookie(event, result.token)
  created(event)
  return { user: result.user }
})
