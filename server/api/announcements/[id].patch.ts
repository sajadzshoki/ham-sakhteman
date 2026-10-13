import { getRouterParam, readBody } from 'h3'
import { updateAnnouncement } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => updateAnnouncement(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event)))
