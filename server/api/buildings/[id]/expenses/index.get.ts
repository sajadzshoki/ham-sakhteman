import { getRouterParam } from 'h3'
import { listExpenses } from '../../../../services/content.service'
import { defineApi, requireUser } from '../../../../utils/api'

export default defineApi(async (event) => listExpenses(requireUser(event), getRouterParam(event, 'id') ?? ''))
