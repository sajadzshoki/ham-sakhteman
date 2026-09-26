import { getRouterParam, readBody } from 'h3'
import { markNotificationRead } from '../../services/directory.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => markNotificationRead(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event)))
