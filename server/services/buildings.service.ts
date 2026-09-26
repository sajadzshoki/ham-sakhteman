import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { User } from '../../types'
import {
  buildingCreateSchema,
  buildingUpdateSchema,
  joinSchema,
  memberCreateSchema,
  memberUpdateSchema,
  unitCreateSchema,
  unitUpdateSchema,
} from '../../shared/schemas'
import { getDb } from '../database/client'
import { buildingMembers, buildingUnits, buildings, invitations, users } from '../database/schema'
import { findBuildingByCode, findMembership, findUserByEmail, findUserById } from '../repositories/lookup.repo'
import { requireBuildingManager, requireBuildingReader, requirePlatformManager } from './access.service'
import { ApiError, isUniqueViolation } from '../utils/errors'
import { presentBuilding, presentInvitation, presentMember, presentUnit } from '../utils/present'
import { makeInvitationCode, normalizeCode } from '../utils/text'
import { parseId, parseSchema } from '../utils/validate'

async function countsFor(ids: string[]) {
  const units = new Map<string, number>()
  const members = new Map<string, number>()
  if (!ids.length) return { units, members }
  const db = getDb()
  const unitRows = await db.select({
    buildingId: buildingUnits.buildingId,
    count: sql<number>`cast(count(*) as int)`,
  }).from(buildingUnits).where(inArray(buildingUnits.buildingId, ids)).groupBy(buildingUnits.buildingId)
  const memberRows = await db.select({
    buildingId: buildingMembers.buildingId,
    count: sql<number>`cast(count(*) as int)`,
  }).from(buildingMembers).where(inArray(buildingMembers.buildingId, ids)).groupBy(buildingMembers.buildingId)
  for (const row of unitRows) units.set(row.buildingId, Number(row.count))
  for (const row of memberRows) members.set(row.buildingId, Number(row.count))
  return { units, members }
}

async function presentWithCounts(rows: Array<typeof buildings.$inferSelect>) {
  const { units, members } = await countsFor(rows.map((row) => row.id))
  return rows.map((row) => presentBuilding(row, units.get(row.id) ?? 0, members.get(row.id) ?? 0))
}

async function reserveCode() {
  const db = getDb()
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeInvitationCode()
    const [existing] = await db.select({ id: buildings.id }).from(buildings).where(eq(buildings.invitationCode, code)).limit(1)
    if (!existing) return code
  }
  throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
}

async function assertUnitInBuilding(buildingId: string, unitId: string) {
  const [unit] = await getDb().select().from(buildingUnits).where(and(
    eq(buildingUnits.id, unitId),
    eq(buildingUnits.buildingId, buildingId),
  )).limit(1)
  if (!unit) throw new ApiError(422, 'VALIDATION_ERROR', 'واحد متعلق به این ساختمان نیست')
  return unit
}

async function managerCount(buildingId: string) {
  const [row] = await getDb().select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(buildingMembers).where(and(
    eq(buildingMembers.buildingId, buildingId),
    eq(buildingMembers.role, 'manager'),
  ))
  return Number(row?.count ?? 0)
}

export async function listBuildings(user: User) {
  const db = getDb()
  if (user.role === 'admin') {
    const rows = await db.select().from(buildings).orderBy(desc(buildings.createdAt))
    return presentWithCounts(rows)
  }
  const rows = await db.select({ building: buildings }).from(buildings).innerJoin(buildingMembers, and(
    eq(buildingMembers.buildingId, buildings.id),
    eq(buildingMembers.userId, user.id),
  )).orderBy(desc(buildings.createdAt))
  return presentWithCounts(rows.map((row) => row.building))
}

export async function createBuilding(user: User, input: unknown) {
  requirePlatformManager(user)
  const data = parseSchema(buildingCreateSchema, input)
  const id = randomUUID()
  const code = await reserveCode()
  await getDb().transaction(async (tx) => {
    await tx.insert(buildings).values({
      id,
      name: data.name,
      address: data.address,
      description: data.description || null,
      managerId: user.id,
      invitationCode: code,
    })
    await tx.insert(buildingMembers).values({
      id: randomUUID(),
      buildingId: id,
      userId: user.id,
      role: 'manager',
    })
  })
  return getBuilding(user, id)
}

export async function getBuilding(user: User, id: string) {
  parseId(id)
  const access = await requireBuildingReader(user, id)
  const [presented] = await presentWithCounts([access.building])
  if (!presented) throw new ApiError(404, 'NOT_FOUND', 'ساختمان پیدا نشد')
  return presented
}

export async function updateBuilding(user: User, id: string, input: unknown) {
  parseId(id)
  await requireBuildingManager(user, id)
  const data = parseSchema(buildingUpdateSchema, input)
  const [row] = await getDb().update(buildings).set({
    ...data,
    description: data.description === undefined ? undefined : data.description || null,
    updatedAt: new Date(),
  }).where(eq(buildings.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'ساختمان پیدا نشد')
  const [presented] = await presentWithCounts([row])
  return presented
}

export async function listUnits(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(buildingUnits).where(eq(buildingUnits.buildingId, buildingId)).orderBy(buildingUnits.number)
  return rows.map(presentUnit)
}

export async function createUnit(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(unitCreateSchema, input)
  if (data.residentId) await assertKnownUser(data.residentId)
  try {
    const [row] = await getDb().insert(buildingUnits).values({
      id: randomUUID(),
      buildingId,
      number: data.number,
      floor: data.floor,
      status: data.status,
      residentName: data.residentName || null,
      residentUserId: data.residentId ?? null,
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    return presentUnit(row)
  } catch (error) {
    if (isUniqueViolation(error)) throw new ApiError(409, 'CONFLICT', 'این شماره واحد قبلاً ثبت شده است')
    throw error
  }
}

export async function updateUnit(user: User, buildingId: string, unitId: string, input: unknown) {
  parseId(buildingId)
  parseId(unitId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(unitUpdateSchema, input)
  await assertUnitInBuilding(buildingId, unitId)
  if (data.residentId) await assertKnownUser(data.residentId)
  const [row] = await getDb().update(buildingUnits).set({
    ...(data.number !== undefined ? { number: data.number } : {}),
    ...(data.floor !== undefined ? { floor: data.floor } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.residentName !== undefined ? { residentName: data.residentName || null } : {}),
    ...(data.residentId !== undefined ? { residentUserId: data.residentId } : {}),
  }).where(eq(buildingUnits.id, unitId)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'واحد پیدا نشد')
  return presentUnit(row)
}

export async function deleteUnit(user: User, buildingId: string, unitId: string) {
  parseId(buildingId)
  parseId(unitId)
  await requireBuildingManager(user, buildingId)
  await assertUnitInBuilding(buildingId, unitId)
  await getDb().delete(buildingUnits).where(eq(buildingUnits.id, unitId))
  return { id: unitId }
}

async function assertKnownUser(id: string) {
  const row = await findUserById(id)
  if (!row) throw new ApiError(422, 'VALIDATION_ERROR', 'کاربر پیدا نشد')
  return row
}

async function presentMembers(buildingId: string) {
  const rows = await getDb().select({
    member: buildingMembers,
    userId: users.id,
    name: users.name,
    avatarInitials: users.avatarInitials,
  }).from(buildingMembers).leftJoin(users, eq(buildingMembers.userId, users.id)).where(eq(buildingMembers.buildingId, buildingId)).orderBy(buildingMembers.joinedAt)
  return rows.map((row) => presentMember(row.member, row.userId ? {
    id: row.userId,
    name: row.name ?? 'عضو',
    avatarInitials: row.avatarInitials,
  } : undefined))
}

export async function listMembers(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  return presentMembers(buildingId)
}

export async function addMember(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(memberCreateSchema, input)
  const account = data.userId ? await findUserById(data.userId) : await findUserByEmail(data.email!)
  if (!account) throw new ApiError(404, 'NOT_FOUND', 'کاربر پیدا نشد')
  if (await findMembership(buildingId, account.id)) throw new ApiError(409, 'CONFLICT', 'این کاربر قبلاً عضو ساختمان است')
  if (data.unitId) await assertUnitInBuilding(buildingId, data.unitId)
  const [row] = await getDb().insert(buildingMembers).values({
    id: randomUUID(),
    buildingId,
    userId: account.id,
    role: data.role,
    unitId: data.unitId ?? null,
    invitedBy: user.id,
  }).returning()
  if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
  return presentMember(row, { id: account.id, name: account.name, avatarInitials: account.avatarInitials })
}

export async function updateMember(user: User, buildingId: string, memberId: string, input: unknown) {
  parseId(buildingId)
  parseId(memberId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(memberUpdateSchema, input)
  const [member] = await getDb().select().from(buildingMembers).where(and(
    eq(buildingMembers.id, memberId),
    eq(buildingMembers.buildingId, buildingId),
  )).limit(1)
  if (!member) throw new ApiError(404, 'NOT_FOUND', 'عضو پیدا نشد')
  if (data.role && data.role !== 'manager' && member.role === 'manager' && await managerCount(buildingId) <= 1) {
    throw new ApiError(409, 'CONFLICT', 'آخرین مدیر ساختمان را نمی‌توان تغییر نقش داد')
  }
  if (data.unitId) await assertUnitInBuilding(buildingId, data.unitId)
  const [row] = await getDb().update(buildingMembers).set({
    ...(data.role !== undefined ? { role: data.role } : {}),
    ...(data.unitId !== undefined ? { unitId: data.unitId } : {}),
  }).where(eq(buildingMembers.id, memberId)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'عضو پیدا نشد')
  const account = await findUserById(row.userId)
  return presentMember(row, account ? { id: account.id, name: account.name, avatarInitials: account.avatarInitials } : undefined)
}

export async function removeMember(user: User, buildingId: string, memberId: string) {
  parseId(buildingId)
  parseId(memberId)
  await requireBuildingManager(user, buildingId)
  const [member] = await getDb().select().from(buildingMembers).where(and(
    eq(buildingMembers.id, memberId),
    eq(buildingMembers.buildingId, buildingId),
  )).limit(1)
  if (!member) throw new ApiError(404, 'NOT_FOUND', 'عضو پیدا نشد')
  if (member.role === 'manager' && await managerCount(buildingId) <= 1) {
    throw new ApiError(409, 'CONFLICT', 'آخرین مدیر ساختمان را نمی‌توان حذف کرد')
  }
  await getDb().delete(buildingMembers).where(eq(buildingMembers.id, memberId))
  return { id: memberId }
}

export async function listInvitations(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const rows = await getDb().select().from(invitations).where(eq(invitations.buildingId, buildingId)).orderBy(desc(invitations.createdAt))
  return rows.map(presentInvitation)
}

export async function createInvitation(user: User, buildingId: string) {
  parseId(buildingId)
  const access = await requireBuildingManager(user, buildingId)
  const [row] = await getDb().insert(invitations).values({
    id: randomUUID(),
    buildingId,
    code: access.building.invitationCode,
    createdBy: user.id,
    used: false,
  }).returning()
  if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
  return presentInvitation(row)
}

export async function joinByCode(user: User, input: unknown) {
  const data = parseSchema(joinSchema, input)
  const building = await findBuildingByCode(normalizeCode(data.code))
  if (!building) throw new ApiError(404, 'NOT_FOUND', 'کد دعوت معتبر نیست')
  if (await findMembership(building.id, user.id)) throw new ApiError(409, 'CONFLICT', 'شما قبلاً عضو این ساختمان هستید')
  await getDb().insert(buildingMembers).values({
    id: randomUUID(),
    buildingId: building.id,
    userId: user.id,
    role: 'resident',
    invitedBy: building.managerId,
  })
  const [presented] = await presentWithCounts([building])
  return presented
}
