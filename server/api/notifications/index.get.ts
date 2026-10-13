import { listNotifications } from '../../services/directory.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => listNotifications(requireUser(event)))
