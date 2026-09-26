import bcrypt from 'bcryptjs'
import { and, eq, gt } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { User } from '../../types'
import { getDb } from '../database/client'
import { sessions, users } from '../database/schema'
import { findUserByEmail, findUserById } from '../repositories/lookup.repo'
import { ApiError, isUniqueViolation } from '../utils/errors'
import { presentUser } from '../utils/present'
import { deleteSessionToken, hashToken, insertSession } from '../utils/session'
import { initials } from '../utils/text'
import { parseSchema } from '../utils/validate'
import { loginSchema, profileSchema, registerSchema } from '../../shared/schemas'

const dummyHash = bcrypt.hashSync('dummy-password-not-a-user', 10)

export async function registerUser(input: unknown) {
  const data = parseSchema(registerSchema, input)
  const existing = await findUserByEmail(data.email)
  if (existing) throw new ApiError(409, 'CONFLICT', 'این ایمیل قبلاً ثبت شده است')

  try {
    const [row] = await getDb().insert(users).values({
      id: randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: 'manager',
      avatarInitials: initials(data.name),
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    const token = await insertSession(row.id)
    return { user: presentUser(row), token }
  } catch (error) {
    if (isUniqueViolation(error)) throw new ApiError(409, 'CONFLICT', 'این ایمیل قبلاً ثبت شده است')
    throw error
  }
}

export async function loginUser(input: unknown) {
  const data = parseSchema(loginSchema, input)
  const row = await findUserByEmail(data.email)
  const matches = await bcrypt.compare(data.password, row?.passwordHash ?? dummyHash)
  if (!row || !matches) throw new ApiError(401, 'UNAUTHORIZED', 'ایمیل یا رمز عبور نادرست است')
  const token = await insertSession(row.id)
  return { user: presentUser(row), token }
}

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

export async function updateProfile(user: User, input: unknown) {
  const data = parseSchema(profileSchema, input)
  if (data.email) {
    const other = await findUserByEmail(data.email)
    if (other && other.id !== user.id) throw new ApiError(409, 'CONFLICT', 'این ایمیل قبلاً ثبت شده است')
  }

  const patch: {
    name?: string
    email?: string
    phone?: string | null
    avatarInitials?: string
    updatedAt: Date
  } = { updatedAt: new Date() }
  if (data.name !== undefined) {
    patch.name = data.name
    patch.avatarInitials = initials(data.name)
  }
  if (data.email !== undefined) patch.email = data.email
  if (data.phone !== undefined) patch.phone = data.phone || null

  try {
    const [row] = await getDb().update(users).set(patch).where(eq(users.id, user.id)).returning()
    if (!row) throw new ApiError(404, 'NOT_FOUND', 'کاربر پیدا نشد')
    return presentUser(row)
  } catch (error) {
    if (isUniqueViolation(error)) throw new ApiError(409, 'CONFLICT', 'این ایمیل قبلاً ثبت شده است')
    throw error
  }
}

export async function requireStoredUser(id: string) {
  const row = await findUserById(id)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'کاربر پیدا نشد')
  return row
}
