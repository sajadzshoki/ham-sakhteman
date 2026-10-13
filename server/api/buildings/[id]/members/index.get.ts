import { getRouterParam } from 'h3'
import { listMembers } from '../../../../services/buildings.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => listMembers(requireUser(event), getRouterParam(event, 'id') ?? ''))
