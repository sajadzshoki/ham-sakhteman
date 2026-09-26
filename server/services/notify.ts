import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { AppDatabase } from '../database/client'
import { buildingMembers, notifications } from '../database/schema'

type Executor = Pick<AppDatabase, 'insert' | 'select' | 'delete'>

export async function notifyBuildingMembers(
  tx: Executor,
  buildingId: string,
  input: { type: 'announcement' | 'problem' | 'charge' | 'service', title: string, message: string, link: string, sourceId: string },
) {
  const members = await tx.select({ userId: buildingMembers.userId }).from(buildingMembers).where(eq(buildingMembers.buildingId, buildingId))
  if (!members.length) return
  await tx.insert(notifications).values(members.map((member) => ({
    id: randomUUID(),
    userId: member.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    sourceId: input.sourceId,
    unread: true,
  })))
}

export async function deleteNotificationsForSource(tx: Executor, sourceId: string) {
  await tx.delete(notifications).where(eq(notifications.sourceId, sourceId))
}

export function ownedNotification(userId: string, id: string) {
  return and(eq(notifications.id, id), eq(notifications.userId, userId))
}
