import { getRouterParam } from 'h3'
import { listUnits } from '../../../../services/buildings.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => listUnits(requireUser(event), getRouterParam(event, 'id') ?? ''))
