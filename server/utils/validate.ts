import { type ZodType } from 'zod'
import { uuidSchema } from '../../shared/schemas'
import { ApiError } from './errors'

export function parseSchema<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues[0]?.message || 'اطلاعات وارد شده نامعتبر است'
    throw new ApiError(422, 'VALIDATION_ERROR', message, { fieldErrors: result.error.flatten().fieldErrors })
  }
  return result.data
}

export function parseId(value: string | undefined) {
  return parseSchema(uuidSchema, value)
}

export function queryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}
