import { getRouterParam } from 'h3'
import { getProblem } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => getProblem(requireUser(event), getRouterParam(event, 'id') ?? ''))
