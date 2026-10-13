import { getRouterParam } from 'h3'
import { removeMember } from '../../../../services/buildings.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => removeMember(
  requireUser(event),
  getRouterParam(event, 'id') ?? '',
  getRouterParam(event, 'memberId') ?? '',
))
