import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => {
  return { user: requireUser(event) }
})
