import { and, desc, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { User } from '../../types'
import {
  announcementSchema,
  announcementUpdateSchema,
  categoryQuerySchema,
  chargeCreateSchema,
  chargeUpdateSchema,
  expenseCategories,
  expenseCreateSchema,
  problemCategories,
  problemCreateSchema,
  problemUpdateSchema,
} from '../../shared/schemas'
import { getDb } from '../database/client'
import { announcements, charges, expenses, problemReports } from '../database/schema'
import { requireBuildingManager, requireBuildingReader } from './access.service'
import { deleteNotificationsForSource, notifyBuildingMembers } from './notify'
import { ApiError } from '../utils/errors'
import { presentAnnouncement, presentCharge, presentExpense, presentProblem } from '../utils/present'
import { parseId, parseSchema, queryValue } from '../utils/validate'

function optionalUrl(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function listAnnouncements(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(announcements).where(eq(announcements.buildingId, buildingId)).orderBy(desc(announcements.createdAt))
  return rows.map(presentAnnouncement)
}

export async function getAnnouncement(user: User, id: string) {
  parseId(id)
  const [row] = await getDb().select().from(announcements).where(eq(announcements.id, id)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'اطلاعیه پیدا نشد')
  await requireBuildingReader(user, row.buildingId)
  return presentAnnouncement(row)
}

export async function createAnnouncement(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(announcementSchema, input)
  const id = randomUUID()
  const created = await getDb().transaction(async (tx) => {
    const [row] = await tx.insert(announcements).values({
      id,
      buildingId,
      title: data.title,
      description: data.description,
      importance: data.importance,
      imageUrl: optionalUrl(data.imageUrl),
      createdBy: user.id,
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    await notifyBuildingMembers(tx, buildingId, {
      type: 'announcement',
      title: row.title,
      message: row.description,
      link: `/announcements?id=${row.id}`,
      sourceId: row.id,
    })
    return row
  })
  return presentAnnouncement(created)
}

export async function updateAnnouncement(user: User, id: string, input: unknown) {
  parseId(id)
  const current = await getAnnouncement(user, id)
  await requireBuildingManager(user, current.buildingId)
  const data = parseSchema(announcementUpdateSchema, input)
  const [row] = await getDb().update(announcements).set({
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.importance !== undefined ? { importance: data.importance } : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: optionalUrl(data.imageUrl) } : {}),
  }).where(eq(announcements.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'اطلاعیه پیدا نشد')
  return presentAnnouncement(row)
}

export async function deleteAnnouncement(user: User, id: string) {
  parseId(id)
  const current = await getAnnouncement(user, id)
  await requireBuildingManager(user, current.buildingId)
  await getDb().transaction(async (tx) => {
    await deleteNotificationsForSource(tx, id)
    await tx.delete(announcements).where(eq(announcements.id, id))
  })
  return { id }
}

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
  return rows.map(presentProblem)
}

export async function getProblem(user: User, id: string) {
  parseId(id)
  const [row] = await getDb().select().from(problemReports).where(eq(problemReports.id, id)).limit(1)
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'گزارش پیدا نشد')
  await requireBuildingReader(user, row.buildingId)
  return presentProblem(row)
}

export async function createProblem(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const data = parseSchema(problemCreateSchema, input)
  const id = randomUUID()
  const created = await getDb().transaction(async (tx) => {
    const [row] = await tx.insert(problemReports).values({
      id,
      buildingId,
      category: data.category,
      title: data.title,
      description: data.description,
      imageUrl: optionalUrl(data.imageUrl),
      status: 'new',
      createdBy: user.id,
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    await notifyBuildingMembers(tx, buildingId, {
      type: 'problem',
      title: 'گزارش مشکل جدید',
      message: row.title,
      link: `/problems?id=${row.id}`,
      sourceId: row.id,
    })
    return row
  })
  return presentProblem(created)
}

export async function updateProblem(user: User, id: string, input: unknown) {
  parseId(id)
  const current = await getProblem(user, id)
  await requireBuildingManager(user, current.buildingId)
  const data = parseSchema(problemUpdateSchema, input)
  const [row] = await getDb().update(problemReports).set({
    status: data.status,
    updatedAt: new Date(),
  }).where(eq(problemReports.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'گزارش پیدا نشد')
  return presentProblem(row)
}

export async function deleteProblem(user: User, id: string) {
  parseId(id)
  const current = await getProblem(user, id)
  await requireBuildingManager(user, current.buildingId)
  await getDb().transaction(async (tx) => {
    await deleteNotificationsForSource(tx, id)
    await tx.delete(problemReports).where(eq(problemReports.id, id))
  })
  return { id }
}

export async function listCharges(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(charges).where(eq(charges.buildingId, buildingId)).orderBy(desc(charges.dueDate))
  return rows.map(presentCharge)
}

export async function createCharge(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(chargeCreateSchema, input)
  const id = randomUUID()
  const created = await getDb().transaction(async (tx) => {
    const [row] = await tx.insert(charges).values({
      id,
      buildingId,
      title: data.title,
      amount: data.amount,
      period: data.period,
      dueDate: data.dueDate,
      description: data.description || null,
      status: 'unpaid',
      createdBy: user.id,
    }).returning()
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
    await notifyBuildingMembers(tx, buildingId, {
      type: 'charge',
      title: 'شارژ جدید',
      message: `${row.title} — ${row.period}`,
      link: '/charges',
      sourceId: row.id,
    })
    return row
  })
  return presentCharge(created)
}

export async function updateCharge(user: User, id: string, input: unknown) {
  parseId(id)
  const [current] = await getDb().select().from(charges).where(eq(charges.id, id)).limit(1)
  if (!current) throw new ApiError(404, 'NOT_FOUND', 'شارژ پیدا نشد')
  await requireBuildingManager(user, current.buildingId)
  const data = parseSchema(chargeUpdateSchema, input)
  const status = data.status ?? current.status
  let paidAt = data.paidAt === undefined ? current.paidAt : data.paidAt
  let paidBy = data.paidBy === undefined ? current.paidBy : data.paidBy
  if (status === 'paid') {
    if (!paidAt) paidAt = new Date().toISOString().slice(0, 10)
    if (!paidBy) paidBy = user.id
  }
  if (status === 'unpaid') {
    paidAt = data.paidAt === undefined ? null : data.paidAt
    paidBy = data.paidBy === undefined ? null : data.paidBy
  }
  const [row] = await getDb().update(charges).set({
    status,
    paidAt,
    paidBy,
    ...(data.note !== undefined ? { note: data.note } : {}),
  }).where(eq(charges.id, id)).returning()
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'شارژ پیدا نشد')
  return presentCharge(row)
}

export async function listExpenses(user: User, buildingId: string) {
  parseId(buildingId)
  await requireBuildingReader(user, buildingId)
  const rows = await getDb().select().from(expenses).where(eq(expenses.buildingId, buildingId)).orderBy(desc(expenses.date))
  return rows.map(presentExpense)
}

export async function createExpense(user: User, buildingId: string, input: unknown) {
  parseId(buildingId)
  await requireBuildingManager(user, buildingId)
  const data = parseSchema(expenseCreateSchema, input)
  if (!expenseCategories.includes(data.category)) throw new ApiError(422, 'VALIDATION_ERROR', 'دسته‌بندی نامعتبر است')
  const [row] = await getDb().insert(expenses).values({
    id: randomUUID(),
    buildingId,
    title: data.title,
    amount: data.amount,
    category: data.category,
    date: data.date || new Date().toISOString().slice(0, 10),
    description: data.description || null,
    receiptUrl: optionalUrl(data.receiptUrl),
    createdBy: user.id,
  }).returning()
  if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
  return presentExpense(row)
}

export async function deleteExpense(user: User, id: string) {
  parseId(id)
  const [current] = await getDb().select().from(expenses).where(eq(expenses.id, id)).limit(1)
  if (!current) throw new ApiError(404, 'NOT_FOUND', 'هزینه پیدا نشد')
  await requireBuildingManager(user, current.buildingId)
  await getDb().delete(expenses).where(eq(expenses.id, id))
  return { id }
}
