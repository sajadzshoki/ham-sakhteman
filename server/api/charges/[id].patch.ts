import { getRouterParam, readBody } from 'h3'
import { updateCharge } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => updateCharge(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event)))
