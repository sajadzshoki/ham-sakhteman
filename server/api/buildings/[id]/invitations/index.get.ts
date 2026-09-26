import { getRouterParam } from 'h3'
import { listInvitations } from '../../../../services/buildings.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => listInvitations(requireUser(event), getRouterParam(event, 'id') ?? ''))
