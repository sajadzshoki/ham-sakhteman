import { getRouterParam } from 'h3'
import { removePayment } from '../../../../services/content.service'
import { defineApi, requireUser } from '../../../../utils/api'

/** `paymentId` می‌تواند شناسه پرداخت یا شناسه عضو باشد */
export default defineApi(async (event) => removePayment(
  requireUser(event),
  getRouterParam(event, 'id') ?? '',
  getRouterParam(event, 'paymentId') ?? '',
))
