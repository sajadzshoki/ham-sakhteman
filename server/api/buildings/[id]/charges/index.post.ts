import { getRouterParam, readBody } from 'h3'
import { createCharge } from '../../../../services/content.service'
import { created, defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => {
  const row = await createCharge(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event))
  created(event)
  return row
})
