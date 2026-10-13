import type { z, ZodTypeAny } from 'zod'
import { uuidSchema } from '../../shared/schemas'
import { ApiError } from './errors'

export function parseSchema<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues[0]?.message || 'اطلاعات وارد شده نامعتبر است'
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_'
      ;(fieldErrors[key] ??= []).push(issue.message)
    }
    throw new ApiError(422, 'VALIDATION_ERROR', message, { fieldErrors })
  }
  return result.data
}

export function parseId(value: string | undefined) {
  return parseSchema(uuidSchema, value)
}

export function queryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}
