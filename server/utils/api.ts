import { defineEventHandler, setResponseStatus, type H3Event } from 'h3'
import type { User } from '../../types'
import { ApiError, isForeignKeyViolation, isUniqueViolation } from './errors'

export function defineApi(handler: (event: H3Event) => Promise<unknown>) {
  return defineEventHandler(async (event) => {
    try {
      const data = await handler(event)
      return { success: true, data }
    } catch (error) {
      if (error instanceof ApiError) {
        setResponseStatus(event, error.status)
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        }
      }
      if (isUniqueViolation(error)) {
        setResponseStatus(event, 409)
        return { success: false, error: { code: 'CONFLICT', message: 'این مقدار قبلاً ثبت شده است', details: {} } }
      }
      if (isForeignKeyViolation(error)) {
        setResponseStatus(event, 422)
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'ارجاع داده‌شده معتبر نیست', details: {} } }
      }
      console.error(error)
      setResponseStatus(event, 500)
      return {
        success: false,
        error: {
          code: 'INTERNAL',
          message: 'خطای داخلی سرور',
          details: {},
        },
      }
    }
  })
}

export function requireUser(event: H3Event): User {
  if (!event.context.user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'برای ادامه وارد شوید')
  }
  return event.context.user
}

export function created(event: H3Event) {
  setResponseStatus(event, 201)
}
