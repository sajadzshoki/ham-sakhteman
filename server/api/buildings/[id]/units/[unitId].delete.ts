import { getRouterParam } from 'h3'
import { deleteUnit } from '../../../../services/buildings.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => deleteUnit(
  requireUser(event),
  getRouterParam(event, 'id') ?? '',
  getRouterParam(event, 'unitId') ?? '',
))
