import { logoutToken } from '../../services/auth.service'
import { defineApi } from '../../utils/api'
import { clearSessionCookie, readSessionCookie } from '../../utils/http'

export default defineApi(async (event) => {
  await logoutToken(readSessionCookie(event))
  clearSessionCookie(event)
  return { ok: true }
})
