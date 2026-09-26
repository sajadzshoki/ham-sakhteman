import { readBody } from 'h3'
import { createBuilding } from '../../services/buildings.service'
import { created, defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => {
  const building = await createBuilding(requireUser(event), await readBody(event))
  created(event)
  return building
})
