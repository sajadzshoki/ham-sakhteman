import { getRouterParam, readBody } from 'h3'
import { setProviderTrusted } from '../../../../services/providers.service'
import { defineApi, requireUser } from '../../../../utils/api'

/** بدنه: `{ trusted: boolean }` — مورد اعتماد بودن فقط برای همین ساختمان */
export default defineApi(async (event) => setProviderTrusted(
  requireUser(event),
  getRouterParam(event, 'id') ?? '',
  getRouterParam(event, 'providerId') ?? '',
  await readBody(event),
))
