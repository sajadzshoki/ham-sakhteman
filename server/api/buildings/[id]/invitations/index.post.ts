import { getRouterParam, readBody } from 'h3'
import { createInvitation } from '../../../../services/buildings.service'
import { created, defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => {
  const body = await readBody(event).catch(() => undefined)
  const invitation = await createInvitation(requireUser(event), getRouterParam(event, 'id') ?? '', body)
  created(event)
  return invitation
})
