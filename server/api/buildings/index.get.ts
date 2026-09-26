import { defineApi, requireUser } from '../../utils/api'
import { listBuildings } from '../../services/buildings.service'

export default defineApi(async (event) => listBuildings(requireUser(event)))
