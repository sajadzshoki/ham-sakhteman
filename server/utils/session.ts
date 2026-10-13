import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getDb } from '../database/client'
import { sessions } from '../database/schema'
import { requireSessionSecret, sessionTtlMs } from './env'

export function hashToken(token: string) {
  return createHash('sha256').update(`${requireSessionSecret()}:${token}`).digest('hex')
}

export function createToken() {
  return randomBytes(32).toString('hex')
}

export async function insertSession(userId: string) {
  const token = createToken()
  const expiresAt = new Date(Date.now() + sessionTtlMs())
  await getDb().insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  })
  return token
}

export async function deleteSessionToken(token: string) {
  await getDb().delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
}

export { randomUUID }
