import { adminOverview } from '../../services/directory.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => adminOverview(requireUser(event)))
