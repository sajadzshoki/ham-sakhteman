import { getRouterParam } from 'h3'
import { getProvider } from '../../services/providers.service'
import { defineApi } from '../../utils/api'

export default defineApi(async (event) => getProvider(getRouterParam(event, 'id') ?? ''))
