import { getRouterParam, readBody } from 'h3'
import { updateBuilding } from '../../services/buildings.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => updateBuilding(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event)))
