import { getQuery } from 'h3'
import { listProviders } from '../../services/providers.service'
import { defineApi } from '../../utils/api'

/** `?buildingId=` اضافه کردن فیلد trusted برای همان ساختمان (نیازمند ورود) */
export default defineApi(async (event) => listProviders(getQuery(event), event.context.user ?? null))
