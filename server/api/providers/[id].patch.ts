import { getRouterParam, readBody } from 'h3'
import { setProviderTrusted } from '../../services/providers.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => setProviderTrusted(requireUser(event), getRouterParam(event, 'id') ?? '', await readBody(event)))
