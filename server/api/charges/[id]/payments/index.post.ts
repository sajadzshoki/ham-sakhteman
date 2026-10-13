import { getRouterParam, readBody } from 'h3'
import { recordPayment } from '../../../../services/content.service'
import { created, defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => {
  const payment = await recordPayment(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event))
  created(event)
  return payment
})
