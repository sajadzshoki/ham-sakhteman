import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { ChargeWithPayments, ProblemStatus, User } from '../../shared/types'
import {
  announcementSchema,
  announcementUpdateSchema,
  categoryQuerySchema,
  chargeCreateSchema,
  chargeUpdateSchema,
  expenseCreateSchema,
  paymentCreateSchema,
  problemCategories,
  problemCreateSchema,
  problemUpdateSchema,
} from '../../shared/schemas'
import { getDb } from '../database/client'
import { announcements, buildingMembers, chargePayments, charges, expenses, problemReports } from '../database/schema'
import { userNameMap } from '../repositories/lookup.repo'
import { requireBuildingManager, requireBuildingReader } from './access.service'
import { deleteNotificationsForSource, notifyBuildingMembers, notifyUsers } from './notify'
import { ApiError, isUniqueViolation } from '../utils/errors'
import {
  presentAnnouncement,
  presentCharge,
  presentChargeWithPayments,
  presentExpense,
  presentPayment,
  presentProblem,
} from '../utils/present'
import { parseId, parseSchema, queryValue } from '../utils/validate'

function optionalUrl(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const problemStatusLabels: Record<ProblemStatus, string> = {
  'new': 'جدید',
  'in-progress': 'در حال رسیدگی',
  'resolved': 'حل‌شده',
}

// ——— اطلاعیه‌ها ———

export async function listAnnouncements(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(announcements).where(eq(announcements.buildingId, buildingId)).orderBy(desc(announcements.createdAt))
  const names = await userNameMap(rows.map((row) => row.createdBy))
  return rows.map((row) => presentAnnouncement(row, names))
}

async function loadAnnouncement(user: User, id: string) {
  parseId(id)
  const [row] = await getDb().select().from(announcements).where(eq(announcements.id, id)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'اطلاعیه پیدا نشد')
  const access = await requireBuildingReader(user, row.buildingId)
  return { row, access }
}

export async function getAnnouncement(user: User, id: string) {
  const { row } = await loadAnnouncement(user, id)
  return presentAnnouncement(row, await userNameMap([row.createdBy]))
}

export async function createAnnouncement(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(announcementSchema, input)
  const created = await getDb().transaction(async (tx) => {
    const [row] = await tx.insert(announcements).values({
      id: randomUUID(),
      buildingId,
      title: data.title,
      body: data.body,
      importance: data.importance,
      imageUrl: optionalUrl(data.image),
      createdBy: user.id,
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    const important = row.importance === 'important'
    await notifyBuildingMembers(tx, buildingId, {
      type: important ? 'announcement-important' : 'announcement',
      title: important ? `اطلاعیه مهم: «${row.title}»` : `اطلاعیه جدید: «${row.title}»`,
      body: row.body,
      link: `/announcements/${row.id}`,
      sourceId: row.id,
    }, { excludeUserId: user.id })
    return row
  })
  return presentAnnouncement(created, new Map([[user.id, user.name]]))
}

export async function updateAnnouncement(user: User, id: string, input: unknown) {
  const { row: current } = await loadAnnouncement(user, id)
  await requireBuildingManager(user, current.buildingId)
  const data = parseSchema(announcementUpdateSchema, input)
  const [row] = await getDb().update(announcements).set({
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.body !== undefined ? { body: data.body } : {}),
    ...(data.importance !== undefined ? { importance: data.importance } : {}),
    ...(data.image !== undefined ? { imageUrl: optionalUrl(data.image) } : {}),
    updatedAt: new Date(),
  }).where(eq(announcements.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'اطلاعیه پیدا نشد')
  return presentAnnouncement(row, await userNameMap([row.createdBy]))
}

export async function deleteAnnouncement(user: User, id: string) {
  const { row: current } = await loadAnnouncement(user, id)
  await requireBuildingManager(user, current.buildingId)
  await getDb().transaction(async (tx) => {
    await deleteNotificationsForSource(tx, id)
    await tx.delete(announcements).where(eq(announcements.id, id))
  })
  return { id }
}

// ——— گزارش مشکلات ———

export async function listProblems(user: User, buildingId: string, query: unknown) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const raw = query && typeof query === 'object' ? { category: queryValue((query as { category?: unknown }).category) } : {}
  const data = parseSchema(categoryQuerySchema, raw)
  const category = data.category && data.category !== 'all' ? data.category : undefined
  if (category && !problemCategories.includes(category as typeof problemCategories[number])) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'دسته‌بندی نامعتبر است')
  }
  const filters = [eq(problemReports.buildingId, buildingId)]
  if (category) filters.push(eq(problemReports.category, category as typeof problemCategories[number]))
  const rows = await getDb().select().from(problemReports).where(and(...filters)).orderBy(desc(problemReports.createdAt))
  const names = await userNameMap(rows.map((row) => row.createdBy))
  return rows.map((row) => presentProblem(row, names))
}

async function loadProblem(user: User, id: string) {
  parseId(id)
  const [row] = await getDb().select().from(problemReports).where(eq(problemReports.id, id)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'گزارش پیدا نشد')
  await requireBuildingReader(user, row.buildingId)
  return row
}

export async function getProblem(user: User, id: string) {
  const row = await loadProblem(user, id)
  return presentProblem(row, await userNameMap([row.createdBy]))
}

export async function createProblem(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const data = parseSchema(problemCreateSchema, input)
  const created = await getDb().transaction(async (tx) => {
    const [row] = await tx.insert(problemReports).values({
      id: randomUUID(),
      buildingId,
      category: data.category,
      title: data.title,
      description: data.description,
      imageUrl: optionalUrl(data.image),
      status: 'new',
      createdBy: user.id,
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    await notifyBuildingMembers(tx, buildingId, {
      type: 'problem-new',
      title: `گزارش مشکل جدید: «${row.title}»`,
      body: row.description,
      link: `/problems/${row.id}`,
      sourceId: row.id,
    }, { onlyManagers: true, excludeUserId: user.id })
    return row
  })
  return presentProblem(created, new Map([[user.id, user.name]]))
}

export async function updateProblem(user: User, id: string, input: unknown) {
  const current = await loadProblem(user, id)
  await requireBuildingManager(user, current.buildingId)
  const data = parseSchema(problemUpdateSchema, input)
  const row = await getDb().transaction(async (tx) => {
    const [updated] = await tx.update(problemReports).set({
      status: data.status,
      updatedAt: new Date(),
    }).where(eq(problemReports.id, id)).returning()
    if (!updated) throw new ApiError(404, 'NOT_FOUND', 'گزارش پیدا نشد')
    if (current.status !== data.status && updated.createdBy !== user.id) {
      await notifyUsers(tx, [updated.createdBy], {
        type: 'problem-status',
        title: `وضعیت گزارش «${updated.title}» تغییر کرد`,
        body: `وضعیت جدید: ${problemStatusLabels[updated.status]}`,
        link: `/problems/${updated.id}`,
        sourceId: updated.id,
      })
    }
    return updated
  })
  return presentProblem(row, await userNameMap([row.createdBy]))
}

export async function deleteProblem(user: User, id: string) {
  const current = await loadProblem(user, id)
  await requireBuildingManager(user, current.buildingId)
  await getDb().transaction(async (tx) => {
    await deleteNotificationsForSource(tx, id)
    await tx.delete(problemReports).where(eq(problemReports.id, id))
  })
  return { id }
}

// ——— شارژها و پرداخت‌ها ———

async function memberCountOf(buildingId: string) {
  const [row] = await getDb().select({ count: sql<number>`cast(count(*) as int)` }).from(buildingMembers).where(eq(buildingMembers.buildingId, buildingId))
  return Number(row?.count ?? 0)
}

async function presentChargeRows(
  rows: Array<typeof charges.$inferSelect>,
  buildingId: string,
  viewerMemberId: string | null,
): Promise<ChargeWithPayments[]> {
  if (!rows.length) return []
  const payments = await getDb().select().from(chargePayments).where(inArray(chargePayments.chargeId, rows.map((row) => row.id))).orderBy(chargePayments.paidAt)
  const [names, memberCount] = await Promise.all([
    userNameMap(rows.map((row) => row.createdBy)),
    memberCountOf(buildingId),
  ])
  return rows.map((row) => presentChargeWithPayments(
    row,
    payments.filter((payment) => payment.chargeId === row.id),
    { names, memberCount, viewerMemberId },
  ))
}

export async function listCharges(user: User, buildingId: string) {
  parseId(buildingId)
  const access = await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(charges).where(eq(charges.buildingId, buildingId)).orderBy(desc(charges.dueAt))
  return presentChargeRows(rows, buildingId, access.member?.id ?? null)
}

async function loadCharge(id: string) {
  parseId(id)
  const [row] = await getDb().select().from(charges).where(eq(charges.id, id)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'شارژ پیدا نشد')
  return row
}

export async function getCharge(user: User, id: string) {
  const row = await loadCharge(id)
  const access = await requireBuildingReader(user, row.buildingId)
  const [presented] = await presentChargeRows([row], row.buildingId, access.member?.id ?? null)
  if (!presented) throw new ApiError(404, 'NOT_FOUND', 'شارژ پیدا نشد')
  return presented
}

export async function createCharge(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(chargeCreateSchema, input)
  const created = await getDb().transaction(async (tx) => {
    const [row] = await tx.insert(charges).values({
      id: randomUUID(),
      buildingId,
      title: data.title,
      amount: data.amount,
      period: data.period,
      dueAt: data.dueAt,
      notes: data.notes || null,
      createdBy: user.id,
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    await notifyBuildingMembers(tx, buildingId, {
      type: 'charge-new',
      title: `شارژ جدید: «${row.title}»`,
      body: row.period ? `${row.title} — ${row.period}` : row.title,
      link: `/charges/${row.id}`,
      sourceId: row.id,
    }, { excludeUserId: user.id })
    return row
  })
  const memberCount = await memberCountOf(buildingId)
  return presentChargeWithPayments(created, [], { names: new Map([[user.id, user.name]]), memberCount })
}

/** ویرایش اطلاعات شارژ (مبلغ پس از ثبت قابل تغییر نیست تا پرداخت‌ها بی‌معنا نشوند) */
export async function updateCharge(user: User, id: string, input: unknown) {
  const current = await loadCharge(id)
  await requireBuildingManager(user, current.buildingId)
  const data = parseSchema(chargeUpdateSchema, input)
  const [row] = await getDb().update(charges).set({
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.period !== undefined ? { period: data.period } : {}),
    ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
    ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
  }).where(eq(charges.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'شارژ پیدا نشد')
  return presentCharge(row, await userNameMap([row.createdBy]))
}

/** حذف شارژ؛ پرداخت‌های آن به‌صورت cascade و اعلان‌های مرتبط دستی پاک می‌شوند */
export async function deleteCharge(user: User, id: string) {
  const current = await loadCharge(id)
  await requireBuildingManager(user, current.buildingId)
  await getDb().transaction(async (tx) => {
    const payments = await tx.select({ id: chargePayments.id }).from(chargePayments).where(eq(chargePayments.chargeId, id))
    await deleteNotificationsForSource(tx, [id, ...payments.map((payment) => payment.id)])
    await tx.delete(charges).where(eq(charges.id, id))
  })
  return { id }
}

export async function recordPayment(user: User, chargeId: string, input: unknown) {
  const charge = await loadCharge(chargeId)
  await requireBuildingManager(user, charge.buildingId)
  const data = parseSchema(paymentCreateSchema, input)
  const [member] = await getDb().select().from(buildingMembers).where(and(
    eq(buildingMembers.id, data.memberId),
    eq(buildingMembers.buildingId, charge.buildingId),
  )).limit(1)
  if (!member) throw new ApiError(422, 'VALIDATION_ERROR', 'عضو متعلق به این ساختمان نیست')

  try {
    const row = await getDb().transaction(async (tx) => {
      const [payment] = await tx.insert(chargePayments).values({
        id: randomUUID(),
        chargeId,
        memberId: member.id,
        memberName: member.name,
        amount: data.amount ?? charge.amount,
        paidAt: data.paidAt ?? new Date(),
        note: data.note?.trim() || null,
        method: 'manual',
        recordedBy: user.id,
      }).returning()
      if (!payment) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
      if (member.userId && member.userId !== user.id) {
        await notifyUsers(tx, [member.userId], {
          type: 'payment-recorded',
          title: `پرداخت «${charge.title}» ثبت شد`,
          body: charge.period ? `${charge.title} — ${charge.period}` : charge.title,
          link: `/charges/${charge.id}`,
          sourceId: payment.id,
        })
      }
      return payment
    })
    return presentPayment(row)
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, 'CONFLICT', 'پرداخت این عضو برای این شارژ قبلاً ثبت شده است')
    }
    throw error
  }
}

/** `paymentOrMemberId` می‌تواند شناسه پرداخت یا شناسه عضو باشد */
export async function removePayment(user: User, chargeId: string, paymentOrMemberId: string) {
  const charge = await loadCharge(chargeId)
  await requireBuildingManager(user, charge.buildingId)
  parseId(paymentOrMemberId)
  const [payment] = await getDb().select().from(chargePayments).where(and(
    eq(chargePayments.chargeId, chargeId),
    or(eq(chargePayments.id, paymentOrMemberId), eq(chargePayments.memberId, paymentOrMemberId)),
  )).limit(1)
  if (!payment) throw new ApiError(404, 'NOT_FOUND', 'پرداخت پیدا نشد')
  await getDb().transaction(async (tx) => {
    await deleteNotificationsForSource(tx, payment.id)
    await tx.delete(chargePayments).where(eq(chargePayments.id, payment.id))
  })
  return { id: payment.id }
}

// ——— هزینه‌ها ———

export async function listExpenses(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(expenses).where(eq(expenses.buildingId, buildingId)).orderBy(desc(expenses.date), desc(expenses.createdAt))
  const names = await userNameMap(rows.map((row) => row.createdBy))
  return rows.map((row) => presentExpense(row, names))
}

export async function createExpense(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(expenseCreateSchema, input)
  const [row] = await getDb().insert(expenses).values({
    id: randomUUID(),
    buildingId,
    title: data.title,
    amount: data.amount,
    category: data.category,
    date: data.date || new Date().toISOString().slice(0, 10),
    notes: data.notes || null,
    receiptUrl: optionalUrl(data.receipt),
    createdBy: user.id,
  }).returning()
  if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
  return presentExpense(row, new Map([[user.id, user.name]]))
}

export async function deleteExpense(user: User, id: string) {
  parseId(id)
  const [current] = await getDb().select().from(expenses).where(eq(expenses.id, id)).limit(1)
  if (!current) throw new ApiError(404, 'NOT_FOUND', 'هزینه پیدا نشد')
  await requireBuildingManager(user, current.buildingId)
  await getDb().delete(expenses).where(eq(expenses.id, id))
  return { id }
}