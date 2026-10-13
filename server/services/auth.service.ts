import { and, eq, gt } from 'drizzle-orm'
import type { User } from '../../shared/types'
import { profileSchema } from '../../shared/schemas'
import { getDb } from '../database/client'
import { buildingMembers, sessions, users } from '../database/schema'
import { findUserById } from '../repositories/lookup.repo'
import { ApiError } from '../utils/errors'
import { presentUser } from '../utils/present'
import { deleteSessionToken, hashToken } from '../utils/session'
import { initials } from '../utils/text'
import { parseSchema } from '../utils/validate'

export async function logoutToken(token: string | null) {
  if (token) await deleteSessionToken(token)
}

export async function getUserByToken(token: string): Promise<User | null> {
  const [row] = await getDb().select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(
    eq(sessions.tokenHash, hashToken(token)),
    gt(sessions.expiresAt, new Date()),
  )).limit(1)
  return row ? presentUser(row.user) : null
}

/** فقط نام قابل ویرایش است (تغییر شماره موبایل فعلاً پشتیبانی نمی‌شود). */
export async function updateProfile(user: User, input: unknown) {
  const data = parseSchema(profileSchema, input)
  const patch: { name?: string, avatarInitials?: string, updatedAt: Date } = { updatedAt: new Date() }
  if (data.name !== undefined) {
    patch.name = data.name
    patch.avatarInitials = initials(data.name)
  }
  const [row] = await getDb().update(users).set(patch).where(eq(users.id, user.id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'کاربر پیدا نشد')
  if (data.name !== undefined) {
    await getDb().update(buildingMembers).set({ name: data.name }).where(eq(buildingMembers.userId, user.id))
  }
  return presentUser(row)
}

export async function requireStoredUser(id: string) {
  const row = await findUserById(id)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'کاربر پیدا نشد')
  return row
}
