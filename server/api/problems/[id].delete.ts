import { getRouterParam } from 'h3'
import { deleteProblem } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => deleteProblem(requireUser(event), getRouterParam(event, 'id') ?? ''))
