import { getRouterParam, readBody } from 'h3'
import { updateProblem } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => updateProblem(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event)))
