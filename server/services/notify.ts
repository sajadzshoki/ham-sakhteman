import { and, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { AppDatabase } from '../database/client'
import { buildingMembers, notifications } from '../database/schema'
import type { NotificationType } from '../../shared/types'

type Executor = Pick<AppDatabase, 'insert' | 'select' | 'delete'>

export interface NotificationInput {
  type: NotificationType
  title: string
  body: string
  link: string
  sourceId: string
}

/** اعلان را برای کاربران مشخص می‌سازد؛ اگر برای همان منبع قبلاً وجود داشته باشد، به‌روز و دوباره خوانده‌نشده می‌شود. */
export async function notifyUsers(tx: Executor, userIds: string[], input: NotificationInput) {
  const unique = [...new Set(userIds)]
  if (!unique.length) return
  await tx.insert(notifications).values(unique.map((userId) => ({
    id: randomUUID(),
    userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    sourceId: input.sourceId,
  }))).onConflictDoUpdate({
    target: [notifications.userId, notifications.type, notifications.sourceId],
    set: {
      title: input.title,
      body: input.body,
      link: input.link,
      readAt: null,
      createdAt: sql`now()`,
    },
  })
}

/** اعلان برای اعضای دارای حساب کاربری ساختمان (در صورت نیاز فقط مدیران، بدون فرستنده). */
export async function notifyBuildingMembers(
  tx: Executor,
  buildingId: string,
  input: NotificationInput,
  options: { onlyManagers?: boolean, excludeUserId?: string } = {},
) {
  const filters = [eq(buildingMembers.buildingId, buildingId), isNotNull(buildingMembers.userId)]
  if (options.onlyManagers) filters.push(eq(buildingMembers.role, 'manager'))
  if (options.excludeUserId) filters.push(ne(buildingMembers.userId, options.excludeUserId))
  const members = await tx.select({ userId: buildingMembers.userId }).from(buildingMembers).where(and(...filters))
  await notifyUsers(tx, members.map((member) => member.userId).filter((id): id is string => Boolean(id)), input)
}

export async function deleteNotificationsForSource(tx: Executor, sourceId: string | string[]) {
  const ids = Array.isArray(sourceId) ? sourceId : [sourceId]
  if (!ids.length) return
  await tx.delete(notifications).where(inArray(notifications.sourceId, ids))
}
