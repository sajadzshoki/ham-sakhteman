import { getRouterParam } from 'h3'
import { getAnnouncement } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => getAnnouncement(requireUser(event), getRouterParam(event, 'id') ?? ''))
