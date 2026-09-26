import { getRouterParam, readBody } from 'h3'
import { createAnnouncement } from '../../../../services/content.service'
import { created, defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => {
  const row = await createAnnouncement(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event))
  created(event)
  return row
})
