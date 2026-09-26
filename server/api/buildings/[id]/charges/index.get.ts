import { getRouterParam } from 'h3'
import { listCharges } from '../../../../services/content.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => listCharges(requireUser(event), getRouterParam(event, 'id') ?? ''))
