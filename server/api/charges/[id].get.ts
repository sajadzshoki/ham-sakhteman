import { getRouterParam } from 'h3'
import { getCharge } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => getCharge(requireUser(event), getRouterParam(event, 'id') ?? ''))
