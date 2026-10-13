import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { BuildingRole, User } from '../../shared/types'
import {
  buildingCreateSchema,
  buildingUpdateSchema,
  invitationCreateSchema,
  joinSchema,
  memberCreateSchema,
  memberUpdateSchema,
  unitCreateSchema,
  unitUpdateSchema,
} from '../../shared/schemas'
import { getDb } from '../database/client'
import { buildingMembers, buildingUnits, buildings, invitations } from '../database/schema'
import {
  findBuildingByCode,
  findBuildingById,
  findInvitationByCode,
  findMembership,
  findUserById,
  findUserByPhone,
} from '../repositories/lookup.repo'
import { requireBuildingManager, requireBuildingReader, requirePlatformManager } from './access.service'
import { ApiError, isUniqueViolation } from '../utils/errors'
import { invitationStatus, presentBuilding, presentInvitation, presentMember, presentUnit } from '../utils/present'
import { makeInvitationCode, normalizeCode } from '../utils/text'
import { parseId, parseSchema } from '../utils/validate'

const DEFAULT_INVITATION_DAYS = 7
const UNITS_PER_FLOOR = 4

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

async function presentWithCounts(rows: Array<typeof buildings.$inferSelect>, isManager: (row: typeof buildings.$inferSelect) => boolean) {
  const { units, members } = await countsFor(rows.map((row) => row.id))
  return rows.map((row) => presentBuilding(
    row,
    { unitsCount: units.get(row.id) ?? 0, memberCount: members.get(row.id) ?? 0 },
    { includeInvitation: isManager(row) },
  ))
}

/** کدی که نه روی ساختمان‌ها و نه روی دعوت‌نامه‌ها استفاده شده باشد */
async function reserveCode() {
  const db = getDb()
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeInvitationCode()
    const [building] = await db.select({ id: buildings.id }).from(buildings).where(eq(buildings.invitationCode, code)).limit(1)
    if (building) continue
    const [invitation] = await db.select({ id: invitations.id }).from(invitations).where(eq(invitations.code, code)).limit(1)
    if (!invitation) return code
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

// ——— ساختمان ———

export async function listBuildings(user: User) {
  const db = getDb()
  if (user.role === 'superadmin') {
    const rows = await db.select().from(buildings).orderBy(desc(buildings.createdAt))
    return presentWithCounts(rows, () => true)
  }
  const rows = await db.select({ building: buildings, role: buildingMembers.role }).from(buildings).innerJoin(buildingMembers, and(
    eq(buildingMembers.buildingId, buildings.id),
    eq(buildingMembers.userId, user.id),
  )).orderBy(desc(buildings.createdAt))
  const managed = new Set(rows.filter((row) => row.role === 'manager').map((row) => row.building.id))
  return presentWithCounts(rows.map((row) => row.building), (building) => managed.has(building.id))
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
      name: user.name,
      phone: user.phone,
      role: 'manager',
    })
    if (data.unitCount) {
      await tx.insert(buildingUnits).values(Array.from({ length: data.unitCount }, (_, index) => ({
        id: randomUUID(),
        buildingId: id,
        number: index + 1,
        floor: Math.ceil((index + 1) / UNITS_PER_FLOOR),
      })))
    }
  })
  return getBuilding(user, id)
}

export async function getBuilding(user: User, id: string) {
  parseId(id)
  const access = await requireBuildingReader(user, id)
  const [presented] = await presentWithCounts([access.building], () => access.isManager)
  if (!presented) throw new ApiError(404, 'NOT_FOUND', 'ساختمان پیدا نشد')
  return presented
}

export async function updateBuilding(user: User, id: string, input: unknown) {
  parseId(id)
  await requireBuildingManager(user, id)
  const data = parseSchema(buildingUpdateSchema, input)
  const [row] = await getDb().update(buildings).set({
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.address !== undefined ? { address: data.address } : {}),
    ...(data.description !== undefined ? { description: data.description || null } : {}),
    updatedAt: new Date(),
  }).where(eq(buildings.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'ساختمان پیدا نشد')
  const [presented] = await presentWithCounts([row], () => true)
  return presented
}

// ——— واحدها ———

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
  try {
    const [row] = await getDb().insert(buildingUnits).values({
      id: randomUUID(),
      buildingId,
      number: data.number,
      floor: data.floor,
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
  try {
    const [row] = await getDb().update(buildingUnits).set({
      ...(data.number !== undefined ? { number: data.number } : {}),
      ...(data.floor !== undefined ? { floor: data.floor } : {}),
    }).where(eq(buildingUnits.id, unitId)).returning()
    if (!row) throw new ApiError(404, 'NOT_FOUND', 'واحد پیدا نشد')
    return presentUnit(row)
  } catch (error) {
    if (isUniqueViolation(error)) throw new ApiError(409, 'CONFLICT', 'این شماره واحد قبلاً ثبت شده است')
    throw error
  }
}

export async function deleteUnit(user: User, buildingId: string, unitId: string) {
  parseId(buildingId)
  parseId(unitId)
  await requireBuildingManager(user, buildingId)
  await assertUnitInBuilding(buildingId, unitId)
  await getDb().delete(buildingUnits).where(eq(buildingUnits.id, unitId))
  return { id: unitId }
}

// ——— اعضا ———

export async function listMembers(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(buildingMembers).where(eq(buildingMembers.buildingId, buildingId)).orderBy(buildingMembers.joinedAt)
  return rows.map(presentMember)
}

export async function addMember(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(memberCreateSchema, input)

  const account = data.userId
    ? await findUserById(data.userId)
    : data.phone ? await findUserByPhone(data.phone) : null
  if (data.userId && !account) throw new ApiError(404, 'NOT_FOUND', 'کاربر پیدا نشد')
  if (account && await findMembership(buildingId, account.id)) {
    throw new ApiError(409, 'CONFLICT', 'این کاربر قبلاً عضو ساختمان است')
  }

  const phone = data.phone ?? account?.phone ?? null
  if (phone) {
    const [duplicate] = await getDb().select({ id: buildingMembers.id }).from(buildingMembers).where(and(
      eq(buildingMembers.buildingId, buildingId),
      eq(buildingMembers.phone, phone),
    )).limit(1)
    if (duplicate) throw new ApiError(409, 'CONFLICT', 'عضوی با این شماره قبلاً ثبت شده است')
  }
  if (data.unitId) await assertUnitInBuilding(buildingId, data.unitId)

  const [row] = await getDb().insert(buildingMembers).values({
    id: randomUUID(),
    buildingId,
    userId: account?.id ?? null,
    name: data.name,
    phone,
    role: data.role,
    unitId: data.unitId ?? null,
    unitStatus: data.unitId ? data.unitStatus ?? null : null,
    invitedBy: user.id,
  }).returning()
  if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
  return presentMember(row)
}

async function requireMember(buildingId: string, memberId: string) {
  const [member] = await getDb().select().from(buildingMembers).where(and(
    eq(buildingMembers.id, memberId),
    eq(buildingMembers.buildingId, buildingId),
  )).limit(1)
  if (!member) throw new ApiError(404, 'NOT_FOUND', 'عضو پیدا نشد')
  return member
}

export async function updateMember(user: User, buildingId: string, memberId: string, input: unknown) {
  parseId(buildingId)
  parseId(memberId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(memberUpdateSchema, input)
  const member = await requireMember(buildingId, memberId)
  if (data.role && data.role !== 'manager' && member.role === 'manager' && await managerCount(buildingId) <= 1) {
    throw new ApiError(409, 'CONFLICT', 'آخرین مدیر ساختمان را نمی‌توان تغییر نقش داد')
  }
  if (data.unitId) await assertUnitInBuilding(buildingId, data.unitId)
  if (data.phone) {
    const [duplicate] = await getDb().select({ id: buildingMembers.id }).from(buildingMembers).where(and(
      eq(buildingMembers.buildingId, buildingId),
      eq(buildingMembers.phone, data.phone),
    )).limit(1)
    if (duplicate && duplicate.id !== memberId) throw new ApiError(409, 'CONFLICT', 'عضوی با این شماره قبلاً ثبت شده است')
  }

  const nextUnitId = data.unitId === undefined ? member.unitId : data.unitId
  const [row] = await getDb().update(buildingMembers).set({
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(data.role !== undefined ? { role: data.role } : {}),
    ...(data.unitId !== undefined ? { unitId: data.unitId } : {}),
    // وضعیت مالک/مستأجر فقط برای عضوی که واحد دارد معنا دارد
    ...(!nextUnitId
      ? { unitStatus: null }
      : data.unitStatus !== undefined ? { unitStatus: data.unitStatus } : {}),
  }).where(eq(buildingMembers.id, memberId)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'عضو پیدا نشد')
  return presentMember(row)
}

export async function removeMember(user: User, buildingId: string, memberId: string) {
  parseId(buildingId)
  parseId(memberId)
  await requireBuildingManager(user, buildingId)
  const member = await requireMember(buildingId, memberId)
  if (member.role === 'manager' && await managerCount(buildingId) <= 1) {
    throw new ApiError(409, 'CONFLICT', 'آخرین مدیر ساختمان را نمی‌توان حذف کرد')
  }
  await getDb().delete(buildingMembers).where(eq(buildingMembers.id, memberId))
  return { id: memberId }
}

// ——— دعوت‌نامه‌ها ———

export async function listInvitations(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const rows = await getDb().select().from(invitations).where(eq(invitations.buildingId, buildingId)).orderBy(desc(invitations.createdAt))
  return rows.map(presentInvitation)
}

export async function createInvitation(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(invitationCreateSchema, input ?? {})
  const expiresAt = data.expiresAt ?? new Date(Date.now() + DEFAULT_INVITATION_DAYS * 86400000)
  if (expiresAt.getTime() <= Date.now()) throw new ApiError(422, 'VALIDATION_ERROR', 'تاریخ انقضا باید در آینده باشد')
  const code = await reserveCode()
  const row = await getDb().transaction(async (tx) => {
    const [created] = await tx.insert(invitations).values({
      id: randomUUID(),
      buildingId,
      code,
      role: data.role,
      createdBy: user.id,
      expiresAt,
    }).returning()
    // آخرین کد فعال روی ساختمان نگه داشته می‌شود
    await tx.update(buildings).set({ invitationCode: code, updatedAt: new Date() }).where(eq(buildings.id, buildingId))
    return created
  })
  if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
  return presentInvitation(row)
}

export async function deleteInvitation(user: User, buildingId: string, invitationId: string) {
  parseId(buildingId)
  parseId(invitationId)
  const { building } = await requireBuildingManager(user, buildingId)
  const [invitation] = await getDb().select().from(invitations).where(and(
    eq(invitations.id, invitationId),
    eq(invitations.buildingId, buildingId),
  )).limit(1)
  if (!invitation) throw new ApiError(404, 'NOT_FOUND', 'دعوت‌نامه پیدا نشد')
  const replacement = building.invitationCode === invitation.code ? await reserveCode() : null
  await getDb().transaction(async (tx) => {
    await tx.delete(invitations).where(eq(invitations.id, invitationId))
    // کد حذف‌شده نباید به‌عنوان کد عمومی ساختمان قابل استفاده بماند
    if (replacement) await tx.update(buildings).set({ invitationCode: replacement, updatedAt: new Date() }).where(eq(buildings.id, buildingId))
  })
  return { id: invitationId }
}

export async function joinByCode(user: User, input: unknown) {
  const data = parseSchema(joinSchema, input)
  if (user.role === 'superadmin') throw new ApiError(403, 'FORBIDDEN', 'سوپرادمین نمی‌تواند عضو ساختمان شود')
  const code = normalizeCode(data.code)

  const invitation = await findInvitationByCode(code)
  let building
  let role: BuildingRole = 'resident'
  let invitedBy: string
  if (invitation) {
    const status = invitationStatus(invitation)
    if (status === 'used') throw new ApiError(410, 'INVITATION_USED', 'این کد دعوت قبلاً استفاده شده است')
    if (status === 'expired') throw new ApiError(410, 'INVITATION_EXPIRED', 'این کد دعوت منقضی شده است')
    building = await findBuildingById(invitation.buildingId)
    role = invitation.role
    invitedBy = invitation.createdBy
  } else {
    // کد اولیه‌ی ساختمان (پیش از ساخت اولین دعوت‌نامه) برای پیوستن به‌عنوان ساکن
    building = await findBuildingByCode(code)
    invitedBy = building?.managerId ?? ''
  }
  if (!building) throw new ApiError(404, 'NOT_FOUND', 'کد دعوت معتبر نیست')
  if (await findMembership(building.id, user.id)) throw new ApiError(409, 'CONFLICT', 'شما قبلاً عضو این ساختمان هستید')
  const buildingId = building.id

  await getDb().transaction(async (tx) => {
    if (invitation) {
      const [claimed] = await tx.update(invitations).set({
        used: true,
        usedBy: user.id,
        usedAt: new Date(),
      }).where(and(
        eq(invitations.id, invitation.id),
        eq(invitations.used, false),
        gt(invitations.expiresAt, new Date()),
      )).returning({ id: invitations.id })
      if (!claimed) throw new ApiError(410, 'INVITATION_USED', 'این کد دعوت قبلاً استفاده شده یا منقضی شده است')
    }

    // اگر مدیر قبلاً عضو مهمانی با همین شماره ثبت کرده، حساب کاربری به همان عضو وصل می‌شود
    const [guest] = await tx.select().from(buildingMembers).where(and(
      eq(buildingMembers.buildingId, buildingId),
      isNull(buildingMembers.userId),
      eq(buildingMembers.phone, user.phone),
    )).limit(1)
    if (guest) {
      await tx.update(buildingMembers).set({
        userId: user.id,
        role: role === 'manager' ? 'manager' : guest.role,
      }).where(eq(buildingMembers.id, guest.id))
    } else {
      await tx.insert(buildingMembers).values({
        id: randomUUID(),
        buildingId,
        userId: user.id,
        name: user.name,
        phone: user.phone,
        role,
        invitedBy,
      })
    }
  })

  const [presented] = await presentWithCounts([building], () => role === 'manager')
  return presented
}
