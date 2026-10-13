import { getRouterParam, readBody } from 'h3'
import { createUnit } from '../../../../services/buildings.service'
import { created, defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => {
  const unit = await createUnit(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event))
  created(event)
  return unit
})
