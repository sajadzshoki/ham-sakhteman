import { getRouterParam } from 'h3'
import { getBuilding } from '../../services/buildings.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => getBuilding(requireUser(event), getRouterParam(event, 'id') ?? ''))
