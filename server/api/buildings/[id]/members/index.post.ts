import { getRouterParam, readBody } from 'h3'
import { addMember } from '../../../../services/buildings.service'
import { created, defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => {
  const member = await addMember(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event))
  created(event)
  return member
})
