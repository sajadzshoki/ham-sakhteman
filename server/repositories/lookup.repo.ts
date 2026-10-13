import { and, eq } from 'drizzle-orm'
import { getDb } from '../database/client'
import { buildingMembers, buildings, users } from '../database/schema'

export async function findUserByEmail(email: string) {
  const [row] = await getDb().select().from(users).where(eq(users.email, email)).limit(1)
  return row ?? null
}

export async function findUserById(id: string) {
  const [row] = await getDb().select().from(users).where(eq(users.id, id)).limit(1)
  return row ?? null
}

export async function findBuildingById(id: string) {
  const [row] = await getDb().select().from(buildings).where(eq(buildings.id, id)).limit(1)
  return row ?? null
}

export async function findBuildingByCode(code: string) {
  const [row] = await getDb().select().from(buildings).where(eq(buildings.invitationCode, code)).limit(1)
  return row ?? null
}

export async function findMembership(buildingId: string, userId: string) {
  const [row] = await getDb().select().from(buildingMembers).where(and(
    eq(buildingMembers.buildingId, buildingId),
    eq(buildingMembers.userId, userId),
  )).limit(1)
  return row ?? null
}
