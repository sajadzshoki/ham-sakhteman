import { and, desc, eq, sql } from 'drizzle-orm'
import type { User } from '../../types'
import { notificationReadSchema } from '../../shared/schemas'
import { getDb } from '../database/client'
import { announcements, buildings, notifications, problemReports, serviceProviders, users } from '../database/schema'
import { requireAdmin } from './access.service'
import { listBuildings } from './buildings.service'
import { ApiError } from '../utils/errors'
import { presentNotification, presentProvider } from '../utils/present'
import { parseId, parseSchema } from '../utils/validate'

export async function listNotifications(user: User) {
  const rows = await getDb().select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt))
  return rows.map(presentNotification)
}

export async function markNotificationRead(user: User, id: string, input: unknown) {
  parseId(id)
  parseSchema(notificationReadSchema, input)
  const [row] = await getDb().update(notifications).set({ unread: false }).where(and(
    eq(notifications.id, id),
    eq(notifications.userId, user.id),
  )).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'اعلان پیدا نشد')
  return presentNotification(row)
}

export async function markAllNotificationsRead(user: User) {
  await getDb().update(notifications).set({ unread: false }).where(eq(notifications.userId, user.id))
  return { ok: true }
}

async function countOf(table: typeof users | typeof buildings | typeof serviceProviders | typeof announcements | typeof problemReports) {
  const [row] = await getDb().select({ count: sql<number>`cast(count(*) as int)` }).from(table)
  return Number(row?.count ?? 0)
}

export async function adminOverview(user: User) {
  requireAdmin(user)
  const [buildingCount, userCount, providerCount, announcementCount, problemCount, providerRows, buildingList] = await Promise.all([
    countOf(buildings),
    countOf(users),
    countOf(serviceProviders),
    countOf(announcements),
    countOf(problemReports),
    getDb().select().from(serviceProviders).orderBy(desc(serviceProviders.createdAt)),
    listBuildings(user),
  ])
  return {
    buildings: buildingCount,
    users: userCount,
    providers: providerCount,
    announcements: announcementCount,
    problems: problemCount,
    buildingList,
    providerList: providerRows.map(presentProvider),
  }
}
