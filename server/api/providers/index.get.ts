import { getQuery } from 'h3'
import { listProviders } from '../../services/providers.service'
import { defineApi } from '../../utils/api'

export default defineApi(async (event) => listProviders(getQuery(event)))
