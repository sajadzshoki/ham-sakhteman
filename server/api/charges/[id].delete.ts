import { getRouterParam } from 'h3'
import { deleteCharge } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => deleteCharge(requireUser(event), getRouterParam(event, 'id') ?? ''))
