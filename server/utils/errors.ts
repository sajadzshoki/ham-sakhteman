export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isUniqueViolation(error: unknown) {
  return hasCode(error, '23505')
}

export function isForeignKeyViolation(error: unknown) {
  return hasCode(error, '23503')
}

/** Drizzle خطای درایور را در `cause` می‌پیچد؛ کل زنجیره بررسی می‌شود. */
function hasCode(error: unknown, code: string) {
  let current: unknown = error
  for (let depth = 0; depth < 5 && typeof current === 'object' && current !== null; depth += 1) {
    if ((current as { code?: unknown }).code === code) return true
    current = (current as { cause?: unknown }).cause
  }
  return false
}
