import { getRouterParam, readBody } from 'h3'
import { updateMember } from '../../../../services/buildings.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => updateMember(
  requireUser(event),
  getRouterParam(event, 'id') ?? '',
  getRouterParam(event, 'memberId') ?? '',
  await readBody(event),
))
