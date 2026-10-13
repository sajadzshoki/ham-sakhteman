import { and, desc, eq, or, sql } from 'drizzle-orm'
import type { User } from '../../shared/types'
import { providerCategories, providerQuerySchema, trustedSchema } from '../../shared/schemas'
import { getDb } from '../database/client'
import { buildingTrustedProviders, serviceProviders } from '../database/schema'
import { requireBuildingManager, requireBuildingReader } from './access.service'
import { ApiError } from '../utils/errors'
import { presentProvider } from '../utils/present'
import { parseId, parseSchema, queryValue } from '../utils/validate'

function searchPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
}

/** شناسه ارائه‌دهندگان مورد اعتماد یک ساختمان؛ فقط برای اعضای همان ساختمان (یا سوپرادمین) */
async function trustedIdsFor(user: User | null, buildingId: string) {
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'برای ادامه وارد شوید')
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select({ providerId: buildingTrustedProviders.providerId }).from(buildingTrustedProviders).where(eq(buildingTrustedProviders.buildingId, buildingId))
  return new Set(rows.map((row) => row.providerId))
}

export async function listProviders(query: unknown, user: User | null = null) {
  const source = query && typeof query === 'object' ? query as Record<string, unknown> : {}
  const data = parseSchema(providerQuerySchema, {
    q: queryValue(source.q) ?? '',
    category: queryValue(source.category),
    buildingId: queryValue(source.buildingId) || undefined,
  })
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
      sql`${serviceProviders.serviceArea} ILIKE ${pattern} ESCAPE '\\'`,
    ))
  }
  const trusted = data.buildingId ? await trustedIdsFor(user, data.buildingId) : null
  const rows = await getDb().select().from(serviceProviders).where(filters.length ? and(...filters) : undefined).orderBy(desc(serviceProviders.rating), serviceProviders.name)
  return rows.map((row) => presentProvider(row, trusted ? trusted.has(row.id) : undefined))
}

export async function getProvider(id: string, query: unknown = {}, user: User | null = null) {
  parseId(id)
  const source = query && typeof query === 'object' ? query as Record<string, unknown> : {}
  const buildingId = queryValue(source.buildingId)
  const [row] = await getDb().select().from(serviceProviders).where(eq(serviceProviders.id, id)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'خدماتی پیدا نشد')
  if (!buildingId) return presentProvider(row)
  const trusted = await trustedIdsFor(user, parseId(String(buildingId)))
  return presentProvider(row, trusted.has(row.id))
}

/** مورد اعتماد بودن ارائه‌دهنده فقط برای همان ساختمان و توسط مدیر آن تنظیم می‌شود */
export async function setProviderTrusted(user: User, buildingId: string, providerId: string, input: unknown) {
  parseId(buildingId)
  parseId(providerId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(trustedSchema, input)
  const [row] = await getDb().select().from(serviceProviders).where(eq(serviceProviders.id, providerId)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'خدماتی پیدا نشد')
  if (data.trusted) {
    await getDb().insert(buildingTrustedProviders).values({ buildingId, providerId }).onConflictDoNothing()
  } else {
    await getDb().delete(buildingTrustedProviders).where(and(
      eq(buildingTrustedProviders.buildingId, buildingId),
      eq(buildingTrustedProviders.providerId, providerId),
    ))
  }
  return presentProvider(row, data.trusted)
}
