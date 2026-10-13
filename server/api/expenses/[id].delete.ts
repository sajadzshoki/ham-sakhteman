import { getRouterParam } from 'h3'
import { deleteExpense } from '../../services/content.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => deleteExpense(requireUser(event), getRouterParam(event, 'id') ?? ''))
