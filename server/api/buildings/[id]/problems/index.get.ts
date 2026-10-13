import { getQuery, getRouterParam } from 'h3'
import { listProblems } from '../../../../services/content.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => listProblems(requireUser(event), getRouterParam(event, 'id') ?? '', getQuery(event)))
