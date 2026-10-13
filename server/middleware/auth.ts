import { defineEventHandler } from 'h3'
import { getUserByToken } from '../services/auth.service'
import { readSessionCookie } from '../utils/http'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api')) return
  const token = readSessionCookie(event)
  event.context.user = token ? await getUserByToken(token) : null
})
