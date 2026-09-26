import { getRouterParam } from 'h3'
import { deleteAnnouncement } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => deleteAnnouncement(requireUser(event), getRouterParam(event, 'id') ?? ''))
