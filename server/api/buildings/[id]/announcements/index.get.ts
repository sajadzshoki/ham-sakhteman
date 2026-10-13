import { getRouterParam } from 'h3'
import { listAnnouncements } from '../../../../services/content.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => listAnnouncements(requireUser(event), getRouterParam(event, 'id') ?? ''))
