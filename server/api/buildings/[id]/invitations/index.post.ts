import { getRouterParam } from 'h3'
import { createInvitation } from '../../../../services/buildings.service'
import { created, defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => {
  const invitation = await createInvitation(requireUser(event), getRouterParam(event, 'id') ?? '')
  created(event)
  return invitation
})
