import { and, desc, eq, or, sql } from 'drizzle-orm'
import type { User } from '../../types'
import { providerCategories, providerQuerySchema, trustedSchema } from '../../shared/schemas'
import { getDb } from '../database/client'
import { serviceProviders } from '../database/schema'
import { requirePlatformManager } from './access.service'
import { ApiError } from '../utils/errors'
import { presentProvider } from '../utils/present'
import { parseId, parseSchema, queryValue } from '../utils/validate'

function searchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
}

export async function listProviders(query: unknown) {
  const raw = query && typeof query === 'object'
    ? {
        q: queryValue((query as { q?: unknown }).q) ?? '',
        category: queryValue((query as { category?: unknown }).category),
      }
    : {}
  const data = parseSchema(providerQuerySchema, raw)
  const filters = []
  if (data.category && data.category !== 'all') {
    if (!providerCategories.includes(data.category as typeof providerCategories[number])) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'دسته‌بندی نامعتبر است')
    }
    filters.push(eq(serviceProviders.category, data.category as typeof providerCategories[number]))
  }
  if (data.q) {
    const pattern = searchPattern(data.q)
    filters.push(or(
      sql`${serviceProviders.name} ILIKE ${pattern} ESCAPE '\\'`,
      sql`${serviceProviders.description} ILIKE ${pattern} ESCAPE '\\'`,
      sql`${serviceProviders.area} ILIKE ${pattern} ESCAPE '\\'`,
    ))
  }
  const rows = await getDb().select().from(serviceProviders).where(filters.length ? and(...filters) : undefined).orderBy(desc(serviceProviders.createdAt))
  return rows.map(presentProvider)
}

export async function getProvider(id: string) {
  parseId(id)
  const [row] = await getDb().select().from(serviceProviders).where(eq(serviceProviders.id, id)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'خدماتی پیدا نشد')
  return presentProvider(row)
}

export async function setProviderTrusted(user: User, id: string, input: unknown) {
  requirePlatformManager(user)
  parseId(id)
  const data = parseSchema(trustedSchema, input)
  const [row] = await getDb().update(serviceProviders).set({ trusted: data.trusted }).where(eq(serviceProviders.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'خدماتی پیدا نشد')
  return presentProvider(row)
}
