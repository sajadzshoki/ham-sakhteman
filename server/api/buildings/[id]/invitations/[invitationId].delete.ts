import { getRouterParam } from 'h3'
import { deleteInvitation } from '../../../../services/buildings.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => deleteInvitation(
  requireUser(event),
  getRouterParam(event, 'id') ?? '',
  getRouterParam(event, 'invitationId') ?? '',
))
