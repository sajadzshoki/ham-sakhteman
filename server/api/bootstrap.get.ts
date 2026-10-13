import { getQuery } from 'h3'
import { buildBootstrap } from '../services/bootstrap.service'
import { defineApi, requireUser } from '../utils/api'

/** بسته‌ی آغازین UI: کاربر، ساختمان‌ها و تمام داده‌ی ساختمان فعال (`?buildingId=` اختیاری) */
export default defineApi(async (event) => buildBootstrap(requireUser(event), getQuery(event)))
