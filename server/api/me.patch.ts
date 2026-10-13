import { readBody } from 'h3'
import { updateProfile } from '../services/auth.service'
import { defineApi, requireUser } from '../utils/api'

export default defineApi(async (event) => {
  const user = await updateProfile(requireUser(event), await readBody(event))
  return { user }
})
