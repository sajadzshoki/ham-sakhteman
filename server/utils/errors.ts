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

function hasCode(error: unknown, code: string) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === code
}
